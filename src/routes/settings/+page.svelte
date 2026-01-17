<script lang="ts">
	import { goto } from '$app/navigation';
	import { settingsStore } from '$lib/stores/settingsStore';
	import {
		FONT_FAMILIES,
		FONT_SIZE_MIN,
		FONT_SIZE_MAX,
		LINE_HEIGHT_MIN,
		LINE_HEIGHT_MAX,
		PARAGRAPH_SPACING_MIN,
		PARAGRAPH_SPACING_MAX,
		READING_WIDTH_MIN,
		READING_WIDTH_MAX,
		OPENROUTER_MODELS,
		DEFAULT_SYSTEM_PROMPT,
		HIGHLIGHT_COLORS
	} from '$lib/config/constants';
	import type { FontFamily, HighlightColor, TextAlign, Theme } from '$lib/types/settings';

	const highlightColorOptions: { value: HighlightColor; label: string; color: string }[] = [
		{ value: 'yellow', label: 'Yellow', color: '#FDE68A' },
		{ value: 'green', label: 'Green', color: '#A7F3D0' },
		{ value: 'blue', label: 'Blue', color: '#BFDBFE' },
		{ value: 'pink', label: 'Pink', color: '#FBCFE8' },
		{ value: 'orange', label: 'Orange', color: '#FED7AA' },
	];

	let apiKey = $settingsStore.anthropicApiKey;
	let openRouterKey = $settingsStore.openRouterApiKey;
	let openRouterModel = $settingsStore.openRouterModel;
	let openAiKey = $settingsStore.openAiApiKey;
	let geminiKey = $settingsStore.geminiApiKey;
	let openAiModel = $settingsStore.openAiModel;
	let geminiModel = $settingsStore.geminiModel;
	let systemPrompt = $settingsStore.systemPrompt;
	let showApiKey = false;
	let showOpenRouterKey = false;
	let showOpenAiKey = false;
	let showGeminiKey = false;
	let showAdvanced = false;

	const themes: { value: Theme; label: string }[] = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'sepia', label: 'Sepia' }
	];

	const fonts: { value: FontFamily; label: string }[] = [
		{ value: 'literata', label: 'Literata' },
		{ value: 'source-serif', label: 'Source Serif' },
		{ value: 'crimson', label: 'Crimson Pro' },
		{ value: 'garamond', label: 'EB Garamond' },
		{ value: 'lora', label: 'Lora' },
		{ value: 'merriweather', label: 'Merriweather' },
		{ value: 'cormorant', label: 'Cormorant Garamond' },
		{ value: 'libre-baskerville', label: 'Libre Baskerville' }
	];

	const saveApiKey = () => {
		settingsStore.setAnthropicApiKey(apiKey.trim());
	};

	const saveOpenRouterKey = () => {
		settingsStore.setOpenRouterApiKey(openRouterKey.trim());
	};

	const saveOpenRouterModel = () => {
		settingsStore.setOpenRouterModel(openRouterModel.trim());
	};

	const saveOpenAiKey = () => {
		settingsStore.setOpenAiApiKey(openAiKey.trim());
	};

	const saveOpenAiModel = () => {
		settingsStore.setOpenAiModel(openAiModel.trim());
	};

	const saveGeminiKey = () => {
		settingsStore.setGeminiApiKey(geminiKey.trim());
	};

	const saveGeminiModel = () => {
		settingsStore.setGeminiModel(geminiModel.trim());
	};

	const saveSystemPrompt = () => {
		const trimmed = systemPrompt.trim();
		settingsStore.setSystemPrompt(trimmed || DEFAULT_SYSTEM_PROMPT);
		systemPrompt = trimmed || DEFAULT_SYSTEM_PROMPT;
	};

	const resetSystemPrompt = () => {
		systemPrompt = DEFAULT_SYSTEM_PROMPT;
		settingsStore.resetSystemPrompt();
	};

	$: isDefaultPrompt = systemPrompt.trim() === DEFAULT_SYSTEM_PROMPT.trim();
</script>

