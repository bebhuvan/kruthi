import { get, writable } from 'svelte/store';
import type { FeedbackRating, ReaderProfile, ReaderSession } from '$lib/types/readerProfile';
import { adapter } from '$lib/platform';
import {
	normalizeReaderProfile,
	recordFeedback,
	recordQuestion,
	recordWordLookup
} from '$lib/services/personalization';
import { DEFAULT_READER_PROFILE } from '$lib/config/constants';

interface ReaderProfileState {
	status: 'loading' | 'ready' | 'error';
	profile: ReaderProfile;
	session: ReaderSession;
	error: string | null;
}

const initialSession: ReaderSession = {
	wordsLookedUp: 0,
	questionsAsked: 0
};

const initialState: ReaderProfileState = {
	status: 'loading',
	profile: { ...DEFAULT_READER_PROFILE },
	session: initialSession,
	error: null
};

function createReaderProfileStore() {
	const { subscribe, update, set } = writable<ReaderProfileState>(initialState);
	const getState = () => get({ subscribe });

	const persist = async (profile: ReaderProfile) => {
		try {
			await adapter.saveReaderProfile(profile);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to save reader profile.';
			update((state) => ({ ...state, status: 'error', error: message }));
		}
	};

	const hydrate = async () => {
		try {
			const stored = await adapter.getReaderProfile();
			const profile = normalizeReaderProfile(stored);
			set({ status: 'ready', profile, session: initialSession, error: null });
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to load reader profile.';
			set({
				status: 'error',
				profile: { ...DEFAULT_READER_PROFILE },
				session: initialSession,
				error: message
			});
		}
	};

	void hydrate();

	return {
		subscribe,
		startChapterSession: (bookId: string, chapterId: string, chapterTitle: string) =>
			update((state) => ({
				...state,
				session: {
					bookId,
					chapterId,
					chapterTitle,
					chapterStartedAt: Date.now(),
					lastProgressAt: Date.now(),
					lastQuestionAt: state.session.lastQuestionAt,
					lastSlowChapterAt: state.session.lastSlowChapterAt,
					wordsLookedUp: 0,
					questionsAsked: 0
				}
			})),
		recordReadingProgress: () =>
			update((state) => ({
				...state,
				session: {
					...state.session,
					lastProgressAt: Date.now()
				}
			})),
		markSlowChapterPrompt: () =>
			update((state) => ({
				...state,
				session: {
					...state.session,
					lastSlowChapterAt: Date.now()
				}
			})),
		recordQuestionAsked: () => {
			const state = getState();
			const nextProfile = recordQuestion(state.profile);
			const nextSession = {
				...state.session,
				questionsAsked: state.session.questionsAsked + 1,
				lastQuestionAt: Date.now()
			};
			update((current) => ({
				...current,
				profile: nextProfile,
				session: nextSession,
				status: 'ready',
				error: null
			}));
			void persist(nextProfile);
		},
		recordWordLookup: () => {
			const state = getState();
			const nextProfile = recordWordLookup(state.profile);
			const nextSession = {
				...state.session,
				wordsLookedUp: state.session.wordsLookedUp + 1
			};
			update((current) => ({
				...current,
				profile: nextProfile,
				session: nextSession,
				status: 'ready',
				error: null
			}));
			void persist(nextProfile);
		},
		recordFeedback: (messageId: string, rating: FeedbackRating, messageLength: number) => {
			const state = getState();
			const nextProfile = recordFeedback(state.profile, rating, messageId, messageLength);
			update((current) => ({
				...current,
				profile: nextProfile,
				status: 'ready',
				error: null
			}));
			void persist(nextProfile);
		}
	};
}

export const readerProfileStore = createReaderProfileStore();
