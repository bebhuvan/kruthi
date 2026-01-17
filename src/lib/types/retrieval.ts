export type SearchScope = 'current_chapter' | 'whole_book';

export interface Chunk {
	id: string;
	bookId: string;
	chapterId: string;
	chapterTitle: string;
	bookChapter: string;
	text: string;
	offsetStart: number;
	offsetEnd: number;
	embedding?: number[];
	embeddingModel?: string;
}

export interface SearchOptions {
	scope: SearchScope;
	chapterId?: string;
	topK?: number;
}

export interface SearchResult {
	chunk: Chunk;
	score: number;
}

export interface ChunkingOptions {
	targetTokens?: number;
	overlapTokens?: number;
	maxTokens?: number;
}

export interface IndexOptions extends ChunkingOptions {
	embeddingBatchSize?: number;
	generateEmbeddings?: boolean;
}
