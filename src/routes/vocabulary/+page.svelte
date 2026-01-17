<script lang="ts">
	import { onMount } from 'svelte';
	import VocabularyPanel from '$lib/components/vocabulary/VocabularyPanel.svelte';
	import VocabularyCard from '$lib/components/vocabulary/VocabularyCard.svelte';
	import VocabularyReview from '$lib/components/vocabulary/VocabularyReview.svelte';
	import {
		getAllVocabulary,
		getWordsForReview,
		recordVocabularyReview,
		deleteVocabularyEntry,
		getNextReviewAt
	} from '$lib/services/vocabulary';
	import type { ReviewRating, VocabularyEntry } from '$lib/types/vocabulary';

	let entries: VocabularyEntry[] = [];
	let isLoading = false;
	let error = '';
	let selectedId: string | null = null;
	let selectedBookId = 'all';
	let query = '';
	let reviewMode = false;
	let reviewEntries: VocabularyEntry[] = [];

	const loadVocabulary = async () => {
		isLoading = true;
		error = '';
		try {
			entries = await getAllVocabulary();
			if (!selectedId && entries.length > 0) {
				selectedId = entries[0].id;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load vocabulary.';
		} finally {
			isLoading = false;
		}
	};

	const startReview = async () => {
		reviewEntries = await getWordsForReview(8);
		reviewMode = true;
	};

	const handleReview = async (event: CustomEvent<{ entry: VocabularyEntry; rating: ReviewRating }>) => {
		const updated = await recordVocabularyReview(event.detail.entry, event.detail.rating);
		entries = entries.map((entry) => (entry.id === updated.id ? updated : entry));
		reviewEntries = reviewEntries.map((entry) => (entry.id === updated.id ? updated : entry));
	};

	const exitReview = () => {
		reviewMode = false;
		reviewEntries = [];
	};

	const removeEntry = async (entry: VocabularyEntry) => {
		if (!confirm(`Remove "${entry.word}" from your vocabulary?`)) {
			return;
		}
		await deleteVocabularyEntry(entry.id);
		entries = entries.filter((item) => item.id !== entry.id);
		if (selectedId === entry.id) {
			selectedId = entries[0]?.id ?? null;
		}
	};

	const downloadFile = (content: string, filename: string, type: string) => {
		const blob = new Blob([content], { type });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(url);
	};

	const buildAnkiExport = (items: VocabularyEntry[]): string => {
		const header = 'Front\tBack\n';
		const lines = items.map((entry) => {
			const front = entry.word.replace(/\t/g, ' ').trim();
			const parts = [entry.definition];
			if (entry.etymology) {
				parts.push(`Etymology: ${entry.etymology}`);
			}
			if (entry.context) {
				parts.push(`Context: ${entry.context}`);
			}
			const back = parts.join(' | ').replace(/\t/g, ' ').trim();
			return `${front}\t${back}`;
		});
		return header + lines.join('\n');
	};

	const exportAnki = () => {
		const exportItems = filteredEntries;
		if (!exportItems.length) return;
		const filename = selectedBookId === 'all' ? 'vocabulary.tsv' : `vocabulary-${selectedBookId}.tsv`;
		downloadFile(buildAnkiExport(exportItems), filename, 'text/tab-separated-values');
	};

	$: books = Array.from(
		entries.reduce<Map<string, { id: string; title: string }>>((acc, entry) => {
			if (!acc.has(entry.bookId)) {
				acc.set(entry.bookId, { id: entry.bookId, title: entry.bookTitle });
			}
			return acc;
		}, new Map()).values()
	);

	$: filteredEntries = entries
		.filter((entry) => (selectedBookId === 'all' ? true : entry.bookId === selectedBookId))
		.filter((entry) => {
			if (!query.trim()) return true;
			const target = `${entry.word} ${entry.definition} ${entry.context}`.toLowerCase();
			return target.includes(query.trim().toLowerCase());
		})
		.sort((a, b) => b.lookedUpAt - a.lookedUpAt);

	$: selectedEntry = filteredEntries.find((entry) => entry.id === selectedId) ?? null;

	$: if (filteredEntries.length > 0 && !filteredEntries.some((entry) => entry.id === selectedId)) {
		selectedId = filteredEntries[0].id;
	}

	$: reviewDueCount = entries.filter((entry) => getNextReviewAt(entry) <= Date.now() && !entry.mastered)
		.length;

	onMount(() => {
		void loadVocabulary();
	});
</script>

<main class="vocabulary-page">
	<header class="page-header">
		<a href="/" class="back-link">
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M10 12L6 8l4-4" />
			</svg>
			Library
		</a>
		<div class="header-actions">
			<button type="button" class="action-btn" on:click={startReview} disabled={!reviewDueCount}>
				Review {reviewDueCount > 0 ? `(${reviewDueCount})` : ''}
			</button>
			<button type="button" class="action-btn primary" on:click={exportAnki} disabled={!filteredEntries.length}>
				Export to Anki
			</button>
		</div>
	</header>

	<header class="vocab-header">
		<div>
			<h1>Your Vocabulary</h1>
			<p>{entries.length} {entries.length === 1 ? 'word' : 'words'} across {books.length} {books.length === 1 ? 'book' : 'books'}</p>
		</div>
		<div class="filters">
			<label>
				<select bind:value={selectedBookId}>
					<option value="all">All books</option>
					{#each books as book}
						<option value={book.id}>{book.title}</option>
					{/each}
				</select>
			</label>
			<label class="search">
				<input type="text" placeholder="Search words..." bind:value={query} />
			</label>
		</div>
	</header>

	{#if isLoading}
		<div class="state loading">
			<div class="loading-dot"></div>
			Loading vocabulary…
		</div>
	{:else if error}
		<div class="state error">{error}</div>
	{:else if entries.length === 0}
		<div class="empty-state">
			<div class="empty-icon">
				<svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">
					<rect x="12" y="10" width="40" height="44" rx="4" />
					<path d="M20 24h24M20 32h24M20 40h16" />
					<circle cx="46" cy="22" r="6" fill="var(--highlight-active)" />
				</svg>
			</div>
			<h2>No vocabulary yet</h2>
			<p>Use the Define action while reading to save words here for review.</p>
			<a href="/" class="empty-btn">Browse your library</a>
		</div>
	{:else}
		<div class="vocab-grid">
			<VocabularyPanel
				entries={filteredEntries}
				selectedId={selectedId}
				on:select={(event) => (selectedId = event.detail.id)}
			/>
			{#if reviewMode}
				<VocabularyReview
					entries={reviewEntries}
					on:review={handleReview}
					on:exit={exitReview}
				/>
			{:else}
				<div class="detail-panel">
					<VocabularyCard entry={selectedEntry} />
					{#if selectedEntry}
						<button type="button" class="remove-btn" on:click={() => removeEntry(selectedEntry)}>
							Remove word
						</button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</main>

<style>
	.vocabulary-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: var(--text-sm);
		color: var(--text-tertiary);
	}

	.header-actions {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.action-btn {
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 8px 14px;
		font-size: var(--text-sm);
	}

	.action-btn.primary {
		background: var(--text-primary);
		color: var(--bg-primary);
		border-color: var(--text-primary);
	}

	.vocab-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
	}

	.vocab-header h1 {
		margin: 0;
		font-size: 28px;
	}

	.vocab-header p {
		margin: 6px 0 0;
		color: var(--text-tertiary);
		font-size: var(--text-sm);
	}

	.filters {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	select,
	input[type='text'] {
		background: var(--bg-primary);
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 8px 12px;
		font-size: var(--text-sm);
	}

	.state {
		padding: 24px;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.state.loading {
		color: var(--text-tertiary);
	}

	.state.error {
		color: #b91c1c;
		border-color: rgba(185, 28, 28, 0.3);
	}

	.loading-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--text-tertiary);
		animation: pulse 1.4s ease-in-out infinite;
	}

	.empty-state {
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		padding: 32px;
		text-align: center;
	}

	.empty-btn {
		display: inline-flex;
		margin-top: 16px;
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 8px 14px;
		font-size: var(--text-sm);
	}

	.vocab-grid {
		display: grid;
		grid-template-columns: minmax(220px, 320px) minmax(0, 1fr);
		gap: 20px;
	}

	.detail-panel {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.remove-btn {
		align-self: flex-end;
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 6px 12px;
		font-size: var(--text-xs);
		color: var(--text-tertiary);
	}

	@media (max-width: 900px) {
		.vocab-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
