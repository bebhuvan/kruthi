import type { Settings } from '$lib/types/settings';

export const SENSITIVE_SETTINGS_KEYS = [
	'anthropicApiKey',
	'openRouterApiKey',
	'openAiApiKey',
	'geminiApiKey'
] as const;

type SensitiveKey = (typeof SENSITIVE_SETTINGS_KEYS)[number];

export function stripSensitiveSettings(settings: Settings): Settings {
	const sanitized = { ...settings };
	for (const key of SENSITIVE_SETTINGS_KEYS) {
		sanitized[key] = '';
	}
	return sanitized;
}

export function extractSensitiveSettings(settings: Partial<Settings> | null | undefined): Partial<Record<SensitiveKey, string>> {
	const source = settings ?? {};
	const result: Partial<Record<SensitiveKey, string>> = {};
	for (const key of SENSITIVE_SETTINGS_KEYS) {
		const value = source[key];
		if (typeof value === 'string' && value.trim()) {
			result[key] = value;
		}
	}
	return result;
}
