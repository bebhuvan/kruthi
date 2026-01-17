export interface VocabularyEntry {
	id: string;
	word: string;
	definition: string;
	etymology?: string;
	context: string;
	bookId: string;
	bookTitle: string;
	chapterId: string;
	lookedUpAt: number;
	reviewCount: number;
	lastReviewedAt?: number;
	mastered: boolean;
}

export interface VocabularyContext {
	bookId: string;
	bookTitle: string;
	chapterId: string;
	context: string;
}

export interface VocabularyDefinition {
	word: string;
	definition: string;
	etymology?: string;
	display: string;
}

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';
