import { describe, expect, it } from 'vitest';
import type { Highlight } from '$lib/types/highlight';
import { buildHighlightGraph } from '$lib/services/highlightGraph';

function makeHighlight(id: string, text: string, bookId = 'book-1'): Highlight {
	return {
		id,
		bookId,
		bookTitle: 'Book',
		author: 'Author',
		chapterId: 'ch-1',
		chapterTitle: 'Chapter',
		bookChapter: `${bookId}:ch-1`,
		selectedText: text,
		context: text,
		createdAt: Date.now(),
		updatedAt: Date.now()
	};
}

describe('buildHighlightGraph', () => {
	it('connects semantically similar highlights within the same book', () => {
		const highlights = [
			makeHighlight('a', 'Industrialization causes social inequality in cities'),
			makeHighlight('b', 'Social inequality grows as industrial cities expand'),
			makeHighlight('c', 'Completely different cooking recipe text')
		];
		const graph = buildHighlightGraph(highlights, 3, 0.1);
		expect(graph.a.some((edge) => edge.id === 'b')).toBe(true);
		expect(graph.a.some((edge) => edge.id === 'c')).toBe(false);
	});
});
