<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Book } from '$lib/types/book';
	import type {
		AnalysisRequest,
		AnalysisResult,
		AnalysisScope,
		AnalysisType,
		CharacterProfile,
		ThemeTracker
	} from '$lib/types/analysis';
	import type { Settings } from '$lib/types/settings';
	import { performAnalysis, identifyThemes, identifyCharacters, trackTheme, buildCharacterProfile } from '$lib/services/analysis';
	import { indexingStore } from '$lib/stores/indexingStore';

	export let open = false;
	export let book: Book;
	export let chapterIndex = 0;
	export let activeTab: 'analysis' | 'themes' | 'characters' = 'analysis';
	export let settings: Settings;

	const dispatch = createEventDispatcher<{ close: void }>();

	let tab: 'analysis' | 'themes' | 'characters' = activeTab;
	let lastExternalTab: 'analysis' | 'themes' | 'characters' = activeTab;
	let analysisType: AnalysisType = 'style';
	let analysisScope: AnalysisScope = 'chapter';
	let analysisSubject = '';
	let analysisResult: AnalysisResult | null = null;
	let analysisLoading = false;
	let analysisError = '';

	let themes: string[] = [];
	let themesLoading = false;
	let themesError = '';
	let selectedTheme = '';
	let themeResult: ThemeTracker | null = null;
	let themeLoading = false;
	let themeError = '';

	let characters: string[] = [];
	let charactersLoading = false;
	let charactersError = '';
	let selectedCharacter = '';
	let characterResult: CharacterProfile | null = null;
	let characterLoading = false;
	let characterError = '';

	let lastChapterId: string | null = null;

	const closePanel = () => dispatch('close');

	const chapter = () => book.chapters[chapterIndex];

	const getMissingKeyMessage = (): string | null => {
		if (settings.llmProvider === 'openrouter' && !settings.openRouterApiKey) {
			return 'Add your OpenRouter API key in Settings to use analysis tools.';
		}
		if (settings.llmProvider === 'openai' && !settings.openAiApiKey) {
			return 'Add your OpenAI API key in Settings to use analysis tools.';
		}
		if (settings.llmProvider === 'gemini' && !settings.geminiApiKey) {
			return 'Add your Gemini API key in Settings to use analysis tools.';
		}
		if (settings.llmProvider === 'anthropic' && !settings.anthropicApiKey) {
			return 'Add your Anthropic API key in Settings to use analysis tools.';
		}
		return null;
	};

	const missingKeyMessage = () => getMissingKeyMessage();

	const toParagraphs = (text: string): string[] =>
		text
			.split(/\n\s*\n/g)
			.map((paragraph) => paragraph.trim())
			.filter(Boolean);

	const analysisConfig = () => ({
		provider: settings.llmProvider,
		openRouterModel: settings.openRouterModel,
		openAiModel: settings.openAiModel,
		geminiModel: settings.geminiModel,
		systemPrompt: settings.systemPrompt,
		useExtendedThinking: true,
		thinkingBudget: 8000
	});

	const requestAnalysis = async (forceRefresh = false) => {
		const current = chapter();
		if (!current) return;
		analysisLoading = true;
		analysisError = '';
		try {
			const request: AnalysisRequest = {
				type: analysisType,
				scope: analysisScope,
				chapterId: analysisScope === 'chapter' ? current.id : undefined,
				subject: analysisSubject.trim() || undefined
			};
			analysisResult = await performAnalysis(book, request, analysisConfig(), { forceRefresh });
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to generate analysis.';
			analysisError = message;
		} finally {
			analysisLoading = false;
		}
	};

	const requestThemeList = async (forceRefresh = false) => {
		themesLoading = true;
		themesError = '';
		try {
			themes = await identifyThemes(book, analysisConfig(), { forceRefresh });
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to identify themes.';
			themesError = message;
		} finally {
			themesLoading = false;
		}
	};

	const requestThemeTracking = async (forceRefresh = false) => {
		const themeName = selectedTheme.trim();
		if (!themeName) return;
		themeLoading = true;
		themeError = '';
		try {
			themeResult = await trackTheme(book, themeName, analysisConfig(), { forceRefresh });
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to track theme.';
			themeError = message;
		} finally {
			themeLoading = false;
		}
	};

	const requestCharacterList = async (forceRefresh = false) => {
		charactersLoading = true;
		charactersError = '';
		try {
			characters = await identifyCharacters(book, analysisConfig(), { forceRefresh });
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to identify characters.';
			charactersError = message;
		} finally {
			charactersLoading = false;
		}
	};

	const requestCharacterProfile = async (forceRefresh = false) => {
		const name = selectedCharacter.trim();
		if (!name) return;
		characterLoading = true;
		characterError = '';
		try {
			characterResult = await buildCharacterProfile(book, name, analysisConfig(), { forceRefresh });
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to build character profile.';
			characterError = message;
		} finally {
			characterLoading = false;
		}
	};

	$: if (activeTab !== lastExternalTab) {
		tab = activeTab;
		lastExternalTab = activeTab;
	}

	$: if (open) {
		const current = chapter();
		if (current && current.id !== lastChapterId) {
			lastChapterId = current.id;
			analysisResult = null;
			analysisError = '';
		}
	}
