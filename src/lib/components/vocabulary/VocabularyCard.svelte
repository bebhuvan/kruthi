<script lang="ts">
	import type { VocabularyEntry } from '$lib/types/vocabulary';

	export let entry: VocabularyEntry | null = null;
</script>

<section class="vocab-card">
	{#if !entry}
		<p class="empty-state">Select a word to see details.</p>
	{:else}
		<header class="card-header">
			<div>
				<h2>{entry.word}</h2>
				<p class="subtitle">{entry.bookTitle}</p>
			</div>
			{#if entry.mastered}
				<span class="mastered">Mastered</span>
			{/if}
		</header>
		<div class="card-section">
			<h3>Definition</h3>
			<p>{entry.definition}</p>
		</div>
		{#if entry.etymology}
			<div class="card-section">
				<h3>Etymology</h3>
				<p>{entry.etymology}</p>
			</div>
		{/if}
		{#if entry.context}
			<div class="card-section">
				<h3>Context</h3>
				<p class="context">{entry.context}</p>
			</div>
		{/if}
		<div class="card-meta">
			<span>Chapter: {entry.chapterId}</span>
			<span>Looked up: {new Date(entry.lookedUpAt).toLocaleDateString()}</span>
			{#if entry.lastReviewedAt}
				<span>Last reviewed: {new Date(entry.lastReviewedAt).toLocaleDateString()}</span>
			{/if}
		</div>
	{/if}
</section>

<style>
	.vocab-card {
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		padding: var(--space-5);
		min-height: 320px;
	}

	.empty-state {
		color: var(--text-tertiary);
		font-size: var(--text-sm);
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		margin-bottom: var(--space-4);
	}

	.card-header h2 {
		margin: 0;
		font-size: 24px;
	}

	.subtitle {
		margin: 4px 0 0;
		color: var(--text-tertiary);
		font-size: var(--text-xs);
	}

	.mastered {
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 4px 10px;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-tertiary);
	}

	.card-section {
		margin-bottom: var(--space-4);
	}

	.card-section h3 {
		margin: 0 0 6px;
		font-size: var(--text-sm);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-tertiary);
	}

	.card-section p {
		margin: 0;
		font-size: var(--text-base);
		line-height: 1.6;
	}

	.context {
		color: var(--text-secondary);
	}

	.card-meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		font-size: var(--text-xs);
		color: var(--text-tertiary);
	}
</style>
