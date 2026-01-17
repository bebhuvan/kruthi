<script lang="ts">
	import { settingsStore } from '$lib/stores/settingsStore';

	const toggleTheme = () => settingsStore.toggleTheme();
</script>

<button
	type="button"
	class="rounded-full border border-[var(--border)] px-3 py-1 text-sm transition hover:border-[var(--accent)]"
	onclick={toggleTheme}
	aria-pressed={$settingsStore.theme === 'dark'}
>
	{$settingsStore.theme === 'dark'
		? 'Dark'
		: $settingsStore.theme === 'sepia'
			? 'Sepia'
			: 'Light'}
</button>
