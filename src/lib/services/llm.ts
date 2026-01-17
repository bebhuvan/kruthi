/**
 * llm.ts
 *
 * Anthropic API integration with streaming responses for Q&A.
 */
import type { Book } from '$lib/types/book';
import type { Chunk, SearchScope } from '$lib/types/retrieval';
import type { ChatMessage, ChatMode, Citation } from '$lib/types/chat';
import type { LLMProvider } from '$lib/types/settings';
import type { ReaderProfile } from '$lib/types/readerProfile';
import { LLMError } from '$lib/types/errors';
import { searchChunks, getChunkById } from '$lib/services/retrieval';
import { buildQaPrompt, isNotFoundResponse, parseCitations } from '$lib/services/prompts';
import { streamOpenRouter } from '$lib/services/openrouter';
import { streamOpenAi } from '$lib/services/openai';
import { streamGemini } from '$lib/services/gemini';
import { buildConversationContext, formatForPrompt } from '$lib/services/conversationContext';
import { buildAdaptiveSystemPrompt } from '$lib/services/personalization';
import { adapter } from '$lib/platform';
import { SECURE_STORAGE_KEYS } from '$lib/config/constants';

const API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const PROMPT_CACHE_BETA = 'prompt-caching-2024-07-31';
// Model tiers for different use cases
const MODELS = {
	flagship: 'claude-sonnet-4-5-20251101',    // Best balance of quality/cost for chat
	thinking: 'claude-opus-4-5-20251101',      // For deep analysis with extended thinking
	fast: 'claude-haiku-4-5-20251101'          // For quick actions like define/explain
} as const;
const DEFAULT_MODEL = MODELS.flagship;
const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_THINKING_BUDGET = 8000;
const DEFAULT_TOP_K = 12;
const TOOL_TOP_K = 12;

interface ToolDefinition {
	name: string;
	description: string;
	input_schema: {
		type: 'object';
		properties: Record<string, unknown>;
		required?: string[];
	};
}

interface ToolCall {
	id: string;
	name: string;
	input: Record<string, unknown>;
}

interface StreamResult {
	text: string;
	toolCalls: ToolCall[];
}

interface StreamHandlers {
	onText?: (delta: string) => void;
}

interface AnswerParams {
	provider: LLMProvider;
	openRouterModel: string;
	openAiModel: string;
	geminiModel: string;
	systemPrompt?: string;
	book: Book;
	question: string;
	scope: SearchScope;
	mode: ChatMode;
	chapterId?: string;
	conversationHistory?: ChatMessage[];
	maxHistoryTokens?: number;
	readerProfile?: ReaderProfile;
	useExtendedThinking?: boolean;
	thinkingBudget?: number;
	onToken?: (delta: string) => void;
}

interface AnswerResponse {
	text: string;
	citations: Citation[];
	notFound: boolean;
}

const TOOLS: ToolDefinition[] = [
	{
		name: 'search_book',
		description: 'Search the indexed book chunks for relevant passages.',
		input_schema: {
			type: 'object',
			properties: {
				query: { type: 'string' },
				scope: { type: 'string', enum: ['current_chapter', 'whole_book'] },
				chapterId: { type: 'string' },
				topK: { type: 'number' }
			},
			required: ['query', 'scope']
		}
	},
	{
		name: 'cite_passage',
		description: 'Fetch a chunk by chunk_id to cite verbatim.',
		input_schema: {
			type: 'object',
			properties: {
				chunkId: { type: 'string' }
			},
			required: ['chunkId']
		}
	}
];

function buildExcerptBlock(excerpts: Chunk[]): string {
	return excerpts
		.map(
			(chunk) => `[chunk_id: ${chunk.id} | chapter: ${chunk.chapterTitle}]\n${chunk.text}`
		)
		.join('\n\n');
}

function resolveChapterScope(
	scope: SearchScope,
	chapterId?: string
): { scope: SearchScope; chapterId?: string } {
	if (scope === 'current_chapter' && chapterId) {
		return { scope, chapterId };
	}
	return { scope: 'whole_book' };
}

