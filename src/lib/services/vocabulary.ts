/**
 * vocabulary.ts
 *
 * Stores and schedules vocabulary lookups with simple spaced repetition.
 */
import { adapter } from '$lib/platform';
import type { VocabularyContext, VocabularyEntry, ReviewRating } from '$lib/types/vocabulary';

const REVIEW_INTERVALS_DAYS = [0, 1, 3, 7, 14, 30, 60];
const MASTERED_THRESHOLD = 6;
const DAY_MS = 24 * 60 * 60 * 1000;

function normalizeWord(word: string): string {
	return word.trim().toLowerCase();
}

function getIntervalDays(reviewCount: number): number {
	const index = Math.min(reviewCount, REVIEW_INTERVALS_DAYS.length - 1);
	return REVIEW_INTERVALS_DAYS[index];
}

export function getNextReviewAt(entry: VocabularyEntry): number {
	if (!entry.lastReviewedAt) {
		return entry.lookedUpAt;
	}
	const intervalDays = getIntervalDays(entry.reviewCount);
	return entry.lastReviewedAt + intervalDays * DAY_MS;
}

function isDue(entry: VocabularyEntry, now: number): boolean {
	if (entry.mastered) {
		return false;
	}
	const nextReviewAt = getNextReviewAt(entry);
	return nextReviewAt <= now;
}

function applyReviewResult(entry: VocabularyEntry, rating: ReviewRating): VocabularyEntry {
	let reviewCount = entry.reviewCount;
	switch (rating) {
		case 'again':
			reviewCount = 0;
			break;
		case 'hard':
			reviewCount = Math.max(1, reviewCount);
			break;
		case 'good':
			reviewCount += 1;
			break;
		case 'easy':
			reviewCount += 2;
			break;
		default:
			reviewCount += 1;
	}

	return {
		...entry,
		reviewCount,
		lastReviewedAt: Date.now(),
		mastered: reviewCount >= MASTERED_THRESHOLD
	};
}

export async function addVocabularyEntry(
	word: string,
	definition: string,
	context: VocabularyContext,
	etymology?: string
): Promise<VocabularyEntry> {
	const normalized = normalizeWord(word);
	const existing = (await adapter.getVocabularyForBook(context.bookId)).find(
		(entry) => normalizeWord(entry.word) === normalized
	);
	const now = Date.now();
	if (existing) {
		const updated: VocabularyEntry = {
			...existing,
			definition: definition.trim() || existing.definition,
			etymology: etymology?.trim() || existing.etymology,
			context: context.context || existing.context,
			lookedUpAt: now
		};
		await adapter.saveVocabularyEntry(updated);
		return updated;
	}

	const entry: VocabularyEntry = {
		id: crypto.randomUUID(),
		word: word.trim(),
		definition: definition.trim(),
		etymology: etymology?.trim() || undefined,
		context: context.context,
		bookId: context.bookId,
		bookTitle: context.bookTitle,
		chapterId: context.chapterId,
		lookedUpAt: now,
		reviewCount: 0,
		mastered: false
	};
	await adapter.saveVocabularyEntry(entry);
	return entry;
}

export async function getVocabularyForBook(bookId: string): Promise<VocabularyEntry[]> {
	return await adapter.getVocabularyForBook(bookId);
}

export async function getAllVocabulary(): Promise<VocabularyEntry[]> {
	return await adapter.getAllVocabulary();
}

/**
 * Returns due vocabulary entries for review based on a simple interval schedule.
 */
export async function getWordsForReview(count: number): Promise<VocabularyEntry[]> {
	const entries = await adapter.getAllVocabulary();
	const now = Date.now();
	return entries
		.filter((entry) => isDue(entry, now))
		.sort((a, b) => getNextReviewAt(a) - getNextReviewAt(b))
		.slice(0, count);
}

export async function recordVocabularyReview(
	entry: VocabularyEntry,
	rating: ReviewRating
): Promise<VocabularyEntry> {
	const updated = applyReviewResult(entry, rating);
	await adapter.saveVocabularyEntry(updated);
	return updated;
}

export async function deleteVocabularyEntry(id: string): Promise<void> {
	await adapter.deleteVocabularyEntry(id);
}
