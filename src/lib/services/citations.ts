import type { Chunk } from '$lib/types/retrieval';
import { getChunkById } from '$lib/services/retrieval';
import { adapter } from '$lib/platform';

export interface CitationContext {
	current: Chunk;
	previous?: Chunk;
	next?: Chunk;
}

export async function getCitationContext(chunkId: string): Promise<CitationContext | null> {
	const current = await getChunkById(chunkId);
	if (!current) {
		return null;
	}
	const chapterChunks = await adapter.getChunks(current.bookId, current.chapterId);
	if (chapterChunks.length === 0) {
		return { current };
	}
	const ordered = [...chapterChunks].sort((a, b) => {
		if (a.offsetStart !== b.offsetStart) {
			return a.offsetStart - b.offsetStart;
		}
		return a.id.localeCompare(b.id);
	});
	const index = ordered.findIndex((item) => item.id === current.id);
	if (index === -1) {
		return { current };
	}
	return {
		current,
		previous: ordered[index - 1],
		next: ordered[index + 1]
	};
}
