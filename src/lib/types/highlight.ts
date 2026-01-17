export type HighlightAction = 'explain' | 'define';

export type SelectionAction = HighlightAction | 'highlight' | 'note';

export interface HighlightRange {
	startPath: number[];
	startOffset: number;
	endPath: number[];
	endOffset: number;
}

export interface HighlightSelection {
	bookId: string;
	bookTitle: string;
	author: string;
	chapterId: string;
	chapterTitle: string;
	selectedText: string;
	context: string;
	cfi?: string;
}

export interface Highlight {
	id: string;
	bookId: string;
	bookTitle: string;
	author: string;
	chapterId: string;
	chapterTitle: string;
	bookChapter: string;
	selectedText: string;
	context: string;
	cfi?: string;
	range?: HighlightRange;
	note?: string;
	createdAt: number;
	updatedAt: number;
}
