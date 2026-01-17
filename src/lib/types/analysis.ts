export type AnalysisType = 'theme' | 'character' | 'style' | 'historical' | 'comparison';

export type AnalysisScope = 'chapter' | 'book';

export interface AnalysisRequest {
	type: AnalysisType;
	scope: AnalysisScope;
	chapterId?: string;
	subject?: string;
}

export interface AnalysisResult {
	id: string;
	bookId: string;
	type: AnalysisType;
	chapterId?: string;
	subject?: string;
	response: string;
	generatedAt: number;
}

export interface ThemeOccurrence {
	chapterId: string;
	quote: string;
	analysis: string;
}

export interface ThemeTracker {
	id: string;
	bookId: string;
	theme: string;
	description: string;
	occurrences: ThemeOccurrence[];
	evolution: string;
	generatedAt: number;
}

export interface CharacterMoment {
	chapterId: string;
	quote: string;
	significance: string;
}

export interface CharacterProfile {
	id: string;
	bookId: string;
	name: string;
	aliases: string[];
	description: string;
	firstAppearance: { chapterId: string; quote: string };
	relationships: Array<{ character: string; relationship: string }>;
	arc: string;
	keyMoments: CharacterMoment[];
	generatedAt: number;
}

export type AnalysisCacheEntry =
	| {
			id: string;
			bookId: string;
			kind: 'analysis';
			subject?: string;
			chapterId?: string;
			payload: AnalysisResult;
			generatedAt: number;
	  }
	| {
			id: string;
			bookId: string;
			kind: 'theme-tracker';
			subject: string;
			payload: ThemeTracker;
			generatedAt: number;
	  }
	| {
			id: string;
			bookId: string;
			kind: 'character-profile';
			subject: string;
			payload: CharacterProfile;
			generatedAt: number;
	  }
	| {
			id: string;
			bookId: string;
			kind: 'theme-list';
			payload: string[];
			generatedAt: number;
	  }
	| {
			id: string;
			bookId: string;
			kind: 'character-list';
			payload: string[];
			generatedAt: number;
	  };
