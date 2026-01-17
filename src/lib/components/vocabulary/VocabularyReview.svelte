<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ReviewRating, VocabularyEntry } from '$lib/types/vocabulary';

	export let entries: VocabularyEntry[] = [];

	const dispatch = createEventDispatcher<{
		review: { entry: VocabularyEntry; rating: ReviewRating };
		exit: void;
	}>();

	let index = 0;
	let reveal = false;

	$: current = entries[index];

	const handleReveal = () => {
		reveal = true;
	};

	const handleRating = (rating: ReviewRating) => {
		if (!current) return;
		dispatch('review', { entry: current, rating });
		reveal = false;
		index += 1;
	};

	const exitReview = () => {
		dispatch('exit');
		reveal = false;
		index = 0;
	};
</script>

<section class="review-card">
	<header class="review-header">
		<h2>Review</h2>
		<button type="button" class="exit-btn" on:click={exitReview}>Exit</button>
	</header>

	{#if entries.length === 0}
		<p class="empty-text">No words ready for review.</p>
	{:else if !current}
		<p class="empty-text">You are all caught up.</p>
	{:else}
		<div class="review-body">
			<p class="count">Card {index + 1} of {entries.length}</p>
			<h3 class="word">{current.word}</h3>
			<p class="context">{current.context}</p>

			{#if reveal}
				<div class="definition-block">
					<p class="definition">{current.definition}</p>
					{#if current.etymology}
						<p class="etymology">Etymology: {current.etymology}</p>
					{/if}
				</div>
				<div class="review-actions">
					<button type="button" class="rating-btn" on:click={() => handleRating('again')}>Again</button>
					<button type="button" class="rating-btn" on:click={() => handleRating('hard')}>Hard</button>
					<button type="button" class="rating-btn primary" on:click={() => handleRating('good')}>Good</button>
					<button type="button" class="rating-btn" on:click={() => handleRating('easy')}>Easy</button>
				</div>
			{:else}
				<button type="button" class="reveal-btn" on:click={handleReveal}>Reveal meaning</button>
			{/if}
		</div>
	{/if}
</section>

<style>
	.review-card {
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		padding: var(--space-5);
		min-height: 320px;
	}

	.review-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-4);
	}

	.exit-btn {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 4px 10px;
	}

	.empty-text {
		color: var(--text-tertiary);
		font-size: var(--text-sm);
	}

	.count {
		font-size: var(--text-xs);
		color: var(--text-tertiary);
		margin-bottom: var(--space-3);
	}

	.word {
		font-size: 26px;
		margin: 0 0 var(--space-3);
	}

	.context {
		color: var(--text-secondary);
		font-size: var(--text-sm);
		line-height: 1.6;
		margin-bottom: var(--space-4);
	}

	.definition-block {
		margin-bottom: var(--space-4);
	}

	.definition {
		font-size: var(--text-base);
		margin: 0 0 var(--space-2);
	}

	.etymology {
		font-size: var(--text-sm);
		color: var(--text-tertiary);
		margin: 0;
	}

	.reveal-btn {
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 8px 16px;
		font-size: var(--text-sm);
	}

	.review-actions {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
		gap: var(--space-2);
	}

	.rating-btn {
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 8px 10px;
		font-size: var(--text-xs);
	}

	.rating-btn.primary {
		background: var(--text-primary);
		color: var(--bg-primary);
		border-color: var(--text-primary);
	}
</style>
