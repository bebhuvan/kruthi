<script lang="ts">
	import { afterUpdate, createEventDispatcher } from 'svelte';
	import type { Book } from '$lib/types/book';
	import type { ProactiveSuggestion } from '$lib/types/readerProfile';
	import { chatStore } from '$lib/stores/chatStore';
	import { readerProfileStore } from '$lib/stores/readerProfileStore';
	import { settingsStore } from '$lib/stores/settingsStore';
	import { indexingStore } from '$lib/stores/indexingStore';
	import { getProactiveSuggestions } from '$lib/services/personalization';
	import ChatMessage from '$lib/components/ai/ChatMessage.svelte';
	import ScopeToggle from '$lib/components/ai/ScopeToggle.svelte';
	import ModeToggle from '$lib/components/ai/ModeToggle.svelte';

	export let book: Book;
	export let currentChapterIndex = 0;

	let question = '';
	let scrollEl: HTMLElement | null = null;
	let proactiveSuggestions: ProactiveSuggestion[] = [];

	const dispatch = createEventDispatcher<{ jump: { chapterId?: string; chunkId: string } }>();

	const closePanel = () => chatStore.close();

	const sendQuestion = async () => {
		const trimmed = question.trim();
		if (!trimmed) return;
		const chapter = book.chapters[currentChapterIndex];
		question = '';
		await chatStore.sendQuestion({
			book,
			question: trimmed,
			chapterId: chapter?.id
		});
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			void sendQuestion();
		}
	};

	const handleJump = (event: CustomEvent<{ chapterId?: string; chunkId: string }>) => {
		dispatch('jump', event.detail);
	};

	const handleFeedback = (event: CustomEvent<{ messageId: string; rating: 'helpful' | 'unhelpful' }>) => {
		chatStore.recordFeedback(event.detail.messageId, event.detail.rating);
	};

	const applySuggestion = (suggestion: ProactiveSuggestion) => {
		question = suggestion.prompt;
		if (suggestion.id === 'recap') {
			readerProfileStore.markSlowChapterPrompt();
		}
	};

	$: proactiveSuggestions = getProactiveSuggestions($readerProfileStore.profile, $readerProfileStore.session, {
		chapterTitle: book.chapters[currentChapterIndex]?.title,
		chapterIndex: currentChapterIndex,
		totalChapters: book.chapters.length
	});

	afterUpdate(() => {
		if (scrollEl) {
			scrollEl.scrollTop = scrollEl.scrollHeight;
		}
	});
</script>

