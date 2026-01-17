<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { settingsStore } from '$lib/stores/settingsStore';
	import {
		DEFAULT_SYSTEM_PROMPT,
		FONT_FAMILIES,
		FONT_SIZE_MIN,
		FONT_SIZE_MAX,
		OPENROUTER_MODELS
	} from '$lib/config/constants';
	import type { FontFamily, Theme } from '$lib/types/settings';

	export let open = false;

	const dispatch = createEventDispatcher<{ close: void }>();

	let apiKey = '';
	let openRouterKey = '';
	let openRouterModel = '';
	let openAiKey = '';
	let geminiKey = '';
	let openAiModel = '';
	let geminiModel = '';
	let showApiKey = false;
	let showOpenRouterKey = false;
	let showOpenAiKey = false;
	let showGeminiKey = false;
	let systemPrompt = '';
	let showAdvanced = false;

	$: if (open) {
		apiKey = $settingsStore.anthropicApiKey;
		openRouterKey = $settingsStore.openRouterApiKey;
		openRouterModel = $settingsStore.openRouterModel;
		openAiKey = $settingsStore.openAiApiKey;
		geminiKey = $settingsStore.geminiApiKey;
		openAiModel = $settingsStore.openAiModel;
		geminiModel = $settingsStore.geminiModel;
		systemPrompt = $settingsStore.systemPrompt;
		showApiKey = false;
		showOpenRouterKey = false;
		showOpenAiKey = false;
		showGeminiKey = false;
		showAdvanced = false;
	}

	const close = () => dispatch('close');

	const handleBackdropClick = (e: MouseEvent) => {
		if (e.target === e.currentTarget) close();
	};

	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') close();
	};

	const themes: { value: Theme; label: string }[] = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'sepia', label: 'Sepia' }
	];

	const fonts: { value: FontFamily; label: string }[] = [
		{ value: 'literata', label: 'Literata' },
		{ value: 'source-serif', label: 'Source Serif' },
		{ value: 'crimson', label: 'Crimson Pro' },
		{ value: 'garamond', label: 'EB Garamond' }
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
		settingsStore.setSystemPrompt(systemPrompt.trim() || DEFAULT_SYSTEM_PROMPT);
	};

	const resetSystemPrompt = () => {
		systemPrompt = DEFAULT_SYSTEM_PROMPT;
		settingsStore.resetSystemPrompt();
	};
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
	<div
		class="modal-backdrop"
		on:click={handleBackdropClick}
		role="presentation"
	>
		<div
			class="modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="settings-title"
		>
			<!-- Header -->
			<header class="modal-header">
				<h2 id="settings-title" class="modal-title">Settings</h2>
				<button
					type="button"
					class="close-btn"
					on:click={close}
					aria-label="Close settings"
				>
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
						<path d="M15 5L5 15M5 5l10 10" />
					</svg>
				</button>
			</header>

			<div class="modal-body">
				<!-- Appearance Section -->
				<section class="settings-section">
					<h3 class="section-title">Appearance</h3>

					<div class="setting-row">
						<span class="setting-label">Theme</span>
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
				</section>

				<div class="divider"></div>

				<!-- Typography Section -->
				<section class="settings-section">
					<h3 class="section-title">Typography</h3>

					<div class="setting-row">
						<span class="setting-label">Font</span>
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
						<span class="setting-label">Size</span>
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
				</section>

				<div class="divider"></div>

				<!-- AI Section -->
				<section class="settings-section">
					<h3 class="section-title">AI Assistant</h3>

					<div class="setting-row">
						<span class="setting-label">Provider</span>
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
							<label class="setting-label" for="api-key">Anthropic API Key</label>
							<p class="setting-hint">Stored locally in your browser. Sent only to Anthropic.</p>
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
							<label class="setting-label" for="openrouter-key">OpenRouter API Key</label>
							<p class="setting-hint">Stored locally in your browser. Sent only to OpenRouter.</p>
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

						<div class="setting-row">
							<label class="setting-label" for="openrouter-model">Model</label>
							<select
								id="openrouter-model"
								class="font-select"
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
						</div>

						<div class="setting-row">
							<label class="setting-label" for="openrouter-model-custom">Custom model</label>
							<input
								id="openrouter-model-custom"
								type="text"
								class="input"
								placeholder="provider/model"
								bind:value={openRouterModel}
								on:blur={saveOpenRouterModel}
							/>
						</div>
					{:else if $settingsStore.llmProvider === 'openai'}
						<div class="api-key-field">
							<label class="setting-label" for="openai-key">OpenAI API Key</label>
							<p class="setting-hint">Stored locally in your browser. Sent only to OpenAI.</p>
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
						<div class="setting-row">
							<label class="setting-label" for="openai-model">Model</label>
							<input
								id="openai-model"
								type="text"
								class="input"
								placeholder="gpt-4o-mini"
								bind:value={openAiModel}
								on:blur={saveOpenAiModel}
							/>
						</div>
					{:else}
						<div class="api-key-field">
							<label class="setting-label" for="gemini-key">Gemini API Key</label>
							<p class="setting-hint">Stored locally in your browser. Sent only to Gemini.</p>
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
						<div class="setting-row">
							<label class="setting-label" for="gemini-model">Model</label>
							<input
								id="gemini-model"
								type="text"
								class="input"
								placeholder="gemini-1.5-flash"
								bind:value={geminiModel}
								on:blur={saveGeminiModel}
							/>
						</div>
					{/if}

					<div class="advanced-row">
						<button
							type="button"
							class="advanced-toggle"
							on:click={() => (showAdvanced = !showAdvanced)}
							aria-expanded={showAdvanced}
						>
							<span>Advanced prompt controls</span>
							<span class="advanced-toggle-icon">{showAdvanced ? '–' : '+'}</span>
						</button>
						{#if showAdvanced}
							<p class="setting-hint warning">
								Editing the system prompt can reduce citation accuracy and refusal behavior.
								Only change this if you understand the tradeoffs.
							</p>
							<label class="setting-label" for="system-prompt">System prompt</label>
							<textarea
								id="system-prompt"
								class="prompt-textarea"
								rows="6"
								bind:value={systemPrompt}
								on:blur={saveSystemPrompt}
							></textarea>
							<div class="prompt-actions">
								<button type="button" class="btn-secondary" on:click={resetSystemPrompt}>
									Reset to default
								</button>
								<button type="button" class="btn-primary" on:click={saveSystemPrompt}>
									Save prompt
								</button>
							</div>
						{/if}
					</div>
				</section>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
		background: var(--overlay);
		animation: fade-in var(--transition-base) ease-out;
	}

	.modal {
		width: 100%;
		max-width: 440px;
		max-height: 85vh;
		overflow-y: auto;
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		animation: slide-up var(--transition-slow) ease-out;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-5) var(--space-6);
		border-bottom: 1px solid var(--border);
	}

	.modal-title {
		font-family: var(--font-reading);
		font-size: var(--text-lg);
		font-weight: 400;
		color: var(--text-primary);
		letter-spacing: -0.01em;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		color: var(--text-tertiary);
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.close-btn:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
	}

	.modal-body {
		padding: var(--space-6);
	}

	.settings-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.section-title {
		font-size: 11px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--text-tertiary);
	}

	.setting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
	}

	.setting-label {
		font-size: var(--text-sm);
		color: var(--text-primary);
	}

	.setting-hint {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		margin-top: 2px;
		line-height: 1.4;
	}

	.divider {
		height: 1px;
		background: var(--border);
		margin: var(--space-5) 0;
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
		padding: 6px 12px;
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
		box-shadow: 0 1px 3px rgba(0,0,0,0.08);
	}

	/* Font Select */
	.font-select {
		padding: 6px 12px;
		padding-right: 28px;
		font-size: var(--text-sm);
		color: var(--text-primary);
		background: var(--bg-secondary);
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: background var(--transition-fast);
		-webkit-appearance: none;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%239A918A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 10px center;
	}

	.font-select:hover {
		background-color: var(--bg-tertiary);
	}

	.font-select:focus {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}

	/* Font Preview */
	.font-preview {
		display: flex;
		align-items: flex-start;
		gap: var(--space-4);
		padding: var(--space-4);
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
	}

	.preview-letter {
		font-size: 2.25rem;
		line-height: 1;
		color: var(--text-primary);
	}

	.preview-text {
		font-size: var(--text-sm);
		line-height: 1.55;
		color: var(--text-secondary);
	}

	/* Size Control */
	.size-control {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex: 1;
		max-width: 220px;
	}

	.size-indicator {
		color: var(--text-tertiary);
		font-family: var(--font-reading);
	}

	.size-indicator.small {
		font-size: 13px;
	}

	.size-indicator.large {
		font-size: 19px;
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
		font-size: 11px;
		color: var(--text-tertiary);
		min-width: 32px;
		text-align: right;
	}

	/* API Key Field */
	.api-key-field {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.api-key-input-wrapper {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-2);
	}

	.api-key-input {
		flex: 1;
	}

	.toggle-visibility {
		padding: 6px 10px;
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.toggle-visibility:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}

	/* Advanced Prompt */
	.advanced-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.advanced-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		color: var(--text-secondary);
		transition: background var(--transition-fast), color var(--transition-fast);
	}

	.advanced-toggle:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.advanced-toggle-icon {
		font-size: var(--text-lg);
		line-height: 1;
		color: var(--text-tertiary);
	}

	.setting-hint.warning {
		color: #b45309;
	}

	.prompt-textarea {
		width: 100%;
		padding: 10px 12px;
		font-size: var(--text-sm);
		color: var(--text-primary);
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		resize: vertical;
	}

	.prompt-textarea:focus {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}

	.prompt-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-2);
	}

	.btn-primary,
	.btn-secondary {
		padding: 6px 12px;
		font-size: var(--text-xs);
		border-radius: var(--radius-md);
		transition: background var(--transition-fast), color var(--transition-fast);
	}

	.btn-primary {
		background: var(--accent);
		color: white;
	}

	.btn-primary:hover {
		background: var(--accent-hover);
	}

	.btn-secondary {
		background: var(--bg-secondary);
		color: var(--text-secondary);
	}

	.btn-secondary:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	/* Animations */
	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slide-up {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
