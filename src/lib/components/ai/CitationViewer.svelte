<script lang="ts">
	import type { CitationContext } from '$lib/services/citations';

	export let open = false;
	export let context: CitationContext | null = null;
	export let loading = false;
	export let error = '';

	export let onClose: () => void = () => {};
</script>

{#if open}
	<div class="viewer-backdrop" role="presentation" on:click={onClose}></div>
	<div class="viewer" role="dialog" aria-modal="true" aria-label="Citation context viewer">
		<header class="viewer-header">
			<h3>Citation Context</h3>
			<button type="button" class="close-btn" on:click={onClose}>Close</button>
		</header>
		{#if loading}
			<p class="state">Loading citation context…</p>
		{:else if error}
			<p class="state error">{error}</p>
		{:else if context}
			<div class="columns">
				<article class="panel">
					<h4>Previous</h4>
					<p>{context.previous?.text ?? 'No previous passage in this chapter.'}</p>
				</article>
				<article class="panel current">
					<h4>Cited</h4>
					<p>{context.current.text}</p>
				</article>
				<article class="panel">
					<h4>Next</h4>
					<p>{context.next?.text ?? 'No next passage in this chapter.'}</p>
				</article>
			</div>
		{:else}
			<p class="state">No context available for this citation.</p>
		{/if}
	</div>
{/if}

<style>
	.viewer-backdrop {
		position: fixed;
		inset: 0;
		background: var(--overlay);
		z-index: 70;
	}

	.viewer {
		position: fixed;
		inset: 8vh 5vw;
		background: var(--bg-primary);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		z-index: 71;
		display: flex;
		flex-direction: column;
	}

	.viewer-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4) var(--space-5);
		border-bottom: 1px solid var(--border);
	}

	.close-btn {
		font-size: var(--text-sm);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 4px 8px;
	}

	.state {
		padding: var(--space-5);
		color: var(--text-secondary);
	}

	.state.error {
		color: #b91c1c;
	}

	.columns {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: var(--space-3);
		padding: var(--space-4);
		overflow: auto;
	}

	.panel {
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: var(--space-3);
		background: var(--bg-secondary);
	}

	.panel.current {
		border-color: var(--accent);
		background: var(--bg-tertiary);
	}

	.panel h4 {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-tertiary);
		margin-bottom: var(--space-2);
	}

	.panel p {
		font-family: var(--font-reading);
		font-size: var(--text-sm);
		line-height: 1.6;
		white-space: pre-wrap;
	}

	@media (max-width: 900px) {
		.columns {
			grid-template-columns: 1fr;
		}
	}
</style>
