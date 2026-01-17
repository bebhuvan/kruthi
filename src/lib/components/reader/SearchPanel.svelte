<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import type { Book } from '$lib/types/book';

	export let book: Book;
	export let open = false;

	const dispatch = createEventDispatcher<{
		close: void;
		result: { chapterIndex: number; text: string };
	}>();

	let query = '';
	let results: Array<{
		chapterIndex: number;
		chapterTitle: string;
		matches: Array<{ text: string; context: string }>;
	}> = [];
	let searchInput: HTMLInputElement;
	let totalMatches = 0;

	$: if (open && searchInput) {
		searchInput.focus();
	}

	const escapeRegExp = (str: string): string => {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	};

	const search = () => {
		if (!query.trim()) {
			results = [];
			totalMatches = 0;
			return;
		}

		const searchTerm = query.trim().toLowerCase();
		const searchRegex = new RegExp(escapeRegExp(searchTerm), 'gi');
		const newResults: typeof results = [];
		let count = 0;

		book.chapters.forEach((chapter, index) => {
			// Create a temporary element to extract text from HTML
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = chapter.html;
			const textContent = tempDiv.textContent || tempDiv.innerText || '';

			const matches: Array<{ text: string; context: string }> = [];
			let match: RegExpExecArray | null;

			// Reset regex lastIndex
			searchRegex.lastIndex = 0;

			while ((match = searchRegex.exec(textContent)) !== null && matches.length < 5) {
				const start = Math.max(0, match.index - 50);
				const end = Math.min(textContent.length, match.index + searchTerm.length + 50);
				let context = textContent.slice(start, end);

				// Clean up context
				if (start > 0) context = '...' + context;
				if (end < textContent.length) context = context + '...';

				matches.push({
					text: match[0],
					context: context.replace(/\s+/g, ' ').trim()
				});
				count++;
			}

			// Check if there are more matches
			searchRegex.lastIndex = 0;
			const allMatches = textContent.match(searchRegex);
			const totalInChapter = allMatches ? allMatches.length : 0;

			if (matches.length > 0) {
				newResults.push({
					chapterIndex: index,
					chapterTitle: chapter.title,
					matches
				});
			}

			count = count - matches.length + totalInChapter;
		});

		results = newResults;
		totalMatches = count;
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			dispatch('close');
		} else if (event.key === 'Enter' && results.length > 0) {
			// Jump to first result
			jumpToResult(results[0].chapterIndex, results[0].matches[0].text);
		}
	};

	const jumpToResult = (chapterIndex: number, text: string) => {
		dispatch('result', { chapterIndex, text });
		dispatch('close');
	};

	const highlightMatch = (context: string): string => {
		if (!query.trim()) return context;
		const searchRegex = new RegExp(`(${escapeRegExp(query.trim())})`, 'gi');
		return context.replace(searchRegex, '<mark>$1</mark>');
	};

	onMount(() => {
		if (searchInput) {
			searchInput.focus();
		}
	});
</script>

{#if open}
	<button
		type="button"
		class="search-backdrop"
		on:click={() => dispatch('close')}
		aria-label="Close search"
	></button>
	<dialog
		class="search-panel"
		on:keydown={handleKeydown}
		aria-modal="true"
		aria-label="Search in book"
		open
	>
		<div class="search-header">
			<div class="search-input-wrapper">
				<svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
					<circle cx="7" cy="7" r="5" />
					<path d="M11 11l3 3" />
				</svg>
				<input
					bind:this={searchInput}
					bind:value={query}
					on:input={search}
					type="text"
					class="search-input"
					placeholder="Search in book..."
					autocomplete="off"
					spellcheck="false"
				/>
				{#if query}
					<button
						type="button"
						class="clear-btn"
						on:click={() => { query = ''; results = []; totalMatches = 0; }}
						aria-label="Clear search"
					>
						<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
							<path d="M10 4L4 10M4 4l6 6" />
						</svg>
					</button>
				{/if}
			</div>
			<button type="button" class="close-btn" on:click={() => dispatch('close')} aria-label="Close search">
				<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
					<path d="M13 5L5 13M5 5l8 8" />
				</svg>
			</button>
		</div>

		{#if query.trim()}
			<div class="search-results">
				{#if totalMatches > 0}
					<div class="results-count">
						{totalMatches} {totalMatches === 1 ? 'match' : 'matches'} found
					</div>
					<div class="results-list">
						{#each results as result}
							<div class="result-chapter">
								<h3 class="chapter-name">{result.chapterTitle}</h3>
								{#each result.matches as match}
									<button
										type="button"
										class="result-item"
										on:click={() => jumpToResult(result.chapterIndex, match.text)}
									>
										<span class="result-context">{@html highlightMatch(match.context)}</span>
									</button>
								{/each}
							</div>
						{/each}
					</div>
				{:else}
					<div class="no-results">
						<p>No matches found for "{query}"</p>
					</div>
				{/if}
			</div>
		{:else}
			<div class="search-hint">
				<p>Start typing to search</p>
				<p class="hint-shortcut">Press <kbd>/</kbd> to open search</p>
			</div>
		{/if}
	</dialog>
{/if}

<style>
	.search-backdrop {
		position: fixed;
		inset: 0;
		z-index: 55;
		background: var(--overlay);
		border: none;
		padding: 0;
		animation: fade-in var(--transition-fast) ease-out;
	}

	.search-panel {
		border: none;
		padding: 0;
		position: fixed;
		top: 10vh;
		left: 50%;
		transform: translateX(-50%);
		z-index: 60;
		width: 90%;
		max-width: 560px;
		max-height: 70vh;
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		display: flex;
		flex-direction: column;
		animation: slide-down var(--transition-base) ease-out;
	}

	.search-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		border-bottom: 1px solid var(--border);
	}

	.search-input-wrapper {
		flex: 1;
		display: flex;
		align-items: center;
		gap: var(--space-3);
		background: var(--bg-secondary);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
	}

	.search-icon {
		color: var(--text-tertiary);
		flex-shrink: 0;
	}

	.search-input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		font-size: var(--text-base);
		color: var(--text-primary);
	}

	.search-input::placeholder {
		color: var(--text-tertiary);
	}

	.clear-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		color: var(--text-tertiary);
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.clear-btn:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		color: var(--text-tertiary);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.close-btn:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
	}

	.search-results {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-4);
	}

	.results-count {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		margin-bottom: var(--space-4);
	}

	.results-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.result-chapter {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.chapter-name {
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-primary);
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--border);
	}

	.result-item {
		text-align: left;
		padding: var(--space-3);
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: background var(--transition-fast);
	}

	.result-item:hover {
		background: var(--bg-tertiary);
	}

	.result-context {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.result-context :global(mark) {
		background: var(--accent-subtle, rgba(180, 166, 50, 0.2));
		color: var(--text-primary);
		padding: 1px 2px;
		border-radius: 2px;
	}

	.no-results,
	.search-hint {
		padding: var(--space-8);
		text-align: center;
		color: var(--text-tertiary);
	}

	.no-results p,
	.search-hint p {
		margin-bottom: var(--space-2);
	}

	.hint-shortcut {
		font-size: var(--text-xs);
	}

	.hint-shortcut kbd {
		display: inline-block;
		padding: 2px 6px;
		font-family: var(--font-ui);
		font-size: var(--text-xs);
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slide-down {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	@media (max-width: 640px) {
		.search-panel {
			top: 0;
			width: 100%;
			max-width: 100%;
			max-height: 100vh;
			border-radius: 0;
		}
	}
</style>