{#if $chatStore.isOpen}
	<div class="chat-backdrop" on:click={closePanel} role="presentation"></div>
{/if}

<aside class="chat-panel" class:open={$chatStore.isOpen} class:indexing={$indexingStore.isIndexing}>
	<header class="chat-header">
		<div>
			<h2 class="chat-title">Ask the book</h2>
			{#if $chatStore.mode === 'grounded'}
				<p class="chat-subtitle">Quote-first, grounded in the text</p>
			{:else}
				<p class="chat-subtitle">Companion mode: interpretive, labeled context</p>
			{/if}
		</div>
		<button
			type="button"
			class="close-btn"
			on:click={closePanel}
			aria-label="Close chat"
		>
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
				<path d="M15 5L5 15M5 5l10 10" />
			</svg>
		</button>
	</header>

	<div class="chat-options">
		<ScopeToggle scope={$chatStore.scope} on:change={(event) => chatStore.setScope(event.detail.scope)} />
		<ModeToggle mode={$chatStore.mode} on:change={(event) => chatStore.setMode(event.detail.mode)} />
		{#if $settingsStore.llmProvider === 'openrouter' && !$settingsStore.openRouterApiKey}
			<p class="api-hint">Add your OpenRouter API key in Settings to start asking questions.</p>
		{:else if $settingsStore.llmProvider === 'anthropic' && !$settingsStore.anthropicApiKey}
			<p class="api-hint">Add your Anthropic API key in Settings to start asking questions.</p>
		{:else if $settingsStore.llmProvider === 'openai' && !$settingsStore.openAiApiKey}
			<p class="api-hint">Add your OpenAI API key in Settings to start asking questions.</p>
		{:else if $settingsStore.llmProvider === 'gemini' && !$settingsStore.geminiApiKey}
			<p class="api-hint">Add your Gemini API key in Settings to start asking questions.</p>
		{/if}
	</div>

	{#if proactiveSuggestions.length > 0}
		<div class="suggestions">
			<p class="suggestions-title">Suggestions based on your reading</p>
			<div class="suggestions-list">
				{#each proactiveSuggestions as suggestion (suggestion.id)}
					<button type="button" class="suggestion-chip" on:click={() => applySuggestion(suggestion)}>
						{suggestion.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<section class="chat-messages" bind:this={scrollEl}>
		{#if $chatStore.messages.length === 0}
			<div class="empty-state">
				{#if $chatStore.mode === 'grounded'}
					Ask about characters, themes, or details. Answers will quote the text before explaining.
				{:else}
					Ask about themes, reception, or meaning. Context answers are labeled and never invent quotes.
				{/if}
			</div>
		{:else}
			<div class="messages-list">
				{#each $chatStore.messages as message (message.id)}
					<ChatMessage {message} on:jump={handleJump} on:feedback={handleFeedback} />
				{/each}
			</div>
		{/if}
	</section>

	<footer class="chat-input">
		{#if $chatStore.error}
			<p class="error-text">{$chatStore.error}</p>
		{/if}
		<div class="input-row">
			<textarea
				class="question-input"
				rows="2"
				placeholder="Ask a question..."
				bind:value={question}
				on:keydown={handleKeydown}
				disabled={$chatStore.isStreaming}
			></textarea>
			<button
				type="button"
				class="send-btn"
				on:click={sendQuestion}
				disabled={!question.trim() || $chatStore.isStreaming}
			>
				{$chatStore.isStreaming ? 'Thinking...' : 'Send'}
			</button>
		</div>
	</footer>
</aside>

<style>
	.chat-backdrop {
		position: fixed;
		inset: 0;
		z-index: 55;
		background: var(--overlay);
		animation: fade-in var(--transition-base) ease-out;
	}

	@media (min-width: 768px) {
		.chat-backdrop {
			display: none;
		}
	}

	.chat-panel {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		z-index: 60;
		width: 100%;
		max-width: 380px;
		display: flex;
		flex-direction: column;
		background: var(--bg-primary);
		box-shadow: none;
		transform: translateX(100%);
		transition: transform var(--transition-base) ease-out;
	}

	.chat-panel.open {
		transform: translateX(0);
		box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
	}

	/* Offset for indexing banner at top */
	.chat-panel.indexing {
		top: 2.5rem;
	}

	.chat-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-5) var(--space-5) var(--space-4);
	}

	.chat-title {
		font-family: var(--font-reading);
		font-size: var(--text-lg);
		font-weight: 400;
		color: var(--text-primary);
		letter-spacing: -0.01em;
	}

	.chat-subtitle {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		margin-top: 4px;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		color: var(--text-tertiary);
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.close-btn:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
	}

	.chat-options {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-5);
		border-bottom: 1px solid var(--border);
	}

	.api-hint {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		margin-top: var(--space-3);
		line-height: 1.4;
	}

	.chat-messages {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-4) var(--space-5);
	}

	.suggestions {
		padding: 0 var(--space-5) var(--space-3);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.suggestions-title {
		font-size: var(--text-xs);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-tertiary);
	}

	.suggestions-list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.suggestion-chip {
		padding: 6px 12px;
		font-size: var(--text-xs);
		color: var(--text-secondary);
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--bg-secondary);
		transition: all var(--transition-fast);
	}

	.suggestion-chip:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}

	.empty-state {
		padding: var(--space-4);
		font-size: var(--text-sm);
		color: var(--text-secondary);
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		line-height: 1.55;
	}

	.messages-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.chat-input {
		padding: var(--space-4) var(--space-5);
		border-top: 1px solid var(--border);
	}

	.error-text {
		font-size: var(--text-xs);
		color: #b91c1c;
		margin-bottom: var(--space-2);
	}

	.input-row {
		display: flex;
		gap: var(--space-2);
	}

	.question-input {
		flex: 1;
		resize: none;
		padding: var(--space-3);
		font-size: var(--text-sm);
		color: var(--text-primary);
		background: var(--bg-secondary);
		border: none;
		border-radius: var(--radius-md);
		transition: background var(--transition-fast);
		line-height: 1.5;
	}

	.question-input::placeholder {
		color: var(--text-tertiary);
	}

	.question-input:focus {
		background: var(--bg-tertiary);
		outline: none;
	}

	.send-btn {
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-primary);
		background: var(--bg-tertiary);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
		align-self: flex-end;
	}

	.send-btn:hover:not(:disabled) {
		background: var(--border);
	}

	.send-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@media (max-width: 640px) {
		.chat-panel {
			max-width: 100%;
		}
	}
</style>
