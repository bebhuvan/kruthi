<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ChatMode } from '$lib/types/chat';

	export let mode: ChatMode;
	const dispatch = createEventDispatcher<{ change: { mode: ChatMode } }>();

	const setMode = (next: ChatMode) => dispatch('change', { mode: next });
</script>

<div class="mode-toggle" role="radiogroup" aria-label="Chat mode">
	<button
		type="button"
		role="radio"
		aria-checked={mode === 'grounded'}
		class="mode-option"
		class:active={mode === 'grounded'}
		on:click={() => setMode('grounded')}
	>
		Grounded
	</button>
	<button
		type="button"
		role="radio"
		aria-checked={mode === 'companion'}
		class="mode-option"
		class:active={mode === 'companion'}
		on:click={() => setMode('companion')}
	>
		Companion
	</button>
</div>

<style>
	.mode-toggle {
		display: inline-flex;
		background: var(--bg-secondary);
		padding: 3px;
		border-radius: var(--radius-md);
		gap: 2px;
	}

	.mode-option {
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-xs);
		color: var(--text-secondary);
		background: transparent;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.mode-option:hover {
		color: var(--text-primary);
	}

	.mode-option.active {
		background: var(--bg-primary);
		color: var(--text-primary);
		box-shadow: var(--shadow-sm);
	}
</style>