async function streamAnthropic(
	apiKey: string,
	body: Record<string, unknown>,
	handlers: StreamHandlers
): Promise<StreamResult> {
	const response = await fetch(API_URL, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			'x-api-key': apiKey,
			'anthropic-version': ANTHROPIC_VERSION,
			'anthropic-beta': PROMPT_CACHE_BETA
		},
		body: JSON.stringify({ ...body, stream: true })
	});

	if (!response.ok) {
		const message = await response.text();
		throw new LLMError(`Anthropic API error: ${message}`, response.status);
	}

	if (!response.body) {
		throw new LLMError('Anthropic API response missing body.');
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	let fullText = '';
	const toolMeta = new Map<string, { name: string }>();
	const toolInputs = new Map<string, string>();

	const handlePayload = (payload: Record<string, unknown>) => {
		if (payload.type === 'content_block_start') {
			const block = payload.content_block as
				| { type: 'tool_use'; id: string; name: string; input?: Record<string, unknown> }
				| undefined;
			if (block?.type === 'tool_use') {
				toolMeta.set(block.id, { name: block.name });
				if (block.input) {
					toolInputs.set(block.id, JSON.stringify(block.input));
				} else {
					toolInputs.set(block.id, '');
				}
			}
		}

		if (payload.type === 'content_block_delta') {
			const delta = payload.delta as
				| { type: 'text'; text: string }
				| { type: 'input_json'; partial_json?: string }
				| undefined;
			if (delta?.type === 'text') {
				fullText += delta.text;
				handlers.onText?.(delta.text);
			}
			if (delta?.type === 'input_json') {
				const partial = delta.partial_json ?? '';
				const lastToolId = Array.from(toolMeta.keys()).slice(-1)[0];
				if (lastToolId) {
					const existing = toolInputs.get(lastToolId) ?? '';
					toolInputs.set(lastToolId, existing + partial);
				}
			}
		}
	};

	while (true) {
		const { value, done } = await reader.read();
		if (done) {
			break;
		}
		buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
		let boundary = buffer.indexOf('\n\n');
		while (boundary !== -1) {
			const chunk = buffer.slice(0, boundary);
			buffer = buffer.slice(boundary + 2);
			const lines = chunk.split('\n');
			const data = lines
				.filter((line) => line.startsWith('data:'))
				.map((line) => line.replace(/^data:\s*/, ''))
				.join('\n');
			if (!data || data === '[DONE]') {
				boundary = buffer.indexOf('\n\n');
				continue;
			}
			try {
				const payload = JSON.parse(data) as Record<string, unknown>;
				handlePayload(payload);
			} catch {
				// Ignore malformed chunks from the stream.
			}
			boundary = buffer.indexOf('\n\n');
		}
	}

	const toolCalls: ToolCall[] = [];
	for (const [id, meta] of toolMeta.entries()) {
		const raw = toolInputs.get(id) ?? '';
		let input: Record<string, unknown> = {};
		if (raw.trim()) {
			try {
				input = JSON.parse(raw) as Record<string, unknown>;
			} catch {
				input = {};
			}
		}
		toolCalls.push({ id, name: meta.name, input });
	}

	return { text: fullText, toolCalls };
}

async function resolveToolCall(
	tool: ToolCall,
	context: { book: Book; defaultScope: SearchScope; defaultChapterId?: string }
): Promise<string> {
	if (tool.name === 'search_book') {
		const query = typeof tool.input.query === 'string' ? tool.input.query : '';
		const scope =
			tool.input.scope === 'current_chapter' || tool.input.scope === 'whole_book'
				? (tool.input.scope as SearchScope)
				: context.defaultScope;
		const chapterId = typeof tool.input.chapterId === 'string' ? tool.input.chapterId : undefined;
		const topK =
			typeof tool.input.topK === 'number' && tool.input.topK > 0
				? tool.input.topK
				: TOOL_TOP_K;
		const resolved = resolveChapterScope(scope, chapterId ?? context.defaultChapterId);
		try {
			const results = await searchChunks(query, context.book.id, {
				scope: resolved.scope,
				chapterId: resolved.chapterId,
				topK
			});
			const excerpts = results.map((result) => result.chunk);
			if (excerpts.length === 0) {
				return 'No relevant passages found.';
			}
			return buildExcerptBlock(excerpts);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Search failed.';
			return `Search error: ${message}`;
		}
	}

	if (tool.name === 'cite_passage') {
		const chunkId = typeof tool.input.chunkId === 'string' ? tool.input.chunkId : '';
		if (!chunkId) {
			return 'No chunk_id provided.';
		}
		const chunk = await getChunkById(chunkId);
		if (!chunk) {
			return `No chunk found for ${chunkId}.`;
		}
		return buildExcerptBlock([chunk]);
	}

	return 'Tool not implemented.';
}

