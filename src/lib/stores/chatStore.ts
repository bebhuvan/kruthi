import { get, writable } from 'svelte/store';
import type { Book } from '$lib/types/book';
import type { ChatMessage, ChatState } from '$lib/types/chat';
import type { SearchScope } from '$lib/types/retrieval';
import type { FeedbackRating } from '$lib/types/readerProfile';
import { streamAnswer } from '$lib/services/llm';
import { settingsStore } from '$lib/stores/settingsStore';
import { readerProfileStore } from '$lib/stores/readerProfileStore';

// Limit messages to prevent memory bloat - keep last N messages
const MAX_MESSAGES = 100;

interface SendQuestionParams {
	book: Book;
	question: string;
	chapterId?: string;
}

const initialState: ChatState = {
	isOpen: false,
	scope: 'current_chapter',
	mode: 'grounded',
	messages: [],
	maxHistoryTokens: 8000,
	isStreaming: false,
	error: null
};

function createChatStore() {
	const { subscribe, update, set } = writable<ChatState>(initialState);
	let activeRequestId: string | null = null;
	let activeAbortController: AbortController | null = null;
	const getState = () => get({ subscribe });

	/**
	 * Cancel any in-flight request. Safe to call multiple times.
	 */
	const cancelActiveRequest = () => {
		activeRequestId = null;
		if (activeAbortController) {
			activeAbortController.abort();
			activeAbortController = null;
		}
	};

	const appendMessage = (message: ChatMessage) => {
		update((state) => {
			const messages = [...state.messages, message];
			// Trim old messages if over limit (keep most recent)
			const trimmed = messages.length > MAX_MESSAGES
				? messages.slice(-MAX_MESSAGES)
				: messages;
			return { ...state, messages: trimmed };
		});
	};

	const updateMessage = (id: string, patch: Partial<ChatMessage>) => {
		update((state) => ({
			...state,
			messages: state.messages.map((message) =>
				message.id === id ? { ...message, ...patch } : message
			)
		}));
	};

	return {
		subscribe,
		open: () => update((state) => ({ ...state, isOpen: true })),
		close: () => update((state) => ({ ...state, isOpen: false })),
		toggle: () => update((state) => ({ ...state, isOpen: !state.isOpen })),
		setScope: (scope: SearchScope) => update((state) => ({ ...state, scope })),
		setMode: (mode: ChatState['mode']) => update((state) => ({ ...state, mode })),
		clearError: () => update((state) => ({ ...state, error: null })),
		reset: () => {
			cancelActiveRequest();
			set({
				...initialState,
				isOpen: getState().isOpen,
				mode: getState().mode
			});
		},
		/** Cancel any in-flight request */
		cancel: () => {
			cancelActiveRequest();
			update((state) => ({ ...state, isStreaming: false }));
		},
		recordFeedback: (messageId: string, rating: FeedbackRating) => {
			update((state) => ({
				...state,
				messages: state.messages.map((message) =>
					message.id === messageId ? { ...message, feedback: rating } : message
				)
			}));
			const message = getState().messages.find((item) => item.id === messageId);
			if (!message) {
				return;
			}
			readerProfileStore.recordFeedback(messageId, rating, message.content.length);
		},
	async sendQuestion(params: SendQuestionParams) {
			const settings = get(settingsStore);
			if (settings.llmProvider === 'openrouter' && !settings.openRouterApiKey) {
				update((state) => ({
					...state,
					error: 'Add your OpenRouter API key in Settings to ask questions.'
				}));
				return;
			}
			if (settings.llmProvider === 'openai' && !settings.openAiApiKey) {
				update((state) => ({
					...state,
					error: 'Add your OpenAI API key in Settings to ask questions.'
				}));
				return;
			}
			if (settings.llmProvider === 'gemini' && !settings.geminiApiKey) {
				update((state) => ({
					...state,
					error: 'Add your Gemini API key in Settings to ask questions.'
				}));
				return;
			}
			if (settings.llmProvider === 'anthropic' && !settings.anthropicApiKey) {
				update((state) => ({
					...state,
					error: 'Add your Anthropic API key in Settings to ask questions.'
				}));
				return;
			}

			const stateSnapshot = getState();

			// Cancel any in-flight request before starting new one
			if (stateSnapshot.isStreaming) {
				cancelActiveRequest();
			}

			const requestId = crypto.randomUUID();
			activeRequestId = requestId;

			const userMessage: ChatMessage = {
				id: crypto.randomUUID(),
				role: 'user',
				content: params.question.trim(),
				createdAt: Date.now(),
				chapterId: params.chapterId
			};

			const assistantMessage: ChatMessage = {
				id: crypto.randomUUID(),
				role: 'assistant',
				content: '',
				createdAt: Date.now(),
				chapterId: params.chapterId,
				isStreaming: true
			};

			appendMessage(userMessage);
			appendMessage(assistantMessage);
			update((state) => ({ ...state, isStreaming: true, error: null }));
			readerProfileStore.recordQuestionAsked();

			try {
				const profileState = get(readerProfileStore);
				const response = await streamAnswer({
					provider: settings.llmProvider,
					openRouterModel: settings.openRouterModel,
					openAiModel: settings.openAiModel,
					geminiModel: settings.geminiModel,
					systemPrompt: settings.systemPrompt,
					readerProfile: profileState.profile,
					book: params.book,
					question: params.question,
					scope: stateSnapshot.scope,
					mode: stateSnapshot.mode,
					chapterId: params.chapterId,
					conversationHistory: stateSnapshot.messages,
					maxHistoryTokens: stateSnapshot.maxHistoryTokens,
					onToken: (delta) => {
						if (activeRequestId !== requestId) {
							return;
						}
						update((state) => ({
							...state,
							messages: state.messages.map((message) =>
								message.id === assistantMessage.id
									? { ...message, content: message.content + delta }
									: message
							)
						}));
					}
				});

				if (activeRequestId !== requestId) {
					return;
				}

				updateMessage(assistantMessage.id, {
					content: response.text,
					citations: response.citations,
					notFound: response.notFound,
					isStreaming: false
				});
				update((state) => ({ ...state, isStreaming: false }));
			} catch (error) {
				if (activeRequestId !== requestId) {
					return;
				}
				const message = error instanceof Error ? error.message : 'Failed to reach the AI provider.';
				updateMessage(assistantMessage.id, {
					content: message,
					isStreaming: false
				});
				update((state) => ({ ...state, isStreaming: false, error: message }));
			}
		}
	};
}

export const chatStore = createChatStore();
