<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let open = false;
	export let x = 0;
	export let y = 0;
	export let note = '';
	export let saving = false;
	export let error: string | null = null;

	const dispatch = createEventDispatcher<{
		save: { note: string };
		close: void;
		delete: void;
	}>();

	let draft = '';

	$: if (open) {
		draft = note;
	}

	const handleSave = () => {
		dispatch('save', { note: draft.trim() });
	};
</script>

{#if open}
	<div
		class="note-popover"
		style="left: {x}px; top: {y}px;"
		role="dialog"
		aria-label="Highlight note"
		data-note-popover
	>
		<header class="note-header">
			<span class="note-title">Note</span>
			<button type="button" class="icon-btn" on:click={() => dispatch('close')} aria-label="Close note">
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
					<path d="M10 4L4 10M4 4l6 6" />
				</svg>
			</button>
		</header>
		<textarea
			class="note-input"
			rows="5"
			placeholder="Add a note..."
			bind:value={draft}
		></textarea>
		{#if error}
			<p class="note-error">{error}</p>
		{/if}
		<div class="note-actions">
			<button type="button" class="note-btn ghost" on:click={() => dispatch('delete')}>
				Remove highlight
			</button>
			<button type="button" class="note-btn" on:click={handleSave} disabled={saving}>
				{saving ? 'Saving...' : 'Save'}
			</button>
		</div>
	</div>
{/if}

<style>
	.note-popover {
		position: fixed;
		z-index: 70;
		transform: translate(-50%, 8px);
		width: min(320px, 90vw);
		padding: var(--space-4);
		background: var(--bg-primary);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		animation: pop-in 140ms ease-out;
	}

	.note-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-3);
	}

	.note-title {
		font-size: var(--text-sm);
		font-weight: 600;
		letter-spacing: 0.01em;
		text-transform: uppercase;
		color: var(--text-tertiary);
	}

	.icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-md);
		color: var(--text-tertiary);
	}

	.icon-btn:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
	}

	.note-input {
		width: 100%;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: var(--space-3);
		background: var(--bg-secondary);
		color: var(--text-primary);
		resize: vertical;
		min-height: 120px;
	}

	.note-error {
		margin-top: var(--space-2);
		color: #b91c1c;
		font-size: var(--text-sm);
	}

	.note-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: var(--space-3);
		gap: var(--space-3);
	}

	.note-btn {
		padding: 8px 14px;
		border-radius: var(--radius-md);
		background: var(--accent);
		color: white;
		font-size: var(--text-sm);
		font-weight: 500;
		transition: all var(--transition-fast);
	}

	.note-btn:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.note-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.note-btn.ghost {
		background: transparent;
		color: var(--text-secondary);
		border: 1px solid var(--border);
	}

	.note-btn.ghost:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	@keyframes pop-in {
		from {
			opacity: 0;
			transform: translate(-50%, 12px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 8px) scale(1);
		}
	}
</style>
