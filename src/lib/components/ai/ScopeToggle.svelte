<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { SearchScope } from '$lib/types/retrieval';

	export let scope: SearchScope;
	const dispatch = createEventDispatcher<{ change: { scope: SearchScope } }>();

	const setScope = (next: SearchScope) => dispatch('change', { scope: next });
</script>

<div class="scope-toggle" role="radiogroup" aria-label="Search scope">
	<button
		type="button"
		role="radio"
		aria-checked={scope === 'current_chapter'}
		class="scope-option"
		class:active={scope === 'current_chapter'}
		on:click={() => setScope('current_chapter')}
	>
		This chapter
	</button>
	<button
		type="button"
		role="radio"
		aria-checked={scope === 'whole_book'}
		class="scope-option"
		class:active={scope === 'whole_book'}
		on:click={() => setScope('whole_book')}
	>
		Whole book
	</button>
</div>

<style>
	.scope-toggle {
		display: inline-flex;
		background: var(--bg-secondary);
		padding: 3px;
		border-radius: var(--radius-md);
		gap: 2px;
	}

	.scope-option {
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-xs);
		color: var(--text-secondary);
		background: transparent;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.scope-option:hover {
		color: var(--text-primary);
	}

	.scope-option.active {
		background: var(--bg-primary);
		color: var(--text-primary);
		box-shadow: var(--shadow-sm);
	}
</style>
