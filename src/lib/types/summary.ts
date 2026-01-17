export type SummaryType = 'brief' | 'detailed';
export type SummaryFocus = 'plot' | 'themes' | 'characters';

export interface SummaryOptions {
	type: SummaryType;
	focus?: SummaryFocus;
	forceRefresh?: boolean;
}

export interface ChapterSummary {
	id: string;
	bookId: string;
	chapterId: string;
	brief: string;
	detailed?: string;
	keyPoints: string[];
	characters: string[];
	generatedAt: number;
}

export type DiscussionPromptType = 'comprehension' | 'analysis' | 'reflection' | 'prediction';

export interface DiscussionPrompt {
	id: string;
	type: DiscussionPromptType;
	question: string;
	hint?: string;
	relatedChunkIds?: string[];
}
