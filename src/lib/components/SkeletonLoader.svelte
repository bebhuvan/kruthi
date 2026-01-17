<script lang="ts">
	export let lines: number = 5;
	export let variant: 'text' | 'title' | 'paragraph' = 'paragraph';
</script>

<div class="skeleton-loader" class:title={variant === 'title'}>
	{#if variant === 'title'}
		<div class="skeleton-line title-line"></div>
		<div class="skeleton-line subtitle-line"></div>
	{:else}
		{#each Array(lines) as _, i}
			<div
				class="skeleton-line"
				style="width: {variant === 'text' ? '100%' : (85 + Math.random() * 15)}%; animation-delay: {i * 0.1}s"
			></div>
		{/each}
	{/if}
</div>

<style>
	.skeleton-loader {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-4) 0;
	}

	.skeleton-loader.title {
		gap: var(--space-2);
		margin-bottom: var(--space-6);
	}

	.skeleton-line {
		height: 1em;
		background: linear-gradient(
			90deg,
			var(--bg-tertiary) 25%,
			var(--bg-secondary) 50%,
			var(--bg-tertiary) 75%
		);
		background-size: 200% 100%;
		border-radius: var(--radius-sm);
		animation: shimmer 1.5s ease-in-out infinite;
	}

	.title-line {
		width: 60%;
		height: 2em;
	}

	.subtitle-line {
		width: 35%;
		height: 1em;
		opacity: 0.6;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	/* Respect reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.skeleton-line {
			animation: none;
			background: var(--bg-tertiary);
		}
	}
</style>
