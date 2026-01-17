<script lang="ts">
	import { collections, getBooksByCollection, type CuratedBook, type CollectionId } from '$lib/data/curatedBooks';
	import BookCover from './BookCover.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		selectBook: CuratedBook;
	}>();

	// Show these collections as separate shelves
	const shelfCollections: CollectionId[] = [
		'bucket-list',
		'start-here',
		'world-classics',
		'short',
		'short-stories',
		'drama',
		'adventure',
		'mystery',
		'gothic',
		'speculative',
		'political-dystopia',
		'love-society',
		'philosophy',
		'poetry',
		'indian-classics'
	];

	function handleBookClick(book: CuratedBook) {
		dispatch('selectBook', book);
	}

	function getCollectionData(id: CollectionId) {
		const collection = collections.find(c => c.id === id);
		const books = getBooksByCollection(id);
		return { collection, books };
	}
</script>

<section class="curated-shelves">
	<header class="shelves-header">
		<div class="header-decoration"></div>
		<h2 class="shelves-title">Curated Classics</h2>
		<p class="shelves-subtitle">Timeless literature, beautifully presented</p>
		<div class="header-decoration"></div>
	</header>

	{#each shelfCollections as collectionId}
		{@const { collection, books } = getCollectionData(collectionId)}
		{#if collection && books.length > 0}
			<div class="shelf">
				<header class="shelf-header">
					<div class="shelf-title-wrapper">
						<span class="shelf-number">{shelfCollections.indexOf(collectionId) + 1}</span>
						<div class="shelf-title-content">
							<h3 class="shelf-title">{collection.name}</h3>
							<span class="shelf-desc">{collection.description}</span>
						</div>
					</div>
				</header>
				<div class="books-scroll">
					<div class="books-row">
						{#each books as book (book.id)}
							<button
								class="book-card"
								on:click={() => handleBookClick(book)}
							>
								<div class="cover-wrapper">
									<BookCover
										cover={book.cover}
										title={book.title}
										author={book.author}
										width={160}
										height={230}
									/>
									<div class="cover-shine"></div>
								</div>
								<div class="book-meta">
									<h4 class="book-title">{book.title}</h4>
									<span class="book-author">{book.author}</span>
								</div>
							</button>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	{/each}
</section>

<style>
	.curated-shelves {
		padding: 3rem 0 4rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.shelves-header {
		text-align: center;
		margin-bottom: 4rem;
		padding: 0 2rem;
	}

	.header-decoration {
		width: 60px;
		height: 1px;
		background: linear-gradient(90deg, transparent, var(--border), transparent);
		margin: 0 auto 1.5rem;
	}

	.header-decoration:last-child {
		margin: 1.5rem auto 0;
	}

	.shelves-title {
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 2rem;
		font-weight: 400;
		color: var(--text-primary);
		margin: 0 0 0.5rem 0;
		letter-spacing: 0.02em;
	}

	.shelves-subtitle {
		font-size: 1rem;
		color: var(--text-secondary);
		margin: 0;
		font-style: italic;
	}

	.shelf {
		margin-bottom: 4rem;
	}

	.shelf-header {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 2rem;
		margin-bottom: 2rem;
	}

	.shelf-title-wrapper {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}

	.shelf-number {
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 2.5rem;
		font-weight: 300;
		color: var(--text-tertiary);
		opacity: 0.4;
		line-height: 1;
	}

	.shelf-title-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.shelf-title {
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 1.25rem;
		font-weight: 500;
		color: var(--text-primary);
		margin: 0;
		letter-spacing: 0.01em;
	}

	.shelf-desc {
		font-size: 0.875rem;
		color: var(--text-tertiary);
		font-style: italic;
	}

	.books-scroll {
		overflow-x: auto;
		padding: 1rem 0 1.5rem;
		scrollbar-width: thin;
		scrollbar-color: var(--border) transparent;
	}

	.books-scroll::-webkit-scrollbar {
		height: 6px;
	}

	.books-scroll::-webkit-scrollbar-track {
		background: transparent;
	}

	.books-scroll::-webkit-scrollbar-thumb {
		background: var(--border);
		border-radius: 3px;
	}

	.books-row {
		display: flex;
		gap: 2rem;
		padding: 0 2rem;
		width: max-content;
		justify-content: center;
		min-width: 100%;
	}

	.book-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0;
		width: 160px;
		text-align: center;
		transition: transform 0.3s ease;
	}

	.book-card:hover {
		transform: translateY(-8px);
	}

	.cover-wrapper {
		position: relative;
		border-radius: 4px;
		overflow: hidden;
	}

	.cover-shine {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			120deg,
			transparent 0%,
			transparent 40%,
			rgba(255, 255, 255, 0.1) 50%,
			transparent 60%,
			transparent 100%
		);
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.book-card:hover .cover-shine {
		opacity: 1;
	}

	.book-meta {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		width: 100%;
		padding: 0 0.25rem;
	}

	.book-title {
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--text-primary);
		line-height: 1.3;
		margin: 0;
		line-clamp: 2;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		transition: color 0.2s ease;
	}

	.book-card:hover .book-title {
		color: var(--accent);
	}

	.book-author {
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	@media (max-width: 768px) {
		.curated-shelves {
			padding: 2rem 0 3rem;
		}

		.shelves-header {
			margin-bottom: 3rem;
		}

		.shelves-title {
			font-size: 1.5rem;
		}

		.shelf {
			margin-bottom: 3rem;
		}

		.shelf-header {
			justify-content: flex-start;
			padding: 0 1.5rem;
		}

		.shelf-number {
			font-size: 2rem;
		}

		.shelf-title {
			font-size: 1.1rem;
		}

		.books-row {
			gap: 1.5rem;
			padding: 0 1.5rem;
			justify-content: flex-start;
		}

		.book-card {
			width: 140px;
		}
	}

	@media (max-width: 480px) {
		.shelf-header {
			padding: 0 1rem;
		}

		.books-row {
			gap: 1rem;
			padding: 0 1rem;
		}

		.book-card {
			width: 120px;
		}

		.book-title {
			font-size: 0.85rem;
		}

		.book-author {
			font-size: 0.75rem;
		}
	}
</style>
