<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { TocItem } from '$lib/types/book';

	export let toc: TocItem[] = [];
	export let currentIndex = 0;

	const dispatch = createEventDispatcher();

	const goTo = (index: number) => dispatch('navigate', { index });
</script>

<nav class="space-y-2">
	{#each toc as item}
		<button
			type="button"
			class="block w-full text-left text-sm transition"
			class:text-[var(--accent)]={item.chapterIndex === currentIndex}
			onclick={() => goTo(item.chapterIndex)}
			aria-current={item.chapterIndex === currentIndex ? 'true' : undefined}
		>
			{item.label}
		</button>
	{/each}
</nav>
