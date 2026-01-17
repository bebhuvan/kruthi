<script lang="ts">
	import { settingsStore } from '$lib/stores/settingsStore';

	const options: { value: number; label: string }[] = [
		{ value: 16, label: 'A-' },
		{ value: 19, label: 'A' },
		{ value: 22, label: 'A+' }
	];

	const setFontSize = (size: number) => settingsStore.setFontSize(size);
</script>

<div class="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2 py-1">
	{#each options as option}
		<button
			type="button"
			class="rounded-full px-2 py-0.5 text-sm transition"
			class:text-[var(--accent)]={$settingsStore.fontSize === option.value}
			on:click={() => setFontSize(option.value)}
			aria-pressed={$settingsStore.fontSize === option.value}
		>
			{option.label}
		</button>
	{/each}
</div>
