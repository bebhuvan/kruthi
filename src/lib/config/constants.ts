import type { ReaderProfile } from '$lib/types/readerProfile';
import type { FontFamily, HighlightColor, LLMProvider, Settings, TextAlign, Theme } from '$lib/types/settings';

export const FONT_FAMILIES: Record<FontFamily, { name: string; css: string }> = {
	literata: {
		name: 'Literata',
		css: "'Literata', Georgia, serif"
	},
	'source-serif': {
		name: 'Source Serif',
		css: "'Source Serif 4', Georgia, serif"
	},
	crimson: {
		name: 'Crimson Pro',
		css: "'Crimson Pro', Georgia, serif"
	},
	garamond: {
		name: 'EB Garamond',
		css: "'EB Garamond', Georgia, serif"
	},
	lora: {
		name: 'Lora',
		css: "'Lora', Georgia, serif"
	},
	merriweather: {
		name: 'Merriweather',
		css: "'Merriweather', Georgia, serif"
	},
	cormorant: {
		name: 'Cormorant Garamond',
		css: "'Cormorant Garamond', Georgia, serif"
	},
	'libre-baskerville': {
		name: 'Libre Baskerville',
		css: "'Libre Baskerville', Georgia, serif"
	}
};

export const FONT_SIZE_MIN = 16;
export const FONT_SIZE_MAX = 24;
export const FONT_SIZE_DEFAULT = 19;

export const LINE_HEIGHT_MIN = 1.4;
export const LINE_HEIGHT_MAX = 2.2;
export const LINE_HEIGHT_DEFAULT = 1.75;

export const PARAGRAPH_SPACING_MIN = 0.5;
export const PARAGRAPH_SPACING_MAX = 2.5;
export const PARAGRAPH_SPACING_DEFAULT = 1.5;
export const PARAGRAPH_INDENT_DEFAULT = true;

export const READING_WIDTH_MIN = 30;
export const READING_WIDTH_MAX = 60;
export const READING_WIDTH_DEFAULT = 38;
export const PAPER_TEXTURE_DEFAULT = true;
export const SWIPE_NAVIGATION_DEFAULT = true;
export const SHOW_READING_PROGRESS_DEFAULT = true;
export const DEFAULT_HIGHLIGHT_COLOR: HighlightColor = 'yellow';

// Softer, non-distracting highlight colors (like Kindle)
export const HIGHLIGHT_COLORS: Record<HighlightColor, {
	name: string;
	light: { bg: string; hover: string; active: string; glow: string };
	dark: { bg: string; hover: string; active: string; glow: string };
	sepia: { bg: string; hover: string; active: string; glow: string };
}> = {
	yellow: {
		name: 'Yellow',
		light: { bg: '#FEF9E7', hover: '#FEF3C7', active: '#FDE68A', glow: 'rgba(253, 230, 138, 0.3)' },
		dark: { bg: 'rgba(254, 243, 199, 0.15)', hover: 'rgba(253, 230, 138, 0.25)', active: 'rgba(252, 211, 77, 0.35)', glow: 'rgba(252, 211, 77, 0.2)' },
		sepia: { bg: '#FDF6E3', hover: '#FAEDCD', active: '#F5E1A4', glow: 'rgba(245, 225, 164, 0.3)' },
	},
	green: {
		name: 'Green',
		light: { bg: '#ECFDF5', hover: '#D1FAE5', active: '#A7F3D0', glow: 'rgba(167, 243, 208, 0.3)' },
		dark: { bg: 'rgba(209, 250, 229, 0.12)', hover: 'rgba(167, 243, 208, 0.2)', active: 'rgba(110, 231, 183, 0.3)', glow: 'rgba(110, 231, 183, 0.2)' },
		sepia: { bg: '#E8F5E9', hover: '#D4EDDA', active: '#B8DFC2', glow: 'rgba(184, 223, 194, 0.3)' },
	},
	blue: {
		name: 'Blue',
		light: { bg: '#EFF6FF', hover: '#DBEAFE', active: '#BFDBFE', glow: 'rgba(191, 219, 254, 0.3)' },
		dark: { bg: 'rgba(219, 234, 254, 0.12)', hover: 'rgba(191, 219, 254, 0.2)', active: 'rgba(147, 197, 253, 0.3)', glow: 'rgba(147, 197, 253, 0.2)' },
		sepia: { bg: '#E3F2FD', hover: '#D1E7F8', active: '#BBDEFB', glow: 'rgba(187, 222, 251, 0.3)' },
	},
	pink: {
		name: 'Pink',
		light: { bg: '#FDF2F8', hover: '#FCE7F3', active: '#FBCFE8', glow: 'rgba(251, 207, 232, 0.3)' },
		dark: { bg: 'rgba(252, 231, 243, 0.12)', hover: 'rgba(251, 207, 232, 0.2)', active: 'rgba(249, 168, 212, 0.3)', glow: 'rgba(249, 168, 212, 0.2)' },
		sepia: { bg: '#FCE4EC', hover: '#F8D0DC', active: '#F4B8C8', glow: 'rgba(244, 184, 200, 0.3)' },
	},
	orange: {
		name: 'Orange',
		light: { bg: '#FFF7ED', hover: '#FFEDD5', active: '#FED7AA', glow: 'rgba(254, 215, 170, 0.3)' },
		dark: { bg: 'rgba(255, 237, 213, 0.12)', hover: 'rgba(254, 215, 170, 0.2)', active: 'rgba(253, 186, 116, 0.3)', glow: 'rgba(253, 186, 116, 0.2)' },
		sepia: { bg: '#FFF3E0', hover: '#FFE8CC', active: '#FFCC80', glow: 'rgba(255, 204, 128, 0.3)' },
	},
};

