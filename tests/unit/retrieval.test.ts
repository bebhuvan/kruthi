import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { chunkText, indexBook, reindexBook, searchChunks } from '$lib/services/retrieval';
import type { Book } from '$lib/types/book';
import { adapter } from '$lib/platform';

describe('chunkText', () => {
	it('splits text into chunks of target size', () => {
		const text = Array.from({ length: 40 }, (_, index) => `word${index}`).join(' ');
		const chunks = chunkText(text, { targetTokens: 10, overlapTokens: 2, maxTokens: 12 });

		expect(chunks.length).toBeGreaterThan(1);
		for (const chunk of chunks) {
			expect(chunk.text.length).toBeGreaterThan(0);
			expect(chunk.offsetEnd - chunk.offsetStart).toBeLessThanOrEqual(12);
		}
	});

	it('respects paragraph boundaries when possible', () => {
		const text = 'Paragraph one.\n\nParagraph two.\n\nParagraph three.';
		const chunks = chunkText(text, { targetTokens: 3, overlapTokens: 0, maxTokens: 8 });

		expect(chunks[0].text).toContain('Paragraph one.');
		expect(chunks[0].text).not.toContain('Paragraph two.');
	});
});

describe('searchChunks', () => {
	it('returns relevant results for a query', async () => {
		const book: Book = {
			id: 'book-1',
			title: 'Test Book',
			author: 'Test Author',
			toc: [],
			chapters: [
				{
					id: 'ch-1',
					title: 'Chapter One',
					href: 'chapter-1',
					html: 'Apples are crisp and bright.\n\nThey grow in orchards.'
				},
				{
					id: 'ch-2',
					title: 'Chapter Two',
					href: 'chapter-2',
					html: 'Bananas are soft and sweet.\n\nThey grow in bunches.'
				}
			]
		};

		await indexBook(book, { targetTokens: 30, overlapTokens: 5, maxTokens: 40 });
		const results = await searchChunks('bananas', book.id, { scope: 'whole_book', topK: 1 });

		expect(results.length).toBe(1);
		expect(results[0].chunk.text.toLowerCase()).toContain('bananas');
	});

	it('filters by chapter when scope is current_chapter', async () => {
		const book: Book = {
			id: 'book-2',
			title: 'Scope Book',
			author: 'Test Author',
			toc: [],
			chapters: [
				{
					id: 'ch-1',
					title: 'Chapter One',
					href: 'chapter-1',
					html: 'The ocean is calm and wide.'
				},
				{
					id: 'ch-2',
					title: 'Chapter Two',
					href: 'chapter-2',
					html: 'The desert is vast and dry.'
				}
			]
		};

		await indexBook(book, { targetTokens: 30, overlapTokens: 5, maxTokens: 40 });
		const results = await searchChunks('desert', book.id, {
			scope: 'current_chapter',
			chapterId: 'ch-1',
			topK: 2
		});

		expect(results.length).toBeGreaterThan(0);
		for (const result of results) {
			expect(result.chunk.chapterId).toBe('ch-1');
		}
	});

	it('reindexes books with new chunk settings', async () => {
		const text = Array.from({ length: 220 }, (_, index) => `word${index}`).join(' ');
		const book: Book = {
			id: 'book-3',
			title: 'Reindex Book',
			author: 'Test Author',
			toc: [],
			chapters: [
				{
					id: 'ch-1',
					title: 'Chapter One',
					href: 'chapter-1',
					html: text
				}
			]
		};

		await indexBook(book, { targetTokens: 80, overlapTokens: 0, maxTokens: 90 });
		const initialChunks = await adapter.getChunks(book.id);

		await reindexBook(book, { targetTokens: 20, overlapTokens: 0, maxTokens: 25 });
		const reindexedChunks = await adapter.getChunks(book.id);

		expect(reindexedChunks.length).toBeGreaterThan(initialChunks.length);
	});
});
