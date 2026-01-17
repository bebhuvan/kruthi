import type { SearchScope } from '$lib/types/retrieval';
import type { FeedbackRating } from '$lib/types/readerProfile';

export type ChatMode = 'grounded' | 'companion';

export interface Citation {
	chunkId: string;
	chapterId?: string;
	chapterTitle?: string;
	quote: string;
}

export interface ToolCall {
	id: string;
	name: string;
	input: Record<string, unknown>;
}

export interface ChatMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	citations?: Citation[];
	createdAt: number;
	chapterId?: string;
	toolCalls?: ToolCall[];
	notFound?: boolean;
	isStreaming?: boolean;
	feedback?: FeedbackRating;
}

export interface ChatState {
	isOpen: boolean;
	scope: SearchScope;
	mode: ChatMode;
	messages: ChatMessage[];
	maxHistoryTokens: number;
	isStreaming: boolean;
	error: string | null;
}
