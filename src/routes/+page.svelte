<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { bookStore } from '$lib/stores/bookStore';
	import { adapter, type BookMeta, type PickedEpubFile } from '$lib/platform';
	import CuratedShelf from '$lib/components/CuratedShelf.svelte';
	import GenerativeCover from '$lib/components/GenerativeCover.svelte';
	import type { CuratedBook } from '$lib/data/curatedBooks';
	import { downloadCuratedBook, getCuratedBookId, type DownloadStatus } from '$lib/services/curatedDownload';

	let books: BookMeta[] = [];
	let isLoading = false;
	let isDragging = false;
	let error = '';
	let fileInput: HTMLInputElement;
	let downloadingBook: CuratedBook | null = null;
	let downloadStatus: DownloadStatus = { state: 'idle' };

	const refreshBooks = async () => {
		books = await adapter.listBooks();
	};

	const handleBookLoad = async (loader: () => Promise<{ id: string }>) => {
		isLoading = true;
		error = '';
		try {
			const parsed = await loader();
			await refreshBooks();
			await goto(`/read?bookId=${parsed.id}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load book.';
		} finally {
			isLoading = false;
		}
	};

	const handleFile = async (file: File) => {
		if (!file.name.toLowerCase().endsWith('.epub')) {
			error = 'Please select an EPUB file.';
			return;
		}

		await handleBookLoad(() => bookStore.loadFromFile(file));
	};

	const handlePickedFile = async (picked: PickedEpubFile) => {
		if (!picked.name.toLowerCase().endsWith('.epub')) {
			error = 'Please select an EPUB file.';
			return;
		}
		await handleBookLoad(() => bookStore.loadFromBytes(picked.bytes, picked.name));
	};

	const isNativeApp = (): boolean => {
		return !!(
			typeof window !== 'undefined' &&
			((window as unknown as { __TAURI__?: unknown }).__TAURI__ ||
			 (window as unknown as { Capacitor?: unknown }).Capacitor)
		);
	};

	const openBookPicker = async () => {
		if (isNativeApp()) {
			try {
				const picked = await adapter.pickEpubFile();
				if (picked) {
					await handlePickedFile(picked);
				}
			} catch (err) {
				console.error('Native file picker error:', err);
				error = err instanceof Error ? err.message : 'Failed to open file picker';
			}
			return;
		}
		fileInput.click();
	};

	const handleUpload = async (event: Event) => {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			await handleFile(file);
		}
		input.value = '';
	};

	const handleDrop = async (event: DragEvent) => {
		event.preventDefault();
		isDragging = false;
		const file = event.dataTransfer?.files[0];
		if (file) {
			await handleFile(file);
		}
	};

	const handleDragOver = (event: DragEvent) => {
		event.preventDefault();
		isDragging = true;
	};

	const handleDragLeave = (event: DragEvent) => {
		// Only handle if leaving the actual drop zone
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const x = event.clientX;
		const y = event.clientY;
		if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
			isDragging = false;
		}
	};

	const handleDeleteBook = async (e: Event, bookId: string) => {
		e.stopPropagation();
		if (confirm('Remove this book from your library?')) {
			await adapter.deleteBook(bookId);
			await refreshBooks();
		}
	};

	const formatDate = (timestamp?: number): string => {
		if (!timestamp) return '';
		const date = new Date(timestamp);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) return 'Today';
		if (days === 1) return 'Yesterday';
		if (days < 7) return `${days} days ago`;
		if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	};

	const handleSelectCuratedBook = async (event: CustomEvent<CuratedBook>) => {
		const book = event.detail;
		downloadingBook = book;
		downloadStatus = { state: 'downloading', progress: 0 };
		error = '';

		try {
			const bookId = await downloadCuratedBook(book, (status) => {
				downloadStatus = status;
			});
			await refreshBooks();
			await goto(`/read?bookId=${bookId}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to download book.';
		} finally {
			downloadingBook = null;
			downloadStatus = { state: 'idle' };
		}
	};

	onMount(() => {
		void refreshBooks();
	});
</script>

<svelte:body
	on:dragover={handleDragOver}
	on:dragleave={handleDragLeave}
	on:drop={handleDrop}
/>

<div class="library" class:dragging={isDragging}>
	<input
		bind:this={fileInput}
		type="file"
		accept=".epub"
		class="sr-only"
		on:change={handleUpload}
		disabled={isLoading}
	/>

	<!-- Header -->
	<header class="header">
		<div class="brand">
		<h1 class="logo">Kruthi</h1>
			<p class="tagline">Your personal library</p>
		</div>
		<div class="header-actions">
			<a href="/highlights" class="nav-link">
				Highlights
			</a>
			<a href="/vocabulary" class="nav-link">
				Vocabulary
			</a>
			<a href="/settings" class="nav-link" aria-label="Settings">
				Settings
			</a>
		</div>
	</header>

	<main class="main">
		<!-- Your Books Section (at top) -->
		<div class="main-content">
			{#if error}
				<p class="error-message">{error}</p>
			{/if}

			{#if books.length === 0}
				<!-- Your Library - Empty State -->
				<section class="library-section empty-library">
					<div class="empty-state">
						<div class="empty-illustration">
							<svg width="120" height="120" viewBox="0 0 120 120" fill="none">
								<!-- Stacked books illustration -->
								<rect x="25" y="70" width="70" height="12" rx="2" fill="var(--bg-tertiary)" stroke="var(--border)" stroke-width="1.5"/>
								<rect x="30" y="58" width="60" height="12" rx="2" fill="var(--bg-secondary)" stroke="var(--border)" stroke-width="1.5"/>
								<rect x="35" y="46" width="50" height="12" rx="2" fill="var(--bg-tertiary)" stroke="var(--border)" stroke-width="1.5"/>
								<!-- Open book on top -->
								<path d="M60 30 L40 38 L40 58 L60 50 L80 58 L80 38 Z" fill="var(--bg-primary)" stroke="var(--text-tertiary)" stroke-width="1.5"/>
								<path d="M60 30 L60 50" stroke="var(--text-tertiary)" stroke-width="1"/>
								<path d="M45 42 L55 38" stroke="var(--text-tertiary)" stroke-width="0.75" opacity="0.5"/>
								<path d="M45 46 L55 42" stroke="var(--text-tertiary)" stroke-width="0.75" opacity="0.5"/>
								<path d="M65 38 L75 42" stroke="var(--text-tertiary)" stroke-width="0.75" opacity="0.5"/>
								<path d="M65 42 L75 46" stroke="var(--text-tertiary)" stroke-width="0.75" opacity="0.5"/>
								<!-- Decorative sparkles -->
								<circle cx="90" cy="35" r="2" fill="var(--highlight-active)" opacity="0.6"/>
								<circle cx="30" cy="40" r="1.5" fill="var(--highlight-active)" opacity="0.4"/>
								<circle cx="95" cy="55" r="1" fill="var(--highlight-active)" opacity="0.5"/>
							</svg>
						</div>
						<div class="empty-content">
							<h2 class="empty-title">Start your reading journey</h2>
							<p class="empty-text">
								Add your favorite EPUB books to build a personal library.
								Your books stay private, stored only in your browser.
							</p>
						</div>
						<div class="empty-actions">
							<button
								type="button"
								class="add-book-btn primary"
								on:click={openBookPicker}
								disabled={isLoading}
							>
								<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M9 4v10M4 9h10" />
								</svg>
								{#if isLoading}
									Adding book...
								{:else}
									Add your first book
								{/if}
							</button>
							<p class="drop-hint">or drop an EPUB file anywhere</p>
						</div>
					</div>
				</section>
			{:else}
				<!-- Library Section -->
				<section class="library-section">
					<header class="section-header">
						<div>
							<h2 class="section-title">Your Books</h2>
							<p class="section-subtitle">{books.length} {books.length === 1 ? 'book' : 'books'} in your library</p>
						</div>
						<button
							type="button"
							class="add-book-btn"
							on:click={openBookPicker}
							disabled={isLoading}
						>
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M8 3v10M3 8h10" />
							</svg>
							{#if isLoading}
								Adding...
							{:else}
								Add Book
							{/if}
						</button>
					</header>

					<div class="book-grid">
						{#each books as book, index (book.id)}
							<article class="book-card" style="animation-delay: {index * 50}ms">
								<button
									type="button"
									class="book-open"
									on:click={() => goto(`/read?bookId=${book.id}`)}
								>
									<div class="book-cover-wrap">
										<GenerativeCover
											title={book.title}
											author={book.author || ''}
											width={90}
											height={126}
										/>
									</div>
									<div class="book-info">
										<h3 class="book-title">{book.title}</h3>
										<p class="book-author">{book.author || 'Unknown Author'}</p>
										{#if book.addedAt}
											<p class="book-date">{formatDate(book.addedAt)}</p>
										{/if}
									</div>
								</button>
								<button
									type="button"
									class="book-remove"
									on:click={(e) => handleDeleteBook(e, book.id)}
									aria-label="Remove from library"
								>
									<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
										<path d="M11 3L3 11M3 3l8 8" />
									</svg>
								</button>
							</article>
						{/each}
					</div>
				</section>
			{/if}
		</div>

		<!-- Curated Classics Shelf -->
		<CuratedShelf on:selectBook={handleSelectCuratedBook} />

		<!-- Free Ebook Sources -->
		<section class="sources-section">
			<div class="sources-container">
				<header class="sources-header">
					<h2 class="sources-title">Explore the World's Greatest Books</h2>
					<p class="sources-subtitle">Download thousands of free public domain classics in EPUB format</p>
				</header>
				<div class="sources-grid">
					<a href="https://www.gutenberg.org" target="_blank" rel="noopener noreferrer" class="source-card">
						<div class="source-icon">
							<svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
								<rect x="6" y="4" width="20" height="24" rx="2" />
								<path d="M10 9h12M10 13h12M10 17h8" />
								<circle cx="22" cy="22" r="4" fill="var(--bg-primary)" />
								<path d="M22 20v4M20 22h4" stroke-width="2" />
							</svg>
						</div>
						<div class="source-info">
							<h3 class="source-name">Project Gutenberg</h3>
							<p class="source-description">70,000+ free ebooks, the oldest digital library</p>
						</div>
						<span class="source-arrow">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M6 4l4 4-4 4" />
							</svg>
						</span>
					</a>
					<a href="https://standardebooks.org" target="_blank" rel="noopener noreferrer" class="source-card">
						<div class="source-icon">
							<svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
								<path d="M16 4L6 8v12c0 4 10 8 10 8s10-4 10-8V8l-10-4z" />
								<path d="M12 14l3 3 5-5" stroke-width="2" />
							</svg>
						</div>
						<div class="source-info">
							<h3 class="source-name">Standard Ebooks</h3>
							<p class="source-description">Beautifully formatted, carefully proofread editions</p>
						</div>
						<span class="source-arrow">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M6 4l4 4-4 4" />
							</svg>
						</span>
					</a>
					<a href="https://en.wikisource.org/wiki/Main_Page" target="_blank" rel="noopener noreferrer" class="source-card">
						<div class="source-icon">
							<svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
								<circle cx="16" cy="16" r="11" />
								<path d="M16 5v22M5 16h22" />
								<path d="M8 10c2 2 5 3 8 3s6-1 8-3M8 22c2-2 5-3 8-3s6 1 8 3" />
							</svg>
						</div>
						<div class="source-info">
							<h3 class="source-name">Wikisource</h3>
							<p class="source-description">Community-curated library with multilingual texts</p>
						</div>
						<span class="source-arrow">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M6 4l4 4-4 4" />
							</svg>
						</span>
					</a>
					<a href="https://openlibrary.org" target="_blank" rel="noopener noreferrer" class="source-card">
						<div class="source-icon">
							<svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
								<path d="M6 6h20v20H6z" />
								<path d="M6 6l10 4 10-4" />
								<path d="M16 10v16" />
								<path d="M10 14h4M18 14h4M10 18h4M18 18h4" />
							</svg>
						</div>
						<div class="source-info">
							<h3 class="source-name">Open Library</h3>
							<p class="source-description">Millions of books from the Internet Archive</p>
						</div>
						<span class="source-arrow">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M6 4l4 4-4 4" />
							</svg>
						</span>
					</a>
				</div>
			</div>
		</section>
	</main>

	<!-- Download Overlay -->
	{#if downloadingBook}
		<div class="download-overlay">
			<div class="download-content">
				<div class="download-spinner"></div>
				<h3 class="download-title">{downloadingBook.title}</h3>
				<p class="download-status">
					{#if downloadStatus.state === 'downloading'}
						Downloading... {downloadStatus.progress}%
					{:else if downloadStatus.state === 'processing'}
						Processing book...
					{:else}
						Preparing...
					{/if}
				</p>
				{#if downloadStatus.state === 'downloading'}
					<div class="download-progress">
						<div class="download-progress-bar" style="width: {downloadStatus.progress}%"></div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Drop Overlay -->
	{#if isDragging}
		<div class="drop-overlay">
			<div class="drop-content">
				<div class="drop-icon">
					<svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
						<path d="M8 32l16 8 16-8M8 24l16 8 16-8M24 8v24M16 16l8-8 8 8" />
					</svg>
				</div>
				<p class="drop-text">Drop to add to library</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.library {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--bg-primary);
	}

	/* Header */
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-5) var(--space-8);
		border-bottom: 1px solid var(--border);
		background: var(--bg-primary);
		position: sticky;
		top: 0;
		z-index: 50;
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
	}

	.brand {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.logo {
		font-family: var(--font-reading);
		font-size: 1.375rem;
		font-weight: 600;
		color: var(--text-primary);
		letter-spacing: -0.03em;
	}

	.tagline {
		font-size: 11px;
		color: var(--text-tertiary);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.nav-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: 8px 14px;
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-secondary);
		text-decoration: none;
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.nav-link:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
		text-decoration: none;
	}

	.nav-link:active {
		transform: scale(0.98);
	}

	/* Main */
	.main {
		flex: 1;
		padding: var(--space-8) 0;
		width: 100%;
	}

	.main-content {
		max-width: 960px;
		width: 100%;
		margin: 0 auto var(--space-8);
		padding: 0 var(--space-6);
	}

	.error-message {
		margin-bottom: var(--space-4);
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-sm);
		color: #b91c1c;
		background: rgba(185, 28, 28, 0.08);
		border-radius: var(--radius-md);
	}

	/* Empty State */
	.empty-library {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 400px;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		max-width: 400px;
		padding: var(--space-8);
		animation: empty-enter 0.6s cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes empty-enter {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.empty-illustration {
		margin-bottom: var(--space-6);
		animation: float-gentle 4s ease-in-out infinite;
	}

	@keyframes float-gentle {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-8px); }
	}

	.empty-content {
		margin-bottom: var(--space-6);
	}

	.empty-title {
		font-family: var(--font-reading);
		font-size: 1.75rem;
		font-weight: 500;
		color: var(--text-primary);
		letter-spacing: -0.02em;
		margin-bottom: var(--space-3);
	}

	.empty-text {
		font-size: var(--text-base);
		line-height: 1.6;
		color: var(--text-secondary);
	}

	.empty-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
	}

	.drop-hint {
		font-size: var(--text-sm);
		color: var(--text-tertiary);
	}

	/* Library Section */
	.library-section {
		animation: fade-in 300ms ease-out;
	}

	.section-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-4);
		margin-bottom: var(--space-6);
		padding-bottom: var(--space-4);
		border-bottom: 1px solid var(--border);
	}

	.section-title {
		font-family: var(--font-reading);
		font-size: var(--text-xl);
		font-weight: 500;
		color: var(--text-primary);
		letter-spacing: -0.01em;
	}

	.section-subtitle {
		font-size: var(--text-sm);
		color: var(--text-tertiary);
		margin-top: var(--space-1);
	}

	.add-book-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: 12px 20px;
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-primary);
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.add-book-btn:hover:not(:disabled) {
		background: var(--bg-tertiary);
		border-color: var(--border-hover);
		transform: translateY(-1px);
	}

	.add-book-btn.primary {
		padding: 14px 28px;
		font-size: var(--text-base);
		color: white;
		background: var(--text-primary);
		border-color: var(--text-primary);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
	}

	.add-book-btn.primary:hover:not(:disabled) {
		background: var(--text-secondary);
		border-color: var(--text-secondary);
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}

	.add-book-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	/* Book Grid */
	.book-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--space-5);
	}

	.book-card {
		position: relative;
		background: var(--bg-secondary);
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		animation: card-enter 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
	}

	@keyframes card-enter {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.book-card:hover {
		background: var(--bg-tertiary);
		transform: translateY(-3px);
		box-shadow: var(--shadow-lg);
	}

	.book-open {
		display: flex;
		align-items: center;
		gap: var(--space-5);
		width: 100%;
		padding: var(--space-5);
		text-align: left;
	}

	.book-open:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.book-cover-wrap {
		flex-shrink: 0;
		transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.book-card:hover .book-cover-wrap {
		transform: scale(1.02);
	}

	.book-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.book-title {
		font-family: var(--font-reading);
		font-size: var(--text-base);
		font-weight: 500;
		color: var(--text-primary);
		line-height: 1.4;
		letter-spacing: -0.01em;
		margin-bottom: var(--space-1);
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.book-author {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		margin-bottom: var(--space-1);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.book-date {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
	}

	.book-remove {
		position: absolute;
		top: var(--space-2);
		right: var(--space-2);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		color: var(--text-tertiary);
		background: var(--bg-primary);
		border-radius: var(--radius-sm);
		opacity: 0;
		transition: all var(--transition-fast);
	}

	.book-card:hover .book-remove {
		opacity: 1;
	}

	.book-remove:hover {
		color: #b91c1c;
		background: rgba(185, 28, 28, 0.1);
	}

	/* Drop Overlay */
	.drop-overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-primary);
		opacity: 0.98;
		animation: fade-in 150ms ease-out;
	}

	.drop-content {
		text-align: center;
	}

	.drop-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 64px;
		height: 64px;
		margin: 0 auto var(--space-4);
		color: var(--text-secondary);
		animation: float 2s ease-in-out infinite;
	}

	.drop-text {
		font-family: var(--font-reading);
		font-size: var(--text-xl);
		color: var(--text-primary);
		letter-spacing: -0.01em;
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-6px); }
	}

	/* Download Overlay */
	.download-overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		animation: fade-in 150ms ease-out;
	}

	.download-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--space-8);
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		min-width: 280px;
		text-align: center;
	}

	.download-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--border);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: var(--space-4);
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.download-title {
		font-family: var(--font-reading);
		font-size: var(--text-lg);
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: var(--space-2);
	}

	.download-status {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		margin-bottom: var(--space-4);
	}

	.download-progress {
		width: 100%;
		height: 4px;
		background: var(--bg-tertiary);
		border-radius: 2px;
		overflow: hidden;
	}

	.download-progress-bar {
		height: 100%;
		background: var(--accent);
		border-radius: 2px;
		transition: width 0.2s ease;
	}

	/* Free Ebook Sources Section */
	.sources-section {
		padding: var(--space-12) 0 var(--space-16);
		background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
		border-top: 1px solid var(--border);
	}

	.sources-container {
		max-width: 960px;
		margin: 0 auto;
		padding: 0 var(--space-6);
	}

	.sources-header {
		text-align: center;
		margin-bottom: var(--space-10);
	}

	.sources-title {
		font-family: var(--font-reading);
		font-size: 1.75rem;
		font-weight: 500;
		color: var(--text-primary);
		letter-spacing: -0.02em;
		margin-bottom: var(--space-2);
	}

	.sources-subtitle {
		font-size: var(--text-base);
		color: var(--text-secondary);
		max-width: 400px;
		margin: 0 auto;
		line-height: 1.5;
	}

	.sources-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-4);
	}

	.source-card {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-5);
		background: var(--bg-primary);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		text-decoration: none;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.source-card:hover {
		border-color: var(--border-hover);
		box-shadow: var(--shadow-lg);
		transform: translateY(-2px);
		text-decoration: none;
	}

	.source-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		flex-shrink: 0;
		color: var(--text-secondary);
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.source-card:hover .source-icon {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}

	.source-info {
		flex: 1;
		min-width: 0;
	}

	.source-name {
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 2px;
	}

	.source-description {
		font-size: var(--text-sm);
		color: var(--text-tertiary);
		line-height: 1.4;
	}

	.source-arrow {
		flex-shrink: 0;
		color: var(--text-tertiary);
		opacity: 0;
		transform: translateX(-4px);
		transition: all var(--transition-fast);
	}

	.source-card:hover .source-arrow {
		opacity: 1;
		transform: translateX(0);
		color: var(--text-secondary);
	}

	/* Responsive - Tablet */
	@media (max-width: 768px) {
		.main-content {
			max-width: 100%;
		}

		.book-grid {
			grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		}

		.sources-grid {
			grid-template-columns: 1fr;
			gap: var(--space-3);
		}

		.sources-title {
			font-size: 1.5rem;
		}

		.sources-section {
			padding: var(--space-10) 0 var(--space-12);
		}
	}

	/* Responsive - Mobile */
	@media (max-width: 640px) {
		.header {
			padding: var(--space-4) var(--space-4);
		}

		.main {
			padding: var(--space-6) var(--space-4);
		}

		.section-header {
			flex-direction: column;
			gap: var(--space-3);
		}

		.add-book-btn {
			width: 100%;
			justify-content: center;
		}

		.book-grid {
			grid-template-columns: 1fr;
		}

		.book-remove {
			opacity: 1;
		}

		.sources-container {
			padding: 0 var(--space-4);
		}

		.sources-header {
			margin-bottom: var(--space-8);
		}

		.sources-title {
			font-size: 1.375rem;
		}

		.sources-subtitle {
			font-size: var(--text-sm);
		}

		.source-card {
			padding: var(--space-4);
			gap: var(--space-3);
		}

		.source-icon {
			width: 40px;
			height: 40px;
		}

		.source-icon svg {
			width: 24px;
			height: 24px;
		}

		.source-arrow {
			opacity: 1;
			transform: translateX(0);
		}
	}
</style>
