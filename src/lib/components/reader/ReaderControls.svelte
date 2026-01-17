<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import ThemeToggle from '$lib/components/common/ThemeToggle.svelte';
	import FontSizeControl from '$lib/components/common/FontSizeControl.svelte';

	export let showTocButton = false;

	const dispatch = createEventDispatcher();

	const toggleToc = () => dispatch('toggleToc');
	const openChat = () => dispatch('openChat');
	const openSettings = () => dispatch('openSettings');
</script>

<div class="flex items-center gap-3">
	<button
		type="button"
		class="rounded-full border border-[var(--border)] px-3 py-1 text-sm transition hover:border-[var(--accent)]"
		onclick={openChat}
	>
		Ask
	</button>
	{#if showTocButton}
		<button
			type="button"
			class="rounded-full border border-[var(--border)] px-3 py-1 text-sm transition hover:border-[var(--accent)] md:hidden"
			onclick={toggleToc}
		>
			Chapters
		</button>
	{/if}
	<FontSizeControl />
	<ThemeToggle />
	<button
		type="button"
		class="rounded-full border border-[var(--border)] px-3 py-1 text-sm transition hover:border-[var(--accent)]"
		onclick={openSettings}
	>
		Settings
	</button>
</div>
