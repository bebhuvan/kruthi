export type Theme = 'light' | 'dark' | 'sepia';

export type FontFamily =
	| 'literata'
	| 'source-serif'
	| 'crimson'
	| 'garamond'
	| 'lora'
	| 'merriweather'
	| 'cormorant'
	| 'libre-baskerville';

export type TextAlign = 'left' | 'justify';

export type LLMProvider = 'anthropic' | 'openrouter' | 'openai' | 'gemini';

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange';

export interface Settings {
	theme: Theme;
	fontFamily: FontFamily;
	fontSize: number;
	lineHeight: number;
	paragraphSpacing: number;
	paragraphIndent: boolean;
	readingWidth: number;
	paperTexture: boolean;
	swipeNavigation: boolean;
	textAlign: TextAlign;
	focusMode: boolean;
	showReadingProgress: boolean;
	highlightColor: HighlightColor;
	llmProvider: LLMProvider;
	anthropicApiKey: string;
	openRouterApiKey: string;
	openRouterModel: string;
	openAiApiKey: string;
	geminiApiKey: string;
	openAiModel: string;
	geminiModel: string;
	systemPrompt: string;
}