</script>

{#if open}
	<div class="analysis-backdrop" on:click={closePanel} role="presentation"></div>
{/if}

<aside class="analysis-panel" class:open={open} class:indexing={$indexingStore.isIndexing}>
	<header class="analysis-header">
		<div>
			<h2 class="analysis-title">Deep analysis</h2>
			<p class="analysis-subtitle">{chapter()?.title ?? 'Analysis tools'}</p>
		</div>
		<button type="button" class="close-btn" on:click={closePanel} aria-label="Close analysis">
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
				<path d="M15 5L5 15M5 5l10 10" />
			</svg>
		</button>
	</header>

	<div class="analysis-tabs">
		<button type="button" class="tab-btn" class:active={tab === 'analysis'} on:click={() => (tab = 'analysis')}>
			Analysis
		</button>
		<button type="button" class="tab-btn" class:active={tab === 'themes'} on:click={() => (tab = 'themes')}>
			Themes
		</button>
		<button type="button" class="tab-btn" class:active={tab === 'characters'} on:click={() => (tab = 'characters')}>
			Characters
		</button>
	</div>

	{#if missingKeyMessage()}
		<p class="api-hint">{missingKeyMessage()}</p>
	{/if}

	<section class="analysis-body">
		{#if tab === 'analysis'}
			<div class="analysis-controls">
				<label>
					<span>Type</span>
					<select bind:value={analysisType}>
						<option value="style">Style</option>
						<option value="historical">Historical</option>
						<option value="comparison">Comparison</option>
					</select>
				</label>
				<label>
					<span>Scope</span>
					<select bind:value={analysisScope}>
						<option value="chapter">Current chapter</option>
						<option value="book">Whole book</option>
					</select>
				</label>
				<label class="wide">
					<span>Focus (optional)</span>
					<input type="text" placeholder="e.g. narrative voice, imagery" bind:value={analysisSubject} />
				</label>
			</div>

			{#if analysisLoading}
				<p class="loading-text">Generating analysis...</p>
			{:else if analysisError}
				<p class="error-text">{analysisError}</p>
			{:else if analysisResult}
				{#each toParagraphs(analysisResult.response) as paragraph}
					<p>{paragraph}</p>
				{/each}
			{:else}
				<p class="empty-text">Generate a focused analysis of this chapter or the whole book.</p>
			{/if}
		{:else if tab === 'themes'}
			<div class="analysis-controls">
				<label class="wide">
					<span>Theme</span>
					<input type="text" placeholder="Enter a theme" bind:value={selectedTheme} />
				</label>
			</div>

			{#if themesLoading}
				<p class="loading-text">Identifying themes...</p>
			{:else if themesError}
				<p class="error-text">{themesError}</p>
			{:else if themes.length > 0}
				<div class="chip-list">
					{#each themes as theme}
						<button
							type="button"
							class="chip"
							class:active={theme === selectedTheme}
							on:click={() => (selectedTheme = theme)}
						>
							{theme}
						</button>
					{/each}
				</div>
			{:else}
				<p class="empty-text">Identify key themes in the book.</p>
			{/if}

			{#if themeLoading}
				<p class="loading-text">Tracking theme across chapters...</p>
			{:else if themeError}
				<p class="error-text">{themeError}</p>
			{:else if themeResult}
				<div class="analysis-section">
					<h3>Theme overview</h3>
					<p>{themeResult.description}</p>
				</div>
				<div class="analysis-section">
					<h3>Evolution</h3>
					<p>{themeResult.evolution}</p>
				</div>
				{#if themeResult.occurrences.length > 0}
					<div class="analysis-section">
						<h3>Key moments</h3>
						<ul>
							{#each themeResult.occurrences as occurrence}
								<li>
									<strong>{occurrence.chapterId}:</strong> “{occurrence.quote}” — {occurrence.analysis}
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			{:else if selectedTheme}
				<p class="empty-text">Track how this theme evolves across the book.</p>
			{/if}
		{:else if tab === 'characters'}
			<div class="analysis-controls">
				<label class="wide">
					<span>Character</span>
					<input type="text" placeholder="Enter a character name" bind:value={selectedCharacter} />
				</label>
			</div>

			{#if charactersLoading}
				<p class="loading-text">Identifying characters...</p>
			{:else if charactersError}
				<p class="error-text">{charactersError}</p>
			{:else if characters.length > 0}
				<div class="chip-list">
					{#each characters as name}
						<button
							type="button"
							class="chip"
							class:active={name === selectedCharacter}
							on:click={() => (selectedCharacter = name)}
						>
							{name}
						</button>
					{/each}
				</div>
			{:else}
				<p class="empty-text">Identify major characters in the book.</p>
			{/if}

			{#if characterLoading}
				<p class="loading-text">Building character profile...</p>
			{:else if characterError}
				<p class="error-text">{characterError}</p>
			{:else if characterResult}
				<div class="analysis-section">
					<h3>Profile</h3>
					<p>{characterResult.description}</p>
					{#if characterResult.aliases.length > 0}
						<p class="muted-text">Aliases: {characterResult.aliases.join(', ')}</p>
					{/if}
				</div>
				<div class="analysis-section">
					<h3>First appearance</h3>
					<p><strong>{characterResult.firstAppearance.chapterId}:</strong> “{characterResult.firstAppearance.quote}”</p>
				</div>
				{#if characterResult.relationships.length > 0}
					<div class="analysis-section">
						<h3>Relationships</h3>
						<ul>
							{#each characterResult.relationships as relation}
								<li>{relation.character}: {relation.relationship}</li>
							{/each}
						</ul>
					</div>
				{/if}
				{#if characterResult.arc}
					<div class="analysis-section">
						<h3>Arc</h3>
						<p>{characterResult.arc}</p>
					</div>
				{/if}
				{#if characterResult.keyMoments.length > 0}
					<div class="analysis-section">
						<h3>Key moments</h3>
						<ul>
							{#each characterResult.keyMoments as moment}
								<li>
									<strong>{moment.chapterId}:</strong> “{moment.quote}” — {moment.significance}
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			{:else if selectedCharacter}
				<p class="empty-text">Build a detailed character profile.</p>
			{/if}
		{/if}
	</section>

	<footer class="analysis-footer">
		{#if tab === 'analysis'}
			<button
				type="button"
				class="primary-btn"
				on:click={() => requestAnalysis(false)}
				disabled={analysisLoading || Boolean(missingKeyMessage())}
			>
				{analysisResult ? 'Refresh analysis' : 'Generate analysis'}
			</button>
			{#if analysisResult}
				<button
					type="button"
					class="secondary-btn"
					on:click={() => requestAnalysis(true)}
					disabled={analysisLoading || Boolean(missingKeyMessage())}
				>
					Regenerate
				</button>
			{/if}
		{:else if tab === 'themes'}
			<button
				type="button"
				class="secondary-btn"
				on:click={() => requestThemeList(false)}
				disabled={themesLoading || Boolean(missingKeyMessage())}
			>
				{themes.length > 0 ? 'Refresh themes' : 'Identify themes'}
			</button>
			<button
				type="button"
				class="primary-btn"
				on:click={() => requestThemeTracking(false)}
				disabled={themeLoading || !selectedTheme || Boolean(missingKeyMessage())}
			>
				{themeResult ? 'Refresh theme' : 'Track theme'}
			</button>
		{:else if tab === 'characters'}
			<button
				type="button"
				class="secondary-btn"
				on:click={() => requestCharacterList(false)}
				disabled={charactersLoading || Boolean(missingKeyMessage())}
			>
				{characters.length > 0 ? 'Refresh list' : 'Identify characters'}
			</button>
			<button
				type="button"
				class="primary-btn"
				on:click={() => requestCharacterProfile(false)}
				disabled={characterLoading || !selectedCharacter || Boolean(missingKeyMessage())}
			>
				{characterResult ? 'Refresh profile' : 'Build profile'}
			</button>
		{/if}
	</footer>
</aside>

<style>
	.analysis-backdrop {
		position: fixed;
		inset: 0;
		z-index: 55;
		background: var(--overlay);
		animation: fade-in var(--transition-base) ease-out;
	}

	@media (min-width: 768px) {
		.analysis-backdrop {
			display: none;
		}
	}

	.analysis-panel {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		z-index: 60;
		width: 100%;
		max-width: 440px;
		display: flex;
		flex-direction: column;
		background: var(--bg-primary);
		box-shadow: none;
		transform: translateX(100%);
		transition: transform var(--transition-base) ease-out;
	}

	.analysis-panel.open {
		transform: translateX(0);
		box-shadow: -6px 0 24px rgba(0, 0, 0, 0.12);
	}

	/* Offset for indexing banner at top */
	.analysis-panel.indexing {
		top: 2.5rem;
	}

	.analysis-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-5) var(--space-6) var(--space-4);
		border-bottom: 1px solid var(--border);
	}

	.analysis-title {
		font-family: var(--font-reading);
		font-size: var(--text-lg);
		font-weight: 400;
		color: var(--text-primary);
		letter-spacing: -0.01em;
	}

	.analysis-subtitle {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		margin-top: 4px;
	}

	.analysis-tabs {
		display: flex;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-6);
		border-bottom: 1px solid var(--border);
	}

	.tab-btn {
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
		border: 1px solid transparent;
		font-size: var(--text-xs);
		color: var(--text-secondary);
		transition: all var(--transition-fast);
	}

	.tab-btn.active {
		border-color: var(--border);
		color: var(--text-primary);
		background: var(--bg-secondary);
	}

	.api-hint {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		padding: 0 var(--space-6);
		margin-top: var(--space-2);
	}

	.analysis-body {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-5) var(--space-6) var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.analysis-controls {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-3);
	}

	.analysis-controls label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.analysis-controls label.wide {
		grid-column: 1 / -1;
	}

	.analysis-controls select,
	.analysis-controls input {
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		color: var(--text-primary);
		background: var(--bg-secondary);
	}

	.analysis-section h3 {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		margin-bottom: var(--space-2);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.analysis-section p,
	.analysis-section li {
		font-size: var(--text-sm);
		color: var(--text-primary);
		line-height: 1.6;
	}

	.analysis-section ul {
		padding-left: var(--space-4);
		list-style: disc;
	}

	.chip-list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.chip {
		padding: 6px 10px;
		border-radius: 999px;
		border: 1px solid var(--border);
		font-size: var(--text-xs);
		color: var(--text-secondary);
		background: var(--bg-secondary);
		transition: all var(--transition-fast);
	}

	.chip.active {
		border-color: var(--accent);
		color: var(--accent);
	}

	.muted-text {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		margin-top: var(--space-2);
	}

	.loading-text,
	.empty-text {
		font-size: var(--text-sm);
		color: var(--text-tertiary);
	}

	.error-text {
		font-size: var(--text-sm);
		color: #b91c1c;
	}

	.analysis-footer {
		display: flex;
		gap: var(--space-2);
		padding: var(--space-4) var(--space-6);
		border-top: 1px solid var(--border);
		background: var(--bg-primary);
	}

	.primary-btn,
	.secondary-btn {
		flex: 1;
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		font-size: var(--text-sm);
		font-weight: 500;
		transition: all var(--transition-fast);
	}

	.primary-btn {
		background: var(--accent);
		color: white;
		border-color: var(--accent);
	}

	.primary-btn:disabled,
	.secondary-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.secondary-btn {
		background: transparent;
		color: var(--text-primary);
	}

	.primary-btn:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.secondary-btn:hover:not(:disabled) {
		border-color: var(--accent);
		color: var(--accent);
	}
</style>
