<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Book } from '$lib/types/book';
	import type { ChapterSummary, DiscussionPrompt } from '$lib/types/summary';
	import type { Settings } from '$lib/types/settings';
	import { adapter } from '$lib/platform';
	import { summarizeChapter, generateRecap } from '$lib/services/summarization';
	import { generateDiscussionPrompts } from '$lib/services/discussionPrompts';
	import { indexingStore } from '$lib/stores/indexingStore';

	export let open = false;
	export let book: Book;
	export let chapterIndex = 0;
	export let activeTab: 'summary' | 'discussion' | 'recap' = 'summary';
	export let returning = false;
	export let settings: Settings;

	const dispatch = createEventDispatcher<{ close: void }>();

	let tab: 'summary' | 'discussion' | 'recap' = activeTab;
	let lastExternalTab: 'summary' | 'discussion' | 'recap' = activeTab;
	let summary: ChapterSummary | null = null;
	let summaryLoading = false;
	let summaryError = '';
	let prompts: DiscussionPrompt[] = [];
	let promptsLoading = false;
	let promptsError = '';
	let recapText = '';
	let recapLoading = false;
	let recapError = '';
	let recapProgressLabel = '';
	let lastChapterId: string | null = null;

	let summaryCache: Record<string, ChapterSummary | null> = {};
	let promptsCache: Record<string, DiscussionPrompt[] | null> = {};

	const closePanel = () => dispatch('close');

	const chapter = () => book.chapters[chapterIndex];

	const getMissingKeyMessage = (): string | null => {
		if (settings.llmProvider === 'openrouter' && !settings.openRouterApiKey) {
			return 'Add your OpenRouter API key in Settings to use summaries.';
		}
		if (settings.llmProvider === 'openai' && !settings.openAiApiKey) {
			return 'Add your OpenAI API key in Settings to use summaries.';
		}
		if (settings.llmProvider === 'gemini' && !settings.geminiApiKey) {
			return 'Add your Gemini API key in Settings to use summaries.';
		}
		if (settings.llmProvider === 'anthropic' && !settings.anthropicApiKey) {
			return 'Add your Anthropic API key in Settings to use summaries.';
		}
		return null;
	};

	const missingKeyMessage = () => getMissingKeyMessage();

	const toParagraphs = (text: string): string[] =>
		text
			.split(/\n\s*\n/g)
			.map((paragraph) => paragraph.trim())
			.filter(Boolean);

	const loadCachedSummary = async (chapterId: string) => {
		if (summaryCache[chapterId] !== undefined) {
			summary = summaryCache[chapterId];
			return;
		}
		const cached = await adapter.getSummary(book.id, chapterId);
		summaryCache = { ...summaryCache, [chapterId]: cached };
		summary = cached;
	};

	const loadCachedPrompts = (chapterId: string) => {
		const cached = promptsCache[chapterId];
		prompts = cached ?? [];
	};

	const requestSummary = async (forceRefresh = false) => {
		const current = chapter();
		if (!current) return;
		summaryLoading = true;
		summaryError = '';
		try {
			const response = await summarizeChapter(
				book,
				current.id,
				{ type: 'detailed', forceRefresh },
				{
					provider: settings.llmProvider,
					openRouterModel: settings.openRouterModel,
					openAiModel: settings.openAiModel,
					geminiModel: settings.geminiModel,
					systemPrompt: settings.systemPrompt
				}
			);
			summary = response;
			summaryCache = { ...summaryCache, [current.id]: response };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to generate summary.';
			summaryError = message;
		} finally {
			summaryLoading = false;
		}
	};

	const requestPrompts = async (forceRefresh = false) => {
		const current = chapter();
		if (!current) return;
		if (!forceRefresh && promptsCache[current.id]) {
			prompts = promptsCache[current.id] ?? [];
			return;
		}
		promptsLoading = true;
		promptsError = '';
		try {
			const response = await generateDiscussionPrompts(
				book,
				current.id,
				3,
				{
					provider: settings.llmProvider,
					openRouterModel: settings.openRouterModel,
					openAiModel: settings.openAiModel,
					geminiModel: settings.geminiModel,
					systemPrompt: settings.systemPrompt
				}
			);
			prompts = response;
			promptsCache = { ...promptsCache, [current.id]: response };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to generate prompts.';
			promptsError = message;
		} finally {
			promptsLoading = false;
		}
	};

	const requestRecap = async () => {
		const current = chapter();
		if (!current) return;
		recapLoading = true;
		recapError = '';
		recapProgressLabel = '';
		try {
			const response = await generateRecap(
				book,
				chapterIndex,
				{
					provider: settings.llmProvider,
					openRouterModel: settings.openRouterModel,
					openAiModel: settings.openAiModel,
					geminiModel: settings.geminiModel,
					systemPrompt: settings.systemPrompt
				},
				(progress) => {
					recapProgressLabel = `Preparing chapter ${progress.current} of ${progress.total}...`;
				}
			);
			recapText = response;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to generate recap.';
			recapError = message;
		} finally {
			recapLoading = false;
			recapProgressLabel = '';
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
			void loadCachedSummary(current.id);
			loadCachedPrompts(current.id);
		}
	}
