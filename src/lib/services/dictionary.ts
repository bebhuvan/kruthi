/**
 * dictionary.ts
 *
 * Loads and queries the bundled dictionary for fast, offline definitions.
 *
 * Data source:
 * - Webster's Unabridged Dictionary (1913), public domain
 */
export type DictionaryEntry = {
	word: string;
	definition: string;
};

const DICTIONARY_GZIP_URL = '/dictionaries/websters.json.gz';
const DICTIONARY_JSON_URL = '/dictionaries/websters.json';
const MAX_LOOKUP_LENGTH = 48;

let dictionaryPromise: Promise<Map<string, string>> | null = null;

function normalizeWord(raw: string): string {
	const cleaned = raw.trim().toLowerCase().replace(/’/g, "'");
	if (!cleaned) return '';
	const stripped = cleaned.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
	if (!stripped) return '';
	if (stripped.endsWith("'s")) {
		return stripped.slice(0, -2);
	}
	return stripped;
}

function buildCandidates(raw: string): string[] {
	const normalized = normalizeWord(raw);
	if (!normalized) return [];
	const candidates = new Set<string>([normalized]);

	if (normalized.includes('-')) {
		candidates.add(normalized.replace(/-/g, ''));
	}
	if (normalized.endsWith('ies') && normalized.length > 4) {
		candidates.add(`${normalized.slice(0, -3)}y`);
	}
	if (normalized.endsWith('es') && normalized.length > 3) {
		candidates.add(normalized.slice(0, -2));
	}
	if (normalized.endsWith('s') && normalized.length > 3) {
		candidates.add(normalized.slice(0, -1));
	}

	return Array.from(candidates);
}

function isSingleWord(text: string): boolean {
	if (!text.trim()) return false;
	const compact = text.trim();
	if (compact.length > MAX_LOOKUP_LENGTH) return false;
	return !/\s/.test(compact);
}

async function fetchDictionaryData(): Promise<Record<string, string>> {
	const response = await fetch(DICTIONARY_GZIP_URL);
	if (response.ok && response.body && typeof DecompressionStream !== 'undefined') {
		const stream = response.body.pipeThrough(new DecompressionStream('gzip'));
		const text = await new Response(stream).text();
		return JSON.parse(text) as Record<string, string>;
	}

	const fallback = await fetch(DICTIONARY_JSON_URL);
	if (!fallback.ok) {
		throw new Error('Failed to load dictionary data.');
	}
	const text = await fallback.text();
	return JSON.parse(text) as Record<string, string>;
}

async function loadDictionary(): Promise<Map<string, string>> {
	if (dictionaryPromise) {
		return dictionaryPromise;
	}
	dictionaryPromise = (async () => {
		const data = await fetchDictionaryData();
		const entries = Object.entries(data).map(
			([word, definition]) => [word.toLowerCase(), definition] as [string, string]
		);
		return new Map(entries);
	})();
	dictionaryPromise.catch(() => {
		dictionaryPromise = null;
	});
	return dictionaryPromise;
}

export async function lookupDictionaryDefinition(word: string): Promise<DictionaryEntry | null> {
	if (!isSingleWord(word)) {
		return null;
	}
	const dictionary = await loadDictionary();
	const candidates = buildCandidates(word);
	for (const candidate of candidates) {
		const definition = dictionary.get(candidate);
		if (definition) {
			return { word: candidate, definition };
		}
	}
	return null;
}
