/**
 * tokenizer.ts
 *
 * Simple tokenization helpers for chunk sizing and lexical ranking.
 */

const WORD_REGEX = /[a-z0-9]+(?:'[a-z0-9]+)?/gi;

export function tokenize(text: string): string[] {
	const normalized = text.toLowerCase();
	return normalized.match(WORD_REGEX) ?? [];
}

export function estimateTokenCount(text: string): number {
	return tokenize(text).length;
}

export function splitIntoParagraphs(text: string): string[] {
	return text
		.split(/\n\s*\n/g)
		.map((paragraph) => paragraph.trim())
		.filter(Boolean);
}
