import { writable } from 'svelte/store';
import { DEFAULT_SETTINGS, DEFAULT_SYSTEM_PROMPT, FONT_FAMILIES, HIGHLIGHT_COLORS, SECURE_STORAGE_KEYS } from '$lib/config/constants';
import type { FontFamily, HighlightColor, Settings, TextAlign, Theme } from '$lib/types/settings';
import { adapter } from '$lib/platform';

function normalizeSettings(parsed: Partial<Settings> | null | undefined): Settings {
	const source = parsed ?? {};
	return {
		theme: source.theme ?? DEFAULT_SETTINGS.theme,
		fontFamily: source.fontFamily ?? DEFAULT_SETTINGS.fontFamily,
		fontSize: source.fontSize ?? DEFAULT_SETTINGS.fontSize,
		lineHeight: source.lineHeight ?? DEFAULT_SETTINGS.lineHeight,
		paragraphSpacing: source.paragraphSpacing ?? DEFAULT_SETTINGS.paragraphSpacing,
		paragraphIndent: source.paragraphIndent ?? DEFAULT_SETTINGS.paragraphIndent,
		readingWidth: source.readingWidth ?? DEFAULT_SETTINGS.readingWidth,
		paperTexture: source.paperTexture ?? DEFAULT_SETTINGS.paperTexture,
		swipeNavigation: source.swipeNavigation ?? DEFAULT_SETTINGS.swipeNavigation,
		textAlign: source.textAlign ?? DEFAULT_SETTINGS.textAlign,
		focusMode: source.focusMode ?? DEFAULT_SETTINGS.focusMode,
		showReadingProgress: source.showReadingProgress ?? DEFAULT_SETTINGS.showReadingProgress,
		highlightColor: source.highlightColor ?? DEFAULT_SETTINGS.highlightColor,
		llmProvider: source.llmProvider ?? DEFAULT_SETTINGS.llmProvider,
		anthropicApiKey: source.anthropicApiKey ?? DEFAULT_SETTINGS.anthropicApiKey,
		openRouterApiKey: source.openRouterApiKey ?? DEFAULT_SETTINGS.openRouterApiKey,
		openRouterModel: source.openRouterModel ?? DEFAULT_SETTINGS.openRouterModel,
		openAiApiKey: source.openAiApiKey ?? DEFAULT_SETTINGS.openAiApiKey,
		geminiApiKey: source.geminiApiKey ?? DEFAULT_SETTINGS.geminiApiKey,
		openAiModel: source.openAiModel ?? DEFAULT_SETTINGS.openAiModel,
		geminiModel: source.geminiModel ?? DEFAULT_SETTINGS.geminiModel,
		systemPrompt: source.systemPrompt ?? DEFAULT_SETTINGS.systemPrompt
	};
}

function applySettings(settings: Settings): void {
	if (typeof document === 'undefined') {
		return;
	}
	const root = document.documentElement;

	// Apply theme via data attribute
	root.setAttribute('data-theme', settings.theme);

	// Apply reading font
	const fontConfig = FONT_FAMILIES[settings.fontFamily];
	root.style.setProperty('--font-reading', fontConfig.css);

	// Apply typography settings
	root.style.setProperty('--text-reading', `${settings.fontSize}px`);
	root.style.setProperty('--line-height-reading', `${settings.lineHeight}`);
	root.style.setProperty('--paragraph-spacing', `${settings.paragraphSpacing}em`);
	root.style.setProperty('--text-align-reading', settings.textAlign);
	root.style.setProperty('--max-width-reading', `${settings.readingWidth}em`);
	root.style.setProperty('--paragraph-indent', settings.paragraphIndent ? '1.5em' : '0');

	root.setAttribute('data-texture', settings.paperTexture ? 'paper' : 'none');
	root.setAttribute('data-paragraph-indent', settings.paragraphIndent ? 'true' : 'false');

	// Apply focus mode
	root.setAttribute('data-focus-mode', settings.focusMode ? 'true' : 'false');

	// Apply highlight color
	const highlightConfig = HIGHLIGHT_COLORS[settings.highlightColor];
	const themeHighlights = highlightConfig[settings.theme];
	root.style.setProperty('--highlight', themeHighlights.bg);
	root.style.setProperty('--highlight-hover', themeHighlights.hover);
	root.style.setProperty('--highlight-active', themeHighlights.active);
	root.style.setProperty('--highlight-glow', themeHighlights.glow);

	// Update theme-color meta tag for mobile browsers
	const themeColorMeta = document.querySelector('meta[name="theme-color"]');
	if (themeColorMeta) {
		const themeColors: Record<Theme, string> = {
			light: '#FDFCFB',
			dark: '#141413',
			sepia: '#F8F4EC'
		};
		themeColorMeta.setAttribute('content', themeColors[settings.theme]);
	}
}

