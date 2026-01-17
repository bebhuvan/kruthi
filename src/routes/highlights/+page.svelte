<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { adapter } from '$lib/platform';
	import type { Highlight } from '$lib/types/highlight';

	let highlights: Highlight[] = [];
	let isLoading = false;
	let error = '';
	let selectedBookId = 'all';
	let query = '';
	let editingId: string | null = null;
	let noteDraft = '';

	const loadHighlights = async () => {
		isLoading = true;
		error = '';
		try {
			highlights = await adapter.getAllHighlights();
			const bookId = $page.url.searchParams.get('bookId');
			if (bookId) selectedBookId = bookId;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load highlights.';
		} finally {
			isLoading = false;
		}
	};

	const formatDate = (timestamp: number): string => {
		const date = new Date(timestamp);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	};

	const startEdit = (highlight: Highlight) => {
		editingId = highlight.id;
		noteDraft = highlight.note ?? '';
	};

	const cancelEdit = () => {
		editingId = null;
		noteDraft = '';
	};

	const saveNote = async (highlight: Highlight) => {
		const updated: Highlight = {
			...highlight,
			note: noteDraft.trim() ? noteDraft.trim() : undefined,
			updatedAt: Date.now()
		};
		await adapter.saveHighlight(updated);
		highlights = highlights.map((item) => (item.id === updated.id ? updated : item));
		cancelEdit();
	};

	const removeHighlight = async (highlight: Highlight) => {
		await adapter.deleteHighlight(highlight.id);
		highlights = highlights.filter((item) => item.id !== highlight.id);
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

	const buildMarkdown = (items: Highlight[]): string => {
		if (!items.length) return '# Highlights\n\n_No highlights yet._\n';
		const byBook = items.reduce<Record<string, Highlight[]>>((acc, item) => {
			acc[item.bookId] = acc[item.bookId] ?? [];
			acc[item.bookId].push(item);
			return acc;
		}, {});

		const lines: string[] = ['# Highlights', '', `Generated ${new Date().toLocaleString()}`, ''];
		for (const group of Object.values(byBook)) {
			const bookTitle = group[0]?.bookTitle ?? 'Untitled';
			const author = group[0]?.author ?? 'Unknown author';
			lines.push(`## ${bookTitle} — ${author}`, '');
			const byChapter = group.reduce<Record<string, Highlight[]>>((acc, item) => {
				acc[item.chapterId] = acc[item.chapterId] ?? [];
				acc[item.chapterId].push(item);
				return acc;
			}, {});
			for (const chapterItems of Object.values(byChapter)) {
				const chapterTitle = chapterItems[0]?.chapterTitle ?? 'Untitled Chapter';
				lines.push(`### ${chapterTitle}`, '');
				chapterItems.forEach((item) => {
					lines.push(`- "${item.selectedText.replace(/\n+/g, ' ').trim()}"`);
					if (item.note) {
						lines.push(`  - Note: ${item.note.replace(/\n+/g, ' ').trim()}`);
					}
				});
				lines.push('');
			}
		}
		return lines.join('\n');
	};

	const exportMarkdown = () => {
		const exportItems = filteredHighlights;
		const filename = selectedBookId === 'all' ? 'highlights.md' : `highlights-${selectedBookId}.md`;
		downloadFile(buildMarkdown(exportItems), filename, 'text/markdown');
	};

	const exportPdf = () => {
		const params = new URLSearchParams();
		if (selectedBookId !== 'all') params.set('bookId', selectedBookId);
		if (query.trim()) params.set('q', query.trim());
		const queryString = params.toString();
		window.open(`/highlights/export${queryString ? `?${queryString}` : ''}`, '_blank', 'noopener');
	};

	$: books = Array.from(
		highlights.reduce<Map<string, { id: string; title: string; author: string }>>((acc, item) => {
			if (!acc.has(item.bookId)) {
				acc.set(item.bookId, {
					id: item.bookId,
					title: item.bookTitle,
					author: item.author
				});
			}
			return acc;
		}, new Map()).values()
	);

	$: filteredHighlights = highlights
		.filter((item) => (selectedBookId === 'all' ? true : item.bookId === selectedBookId))
		.filter((item) => {
			if (!query.trim()) return true;
			const target = `${item.selectedText} ${item.note ?? ''} ${item.chapterTitle}`.toLowerCase();
			return target.includes(query.trim().toLowerCase());
		})
		.sort((a, b) => b.createdAt - a.createdAt);

	$: groupedHighlights = filteredHighlights.reduce<Record<string, Highlight[]>>((acc, item) => {
		acc[item.bookId] = acc[item.bookId] ?? [];
		acc[item.bookId].push(item);
		return acc;
	}, {});

	onMount(() => {
		void loadHighlights();
	});
</script>

<main class="highlights-page">
	<!-- Header -->
	<header class="page-header">
		<a href="/" class="back-link">
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M10 12L6 8l4-4" />
			</svg>
			Library
		</a>
	</header>

	<header class="highlights-header">
		<div class="header-content">
			<h1 class="highlights-title">Your Highlights</h1>
			{#if highlights.length > 0}
				<p class="highlights-count">{highlights.length} {highlights.length === 1 ? 'highlight' : 'highlights'} across {books.length} {books.length === 1 ? 'book' : 'books'}</p>
			{/if}
		</div>
		{#if highlights.length > 0}
			<div class="header-actions">
				<button type="button" class="export-btn" on:click={exportMarkdown} disabled={!filteredHighlights.length}>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
						<path d="M8 2v8M4 6l4 4 4-4M2 12v2h12v-2" />
					</svg>
					Markdown
				</button>
				<button type="button" class="export-btn primary" on:click={exportPdf} disabled={!filteredHighlights.length}>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
						<path d="M8 2v8M4 6l4 4 4-4M2 12v2h12v-2" />
					</svg>
					PDF
				</button>
			</div>
		{/if}
	</header>

	{#if isLoading}
		<div class="state loading">
			<div class="loading-dot"></div>
			Loading your highlights…
		</div>
	{:else if error}
		<div class="state error">{error}</div>
	{:else if highlights.length === 0}
		<!-- Empty State -->
		<div class="empty-state">
			<div class="empty-icon">
				<svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">
					<rect x="12" y="8" width="40" height="48" rx="2" />
					<path d="M20 20h24M20 28h24M20 36h16" />
					<path d="M18 16l6 4-6 4" stroke-width="2" fill="var(--highlight-active)" />
				</svg>
			</div>
			<h2 class="empty-title">No highlights yet</h2>
			<p class="empty-text">Select text while reading to save passages, add notes, and build your personal knowledge base.</p>
			<a href="/" class="empty-btn">Browse your library</a>
		</div>
	{:else}
		<!-- Filters -->
		<section class="filters">
			<div class="filter-group">
				<label for="bookFilter">
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
						<rect x="2" y="2" width="10" height="12" rx="1" />
						<path d="M5 5h4M5 8h4" />
					</svg>
					Book
				</label>
				<select id="bookFilter" bind:value={selectedBookId}>
					<option value="all">All books</option>
					{#each books as book}
						<option value={book.id}>{book.title}</option>
					{/each}
				</select>
			</div>
			<div class="filter-group search">
				<label for="query">
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
						<circle cx="6" cy="6" r="4" />
						<path d="M9 9l3 3" />
					</svg>
					Search
				</label>
				<input id="query" type="text" placeholder="Find quotes or notes..." bind:value={query} />
			</div>
		</section>

		<!-- Results -->
		{#if filteredHighlights.length === 0}
			<div class="state empty">No highlights match your search.</div>
		{:else}
			<div class="results-summary">
				{#if selectedBookId !== 'all' || query.trim()}
					<span>{filteredHighlights.length} {filteredHighlights.length === 1 ? 'result' : 'results'}</span>
				{/if}
			</div>

			{#each Object.values(groupedHighlights) as group}
				<section class="book-group">
					<header class="book-header">
						<div class="book-info">
							<h2>{group[0].bookTitle}</h2>
							<span class="book-meta">
								<span class="book-author">{group[0].author}</span>
								<span class="separator">·</span>
								<span class="highlight-count">{group.length} {group.length === 1 ? 'highlight' : 'highlights'}</span>
							</span>
						</div>
						<a href={`/read?bookId=${group[0].bookId}`} class="book-link">
							Continue reading
							<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M5 3l5 4-5 4" />
							</svg>
						</a>
					</header>

					<div class="highlight-list">
						{#each group as highlight (highlight.id)}
							<article class="highlight-card">
								<div class="highlight-accent"></div>
								<div class="highlight-content">
									<div class="highlight-meta">
										<span class="chapter">{highlight.chapterTitle}</span>
										<span class="date">{formatDate(highlight.createdAt)}</span>
									</div>
									<blockquote class="highlight-quote">{highlight.selectedText}</blockquote>

									{#if editingId === highlight.id}
										<textarea rows="3" class="note-input" bind:value={noteDraft} placeholder="Add your thoughts..."></textarea>
										<div class="card-actions">
											<button type="button" class="action-btn" on:click={cancelEdit}>Cancel</button>
											<button type="button" class="action-btn primary" on:click={() => saveNote(highlight)}>
												Save note
											</button>
										</div>
									{:else}
										{#if highlight.note}
											<div class="note">
												<span class="note-label">Note</span>
												<p class="note-text">{highlight.note}</p>
											</div>
										{/if}
										<div class="card-actions">
											<button type="button" class="action-btn" on:click={() => startEdit(highlight)}>
												{highlight.note ? 'Edit note' : 'Add note'}
											</button>
											<a class="action-btn" href={`/read?bookId=${highlight.bookId}&highlightId=${highlight.id}`}>
												View in book
											</a>
											<button type="button" class="action-btn danger" on:click={() => removeHighlight(highlight)}>
												Remove
											</button>
										</div>
									{/if}
								</div>
							</article>
						{/each}
					</div>
				</section>
			{/each}
		{/if}
	{/if}
</main>

<style>
	.highlights-page {
		min-height: 100vh;
		padding: var(--space-6) var(--space-6) var(--space-20);
		max-width: 900px;
		margin: 0 auto;
	}

	/* Page Header */
	.page-header {
		margin-bottom: var(--space-6);
		animation: fade-slide-in 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes fade-slide-in {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-secondary);
		text-decoration: none;
		padding: var(--space-2) var(--space-3);
		margin-left: calc(-1 * var(--space-3));
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.back-link:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
		text-decoration: none;
	}

	/* Highlights Header */
	.highlights-header {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
		align-items: flex-end;
		justify-content: space-between;
		margin-bottom: var(--space-8);
		padding-bottom: var(--space-6);
		border-bottom: 1px solid var(--border);
		animation: fade-slide-in 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.05s backwards;
	}

	.header-content {
		flex: 1;
	}

	.highlights-title {
		font-family: var(--font-reading);
		font-size: 2.25rem;
		font-weight: 500;
		letter-spacing: -0.025em;
		color: var(--text-primary);
		line-height: 1.2;
	}

	.highlights-count {
		color: var(--text-tertiary);
		margin-top: var(--space-2);
		font-size: var(--text-sm);
	}

	.header-actions {
		display: flex;
		gap: var(--space-2);
	}

	.export-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: 8px 14px;
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-secondary);
		background: transparent;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.export-btn:hover:not(:disabled) {
		color: var(--text-primary);
		background: var(--bg-secondary);
		border-color: var(--border-hover);
	}

	.export-btn.primary {
		background: var(--accent);
		border-color: var(--accent);
		color: white;
	}

	.export-btn.primary:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.export-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* States */
	.state {
		padding: var(--space-10) var(--space-6);
		border-radius: var(--radius-lg);
		background: var(--bg-secondary);
		color: var(--text-tertiary);
		text-align: center;
		font-size: var(--text-sm);
	}

	.state.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
	}

	.loading-dot {
		width: 6px;
		height: 6px;
		background: var(--text-tertiary);
		border-radius: 50%;
		animation: pulse 1.2s ease-in-out infinite;
	}

	.state.error {
		color: #b91c1c;
		background: rgba(185, 28, 28, 0.06);
	}

	.state.empty {
		border: 1px dashed var(--border);
		background: transparent;
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: var(--space-16) var(--space-6);
		max-width: 360px;
		margin: 0 auto;
	}

	.empty-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100px;
		height: 100px;
		margin-bottom: var(--space-6);
		color: var(--text-tertiary);
		opacity: 0.5;
	}

	.empty-title {
		font-family: var(--font-reading);
		font-size: var(--text-xl);
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: var(--space-2);
	}

	.empty-text {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		line-height: 1.6;
		margin-bottom: var(--space-6);
	}

	.empty-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: 12px 24px;
		font-size: var(--text-sm);
		font-weight: 500;
		color: white;
		background: var(--accent);
		border-radius: var(--radius-md);
		text-decoration: none;
		transition: all var(--transition-fast);
	}

	.empty-btn:hover {
		background: var(--accent-hover);
		text-decoration: none;
	}

	/* Filters */
	.filters {
		display: flex;
		gap: var(--space-3);
		margin-bottom: var(--space-6);
		padding: var(--space-4);
		background: var(--bg-secondary);
		border-radius: var(--radius-lg);
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.filter-group.search {
		flex: 1;
	}

	.filter-group label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-tertiary);
		font-weight: 500;
	}

	.filter-group input,
	.filter-group select {
		padding: 10px 14px;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		background: var(--bg-primary);
		color: var(--text-primary);
		font-size: var(--text-sm);
		transition: border-color var(--transition-fast);
	}

	.filter-group select {
		min-width: 180px;
	}

	.filter-group input:focus,
	.filter-group select:focus {
		border-color: var(--text-tertiary);
		outline: none;
	}

	/* Results Summary */
	.results-summary {
		font-size: var(--text-sm);
		color: var(--text-tertiary);
		margin-bottom: var(--space-6);
		min-height: 20px;
	}

	/* Book Groups */
	.book-group {
		margin-bottom: var(--space-10);
	}

	.book-header {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}

	.book-info h2 {
		font-family: var(--font-reading);
		font-weight: 500;
		font-size: var(--text-lg);
		letter-spacing: -0.01em;
		color: var(--text-primary);
		margin-bottom: var(--space-1);
	}

	.book-meta {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--text-tertiary);
	}

	.separator {
		opacity: 0.5;
	}

	.book-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-secondary);
		text-decoration: none;
		padding: 6px 12px;
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.book-link svg {
		transition: transform var(--transition-fast);
	}

	.book-link:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
		text-decoration: none;
	}

	.book-link:hover svg {
		transform: translateX(2px);
	}

	/* Highlight Cards */
	.highlight-list {
		display: grid;
		gap: var(--space-4);
	}

	.highlight-card {
		display: grid;
		grid-template-columns: 3px 1fr;
		gap: 0;
		border-radius: var(--radius-lg);
		background: var(--bg-secondary);
		overflow: hidden;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		animation: card-enter 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
	}

	.highlight-card:nth-child(1) { animation-delay: 0ms; }
	.highlight-card:nth-child(2) { animation-delay: 30ms; }
	.highlight-card:nth-child(3) { animation-delay: 60ms; }
	.highlight-card:nth-child(4) { animation-delay: 90ms; }
	.highlight-card:nth-child(5) { animation-delay: 120ms; }

	@keyframes card-enter {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.highlight-card:hover {
		background: var(--bg-tertiary);
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}

	.highlight-accent {
		background: linear-gradient(
			180deg,
			var(--highlight-active) 0%,
			var(--highlight-hover) 100%
		);
	}

	.highlight-content {
		padding: var(--space-6);
	}

	.highlight-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 11px;
		letter-spacing: 0.02em;
		color: var(--text-tertiary);
		margin-bottom: var(--space-4);
	}

	.chapter {
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.highlight-quote {
		position: relative;
		font-family: var(--font-reading);
		font-size: 1.0625rem;
		line-height: 1.8;
		margin-bottom: var(--space-5);
		color: var(--text-primary);
		padding-left: var(--space-6);
	}

	.highlight-quote::before {
		content: '"';
		position: absolute;
		left: 0;
		top: -0.15em;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 2.75em;
		line-height: 1;
		color: var(--highlight-active);
		opacity: 0.6;
	}

	/* Notes */
	.note {
		margin-bottom: var(--space-4);
		padding: var(--space-3) var(--space-4);
		background: var(--bg-primary);
		border-radius: var(--radius-md);
		border-left: 3px solid var(--highlight-active);
	}

	.note-label {
		display: block;
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-tertiary);
		margin-bottom: var(--space-2);
	}

	.note-text {
		color: var(--text-secondary);
		font-size: var(--text-sm);
		line-height: 1.6;
		white-space: pre-wrap;
	}

	.note-input {
		width: 100%;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: var(--space-3) var(--space-4);
		background: var(--bg-primary);
		color: var(--text-primary);
		margin-bottom: var(--space-3);
		font-size: var(--text-sm);
		line-height: 1.6;
		resize: vertical;
	}

	.note-input:focus {
		border-color: var(--highlight-active);
		outline: none;
	}

	/* Card Actions */
	.card-actions {
		display: flex;
		gap: var(--space-1);
		flex-wrap: wrap;
		margin-top: var(--space-2);
	}

	.action-btn {
		padding: 6px 12px;
		border-radius: var(--radius-md);
		font-size: var(--text-xs);
		font-weight: 500;
		border: none;
		background: transparent;
		color: var(--text-secondary);
		text-decoration: none;
		transition: all var(--transition-fast);
	}

	.action-btn:hover {
		background: var(--bg-primary);
		color: var(--text-primary);
		text-decoration: none;
	}

	.action-btn.primary {
		background: var(--accent);
		color: white;
	}

	.action-btn.primary:hover {
		background: var(--accent-hover);
	}

	.action-btn.danger:hover {
		color: #b91c1c;
		background: rgba(185, 28, 28, 0.08);
	}

	/* Animations */
	@keyframes pulse {
		0%, 100% { opacity: 0.4; }
		50% { opacity: 1; }
	}

	/* Responsive */
	@media (max-width: 700px) {
		.highlights-page {
			padding: var(--space-4) var(--space-4) var(--space-12);
		}

		.highlights-header {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-4);
		}

		.header-actions {
			width: 100%;
		}

		.export-btn {
			flex: 1;
			justify-content: center;
		}

		.highlights-title {
			font-size: 1.5rem;
		}

		.filters {
			flex-direction: column;
		}

		.filter-group select {
			min-width: 100%;
		}

		.book-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.book-link {
			width: 100%;
			justify-content: center;
			background: var(--bg-secondary);
			padding: 10px;
		}

		.highlight-content {
			padding: var(--space-4);
		}
	}
</style>
