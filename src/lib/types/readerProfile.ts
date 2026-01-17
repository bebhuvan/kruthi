export type VocabularyLevel = 'beginner' | 'intermediate' | 'advanced';
export type ComprehensionLevel = 'casual' | 'engaged' | 'analytical';
export type ExplanationDepth = 'brief' | 'moderate' | 'detailed';

export interface ReaderProfile {
	id: string;
	vocabularyLevel: VocabularyLevel;
	comprehensionLevel: ComprehensionLevel;
	preferredExplanationDepth: ExplanationDepth;
	interestedIn: string[];
	questionsAsked: number;
	wordsLookedUp: number;
	helpfulResponses: string[];
	unhelpfulResponses: string[];
	updatedAt: number;
}

export type FeedbackRating = 'helpful' | 'unhelpful';

export interface ReaderSession {
	bookId?: string;
	chapterId?: string;
	chapterTitle?: string;
	chapterStartedAt?: number;
	lastProgressAt?: number;
	lastQuestionAt?: number;
	wordsLookedUp: number;
	questionsAsked: number;
	lastSlowChapterAt?: number;
}

export interface ProactiveSuggestion {
	id: string;
	label: string;
	prompt: string;
	reason: string;
}
