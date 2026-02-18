import { describe, expect, it } from 'vitest';
import { parseCitations } from '$lib/services/prompts';
import type { Chunk } from '$lib/types/retrieval';

function makeChunk(id: string, text: string): Chunk {
	return {
		id,
		bookId: 'book-1',
		chapterId: 'ch-1',
		chapterTitle: 'Chapter One',
		bookChapter: 'book-1:ch-1',
		text,
		offsetStart: 0,
		offsetEnd: 10
	};
}

describe('parseCitations', () => {
	it('parses standard quoted bullet citations', () => {
		const chunk = makeChunk('chunk-1', 'Original quoted text.');
		const response = '- "Quoted passage" (chunk_id: chunk-1, chapter: Chapter One)';
		const citations = parseCitations(response, new Map([[chunk.id, chunk]]));

		expect(citations).toHaveLength(1);
		expect(citations[0].chunkId).toBe('chunk-1');
		expect(citations[0].quote).toBe('Quoted passage');
	});

	it('parses unbulleted citation format', () => {
		const chunk = makeChunk('chunk-2', 'Some text.');
		const response = '"Another quote" (chunk: chunk-2, chapter: Chapter One)';
		const citations = parseCitations(response, new Map([[chunk.id, chunk]]));

		expect(citations).toHaveLength(1);
		expect(citations[0].chunkId).toBe('chunk-2');
	});

	it('falls back to chunk preview when only chunk id is present', () => {
		const chunk = makeChunk('chunk-3', 'Preview text from chunk used as fallback citation.');
		const response = 'Evidence: chunk_id: chunk-3';
		const citations = parseCitations(response, new Map([[chunk.id, chunk]]));

		expect(citations).toHaveLength(1);
		expect(citations[0].chunkId).toBe('chunk-3');
		expect(citations[0].quote).toContain('Preview text');
	});
});
