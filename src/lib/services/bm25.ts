/**
 * bm25.ts
 *
 * BM25 ranking implementation for lexical search.
 */
import type { Chunk } from '$lib/types/retrieval';
import { tokenize } from '$lib/utils/tokenizer';

export interface BM25Index {
	k1: number;
	b: number;
	avgDocLength: number;
	docCount: number;
	termDocFreq: Map<string, number>;
}

const DEFAULT_K1 = 1.5;
const DEFAULT_B = 0.75;

export function buildBM25Index(chunks: Chunk[]): BM25Index {
	const termDocFreq = new Map<string, number>();
	let totalDocLength = 0;

	for (const chunk of chunks) {
		const tokens = tokenize(chunk.text);
		totalDocLength += tokens.length;
		const uniqueTokens = new Set(tokens);
		for (const token of uniqueTokens) {
			termDocFreq.set(token, (termDocFreq.get(token) ?? 0) + 1);
		}
	}

	const docCount = chunks.length;
	const avgDocLength = docCount === 0 ? 0 : totalDocLength / docCount;

	return {
		k1: DEFAULT_K1,
		b: DEFAULT_B,
		avgDocLength,
		docCount,
		termDocFreq
	};
}

export function scoreBM25Batch(query: string, chunks: Chunk[], index: BM25Index): number[] {
	const queryTokens = tokenize(query);
	if (queryTokens.length === 0 || chunks.length === 0) {
		return chunks.map(() => 0);
	}

	const uniqueQueryTokens = Array.from(new Set(queryTokens));
	const avgDocLength = index.avgDocLength || 1;

	return chunks.map((chunk) => {
		const docTokens = tokenize(chunk.text);
		if (docTokens.length === 0) {
			return 0;
		}

		const termCounts = new Map<string, number>();
		for (const token of docTokens) {
			termCounts.set(token, (termCounts.get(token) ?? 0) + 1);
		}

		const docLength = docTokens.length;
		let score = 0;

		for (const term of uniqueQueryTokens) {
			const tf = termCounts.get(term) ?? 0;
			if (tf === 0) {
				continue;
			}
			const df = index.termDocFreq.get(term) ?? 0;
			const idf = Math.log(1 + (index.docCount - df + 0.5) / (df + 0.5));
			const denom = tf + index.k1 * (1 - index.b + index.b * (docLength / avgDocLength));
			const termScore = idf * ((tf * (index.k1 + 1)) / denom);
			score += termScore;
		}

		return score;
	});
}
