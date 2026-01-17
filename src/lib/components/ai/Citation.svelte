<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Citation } from '$lib/types/chat';

	export let citation: Citation;

	const dispatch = createEventDispatcher<{ jump: { chapterId?: string; chunkId: string } }>();

	const jumpToSource = () => {
		dispatch('jump', { chapterId: citation.chapterId, chunkId: citation.chunkId });
	};
</script>

<button type="button" class="citation-card" on:click={jumpToSource}>
	<span class="citation-label">Cited passage</span>
	<p class="citation-quote">"{citation.quote}"</p>
	<span class="citation-source">
		{#if citation.chapterTitle}
			{citation.chapterTitle}
		{:else}
			Source #{citation.chunkId}
		{/if}
	</span>
</button>

<style>
	.citation-card {
		display: block;
		width: 100%;
		padding: var(--space-3) var(--space-4);
		text-align: left;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.citation-card:hover {
		border-color: var(--border-hover);
		background: var(--bg-tertiary);
	}

	.citation-label {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-tertiary);
	}

	.citation-quote {
		margin-top: var(--space-2);
		font-family: var(--font-reading);
		font-size: var(--text-sm);
		font-style: italic;
		line-height: 1.5;
		color: var(--text-primary);
	}

	.citation-source {
		display: block;
		margin-top: var(--space-2);
		font-size: var(--text-xs);
		color: var(--text-tertiary);
	}
</style>