function persistSettings(settings: Settings): void {
	void adapter.saveSettings(settings);
}

const initial = DEFAULT_SETTINGS;
applySettings(initial);

function createSettingsStore() {
	const { subscribe, set, update } = writable<Settings>(initial);

	const hydrate = async () => {
		const stored = await adapter.getSettings();
		const [anthropicApiKey, openRouterApiKey, openAiApiKey, geminiApiKey] = await Promise.all([
			adapter.getSecureValue(SECURE_STORAGE_KEYS.anthropicApiKey),
			adapter.getSecureValue(SECURE_STORAGE_KEYS.openRouterApiKey),
			adapter.getSecureValue(SECURE_STORAGE_KEYS.openAiApiKey),
			adapter.getSecureValue(SECURE_STORAGE_KEYS.geminiApiKey)
		]);

		let next = normalizeSettings(stored);
		if (anthropicApiKey) {
			next = { ...next, anthropicApiKey };
		} else if (stored?.anthropicApiKey) {
			await adapter.setSecureValue(SECURE_STORAGE_KEYS.anthropicApiKey, stored.anthropicApiKey);
		}

		if (openRouterApiKey) {
			next = { ...next, openRouterApiKey };
		} else if (stored?.openRouterApiKey) {
			await adapter.setSecureValue(SECURE_STORAGE_KEYS.openRouterApiKey, stored.openRouterApiKey);
		}

		if (openAiApiKey) {
			next = { ...next, openAiApiKey };
		} else if (stored?.openAiApiKey) {
			await adapter.setSecureValue(SECURE_STORAGE_KEYS.openAiApiKey, stored.openAiApiKey);
		}

		if (geminiApiKey) {
			next = { ...next, geminiApiKey };
		} else if (stored?.geminiApiKey) {
			await adapter.setSecureValue(SECURE_STORAGE_KEYS.geminiApiKey, stored.geminiApiKey);
		}

		applySettings(next);
		set(next);
	};

	void hydrate();

	return {
		subscribe,

		setTheme: (theme: Theme) =>
			update((settings) => {
				const next = { ...settings, theme };
				applySettings(next);
				persistSettings(next);
				return next;
			}),

		setFontFamily: (fontFamily: FontFamily) =>
			update((settings) => {
				const next = { ...settings, fontFamily };
				applySettings(next);
				persistSettings(next);
				return next;
			}),

		setFontSize: (fontSize: number) =>
			update((settings) => {
				const next = { ...settings, fontSize };
				applySettings(next);
				persistSettings(next);
				return next;
			}),

		setLineHeight: (lineHeight: number) =>
			update((settings) => {
				const next = { ...settings, lineHeight };
				applySettings(next);
				persistSettings(next);
				return next;
			}),

		setParagraphSpacing: (paragraphSpacing: number) =>
			update((settings) => {
				const next = { ...settings, paragraphSpacing };
				applySettings(next);
				persistSettings(next);
				return next;
			}),

		setParagraphIndent: (paragraphIndent: boolean) =>
			update((settings) => {
				const next = { ...settings, paragraphIndent };
				applySettings(next);
				persistSettings(next);
				return next;
			}),

		setReadingWidth: (readingWidth: number) =>
			update((settings) => {
				const next = { ...settings, readingWidth };
				applySettings(next);
				persistSettings(next);
				return next;
			}),

		setPaperTexture: (paperTexture: boolean) =>
			update((settings) => {
				const next = { ...settings, paperTexture };
				applySettings(next);
				persistSettings(next);
				return next;
			}),

		setSwipeNavigation: (swipeNavigation: boolean) =>
			update((settings) => {
				const next = { ...settings, swipeNavigation };
				persistSettings(next);
				return next;
			}),

		setTextAlign: (textAlign: TextAlign) =>
			update((settings) => {
				const next = { ...settings, textAlign };
				applySettings(next);
				persistSettings(next);
				return next;
			}),

		setFocusMode: (focusMode: boolean) =>
			update((settings) => {
				const next = { ...settings, focusMode };
				applySettings(next);
				persistSettings(next);
				return next;
			}),

		toggleFocusMode: () =>
			update((settings) => {
				const next = { ...settings, focusMode: !settings.focusMode };
				applySettings(next);
				persistSettings(next);
				return next;
			}),

		setShowReadingProgress: (showReadingProgress: boolean) =>
			update((settings) => {
				const next = { ...settings, showReadingProgress };
				persistSettings(next);
				return next;
			}),

		setHighlightColor: (highlightColor: HighlightColor) =>
			update((settings) => {
				const next = { ...settings, highlightColor };
				applySettings(next);
				persistSettings(next);
				return next;
			}),

		setAnthropicApiKey: (anthropicApiKey: string) =>
			update((settings) => {
				const next = { ...settings, anthropicApiKey };
				void adapter.setSecureValue(SECURE_STORAGE_KEYS.anthropicApiKey, anthropicApiKey);
				persistSettings(next);
				return next;
			}),

		setLlmProvider: (llmProvider: Settings['llmProvider']) =>
			update((settings) => {
				const next = { ...settings, llmProvider };
				persistSettings(next);
				return next;
			}),

		setOpenRouterApiKey: (openRouterApiKey: string) =>
			update((settings) => {
				const next = { ...settings, openRouterApiKey };
				void adapter.setSecureValue(SECURE_STORAGE_KEYS.openRouterApiKey, openRouterApiKey);
				persistSettings(next);
				return next;
			}),

		setOpenAiApiKey: (openAiApiKey: string) =>
			update((settings) => {
				const next = { ...settings, openAiApiKey };
				void adapter.setSecureValue(SECURE_STORAGE_KEYS.openAiApiKey, openAiApiKey);
				persistSettings(next);
				return next;
			}),

		setGeminiApiKey: (geminiApiKey: string) =>
			update((settings) => {
				const next = { ...settings, geminiApiKey };
				void adapter.setSecureValue(SECURE_STORAGE_KEYS.geminiApiKey, geminiApiKey);
				persistSettings(next);
				return next;
			}),

		setOpenRouterModel: (openRouterModel: string) =>
			update((settings) => {
				const next = { ...settings, openRouterModel };
				persistSettings(next);
				return next;
			}),

		setOpenAiModel: (openAiModel: string) =>
			update((settings) => {
				const next = { ...settings, openAiModel };
				persistSettings(next);
				return next;
			}),

		setGeminiModel: (geminiModel: string) =>
			update((settings) => {
				const next = { ...settings, geminiModel };
				persistSettings(next);
				return next;
			}),

		setSystemPrompt: (systemPrompt: string) =>
			update((settings) => {
				const next = { ...settings, systemPrompt };
				persistSettings(next);
				return next;
			}),

		resetSystemPrompt: () =>
			update((settings) => {
				const next = { ...settings, systemPrompt: DEFAULT_SYSTEM_PROMPT };
				persistSettings(next);
				return next;
			}),

		toggleTheme: () =>
			update((settings) => {
				const order: Theme[] = ['light', 'dark', 'sepia'];
				const index = order.indexOf(settings.theme);
				const nextTheme = order[(index + 1) % order.length] ?? 'light';
				const next = { ...settings, theme: nextTheme };
				applySettings(next);
				persistSettings(next);
				return next;
			}),

		reset: () => {
			applySettings(DEFAULT_SETTINGS);
			persistSettings(DEFAULT_SETTINGS);
			void adapter.deleteSecureValue(SECURE_STORAGE_KEYS.anthropicApiKey);
			void adapter.deleteSecureValue(SECURE_STORAGE_KEYS.openRouterApiKey);
			void adapter.deleteSecureValue(SECURE_STORAGE_KEYS.openAiApiKey);
			void adapter.deleteSecureValue(SECURE_STORAGE_KEYS.geminiApiKey);
			set(DEFAULT_SETTINGS);
		}
	};
}

export const settingsStore = createSettingsStore();
