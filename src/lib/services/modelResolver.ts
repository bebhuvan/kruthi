import { LLMError } from '$lib/types/errors';

const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';
const ANTHROPIC_MODELS_URL = 'https://api.anthropic.com/v1/models';
const ANTHROPIC_VERSION = '2023-06-01';
const CATALOG_TTL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 5000;

interface CatalogModel {
	id: string;
	created?: number;
	created_at?: string;
}

type CatalogResponse = {
	data?: CatalogModel[];
};

interface ResolvedAnthropicModels {
	flagship: string;
	thinking: string;
	fast: string;
}

const FALLBACK_ANTHROPIC_MODELS: ResolvedAnthropicModels = {
	flagship: 'claude-sonnet-4-5-20251101',
	thinking: 'claude-opus-4-5-20251101',
	fast: 'claude-haiku-4-5-20251101'
};

let openRouterCache: { expiresAt: number; models: CatalogModel[] } | null = null;
let anthropicCache: { expiresAt: number; models: CatalogModel[] } | null = null;

function normalizeCreated(model: CatalogModel): number {
	if (typeof model.created === 'number') {
		return model.created;
	}
	if (typeof model.created_at === 'string') {
		const parsed = Date.parse(model.created_at);
		return Number.isNaN(parsed) ? 0 : Math.floor(parsed / 1000);
	}
	return 0;
}

async function fetchJsonWithTimeout(url: string, headers: Record<string, string> = {}): Promise<CatalogResponse> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
	try {
		const response = await fetch(url, {
			method: 'GET',
			headers,
			signal: controller.signal
		});
		if (!response.ok) {
			throw new LLMError(`Model catalog request failed: ${response.statusText}`, response.status);
		}
		return (await response.json()) as CatalogResponse;
	} finally {
		clearTimeout(timeoutId);
	}
}

function pickLatestByPrefix(models: CatalogModel[], prefixes: string[]): string | null {
	let selected: CatalogModel | null = null;
	let selectedRank = Number.MAX_SAFE_INTEGER;
	let selectedCreated = 0;

	for (const model of models) {
		const rank = prefixes.findIndex((prefix) => model.id.startsWith(prefix));
		if (rank === -1) {
			continue;
		}
		const created = normalizeCreated(model);
		if (
			selected === null ||
			rank < selectedRank ||
			(rank === selectedRank && created > selectedCreated)
		) {
			selected = model;
			selectedRank = rank;
			selectedCreated = created;
		}
	}

	return selected?.id ?? null;
}

async function getOpenRouterModels(): Promise<CatalogModel[]> {
	if (openRouterCache && openRouterCache.expiresAt > Date.now()) {
		return openRouterCache.models;
	}
	const payload = await fetchJsonWithTimeout(OPENROUTER_MODELS_URL);
	const models = Array.isArray(payload.data) ? payload.data : [];
	openRouterCache = {
		models,
		expiresAt: Date.now() + CATALOG_TTL_MS
	};
	return models;
}

async function getAnthropicModels(apiKey: string): Promise<CatalogModel[]> {
	if (!apiKey.trim()) {
		return [];
	}
	if (anthropicCache && anthropicCache.expiresAt > Date.now()) {
		return anthropicCache.models;
	}
	const payload = await fetchJsonWithTimeout(ANTHROPIC_MODELS_URL, {
		'x-api-key': apiKey,
		'anthropic-version': ANTHROPIC_VERSION
	});
	const models = Array.isArray(payload.data) ? payload.data : [];
	anthropicCache = {
		models,
		expiresAt: Date.now() + CATALOG_TTL_MS
	};
	return models;
}

export async function resolveOpenRouterModel(requestedModel: string): Promise<string> {
	const trimmed = requestedModel.trim();
	if (trimmed && trimmed !== 'auto') {
		return trimmed;
	}

	try {
		const models = await getOpenRouterModels();
		const selected = pickLatestByPrefix(models, [
			'anthropic/claude-sonnet-',
			'anthropic/claude-opus-',
			'moonshotai/kimi-',
			'openai/gpt-5'
		]);
		return selected ?? 'anthropic/claude-sonnet-4.5';
	} catch {
		return 'anthropic/claude-sonnet-4.5';
	}
}

export async function resolveAnthropicModels(apiKey: string): Promise<ResolvedAnthropicModels> {
	try {
		const models = await getAnthropicModels(apiKey);
		if (models.length === 0) {
			return FALLBACK_ANTHROPIC_MODELS;
		}

		return {
			flagship:
				pickLatestByPrefix(models, ['claude-sonnet-', 'claude-3-7-sonnet', 'claude-3-5-sonnet']) ??
				FALLBACK_ANTHROPIC_MODELS.flagship,
			thinking:
				pickLatestByPrefix(models, ['claude-opus-', 'claude-sonnet-']) ??
				FALLBACK_ANTHROPIC_MODELS.thinking,
			fast:
				pickLatestByPrefix(models, ['claude-haiku-', 'claude-3-5-haiku', 'claude-3-haiku']) ??
				FALLBACK_ANTHROPIC_MODELS.fast
		};
	} catch {
		return FALLBACK_ANTHROPIC_MODELS;
	}
}
