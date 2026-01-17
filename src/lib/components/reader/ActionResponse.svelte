<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { marked } from 'marked';
	import type { HighlightAction } from '$lib/types/highlight';

	export let open = false;
	export let x = 0;
	export let y = 0;
	export let action: HighlightAction = 'explain';
	export let text = '';
	export let isLoading = false;
	export let error: string | null = null;

	const dispatch = createEventDispatcher<{ close: void }>();

	// Configure marked for simple rendering
	marked.setOptions({
		breaks: true,
		gfm: true
	});

	$: title = action === 'define' ? 'Definition' : 'Explanation';
	$: renderedText = text ? marked.parse(text) : '';
</script>

{#if open}
	<div
		class="response-card"
		style="left: {x}px; top: {y}px;"
		data-action-response
	>
		<header class="response-header">
			<span class="response-title">{title}</span>
			<button
				type="button"
				class="close-btn"
				on:click={() => dispatch('close')}
				aria-label="Close"
			>
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
					<path d="M12 4L4 12M4 4l8 8" />
				</svg>
			</button>
		</header>
		<div class="response-body">
			{#if isLoading}
				<div class="loading">
					<span class="loading-dot"></span>
					<span class="loading-text">Thinking</span>
				</div>
			{:else if error}
				<p class="error-text">{error}</p>
			{:else}
				<div class="response-text prose">{@html renderedText}</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.response-card {
		position: fixed;
		z-index: 55;
		width: min(88vw, 340px);
		transform: translate(-50%, 10px);
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
		animation: slide-up 180ms ease-out;
		overflow: hidden;
	}

	.response-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px var(--space-4);
		border-bottom: 1px solid var(--border);
	}

	.response-title {
		font-size: 11px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-tertiary);
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		color: var(--text-tertiary);
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.close-btn:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
	}

	.response-body {
		padding: var(--space-4);
		max-height: 280px;
		overflow-y: auto;
	}

	.loading {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.loading-dot {
		width: 5px;
		height: 5px;
		background: var(--text-tertiary);
		border-radius: 50%;
		animation: pulse 1.4s ease-in-out infinite;
	}

	.loading-text {
		font-size: var(--text-sm);
		color: var(--text-tertiary);
	}

	.response-text {
		font-family: var(--font-reading);
		font-size: 15px;
		line-height: 1.6;
		color: var(--text-primary);
	}

	/* Prose styles for markdown content */
	.prose :global(p) {
		margin-bottom: 0.75em;
	}

	.prose :global(p:last-child) {
		margin-bottom: 0;
	}

	.prose :global(strong) {
		font-weight: 600;
		color: var(--text-primary);
	}

	.prose :global(em) {
		font-style: italic;
	}

	.prose :global(ul),
	.prose :global(ol) {
		margin: 0.5em 0;
		padding-left: 1.25em;
	}

	.prose :global(li) {
		margin-bottom: 0.25em;
	}

	.prose :global(code) {
		font-family: 'SF Mono', Menlo, monospace;
		font-size: 0.9em;
		background: var(--bg-secondary);
		padding: 0.15em 0.4em;
		border-radius: 3px;
	}

	.prose :global(blockquote) {
		margin: 0.75em 0;
		padding-left: 0.75em;
		border-left: 2px solid var(--border);
		color: var(--text-secondary);
		font-style: italic;
	}

	.prose :global(h1),
	.prose :global(h2),
	.prose :global(h3),
	.prose :global(h4) {
		font-weight: 600;
		margin-top: 1em;
		margin-bottom: 0.5em;
	}

	.prose :global(h1) { font-size: 1.25em; }
	.prose :global(h2) { font-size: 1.15em; }
	.prose :global(h3) { font-size: 1.1em; }
	.prose :global(h4) { font-size: 1em; }

	.error-text {
		font-size: var(--text-sm);
		color: #b91c1c;
		line-height: 1.5;
	}

	@keyframes slide-up {
		from {
			opacity: 0;
			transform: translate(-50%, 16px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 10px);
		}
	}

	@keyframes pulse {
		0%, 100% { opacity: 0.3; }
		50% { opacity: 1; }
	}
</style>
