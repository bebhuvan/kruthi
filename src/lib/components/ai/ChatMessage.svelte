<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ChatMessage } from '$lib/types/chat';
	import Citation from '$lib/components/ai/Citation.svelte';

	export let message: ChatMessage;
	const dispatch = createEventDispatcher<{
		jump: { chapterId?: string; chunkId: string };
		feedback: { messageId: string; rating: 'helpful' | 'unhelpful' };
	}>();

	const handleJump = (event: CustomEvent<{ chapterId?: string; chunkId: string }>) => {
		dispatch('jump', event.detail);
	};

	const sendFeedback = (rating: 'helpful' | 'unhelpful') => {
		dispatch('feedback', { messageId: message.id, rating });
	};
</script>

<div class="message-container">
	<div class="message" class:user={message.role === 'user'} class:assistant={message.role === 'assistant'}>
		{#if message.notFound}
			<p class="not-found">Not found in this book.</p>
		{/if}
		<p class="message-content">{message.content}</p>
	</div>

	{#if message.citations && message.citations.length > 0}
		<div class="citations">
			{#each message.citations as citation (citation.chunkId)}
				<Citation {citation} on:jump={handleJump} />
			{/each}
		</div>
	{/if}

	{#if message.role === 'assistant' && !message.isStreaming}
		<div class="feedback-row">
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