</script>

{#if open}
	<div class="summary-backdrop" on:click={closePanel} role="presentation"></div>
{/if}

<aside class="summary-panel" class:open={open} class:indexing={$indexingStore.isIndexing}>
	<header class="summary-header">
		<div>
			<h2 class="summary-title">Chapter companion</h2>
			<p class="summary-subtitle">{chapter()?.title ?? 'Summary tools'}</p>
		</div>
		<button type="button" class="close-btn" on:click={closePanel} aria-label="Close summary">
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
				<path d="M15 5L5 15M5 5l10 10" />
			</svg>
		</button>
	</header>

	<div class="summary-tabs">
		<button type="button" class="tab-btn" class:active={tab === 'summary'} on:click={() => (tab = 'summary')}>
			Summary
		</button>
		<button type="button" class="tab-btn" class:active={tab === 'discussion'} on:click={() => (tab = 'discussion')}>
			Discussion
		</button>
		{#if returning && chapterIndex > 0}
			<button type="button" class="tab-btn" class:active={tab === 'recap'} on:click={() => (tab = 'recap')}>
				Recap
			</button>
		{/if}
	</div>

	{#if missingKeyMessage()}
		<p class="api-hint">{missingKeyMessage()}</p>
	{/if}

	<section class="summary-body">
		{#if tab === 'summary'}
			{#if summaryLoading}
				<p class="loading-text">Summarizing chapter...</p>
			{:else if summaryError}
				<p class="error-text">{summaryError}</p>
			{:else if summary}
				<div class="summary-section">
					<h3>Quick summary</h3>
					{#each toParagraphs(summary.brief) as paragraph}
						<p>{paragraph}</p>
					{/each}
				</div>
				{#if summary.keyPoints.length > 0}
					<div class="summary-section">
						<h3>Key points</h3>
						<ul>
							{#each summary.keyPoints as point}
								<li>{point}</li>
							{/each}
						</ul>
					</div>
				{/if}
				{#if summary.characters.length > 0}
					<div class="summary-section">
						<h3>Characters</h3>
						<p>{summary.characters.join(', ')}</p>
					</div>
				{/if}
				{#if summary.detailed}
					<div class="summary-section">
						<h3>Detailed summary</h3>
						{#each toParagraphs(summary.detailed) as paragraph}
							<p>{paragraph}</p>
						{/each}
					</div>
				{/if}
			{:else}
				<p class="empty-text">Generate a summary for this chapter.</p>
			{/if}
		{:else if tab === 'discussion'}
			{#if promptsLoading}
				<p class="loading-text">Generating discussion prompts...</p>
			{:else if promptsError}
				<p class="error-text">{promptsError}</p>
			{:else if prompts.length > 0}
				<div class="prompt-list">
					{#each prompts as prompt}
						<div class="prompt-card">
							<span class="prompt-type">{prompt.type}</span>
							<p class="prompt-question">{prompt.question}</p>
							{#if prompt.hint}
								<p class="prompt-hint">{prompt.hint}</p>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<p class="empty-text">Generate discussion questions for this chapter.</p>
			{/if}
		{:else if tab === 'recap'}
			{#if recapLoading}
				<p class="loading-text">Generating recap...</p>
				{#if recapProgressLabel}
					<p class="progress-text">{recapProgressLabel}</p>
				{/if}
			{:else if recapError}
				<p class="error-text">{recapError}</p>
			{:else if recapText}
				{#each toParagraphs(recapText) as paragraph}
					<p>{paragraph}</p>
				{/each}
			{:else}
				<p class="empty-text">Generate a recap of what happened so far.</p>
			{/if}
		{/if}
	</section>

	<footer class="summary-footer">
		{#if tab === 'summary'}
			<button
				type="button"
				class="primary-btn"
				on:click={() => requestSummary(false)}
				disabled={summaryLoading || Boolean(missingKeyMessage())}
			>
				{summary ? 'Refresh summary' : 'Summarize this chapter'}
			</button>
			{#if summary}
				<button
					type="button"
					class="secondary-btn"
					on:click={() => requestSummary(true)}
					disabled={summaryLoading || Boolean(missingKeyMessage())}
				>
					Regenerate
				</button>
			{/if}
		{:else if tab === 'discussion'}
			<button
				type="button"
				class="primary-btn"
				on:click={() => requestPrompts(true)}
				disabled={promptsLoading || Boolean(missingKeyMessage())}
			>
				{prompts.length > 0 ? 'New questions' : 'Get discussion questions'}
			</button>
		{:else if tab === 'recap'}
			<button
				type="button"
				class="primary-btn"
				on:click={requestRecap}
				disabled={recapLoading || Boolean(missingKeyMessage())}
			>
				{recapText ? 'Refresh recap' : 'Generate recap'}
			</button>
		{/if}
	</footer>
</aside>

<style>
	.summary-backdrop {
		position: fixed;
		inset: 0;
		z-index: 55;
		background: var(--overlay);
		animation: fade-in var(--transition-base) ease-out;
	}

	@media (min-width: 768px) {
		.summary-backdrop {
			display: none;
		}
	}

	.summary-panel {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		z-index: 60;
		width: 100%;
		max-width: 420px;
		display: flex;
		flex-direction: column;
		background: var(--bg-primary);
		box-shadow: none;
		transform: translateX(100%);
		transition: transform var(--transition-base) ease-out;
	}

	.summary-panel.open {
		transform: translateX(0);
		box-shadow: -6px 0 24px rgba(0, 0, 0, 0.12);
	}

	/* Offset for indexing banner at top */
	.summary-panel.indexing {
		top: 2.5rem;
	}

	.summary-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-5) var(--space-6) var(--space-4);
		border-bottom: 1px solid var(--border);
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		color: var(--text-tertiary);
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.close-btn:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.summary-title {
		font-family: var(--font-reading);
		font-size: var(--text-lg);
		font-weight: 400;
		color: var(--text-primary);
		letter-spacing: -0.01em;
	}

	.summary-subtitle {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		margin-top: 4px;
	}

	.summary-tabs {
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

	.summary-body {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-5) var(--space-6) var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.summary-section h3 {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		margin-bottom: var(--space-2);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.summary-section p,
	.summary-section li {
		font-size: var(--text-sm);
		color: var(--text-primary);
		line-height: 1.6;
	}

	.summary-section ul {
		padding-left: var(--space-4);
		list-style: disc;
	}

	.prompt-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.prompt-card {
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: var(--space-4);
		background: var(--bg-secondary);
	}

	.prompt-type {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--text-tertiary);
	}

	.prompt-question {
		margin-top: var(--space-2);
		font-size: var(--text-sm);
		color: var(--text-primary);
	}

	.prompt-hint {
		margin-top: var(--space-2);
		font-size: var(--text-xs);
		color: var(--text-tertiary);
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

	.progress-text {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
	}

	.summary-footer {
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
