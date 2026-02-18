import type { Highlight } from '$lib/types/highlight';
import { tokenize } from '$lib/utils/tokenizer';

export interface HighlightEdge {
	id: string;
	score: number;
}

export type HighlightGraph = Record<string, HighlightEdge[]>;

function toVector(text: string): Map<string, number> {
	const vec = new Map<string, number>();
	for (const token of tokenize(text)) {
		vec.set(token, (vec.get(token) ?? 0) + 1);
	}
	return vec;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
	let dot = 0;
	let normA = 0;
	let normB = 0;
	for (const value of a.values()) {
		normA += value * value;
	}
	for (const value of b.values()) {
		normB += value * value;
	}
	if (normA === 0 || normB === 0) {
		return 0;
	}
	for (const [key, valueA] of a.entries()) {
		const valueB = b.get(key) ?? 0;
		dot += valueA * valueB;
	}
	return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function buildText(highlight: Highlight): string {
	return `${highlight.selectedText}\n${highlight.note ?? ''}\n${highlight.context ?? ''}`;
}

export function buildHighlightGraph(
	highlights: Highlight[],
	maxEdgesPerNode = 3,
	minScore = 0.16
): HighlightGraph {
	const graph: HighlightGraph = {};
	const vectors = new Map<string, Map<string, number>>();
	for (const highlight of highlights) {
		vectors.set(highlight.id, toVector(buildText(highlight)));
		graph[highlight.id] = [];
	}

	for (let i = 0; i < highlights.length; i += 1) {
		for (let j = i + 1; j < highlights.length; j += 1) {
			const left = highlights[i];
			const right = highlights[j];
			if (left.bookId !== right.bookId) {
				continue;
			}
			const score = cosine(vectors.get(left.id) ?? new Map(), vectors.get(right.id) ?? new Map());
			if (score < minScore) {
				continue;
			}
			graph[left.id].push({ id: right.id, score });
			graph[right.id].push({ id: left.id, score });
		}
	}

	for (const key of Object.keys(graph)) {
		graph[key] = graph[key]
			.sort((a, b) => b.score - a.score)
			.slice(0, maxEdgesPerNode);
	}

	return graph;
}
