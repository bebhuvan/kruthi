<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Reader from '$lib/components/reader/Reader.svelte';
	import SkeletonLoader from '$lib/components/SkeletonLoader.svelte';
	import { bookStore } from '$lib/stores/bookStore';

	let bookId: string | null = null;
	let highlightId: string | null = null;
	let loading = false;
	let error = '';
	let lastLoadedId: string | null = null;
	let loadingProgress = 0;
	let loadingLabel = 'Preparing book...';

	$: bookId = $page.url.searchParams.get('bookId');
	$: highlightId = $page.url.searchParams.get('highlightId');

	const loadBook = async (id: string) => {
		if ($bookStore.status === 'ready' && $bookStore.book.id === id) {
			lastLoadedId = id;
			return;
		}
		loading = true;
		error = '';
		try {
			await bookStore.loadFromId(id);
			lastLoadedId = id;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load book.';
		} finally {
			loading = false;
		}
	};

	$: if (bookId && bookId !== lastLoadedId) {
		void loadBook(bookId);
	}

	$: if ($bookStore.status === 'loading') {
		loadingProgress = $bookStore.progress;
		if ($bookStore.stage === 'rendering' && $bookStore.totalChapters) {
			loadingLabel = `Rendering chapter ${$bookStore.chapterIndex ?? 0} of ${$bookStore.totalChapters}...`;
		} else if ($bookStore.stage === 'toc') {
			loadingLabel = 'Building table of contents...';
		} else if ($bookStore.stage === 'finalizing') {
			loadingLabel = 'Finalizing book...';
		} else {
			loadingLabel = 'Preparing book...';
		}
	} else {
		loadingProgress = 0;
		loadingLabel = 'Preparing book...';
	}
</script>

<main class="read-page">
	{#if !bookId}
		<div class="empty-state">
			<h1 class="empty-title">No book selected</h1>
			<p class="empty-text">Upload an EPUB to start reading.</p>
			<a href="/" class="back-btn">Go to library</a>
		</div>
	{:else if loading}
		<div class="skeleton-state">
			<div class="skeleton-header">
				<div class="skeleton-back"></div>
				<div class="skeleton-title-bar"></div>
				<div class="skeleton-actions"></div>
			</div>
			<div class="skeleton-content">
				<SkeletonLoader variant="title" />
				<SkeletonLoader lines={8} />
				<SkeletonLoader lines={6} />
				<SkeletonLoader lines={7} />
				{#if $bookStore.status === 'loading'}
					<div class="loading-progress">
						<div class="loading-bar" style="width: {loadingProgress}%"></div>
					</div>
					<p class="loading-label">{loadingLabel}</p>
				{/if}
			</div>
		</div>
	{:else if error}
		<div class="error-state">
			<p class="error-text">{error}</p>
			<a href="/" class="back-btn">Back to library</a>
		</div>
	{:else if $bookStore.status === 'ready'}
		{#key $bookStore.book.id}
			<Reader book={$bookStore.book} {highlightId} />
		{/key}
	{/if}
</main>

<style>
	.read-page {
		min-height: 100vh;
		background: var(--bg-primary);
	}

	.empty-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: var(--space-6);
		text-align: center;
	}

	.empty-title {
		font-family: var(--font-reading);
		font-size: 1.5rem;
		font-weight: 400;
		color: var(--text-primary);
		letter-spacing: -0.02em;
	}

	.empty-text {
		font-size: var(--text-base);
		color: var(--text-tertiary);
		margin-top: var(--space-2);
	}

	.back-btn {
		display: inline-block;
		margin-top: var(--space-8);
		padding: var(--space-3) var(--space-6);
		font-size: var(--text-sm);
		font-weight: 500;
		color: white;
		background: var(--accent);
		border-radius: var(--radius-md);
		text-decoration: none;
		transition: all var(--transition-fast);
	}

	.back-btn:hover {
		background: var(--accent-hover);
		text-decoration: none;
		transform: translateY(-1px);
	}

	.error-text {
		font-size: var(--text-base);
		color: #b91c1c;
		max-width: 400px;
		line-height: 1.5;
	}

	@keyframes pulse {
		0%, 100% { opacity: 0.3; }
		50% { opacity: 1; }
	}

	/* Skeleton Loading State */
	.skeleton-state {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		animation: fade-in 0.3s ease-out;
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.skeleton-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4) var(--space-6);
		border-bottom: 1px solid var(--border);
	}

	.skeleton-back {
		width: 80px;
		height: 32px;
		background: var(--bg-tertiary);
		border-radius: var(--radius-md);
	}

	.skeleton-title-bar {
		width: 200px;
		height: 24px;
		background: var(--bg-tertiary);
		border-radius: var(--radius-sm);
	}

	.skeleton-actions {
		width: 120px;
		height: 32px;
		background: var(--bg-tertiary);
		border-radius: var(--radius-md);
	}

	.skeleton-content {
		flex: 1;
		max-width: var(--max-width-reading, 38em);
		margin: 0 auto;
		padding: var(--space-12) var(--space-6);
		width: 100%;
	}

	.loading-progress {
		height: 8px;
		background: var(--bg-tertiary);
		border-radius: 999px;
		overflow: hidden;
		margin-top: var(--space-6);
	}

	.loading-bar {
		height: 100%;
		background: linear-gradient(90deg, var(--accent), var(--accent-hover));
		transition: width 0.2s ease-out;
	}

	.loading-label {
		margin-top: var(--space-3);
		font-size: var(--text-sm);
		color: var(--text-tertiary);
	}

	@media (max-width: 640px) {
		.skeleton-header {
			padding: var(--space-3) var(--space-4);
		}

		.skeleton-content {
			padding: var(--space-8) var(--space-4);
		}

		.skeleton-title-bar {
			display: none;
		}
	}
</style>