export const DEFAULT_THEME: Theme = 'light';
export const DEFAULT_FONT_FAMILY: FontFamily = 'literata';
export const DEFAULT_TEXT_ALIGN: TextAlign = 'left';
export const DEFAULT_LLM_PROVIDER: LLMProvider = 'anthropic';
export const DEFAULT_OPENROUTER_MODEL = 'anthropic/claude-sonnet-4.5';
export const DEFAULT_OPENAI_MODEL = 'gpt-5.2';
export const DEFAULT_GEMINI_MODEL = 'gemini-3-flash-preview';

// OpenAI model options
export const OPENAI_MODELS = [
	{ value: 'gpt-5.2', label: 'GPT-5.2 (latest flagship)' },
	{ value: 'gpt-5-mini', label: 'GPT-5 Mini (fast & affordable)' },
	{ value: 'gpt-4.1', label: 'GPT-4.1 (stable)' },
	{ value: 'gpt-4o-mini', label: 'GPT-4o Mini (budget)' }
] as const;

// Gemini model options
export const GEMINI_MODELS = [
	{ value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro (flagship)' },
	{ value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (fast)' },
	{ value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (stable)' },
	{ value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (budget)' }
] as const;

export const DEFAULT_SYSTEM_PROMPT = `You are a thoughtful reading companion helping someone understand a book. Your role is to clarify, explain, and enrich their reading experience.

When answering questions:
- Quote relevant passages from the provided context before explaining
- Be concise but thorough — respect the reader's time
- If the answer isn't in the provided text, say so honestly
- Match the tone to the book's style when appropriate

For definitions: Give a clear, contextual meaning — how the word is used here, not just a dictionary definition.

For explanations: Connect ideas to the broader themes of the work when relevant.`;
export const OPENROUTER_MODELS = [
	{ value: 'anthropic/claude-sonnet-4.5', label: 'Claude Sonnet 4.5 (frontier)' },
	{ value: 'anthropic/claude-opus-4.5', label: 'Claude Opus 4.5 (frontier)' },
	{ value: 'anthropic/claude-haiku-4.5', label: 'Claude Haiku 4.5 (affordable)' },
	{ value: 'openai/gpt-5.2', label: 'OpenAI GPT-5.2 (latest)' },
	{ value: 'openai/gpt-4o-mini', label: 'OpenAI GPT-4o mini (budget)' },
	{ value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro (preview)' },
	{ value: 'google/gemini-3-pro-image-preview', label: 'Gemini 3 Pro Image (preview)' },
	{ value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash (preview)' },
	{ value: 'qwen/qwen3-vl-32b-instruct', label: 'Qwen3 VL 32B Instruct' },
	{ value: 'moonshotai/kimi-k2-thinking', label: 'Kimi K2 Thinking' },
	{ value: 'z-ai/glm-4.7', label: 'Z.AI GLM 4.7' }
] as const;

export const DEFAULT_SETTINGS: Settings = {
	theme: DEFAULT_THEME,
	fontFamily: DEFAULT_FONT_FAMILY,
	fontSize: FONT_SIZE_DEFAULT,
	lineHeight: LINE_HEIGHT_DEFAULT,
	paragraphSpacing: PARAGRAPH_SPACING_DEFAULT,
	paragraphIndent: PARAGRAPH_INDENT_DEFAULT,
	readingWidth: READING_WIDTH_DEFAULT,
	paperTexture: PAPER_TEXTURE_DEFAULT,
	swipeNavigation: SWIPE_NAVIGATION_DEFAULT,
	textAlign: DEFAULT_TEXT_ALIGN,
	focusMode: false,
	showReadingProgress: SHOW_READING_PROGRESS_DEFAULT,
	highlightColor: DEFAULT_HIGHLIGHT_COLOR,
	llmProvider: DEFAULT_LLM_PROVIDER,
	anthropicApiKey: '',
	openRouterApiKey: '',
	openRouterModel: DEFAULT_OPENROUTER_MODEL,
	openAiApiKey: '',
	geminiApiKey: '',
	openAiModel: DEFAULT_OPENAI_MODEL,
	geminiModel: DEFAULT_GEMINI_MODEL,
	systemPrompt: DEFAULT_SYSTEM_PROMPT
};

export const DEFAULT_READER_PROFILE: ReaderProfile = {
	id: 'local',
	vocabularyLevel: 'intermediate',
	comprehensionLevel: 'engaged',
	preferredExplanationDepth: 'moderate',
	interestedIn: [],
	questionsAsked: 0,
	wordsLookedUp: 0,
	helpfulResponses: [],
	unhelpfulResponses: [],
	updatedAt: Date.now()
};

export const STORAGE_KEYS = {
	settings: 'reading-companion-settings'
} as const;

export const SECURE_STORAGE_KEYS = {
	anthropicApiKey: 'anthropicApiKey',
	openRouterApiKey: 'openRouterApiKey',
	openAiApiKey: 'openAiApiKey',
	geminiApiKey: 'geminiApiKey'
} as const;
