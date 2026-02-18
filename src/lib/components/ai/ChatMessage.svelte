<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import type { ChatMessage } from '$lib/types/chat';
	import Citation from '$lib/components/ai/Citation.svelte';

	export let message: ChatMessage;
	const dispatch = createEventDispatcher<{
		jump: { chapterId?: string; chunkId: string };
		viewCitation: { chapterId?: string; chunkId: string };
		feedback: { messageId: string; rating: 'helpful' | 'unhelpful' };
		simplify: { messageId: string; content: string };
	}>();

	const handleJump = (event: CustomEvent<{ chapterId?: string; chunkId: string }>) => {
		dispatch('jump', event.detail);
	};

	const handleViewCitation = (event: CustomEvent<{ chapterId?: string; chunkId: string }>) => {
		dispatch('viewCitation', event.detail);
	};

	const sendFeedback = (rating: 'helpful' | 'unhelpful') => {
		dispatch('feedback', { messageId: message.id, rating });
	};

	const simplifyAnswer = () => {
		dispatch('simplify', { messageId: message.id, content: message.content });
	};

	marked.setOptions({
		breaks: true,
		gfm: true
	});

	$: renderedContent =
		message.role === 'assistant'
			? DOMPurify.sanitize(marked.parse(message.content) as string)
			: '';
</script>

<div class="message-container">
	<div class="message" class:user={message.role === 'user'} class:assistant={message.role === 'assistant'}>
		{#if message.notFound}
			<p class="not-found">Not found in this book.</p>
		{/if}
		{#if message.role === 'assistant'}
			<div class="message-content prose">{@html renderedContent}</div>
		{:else}
			<p class="message-content">{message.content}</p>
		{/if}
	</div>

	{#if message.citations && message.citations.length > 0}
		<div class="citations">
			{#each message.citations as citation (citation.chunkId)}
				<Citation {citation} on:jump={handleJump} on:view={handleViewCitation} />
			{/each}
		</div>
	{/if}

	{#if message.role === 'assistant' && !message.isStreaming}
		<div class="feedback-row">
			<button
				type="button"
				class="feedback-btn"
				on:click={simplifyAnswer}
			>
				Simplify
			</button>
			<button
				type="button"
				class="feedback-btn"
				class:active={message.feedback === 'helpful'}
				on:click={() => sendFeedback('helpful')}
				disabled={message.feedback === 'helpful'}
			>
				Helpful
			</button>
			<button
				type="button"
				class="feedback-btn"
				class:active={message.feedback === 'unhelpful'}
				on:click={() => sendFeedback('unhelpful')}
				disabled={message.feedback === 'unhelpful'}
			>
				Not helpful
			</button>
		</div>
	{/if}
</div>

<style>
	.message-container {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.message {
		max-width: 85%;
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-lg);
		font-size: var(--text-sm);
		line-height: 1.6;
	}

	.message.user {
		margin-left: auto;
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.message.assistant {
		background: var(--bg-secondary);
		color: var(--text-primary);
		border: 1px solid var(--border);
	}

	.not-found {
		font-weight: 500;
		margin-bottom: var(--space-2);
	}

	.message-content {
		white-space: pre-wrap;
	}

	.prose {
		white-space: normal;
	}

	.prose :global(p) {
		margin-bottom: 0.6em;
	}

	.prose :global(p:last-child) {
		margin-bottom: 0;
	}

	.prose :global(ul),
	.prose :global(ol) {
		margin: 0.5em 0;
		padding-left: 1.2em;
	}

	.prose :global(li) {
		margin-bottom: 0.2em;
	}

	.prose :global(strong) {
		font-weight: 600;
	}

	.prose :global(code) {
		font-family: 'SF Mono', Menlo, monospace;
		font-size: 0.9em;
		background: var(--bg-tertiary);
		padding: 0.1em 0.35em;
		border-radius: 4px;
	}

	.prose :global(blockquote) {
		margin: 0.6em 0;
		padding-left: 0.7em;
		border-left: 2px solid var(--border);
		color: var(--text-secondary);
	}

	.citations {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.feedback-row {
		display: flex;
		gap: var(--space-2);
	}

	.feedback-btn {
		padding: 4px 10px;
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		background: var(--bg-secondary);
		border: 1px solid transparent;
		transition: all var(--transition-fast);
	}

	.feedback-btn:hover:not(:disabled) {
		color: var(--text-primary);
		border-color: var(--border);
	}

	.feedback-btn.active {
		color: var(--text-primary);
		border-color: var(--border);
		background: var(--bg-tertiary);
	}

	.feedback-btn:disabled {
		cursor: default;
	}
</style>
