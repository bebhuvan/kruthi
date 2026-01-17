/**
 * conversationContext.ts
 *
 * Builds a trimmed conversation history payload for chat prompts.
 */
import type { ChatMessage } from '$lib/types/chat';
import { estimateTokenCount } from '$lib/utils/tokenizer';

export interface ConversationTurn {
	role: 'user' | 'assistant';
	content: string;
}

export interface ConversationContext {
	messages: ConversationTurn[];
	tokenCount: number;
}

function isRenderableMessage(message: ChatMessage): boolean {
	return message.content.trim().length > 0 && !message.isStreaming;
}

export function buildConversationContext(
	messages: ChatMessage[],
	maxTokens: number
): ConversationContext {
	const trimmed: ConversationTurn[] = [];
	let tokenCount = 0;

	for (let i = messages.length - 1; i >= 0; i -= 1) {
		const message = messages[i];
		if (!isRenderableMessage(message)) {
			continue;
		}
		const nextTokens = estimateTokenCount(message.content);
		if (trimmed.length > 0 && tokenCount + nextTokens > maxTokens) {
			break;
		}
		trimmed.push({ role: message.role, content: message.content });
		tokenCount += nextTokens;
		if (trimmed.length === 1 && tokenCount > maxTokens) {
			break;
		}
	}

	trimmed.reverse();

	return { messages: trimmed, tokenCount };
}

export function formatForPrompt(context: ConversationContext): string {
	if (context.messages.length === 0) {
		return '';
	}
	const lines = context.messages.map((message) => {
		const label = message.role === 'user' ? 'User' : 'Assistant';
		return `${label}: ${message.content}`;
	});
	return `Conversation history:\n${lines.join('\n')}`;
}
