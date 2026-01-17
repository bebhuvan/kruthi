<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { VocabularyEntry } from '$lib/types/vocabulary';

	export let entries: VocabularyEntry[] = [];
	export let selectedId: string | null = null;

	const dispatch = createEventDispatcher<{ select: { id: string } }>();

	const formatDate = (timestamp: number): string => {
		const date = new Date(timestamp);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	};
</script>

<aside class="vocab-panel">
	<header class="panel-header">
		<h2>Vocabulary</h2>
		<p>{entries.length} {entries.length === 1 ? 'word' : 'words'}</p>
	</header>
	{#if entries.length === 0}
		<p class="panel-empty">No words yet.</p>
	{:else}
		<ul class="panel-list">
			{#each entries as entry (entry.id)}
				<li>
					<button
						type="button"
						class="panel-item"
						class:active={entry.id === selectedId}
						on:click={() => dispatch('select', { id: entry.id })}
					>
						<span class="word">{entry.word}</span>
						<span class="meta">
							{formatDate(entry.lookedUpAt)}
							{#if entry.mastered}
								<span class="tag">Mastered</span>
							{/if}
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</aside>

<style>
	.vocab-panel {
		background: var(--bg-secondary);
		border-radius: var(--radius-lg);
		padding: var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		min-height: 320px;
	}

	.panel-header h2 {
		font-size: var(--text-base);
		margin: 0;
	}

	.panel-header p {
		margin: 4px 0 0;
		font-size: var(--text-xs);
		color: var(--text-tertiary);
	}

	.panel-empty {
		font-size: var(--text-sm);
		color: var(--text-tertiary);
	}

	.panel-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.panel-item {
		width: 100%;
		text-align: left;
		padding: 10px 12px;
		border-radius: var(--radius-md);
		background: var(--bg-primary);
		border: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
	}

	.panel-item:hover {
		border-color: var(--border-strong);
		box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.04);
	}

	.panel-item.active {
		border-color: var(--text-primary);
		box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08);
	}

	.word {
		font-size: var(--text-sm);
		font-weight: 600;
	}

	.meta {
		font-size: 11px;
		color: var(--text-tertiary);
		display: flex;
		gap: 6px;
		align-items: center;
	}

	.tag {
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 2px 6px;
		font-size: 10px;
	}
</style>
