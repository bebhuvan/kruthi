/**
 * personalization.ts
 *
 * Reader profile inference, adaptive prompt hints, and proactive suggestions.
 */
import type {
	ReaderProfile,
	ReaderSession,
	FeedbackRating,
	ProactiveSuggestion,
	VocabularyLevel,
	ComprehensionLevel,
	ExplanationDepth
} from '$lib/types/readerProfile';
import { DEFAULT_READER_PROFILE } from '$lib/config/constants';

const MAX_FEEDBACK_HISTORY = 50;
const SLOW_CHAPTER_MINUTES = 8;
const SLOW_CHAPTER_COOLDOWN_MS = 15 * 60 * 1000;

function clampHistory(items: string[]): string[] {
	if (items.length <= MAX_FEEDBACK_HISTORY) {
		return items;
	}
	return items.slice(-MAX_FEEDBACK_HISTORY);
}

function inferVocabularyLevel(wordsLookedUp: number): VocabularyLevel {
	if (wordsLookedUp >= 20) {
		return 'beginner';
	}
	if (wordsLookedUp >= 8) {
		return 'intermediate';
	}
	return 'advanced';
}

function inferComprehensionLevel(questionsAsked: number): ComprehensionLevel {
	if (questionsAsked >= 12) {
		return 'analytical';
	}
	if (questionsAsked >= 4) {
		return 'engaged';
	}
	return 'casual';
}

function inferDepthFromFeedback(
	current: ExplanationDepth,
	rating: FeedbackRating,
	messageLength: number
): ExplanationDepth {
	if (rating === 'helpful') {
		if (messageLength > 900) {
			return 'detailed';
		}
		if (messageLength < 300) {
			return 'brief';
		}
		return current;
	}

	if (messageLength > 900) {
		return 'brief';
	}
	if (messageLength < 300) {
		return 'detailed';
	}
	return current;
}

export function normalizeReaderProfile(profile: ReaderProfile | null): ReaderProfile {
	if (!profile) {
		return { ...DEFAULT_READER_PROFILE, updatedAt: Date.now() };
	}
	return {
		...DEFAULT_READER_PROFILE,
		...profile,
		updatedAt: profile.updatedAt || Date.now()
	};
}

export function recordQuestion(profile: ReaderProfile): ReaderProfile {
	const questionsAsked = profile.questionsAsked + 1;
	return {
		...profile,
		questionsAsked,
		comprehensionLevel: inferComprehensionLevel(questionsAsked),
		updatedAt: Date.now()
	};
}

export function recordWordLookup(profile: ReaderProfile): ReaderProfile {
	const wordsLookedUp = profile.wordsLookedUp + 1;
	return {
		...profile,
		wordsLookedUp,
		vocabularyLevel: inferVocabularyLevel(wordsLookedUp),
		updatedAt: Date.now()
	};
}

export function recordFeedback(
	profile: ReaderProfile,
	rating: FeedbackRating,
	messageId: string,
	messageLength: number
): ReaderProfile {
	const helpfulResponses =
		rating === 'helpful'
			? clampHistory([...profile.helpfulResponses, messageId])
			: profile.helpfulResponses;
	const unhelpfulResponses =
		rating === 'unhelpful'
			? clampHistory([...profile.unhelpfulResponses, messageId])
			: profile.unhelpfulResponses;

	return {
		...profile,
		helpfulResponses,
		unhelpfulResponses,
		preferredExplanationDepth: inferDepthFromFeedback(
			profile.preferredExplanationDepth,
			rating,
			messageLength
		),
		updatedAt: Date.now()
	};
}

export function buildAdaptiveSystemPrompt(
	profile: ReaderProfile | null,
	basePrompt?: string
): string {
	if (!profile) {
		return basePrompt ?? '';
	}
	const depthGuidance: Record<ExplanationDepth, string> = {
		brief: 'Keep explanations to 1-2 concise paragraphs.',
		moderate: 'Aim for 2-3 short paragraphs with clear structure.',
		detailed: 'Provide 3-5 short paragraphs or a few concise bullets for depth.'
	};
	const vocabGuidance: Record<VocabularyLevel, string> = {
		beginner: 'Use simpler vocabulary and define unfamiliar terms when helpful.',
		intermediate: 'Use clear language with occasional literary terms, defined when needed.',
		advanced: 'You can use precise literary terminology without over-explaining.'
	};
	const comprehensionGuidance: Record<ComprehensionLevel, string> = {
		casual: 'Prioritize clarity over dense analysis.',
		engaged: 'Balance clarity with interpretive insight.',
		analytical: 'Lean into deeper analysis and critical framing.'
	};

	const interestLine = profile.interestedIn.length
		? `Prioritize these interests when relevant: ${profile.interestedIn.join(', ')}.`
		: null;

	const profileNotes = [
		'Reader profile:',
		vocabGuidance[profile.vocabularyLevel],
		comprehensionGuidance[profile.comprehensionLevel],
		depthGuidance[profile.preferredExplanationDepth],
		interestLine
	].filter(Boolean);

	return [basePrompt, profileNotes.join('\n')].filter(Boolean).join('\n\n');
}

export function getProactiveSuggestions(
	profile: ReaderProfile,
	session: ReaderSession,
	context: {
		chapterTitle?: string;
		chapterIndex?: number;
		totalChapters?: number;
	}
): ProactiveSuggestion[] {
	const suggestions: ProactiveSuggestion[] = [];
	const now = Date.now();
	const chapterTitle = context.chapterTitle ?? 'this chapter';

	if (session.chapterStartedAt) {
		const minutesInChapter = (now - session.chapterStartedAt) / 60000;
		const slowCooldown = session.lastSlowChapterAt
			? now - session.lastSlowChapterAt > SLOW_CHAPTER_COOLDOWN_MS
			: true;
		if (minutesInChapter >= SLOW_CHAPTER_MINUTES && slowCooldown) {
			suggestions.push({
				id: 'recap',
				label: 'Recap this chapter',
				prompt: `Give me a short recap of ${chapterTitle} so far.`,
				reason: 'You have been in this chapter for a while.'
			});
		}
	}

	if (session.wordsLookedUp >= 4 || profile.wordsLookedUp >= 20) {
		suggestions.push({
			id: 'simplify',
			label: 'Simplify the prose',
			prompt: `Explain ${chapterTitle} in simpler language, keeping the key points.`,
			reason: 'There have been several vocabulary lookups.'
		});
	}

	if (
		typeof context.chapterIndex === 'number' &&
		typeof context.totalChapters === 'number' &&
		context.totalChapters > 0 &&
		context.chapterIndex >= context.totalChapters - 2
	) {
		suggestions.push({
			id: 'stakes',
			label: 'Check the stakes',
			prompt: 'What are the key stakes or tensions as we approach the end?',
			reason: 'You are close to the end of the book.'
		});
	}

	if (profile.comprehensionLevel === 'analytical') {
		suggestions.push({
			id: 'analysis',
			label: 'Analyze a theme',
			prompt: `Analyze a central theme emerging in ${chapterTitle}.`,
			reason: 'You tend to prefer deeper analysis.'
		});
	}

	return suggestions.slice(0, 3);
}