<div class="settings-page">
	<header class="header">
		<button type="button" class="back-btn" on:click={() => history.back()}>
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
				<path d="M12 4L6 10L12 16" />
			</svg>
			Back
		</button>
		<h1 class="page-title">Settings</h1>
		<div class="header-spacer"></div>
	</header>

	<main class="main">
		<div class="settings-container">
			<!-- Appearance Section -->
			<section class="settings-section">
				<h2 class="section-title">Appearance</h2>
				<div class="section-content">
					<div class="setting-row">
						<div class="setting-info">
							<span class="setting-label">Theme</span>
							<span class="setting-description">Choose your reading environment</span>
						</div>
						<div class="theme-toggle" role="radiogroup" aria-label="Theme selection">
							{#each themes as theme}
								<button
									type="button"
									role="radio"
									aria-checked={$settingsStore.theme === theme.value}
									class="theme-option"
									class:active={$settingsStore.theme === theme.value}
									on:click={() => settingsStore.setTheme(theme.value)}
								>
									{theme.label}
								</button>
							{/each}
						</div>
					</div>
				</div>
			</section>

			<!-- Typography Section -->
			<section class="settings-section">
				<h2 class="section-title">Typography</h2>
				<div class="section-content">
					<div class="setting-row">
						<div class="setting-info">
							<span class="setting-label">Font</span>
							<span class="setting-description">Select your reading typeface</span>
						</div>
						<select
							class="font-select"
							value={$settingsStore.fontFamily}
							on:change={(e) => settingsStore.setFontFamily(e.currentTarget.value as FontFamily)}
						>
							{#each fonts as font}
								<option value={font.value}>{font.label}</option>
							{/each}
						</select>
					</div>

					<!-- Font Preview -->
					<div class="font-preview" style="font-family: {FONT_FAMILIES[$settingsStore.fontFamily].css}">
						<span class="preview-letter">Aa</span>
						<p class="preview-text">
							The quick brown fox jumps over the lazy dog.
							Reading should feel effortless and beautiful.
						</p>
					</div>

					<div class="setting-row">
						<div class="setting-info">
							<span class="setting-label">Size</span>
							<span class="setting-description">Adjust text size for comfortable reading</span>
						</div>
						<div class="size-control">
							<span class="size-indicator small">A</span>
							<input
								type="range"
								min={FONT_SIZE_MIN}
								max={FONT_SIZE_MAX}
								step="1"
								value={$settingsStore.fontSize}
								on:input={(e) => settingsStore.setFontSize(Number(e.currentTarget.value))}
								class="size-slider"
								aria-label="Font size"
							/>
							<span class="size-indicator large">A</span>
							<span class="size-value">{$settingsStore.fontSize}px</span>
						</div>
					</div>

					<div class="setting-row">
						<div class="setting-info">
							<span class="setting-label">Line height</span>
							<span class="setting-description">Space between lines of text</span>
						</div>
						<div class="size-control">
							<span class="size-indicator-text">Tight</span>
							<input
								type="range"
								min={LINE_HEIGHT_MIN}
								max={LINE_HEIGHT_MAX}
								step="0.05"
								value={$settingsStore.lineHeight}
								on:input={(e) => settingsStore.setLineHeight(Number(e.currentTarget.value))}
								class="size-slider"
								aria-label="Line height"
							/>
							<span class="size-indicator-text">Loose</span>
							<span class="size-value">{$settingsStore.lineHeight.toFixed(2)}</span>
						</div>
					</div>

					<div class="setting-row">
						<div class="setting-info">
							<span class="setting-label">Paragraph spacing</span>
							<span class="setting-description">Space between paragraphs</span>
						</div>
						<div class="size-control">
							<span class="size-indicator-text">Compact</span>
							<input
								type="range"
								min={PARAGRAPH_SPACING_MIN}
								max={PARAGRAPH_SPACING_MAX}
								step="0.1"
								value={$settingsStore.paragraphSpacing}
								on:input={(e) => settingsStore.setParagraphSpacing(Number(e.currentTarget.value))}
								class="size-slider"
								aria-label="Paragraph spacing"
							/>
							<span class="size-indicator-text">Airy</span>
							<span class="size-value">{$settingsStore.paragraphSpacing.toFixed(1)}em</span>
						</div>
					</div>

					<div class="setting-row">
						<div class="setting-info">
							<span class="setting-label">Paragraph indent</span>
							<span class="setting-description">Indent first lines for a classic book feel</span>
						</div>
						<button
							type="button"
							class="toggle-switch"
							class:active={$settingsStore.paragraphIndent}
							on:click={() => settingsStore.setParagraphIndent(!$settingsStore.paragraphIndent)}
							role="switch"
							aria-checked={$settingsStore.paragraphIndent}
							aria-label="Toggle paragraph indent"
						>
							<span class="toggle-knob"></span>
						</button>
					</div>

					<div class="setting-row">
						<div class="setting-info">
							<span class="setting-label">Reading width</span>
							<span class="setting-description">Max line width for the reading column</span>
						</div>
						<div class="size-control">
							<span class="size-indicator-text">Narrow</span>
							<input
								type="range"
								min={READING_WIDTH_MIN}
								max={READING_WIDTH_MAX}
								step="1"
								value={$settingsStore.readingWidth}
								on:input={(e) => settingsStore.setReadingWidth(Number(e.currentTarget.value))}
								class="size-slider"
								aria-label="Reading width"
							/>
							<span class="size-indicator-text">Wide</span>
							<span class="size-value">{$settingsStore.readingWidth}em</span>
						</div>
					</div>

					<div class="setting-row">
						<div class="setting-info">
							<span class="setting-label">Alignment</span>
							<span class="setting-description">How text aligns to margins</span>
						</div>
						<div class="theme-toggle" role="radiogroup" aria-label="Text alignment">
							<button
								type="button"
								role="radio"
								aria-checked={$settingsStore.textAlign === 'left'}
								class="theme-option"
								class:active={$settingsStore.textAlign === 'left'}
								on:click={() => settingsStore.setTextAlign('left')}
							>
								Left
							</button>
							<button
								type="button"
								role="radio"
								aria-checked={$settingsStore.textAlign === 'justify'}
								class="theme-option"
								class:active={$settingsStore.textAlign === 'justify'}
								on:click={() => settingsStore.setTextAlign('justify')}
							>
								Justify
							</button>
						</div>
					</div>
				</div>
			</section>

			<!-- Reading Section -->
			<section class="settings-section">
				<h2 class="section-title">Reading</h2>
				<div class="section-content">
					<div class="setting-row">
						<div class="setting-info">
							<span class="setting-label">Paper texture</span>
							<span class="setting-description">Subtle grain for a tactile page feel</span>
						</div>
						<button
							type="button"
							class="toggle-switch"
							class:active={$settingsStore.paperTexture}
							on:click={() => settingsStore.setPaperTexture(!$settingsStore.paperTexture)}
							role="switch"
							aria-checked={$settingsStore.paperTexture}
							aria-label="Toggle paper texture"
						>
							<span class="toggle-knob"></span>
						</button>
					</div>
					<div class="setting-row">
						<div class="setting-info">
							<span class="setting-label">Swipe navigation</span>
							<span class="setting-description">Swipe left/right to move between chapters</span>
						</div>
						<button
							type="button"
							class="toggle-switch"
							class:active={$settingsStore.swipeNavigation}
							on:click={() => settingsStore.setSwipeNavigation(!$settingsStore.swipeNavigation)}
							role="switch"
							aria-checked={$settingsStore.swipeNavigation}
							aria-label="Toggle swipe navigation"
						>
							<span class="toggle-knob"></span>
						</button>
					</div>
					<div class="setting-row">
						<div class="setting-info">
							<span class="setting-label">Focus mode</span>
							<span class="setting-description">Dim surrounding text to highlight current paragraph</span>
						</div>
						<button
							type="button"
							class="toggle-switch"
							class:active={$settingsStore.focusMode}
							on:click={() => settingsStore.toggleFocusMode()}
							role="switch"
							aria-checked={$settingsStore.focusMode}
							aria-label="Toggle focus mode"
						>
							<span class="toggle-knob"></span>
						</button>
					</div>
					<div class="setting-row">
						<div class="setting-info">
							<span class="setting-label">Reading progress</span>
							<span class="setting-description">Show progress bar and chapter indicator</span>
						</div>
						<button
							type="button"
							class="toggle-switch"
							class:active={$settingsStore.showReadingProgress}
							on:click={() => settingsStore.setShowReadingProgress(!$settingsStore.showReadingProgress)}
							role="switch"
							aria-checked={$settingsStore.showReadingProgress}
							aria-label="Toggle reading progress"
						>
							<span class="toggle-knob"></span>
						</button>
					</div>
					<div class="setting-row">
						<div class="setting-info">
							<span class="setting-label">Highlight color</span>
							<span class="setting-description">Choose your preferred highlight color</span>
						</div>
						<div class="highlight-colors" role="radiogroup" aria-label="Highlight color selection">
							{#each highlightColorOptions as colorOption}
								<button
									type="button"
									role="radio"
									aria-checked={$settingsStore.highlightColor === colorOption.value}
									class="color-swatch"
									class:active={$settingsStore.highlightColor === colorOption.value}
									style="--swatch-color: {colorOption.color}"
									on:click={() => settingsStore.setHighlightColor(colorOption.value)}
									title={colorOption.label}
								>
									{#if $settingsStore.highlightColor === colorOption.value}
										<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M3 7l3 3 5-5" />
										</svg>
									{/if}
								</button>
							{/each}
						</div>
					</div>
				</div>
			</section>

			<!-- Keyboard Shortcuts Section -->
			<section class="settings-section">
				<h2 class="section-title">Keyboard Shortcuts</h2>
				<div class="section-content">
					<div class="shortcuts-grid">
						<div class="shortcut-group">
							<h3 class="shortcut-group-title">Navigation</h3>
							<div class="shortcut-item">
								<span class="shortcut-keys"><kbd>j</kbd> / <kbd>↓</kbd></span>
								<span class="shortcut-desc">Scroll down</span>
							</div>
							<div class="shortcut-item">
								<span class="shortcut-keys"><kbd>k</kbd> / <kbd>↑</kbd></span>
								<span class="shortcut-desc">Scroll up</span>
							</div>
							<div class="shortcut-item">
								<span class="shortcut-keys"><kbd>Space</kbd></span>
								<span class="shortcut-desc">Page down</span>
							</div>
							<div class="shortcut-item">
								<span class="shortcut-keys"><kbd>Shift</kbd> + <kbd>Space</kbd></span>
								<span class="shortcut-desc">Page up</span>
							</div>
							<div class="shortcut-item">
								<span class="shortcut-keys"><kbd>←</kbd> / <kbd>p</kbd></span>
								<span class="shortcut-desc">Previous chapter</span>
							</div>
							<div class="shortcut-item">
								<span class="shortcut-keys"><kbd>→</kbd> / <kbd>n</kbd></span>
								<span class="shortcut-desc">Next chapter</span>
							</div>
						</div>
						<div class="shortcut-group">
							<h3 class="shortcut-group-title">Features</h3>
							<div class="shortcut-item">
								<span class="shortcut-keys"><kbd>/</kbd></span>
								<span class="shortcut-desc">Search in book</span>
							</div>
							<div class="shortcut-item">
								<span class="shortcut-keys"><kbd>t</kbd></span>
								<span class="shortcut-desc">Table of contents</span>
							</div>
							<div class="shortcut-item">
								<span class="shortcut-keys"><kbd>c</kbd></span>
								<span class="shortcut-desc">Open chat</span>
							</div>
							<div class="shortcut-item">
								<span class="shortcut-keys"><kbd>f</kbd></span>
								<span class="shortcut-desc">Toggle focus mode</span>
							</div>
							<div class="shortcut-item">
								<span class="shortcut-keys"><kbd>Esc</kbd></span>
								<span class="shortcut-desc">Close panel</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- AI Assistant Section -->
			<section class="settings-section">
				<h2 class="section-title">AI Assistant</h2>
				<div class="section-content">
					<div class="setting-row">
						<div class="setting-info">
							<span class="setting-label">Provider</span>
							<span class="setting-description">Choose your AI provider</span>
						</div>
						<div class="theme-toggle" role="radiogroup" aria-label="LLM provider">
							<button
								type="button"
								role="radio"
								aria-checked={$settingsStore.llmProvider === 'anthropic'}
								class="theme-option"
								class:active={$settingsStore.llmProvider === 'anthropic'}
								on:click={() => settingsStore.setLlmProvider('anthropic')}
							>
								Anthropic
							</button>
							<button
								type="button"
								role="radio"
								aria-checked={$settingsStore.llmProvider === 'openrouter'}
								class="theme-option"
								class:active={$settingsStore.llmProvider === 'openrouter'}
								on:click={() => settingsStore.setLlmProvider('openrouter')}
							>
								OpenRouter
							</button>
							<button
								type="button"
								role="radio"
								aria-checked={$settingsStore.llmProvider === 'openai'}
								class="theme-option"
								class:active={$settingsStore.llmProvider === 'openai'}
								on:click={() => settingsStore.setLlmProvider('openai')}
							>
								OpenAI
							</button>
							<button
								type="button"
								role="radio"
								aria-checked={$settingsStore.llmProvider === 'gemini'}
								class="theme-option"
								class:active={$settingsStore.llmProvider === 'gemini'}
								on:click={() => settingsStore.setLlmProvider('gemini')}
							>
								Gemini
							</button>
						</div>
					</div>

					{#if $settingsStore.llmProvider === 'anthropic'}
						<div class="api-key-field">
							<div class="setting-info">
								<label class="setting-label" for="api-key">API Key</label>
								<span class="setting-description">Stored locally. Sent only to Anthropic.</span>
							</div>
							<div class="api-key-input-wrapper">
								<input
									id="api-key"
									type={showApiKey ? 'text' : 'password'}
									class="input api-key-input"
									placeholder="sk-ant-..."
									bind:value={apiKey}
									on:blur={saveApiKey}
								/>
								<button
									type="button"
									class="toggle-visibility"
									on:click={() => showApiKey = !showApiKey}
									aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
								>
									{showApiKey ? 'Hide' : 'Show'}
								</button>
							</div>
						</div>
					{:else if $settingsStore.llmProvider === 'openrouter'}
						<div class="api-key-field">
							<div class="setting-info">
								<label class="setting-label" for="openrouter-key">API Key</label>
								<span class="setting-description">Stored locally. Sent only to OpenRouter.</span>
							</div>
							<div class="api-key-input-wrapper">
								<input
									id="openrouter-key"
									type={showOpenRouterKey ? 'text' : 'password'}
									class="input api-key-input"
									placeholder="sk-or-..."
									bind:value={openRouterKey}
									on:blur={saveOpenRouterKey}
								/>
								<button
									type="button"
									class="toggle-visibility"
									on:click={() => showOpenRouterKey = !showOpenRouterKey}
									aria-label={showOpenRouterKey ? 'Hide API key' : 'Show API key'}
								>
									{showOpenRouterKey ? 'Hide' : 'Show'}
								</button>
							</div>
						</div>

						<div class="setting-row stacked">
							<div class="setting-info">
								<label class="setting-label" for="openrouter-model">Model</label>
								<span class="setting-description">Select or enter a custom model identifier</span>
							</div>
							<select
								id="openrouter-model"
								class="font-select full-width"
								value={openRouterModel}
								on:change={(e) => {
									openRouterModel = e.currentTarget.value;
									saveOpenRouterModel();
								}}
							>
								{#each OPENROUTER_MODELS as model}
									<option value={model.value}>{model.label}</option>
								{/each}
							</select>
							<input
								type="text"
								class="input full-width"
								placeholder="Or enter custom: provider/model"
								bind:value={openRouterModel}
								on:blur={saveOpenRouterModel}
							/>
						</div>
					{:else if $settingsStore.llmProvider === 'openai'}
						<div class="api-key-field">
							<div class="setting-info">
								<label class="setting-label" for="openai-key">API Key</label>
								<span class="setting-description">Stored locally. Sent only to OpenAI.</span>
							</div>
							<div class="api-key-input-wrapper">
								<input
									id="openai-key"
									type={showOpenAiKey ? 'text' : 'password'}
									class="input api-key-input"
									placeholder="sk-..."
									bind:value={openAiKey}
									on:blur={saveOpenAiKey}
								/>
								<button
									type="button"
									class="toggle-visibility"
									on:click={() => showOpenAiKey = !showOpenAiKey}
									aria-label={showOpenAiKey ? 'Hide API key' : 'Show API key'}
								>
									{showOpenAiKey ? 'Hide' : 'Show'}
								</button>
							</div>
						</div>

						<div class="setting-row stacked">
							<div class="setting-info">
								<label class="setting-label" for="openai-model">Model</label>
								<span class="setting-description">Enter the OpenAI model identifier</span>
							</div>
							<input
								id="openai-model"
								type="text"
								class="input full-width"
								placeholder="gpt-4o-mini"
								bind:value={openAiModel}
								on:blur={saveOpenAiModel}
							/>
						</div>
					{:else}
						<div class="api-key-field">
							<div class="setting-info">
								<label class="setting-label" for="gemini-key">API Key</label>
								<span class="setting-description">Stored locally. Sent only to Gemini.</span>
							</div>
							<div class="api-key-input-wrapper">
								<input
									id="gemini-key"
									type={showGeminiKey ? 'text' : 'password'}
									class="input api-key-input"
									placeholder="AIza..."
									bind:value={geminiKey}
									on:blur={saveGeminiKey}
								/>
								<button
									type="button"
									class="toggle-visibility"
									on:click={() => showGeminiKey = !showGeminiKey}
									aria-label={showGeminiKey ? 'Hide API key' : 'Show API key'}
								>
									{showGeminiKey ? 'Hide' : 'Show'}
								</button>
							</div>
						</div>

						<div class="setting-row stacked">
							<div class="setting-info">
								<label class="setting-label" for="gemini-model">Model</label>
								<span class="setting-description">Enter the Gemini model identifier</span>
							</div>
							<input
								id="gemini-model"
								type="text"
								class="input full-width"
								placeholder="gemini-1.5-flash"
								bind:value={geminiModel}
								on:blur={saveGeminiModel}
							/>
						</div>
					{/if}

					<div class="api-key-field">
						<div class="setting-info">
							<label class="setting-label" for="openai-key">OpenAI API Key</label>
							<span class="setting-description">Stored locally for future OpenAI support.</span>
						</div>
						<div class="api-key-input-wrapper">
							<input
								id="openai-key"
								type={showOpenAiKey ? 'text' : 'password'}
								class="input api-key-input"
								placeholder="sk-..."
								bind:value={openAiKey}
								on:blur={saveOpenAiKey}
							/>
							<button
								type="button"
								class="toggle-visibility"
								on:click={() => showOpenAiKey = !showOpenAiKey}
								aria-label={showOpenAiKey ? 'Hide API key' : 'Show API key'}
							>
								{showOpenAiKey ? 'Hide' : 'Show'}
							</button>
						</div>
					</div>

					<div class="api-key-field">
						<div class="setting-info">
							<label class="setting-label" for="gemini-key">Gemini API Key</label>
							<span class="setting-description">Stored locally for future Gemini support.</span>
						</div>
						<div class="api-key-input-wrapper">
							<input
								id="gemini-key"
								type={showGeminiKey ? 'text' : 'password'}
								class="input api-key-input"
								placeholder="AIza..."
								bind:value={geminiKey}
								on:blur={saveGeminiKey}
							/>
							<button
								type="button"
								class="toggle-visibility"
								on:click={() => showGeminiKey = !showGeminiKey}
								aria-label={showGeminiKey ? 'Hide API key' : 'Show API key'}
							>
								{showGeminiKey ? 'Hide' : 'Show'}
							</button>
						</div>
					</div>

					<div class="advanced-section">
						<button
							type="button"
							class="advanced-toggle"
							on:click={() => (showAdvanced = !showAdvanced)}
							aria-expanded={showAdvanced}
						>
							<span>Advanced prompt controls</span>
							<span class="advanced-icon">{showAdvanced ? '–' : '+'}</span>
						</button>
						{#if showAdvanced}
							<div class="setting-info full-width">
								<span class="setting-label">System prompt</span>
								<span class="setting-description warning">
									Editing this can reduce citation accuracy and refusal behavior. Base citation rules
									are still enforced.
								</span>
							</div>
							<div class="prompt-editor">
								<textarea
									class="prompt-textarea"
									rows="10"
									placeholder="Enter your system prompt..."
									bind:value={systemPrompt}
									on:blur={saveSystemPrompt}
								></textarea>
								<div class="prompt-actions">
									{#if !isDefaultPrompt}
										<button type="button" class="reset-btn" on:click={resetSystemPrompt}>
											Reset to default
										</button>
									{/if}
									<span class="prompt-hint">Changes are saved automatically</span>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</section>

		</div>
	</main>
</div>

<style>
	.settings-page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--bg-primary);
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4) var(--space-6);
		border-bottom: 1px solid var(--border);
		position: sticky;
		top: 0;
		background: var(--bg-primary);
		z-index: 10;
		backdrop-filter: blur(8px);
	}

	.back-btn {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		color: var(--text-secondary);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.back-btn:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
	}

	.page-title {
		font-family: var(--font-reading);
		font-size: var(--text-xl);
		font-weight: 400;
		color: var(--text-primary);
		letter-spacing: -0.02em;
	}

	.header-spacer {
		width: 80px;
	}

	.main {
		flex: 1;
		padding: var(--space-10) var(--space-6) var(--space-16);
	}

	.settings-container {
		max-width: 680px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.settings-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		animation: section-enter 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
	}

	.settings-section:nth-child(1) { animation-delay: 0ms; }
	.settings-section:nth-child(2) { animation-delay: 50ms; }
	.settings-section:nth-child(3) { animation-delay: 100ms; }
	.settings-section:nth-child(4) { animation-delay: 150ms; }
	.settings-section:nth-child(5) { animation-delay: 200ms; }

	@keyframes section-enter {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.section-title {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--text-tertiary);
		padding-bottom: var(--space-2);
	}

	.section-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		background: var(--bg-secondary);
		border-radius: var(--radius-lg);
		padding: var(--space-2);
		border: 1px solid var(--border-subtle, var(--border));
		overflow: hidden;
	}

	.setting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-4);
		border-radius: var(--radius-md);
		transition: background var(--transition-fast);
		overflow: hidden;
	}

	.setting-row:hover {
		background: var(--bg-tertiary);
	}

	.setting-row.stacked {
		flex-direction: column;
		align-items: stretch;
		gap: var(--space-3);
	}

	.setting-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
		flex: 1;
	}

	.setting-info.full-width {
		width: 100%;
	}

	.setting-label {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-primary);
	}

	.setting-description {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		line-height: 1.4;
		overflow-wrap: break-word;
		word-break: break-word;
	}

	.setting-description.warning {
		color: #b45309;
	}

	/* Theme Toggle */
	.theme-toggle {
		display: flex;
		background: var(--bg-secondary);
		padding: 3px;
		border-radius: var(--radius-md);
		gap: 2px;
	}

	.theme-option {
		padding: 6px 14px;
		font-size: var(--text-sm);
		color: var(--text-secondary);
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.theme-option:hover {
		color: var(--text-primary);
	}

	.theme-option.active {
		background: var(--bg-primary);
		color: var(--text-primary);
		box-shadow: 0 1px 3px rgba(0,0,0,0.06);
	}

	/* Font Select */
	.font-select {
		padding: 8px 14px;
		padding-right: 32px;
		font-size: var(--text-sm);
		color: var(--text-primary);
		background: var(--bg-secondary);
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: background var(--transition-fast);
		-webkit-appearance: none;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%239C9C9C' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 12px center;
	}

	.font-select.full-width {
		width: 100%;
	}

	.font-select:hover {
		background-color: var(--bg-tertiary);
	}

	.font-select:focus {
		outline: 2px solid var(--border-hover);
		outline-offset: 1px;
	}

	/* Font Preview */
	.font-preview {
		display: flex;
		align-items: flex-start;
		gap: var(--space-5);
		padding: var(--space-6);
		margin: var(--space-2);
		background: var(--bg-primary);
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		transition: all var(--transition-base);
	}

	.preview-letter {
		font-size: 3rem;
		line-height: 1;
		color: var(--text-primary);
		transition: font-family var(--transition-base);
	}

	.preview-text {
		font-size: var(--text-base);
		line-height: 1.7;
		color: var(--text-secondary);
		transition: font-family var(--transition-base);
	}

	/* Size Control */
	.size-control {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex: 1;
		max-width: 100%;
		min-width: 220px;
		flex-wrap: wrap;
		row-gap: var(--space-2);
	}

	.size-indicator {
		color: var(--text-tertiary);
		font-family: var(--font-reading);
	}

	.size-indicator.small {
		font-size: 13px;
	}

	.size-indicator.large {
		font-size: 20px;
	}

	.size-slider {
		flex: 1;
		-webkit-appearance: none;
		appearance: none;
		height: 3px;
		background: var(--bg-tertiary);
		border-radius: 2px;
		cursor: pointer;
	}

	.size-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 14px;
		height: 14px;
		background: var(--text-primary);
		border-radius: 50%;
		cursor: pointer;
		transition: transform var(--transition-fast);
	}

	.size-slider::-webkit-slider-thumb:hover {
		transform: scale(1.15);
	}

	.size-slider::-moz-range-thumb {
		width: 14px;
		height: 14px;
		background: var(--text-primary);
		border: none;
		border-radius: 50%;
		cursor: pointer;
	}

	.size-value {
		font-size: 12px;
		color: var(--text-tertiary);
		min-width: 3.5ch;
		text-align: right;
		margin-left: auto;
	}

	.size-indicator-text {
		font-size: 11px;
		color: var(--text-tertiary);
		white-space: nowrap;
	}

	/* Toggle Switch */
	.toggle-switch {
		position: relative;
		width: 44px;
		height: 24px;
		background: var(--bg-tertiary);
		border-radius: 12px;
		cursor: pointer;
		transition: background var(--transition-fast);
	}

	.toggle-switch.active {
		background: var(--text-primary);
	}

	.toggle-knob {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 20px;
		height: 20px;
		background: var(--bg-primary);
		border-radius: 50%;
		transition: transform var(--transition-fast);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.toggle-switch.active .toggle-knob {
		transform: translateX(20px);
	}

	/* API Key Field */
	.api-key-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.api-key-input-wrapper {
		display: flex;
		gap: var(--space-2);
	}

	.input {
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-sm);
		color: var(--text-primary);
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.input:focus {
		outline: none;
		border-color: var(--border-hover);
		background: var(--bg-tertiary);
	}

	.input::placeholder {
		color: var(--text-tertiary);
	}

	.input.full-width {
		width: 100%;
	}

	.api-key-input {
		flex: 1;
	}

	.toggle-visibility {
		padding: 8px 12px;
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--text-secondary);
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.toggle-visibility:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}

	.advanced-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.advanced-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3) var(--space-4);
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		font-size: var(--text-sm);
		transition: all var(--transition-fast);
	}

	.advanced-toggle:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.advanced-icon {
		font-size: var(--text-lg);
		line-height: 1;
		color: var(--text-tertiary);
	}

	/* Prompt Editor */
	.prompt-editor {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.prompt-textarea {
		width: 100%;
		padding: var(--space-4);
		font-family: var(--font-ui);
		font-size: var(--text-sm);
		line-height: 1.6;
		color: var(--text-primary);
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		resize: vertical;
		min-height: 200px;
		transition: all var(--transition-fast);
	}

	.prompt-textarea:focus {
		outline: none;
		border-color: var(--border-hover);
		background: var(--bg-tertiary);
	}

	.prompt-textarea::placeholder {
		color: var(--text-tertiary);
	}

	.prompt-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.reset-btn {
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--text-secondary);
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.reset-btn:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}

	.prompt-hint {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
	}

	/* Keyboard Shortcuts */
	.shortcuts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: var(--space-6);
	}

	.shortcut-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.shortcut-group-title {
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--text-secondary);
		margin-bottom: var(--space-2);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.shortcut-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-2) 0;
		border-bottom: 1px solid var(--border);
	}

	.shortcut-item:last-child {
		border-bottom: none;
	}

	.shortcut-keys {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: var(--text-xs);
		color: var(--text-tertiary);
	}

	.shortcut-keys kbd {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 24px;
		height: 24px;
		padding: 0 6px;
		font-family: var(--font-ui);
		font-size: 11px;
		font-weight: 500;
		color: var(--text-secondary);
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		box-shadow: 0 1px 0 var(--border);
	}

	.shortcut-desc {
		font-size: var(--text-sm);
		color: var(--text-primary);
	}

	/* Highlight Color Swatches */
	.highlight-colors {
		display: flex;
		gap: var(--space-2);
		flex-shrink: 0;
	}

	.color-swatch {
		width: 32px;
		height: 32px;
		min-width: 32px;
		min-height: 32px;
		border-radius: 50%;
		background-color: var(--swatch-color, #FDE68A);
		border: 2px solid var(--border);
		cursor: pointer;
		transition: all var(--transition-fast);
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(0, 0, 0, 0.5);
		flex-shrink: 0;
	}

	.color-swatch:hover {
		transform: scale(1.1);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.color-swatch.active {
		border-color: var(--text-primary);
		box-shadow: 0 0 0 2px var(--bg-primary), 0 0 0 4px var(--text-tertiary);
	}

	.color-swatch svg {
		opacity: 0.7;
	}

	/* Responsive - Tablet */
	@media (max-width: 768px) {
		.settings-container {
			max-width: 100%;
		}

		.shortcuts-grid {
			grid-template-columns: 1fr;
		}
	}

	/* Responsive - Mobile */
	@media (max-width: 640px) {
		.header {
			padding: var(--space-3) var(--space-4);
		}

		.main {
			padding: var(--space-6) var(--space-4);
		}

		.setting-row {
			flex-direction: column;
			align-items: stretch;
			gap: var(--space-3);
		}

		.size-control {
			max-width: 100%;
		}

		.header-spacer {
			display: none;
		}

		.highlight-colors {
			justify-content: flex-start;
		}

		.theme-toggle {
			width: 100%;
		}

		.theme-option {
			flex: 1;
			text-align: center;
		}
	}
</style>
