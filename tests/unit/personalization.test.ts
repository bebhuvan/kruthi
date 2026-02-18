import { describe, expect, it } from 'vitest';
import { DEFAULT_READER_PROFILE } from '$lib/config/constants';
import {
	recordBookReadingMinutes,
	recordChapterCompletion,
	setWeeklyGoal
} from '$lib/services/personalization';

describe('personalization book stats', () => {
	it('tracks weekly goal and reading minutes per book', () => {
		const profile = { ...DEFAULT_READER_PROFILE, bookStats: {} };
		const withGoal = setWeeklyGoal(profile, 'book-1', 180);
		expect(withGoal.bookStats['book-1']?.weeklyGoalMinutes).toBe(180);

		const withReading = recordBookReadingMinutes(withGoal, 'book-1', 22);
		expect(withReading.bookStats['book-1']?.weeklyMinutesRead).toBeGreaterThanOrEqual(22);
		expect(withReading.bookStats['book-1']?.totalMinutesRead).toBeGreaterThanOrEqual(22);
	});

	it('records unique completed chapters', () => {
		const profile = { ...DEFAULT_READER_PROFILE, bookStats: {} };
		const once = recordChapterCompletion(profile, 'book-1', 'ch-1');
		const twice = recordChapterCompletion(once, 'book-1', 'ch-1');
		expect(once.bookStats['book-1']?.completedChapterIds).toContain('ch-1');
		expect(twice.bookStats['book-1']?.completedChapterIds.length).toBe(1);
	});
});
