import { describe, expect, it } from 'vitest';
import { stripSensitiveSettings, extractSensitiveSettings } from '$lib/services/settingsSecurity';
import { DEFAULT_SETTINGS } from '$lib/config/constants';

describe('settingsSecurity', () => {
	it('strips API keys from persisted settings payload', () => {
		const settings = {
			...DEFAULT_SETTINGS,
			anthropicApiKey: 'a',
			openRouterApiKey: 'b',
			openAiApiKey: 'c',
			geminiApiKey: 'd'
		};
		const sanitized = stripSensitiveSettings(settings);

		expect(sanitized.anthropicApiKey).toBe('');
		expect(sanitized.openRouterApiKey).toBe('');
		expect(sanitized.openAiApiKey).toBe('');
		expect(sanitized.geminiApiKey).toBe('');
	});

	it('extracts legacy plaintext keys for migration', () => {
		const extracted = extractSensitiveSettings({
			anthropicApiKey: '  key1  ',
			openRouterApiKey: '',
			openAiApiKey: 'key2',
			geminiApiKey: undefined
		});

		expect(extracted.anthropicApiKey).toBe('  key1  ');
		expect(extracted.openAiApiKey).toBe('key2');
		expect(extracted.openRouterApiKey).toBeUndefined();
		expect(extracted.geminiApiKey).toBeUndefined();
	});
});
