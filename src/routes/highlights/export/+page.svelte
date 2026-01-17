<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { page } from '$app/stores';
	import { adapter } from '$lib/platform';
	import type { Highlight } from '$lib/types/highlight';

	let highlights: Highlight[] = [];
	let isLoading = true;
	let error = '';

	const formatDate = (timestamp: number): string => {
		const date = new Date(timestamp);
		return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
	};

	const loadHighlights = async () => {
		error = '';
		try {
			const bookId = $page.url.searchParams.get('bookId');
			const query = $page.url.searchParams.get('q')?.trim().toLowerCase() ?? '';
			const items = await adapter.getAllHighlights();
			highlights = items
				.filter((item) => (bookId ? item.bookId === bookId : true))
				.filter((item) => {
					if (!query) return true;
					const target = `${item.selectedText} ${item.note ?? ''} ${item.chapterTitle}`.toLowerCase();
					return target.includes(query);
				})
				.sort((a, b) => b.createdAt - a.createdAt);
			await tick();
			window.setTimeout(() => window.print(), 300);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load highlights.';
		} finally {
			isLoading = false;
		}
	};

	$: groupedHighlights = highlights.reduce<Record<string, Highlight[]>>((acc, item) => {
		acc[item.bookId] = acc[item.bookId] ?? [];
		acc[item.bookId].push(item);
		return acc;
	}, {});

	onMount(() => {
		void loadHighlights();
	});
</script>

<main class="export-page">
	{#if isLoading}
		<p class="status">Preparing your export…</p>
	{:else if error}
		<p class="status">{error}</p>
	{:else if !highlights.length}
		<p class="status">No highlights to export.</p>
	{:else}
		<header class="export-header">
			<h1>Kruthi Highlights</h1>
			<p>Generated {formatDate(Date.now())}</p>
		</header>

		{#each Object.values(groupedHighlights) as group}
			<section class="export-book">
				<header>
					<h2>{group[0].bookTitle}</h2>
					<p class="author">{group[0].author}</p>
				</header>
				{#each group as highlight (highlight.id)}
					<article class="export-highlight">
						<div class="meta">
							<span>{highlight.chapterTitle}</span>
							<span>{formatDate(highlight.createdAt)}</span>
						</div>
						<blockquote>“{highlight.selectedText}”</blockquote>
						{#if highlight.note}
							<p class="note">{highlight.note}</p>
						{/if}
					</article>
				{/each}
			</section>
		{/each}
	{/if}
</main>

<style>
	.export-page {
		max-width: 740px;
		margin: 0 auto;
		padding: 48px 32px 72px;
		font-family: var(--font-reading);
		color: #1f1f1f;
	}

	.status {
		text-align: center;
		margin-top: 40vh;
		color: var(--text-secondary);
		font-family: var(--font-ui);
	}

	.export-header {
		border-bottom: 1px solid #ded9cf;
		padding-bottom: 16px;
		margin-bottom: 32px;
	}

	.export-header h1 {
		font-size: 2.1rem;
		font-weight: 500;
		margin-bottom: 6px;
	}

	.export-header p {
		font-family: var(--font-ui);
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: #6b6b6b;
	}

	.export-book {
		margin-bottom: 48px;
		page-break-inside: avoid;
	}

	.export-book h2 {
		font-size: 1.6rem;
		font-weight: 500;
		margin-bottom: 6px;
	}

	.export-book .author {
		font-family: var(--font-ui);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-size: 0.75rem;
		color: #7b7b7b;
		margin-bottom: 18px;
	}

	.export-highlight {
		padding: 18px 0;
		border-bottom: 1px solid #eee7db;
		page-break-inside: avoid;
	}

	.export-highlight:last-of-type {
		border-bottom: none;
	}

	.export-highlight .meta {
		display: flex;
		justify-content: space-between;
		font-family: var(--font-ui);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #8a8a8a;
		margin-bottom: 10px;
	}

	blockquote {
		margin: 0 0 12px;
		font-size: 1.05rem;
		line-height: 1.7;
	}

	.note {
		font-family: var(--font-ui);
		font-size: 0.95rem;
		color: #3a3a3a;
		white-space: pre-wrap;
		margin: 0;
		padding-left: 16px;
		border-left: 2px solid #ded9cf;
	}

	@media print {
		:global(body) {
			background: white !important;
			color: #1f1f1f;
		}

		.export-page {
			padding: 24px 24px 40px;
		}
	}

	@page {
		margin: 18mm 18mm 22mm;
	}
</style>