export async function streamAnswer(params: AnswerParams): Promise<AnswerResponse> {
	const [anthropicApiKey, openRouterApiKey, openAiApiKey, geminiApiKey] = await Promise.all([
		adapter.getSecureValue(SECURE_STORAGE_KEYS.anthropicApiKey),
		adapter.getSecureValue(SECURE_STORAGE_KEYS.openRouterApiKey),
		adapter.getSecureValue(SECURE_STORAGE_KEYS.openAiApiKey),
		adapter.getSecureValue(SECURE_STORAGE_KEYS.geminiApiKey)
	]);
	const resolvedScope = resolveChapterScope(params.scope, params.chapterId);
	const results = await searchChunks(params.question, params.book.id, {
		scope: resolvedScope.scope,
		chapterId: resolvedScope.chapterId,
		topK: DEFAULT_TOP_K
	});
	const excerpts = results.map((result) => result.chunk);
	const chunkLookup = new Map<string, Chunk>(
		excerpts.map((excerpt) => [excerpt.id, excerpt])
	);
	const adaptiveSystemPrompt = buildAdaptiveSystemPrompt(
		params.readerProfile ?? null,
		params.systemPrompt
	);
	const prompt = buildQaPrompt(
		excerpts,
		params.question,
		resolvedScope.scope,
		params.mode,
		adaptiveSystemPrompt
	);

	const conversationContext = params.conversationHistory
		? buildConversationContext(params.conversationHistory, params.maxHistoryTokens ?? 8000)
		: { messages: [], tokenCount: 0 };

	const historyMessages = conversationContext.messages.map((message) => ({
		role: message.role,
		content: message.content
	}));

	const initialMessages = [
		...historyMessages,
		{
			role: 'user',
			content: [
				{
					type: 'text',
					text: prompt.user,
					cache_control: { type: 'ephemeral' }
				}
			]
		}
	];

	let responseText = '';

	if (params.provider === 'openrouter') {
		responseText = await streamOpenRouter({
			apiKey: openRouterApiKey ?? '',
			model: params.openRouterModel,
			system: prompt.system,
			user: prompt.user,
			history: historyMessages,
			onToken: params.onToken
		});
	} else if (params.provider === 'openai') {
		responseText = await streamOpenAi({
			apiKey: openAiApiKey ?? '',
			model: params.openAiModel,
			system: prompt.system,
			user: prompt.user,
			history: historyMessages,
			onToken: params.onToken
		});
	} else if (params.provider === 'gemini') {
		responseText = await streamGemini({
			apiKey: geminiApiKey ?? '',
			model: params.geminiModel,
			system: prompt.system,
			user: prompt.user,
			history: historyMessages,
			onToken: params.onToken
		});
	} else {
		const buildAnthropicBody = (messages: Array<Record<string, unknown>>) => {
			const body: Record<string, unknown> = {
				model: DEFAULT_MODEL,
				max_tokens: DEFAULT_MAX_TOKENS,
				system: prompt.system,
				messages,
				tools: TOOLS,
				tool_choice: { type: 'auto' }
			};
			if (params.useExtendedThinking) {
				const budget = Math.max(1000, params.thinkingBudget ?? DEFAULT_THINKING_BUDGET);
				body.thinking = { type: 'enabled', budget_tokens: budget };
			}
			return body;
		};

		let streamResult = await streamAnthropic(
			anthropicApiKey ?? '',
			buildAnthropicBody(initialMessages),
			{ onText: params.onToken }
		);

		if (streamResult.toolCalls.length > 0) {
			const toolResults = await Promise.all(
				streamResult.toolCalls.map((tool) =>
					resolveToolCall(tool, {
						book: params.book,
						defaultScope: resolvedScope.scope,
						defaultChapterId: resolvedScope.chapterId
					})
				)
			);

			const toolUseBlocks = streamResult.toolCalls.map((tool) => ({
				type: 'tool_use',
				id: tool.id,
				name: tool.name,
				input: tool.input
			}));
			const toolResultBlocks = streamResult.toolCalls.map((tool, index) => ({
				type: 'tool_result',
				tool_use_id: tool.id,
				content: toolResults[index]
			}));

			streamResult = await streamAnthropic(
				anthropicApiKey ?? '',
				buildAnthropicBody([
					...initialMessages,
					{ role: 'assistant', content: toolUseBlocks },
					{ role: 'user', content: toolResultBlocks }
				]),
				{ onText: params.onToken }
			);
		}

		responseText = streamResult.text;
	}

	const citations = parseCitations(responseText, chunkLookup);
	const groundedNotFound = params.mode === 'grounded' && isNotFoundResponse(responseText);
	return {
		text: responseText,
		citations,
		notFound: groundedNotFound
	};
}
