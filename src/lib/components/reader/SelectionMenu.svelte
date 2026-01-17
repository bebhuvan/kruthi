<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { SelectionAction } from '$lib/types/highlight';

	export let open = false;
	export let x = 0;
	export let y = 0;

	const dispatch = createEventDispatcher<{ action: { action: SelectionAction } }>();

	const handleAction = (action: SelectionAction) => {
		dispatch('action', { action });
	};
</script>

{#if open}
	<div
		class="selection-menu"
		style="left: {x}px; top: {y}px;"
		role="menu"
		data-selection-menu
	>
		<button
			type="button"
			class="menu-btn"
			on:click={() => handleAction('highlight')}
		>
			Highlight
		</button>
		<button
			type="button"
			class="menu-btn"
			on:click={() => handleAction('note')}
		>
			Note
		</button>
		<button
			type="button"
			class="menu-btn primary"
			on:click={() => handleAction('explain')}
		>
			Explain
		</button>
		<button
			type="button"
			class="menu-btn"
			on:click={() => handleAction('define')}
		>
			Define
		</button>
	</div>
{/if}

<style>
	.selection-menu {
		position: fixed;
		z-index: 60;
		transform: translate(-50%, calc(-100% - 10px));
		display: flex;
		align-items: center;
		gap: 3px;
		padding: 3px;
		background: var(--bg-primary);
		border-radius: var(--radius-md);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		animation: pop-in 120ms ease-out;
	}

	.menu-btn {
		padding: 6px 12px;
		font-size: 13px;
		font-weight: 500;
		color: var(--text-secondary);
		background: transparent;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.menu-btn:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
	}

	.menu-btn.primary {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}

	.menu-btn.primary:hover {
		background: var(--border);
	}

	@keyframes pop-in {
		from {
			opacity: 0;
			transform: translate(-50%, calc(-100% - 10px)) scale(0.9);
		}
		to {
			opacity: 1;
			transform: translate(-50%, calc(-100% - 10px)) scale(1);
		}
	}
</style>
