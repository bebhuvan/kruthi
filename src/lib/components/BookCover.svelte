<script lang="ts">
	import type { CoverDesign } from '$lib/data/curatedBooks';

	export let cover: CoverDesign;
	export let title: string;
	export let author: string;
	export let width: number = 160;
	export let height: number = 230;

	// Fixed viewBox for consistent proportions
	const viewBoxWidth = 160;
	const viewBoxHeight = 230;

	// Split title into lines for better display
	function splitTitle(title: string, maxChars: number = 18): string[] {
		const words = title.split(' ');
		const lines: string[] = [];
		let currentLine = '';

		for (const word of words) {
			if ((currentLine + ' ' + word).trim().length <= maxChars) {
				currentLine = (currentLine + ' ' + word).trim();
			} else {
				if (currentLine) lines.push(currentLine);
				currentLine = word;
			}
		}
		if (currentLine) lines.push(currentLine);
		return lines.slice(0, 3); // Max 3 lines
	}

	// Get shortened author name
	function shortenAuthor(author: string): string {
		if (author.length <= 20) return author;
		const parts = author.split(' ');
		if (parts.length >= 2) {
			return `${parts[0][0]}. ${parts[parts.length - 1]}`;
		}
		return author.slice(0, 18) + '...';
	}

	$: titleLines = splitTitle(title);
	$: shortAuthor = shortenAuthor(author);
</script>

<svg
	{width}
	{height}
	viewBox="0 0 {viewBoxWidth} {viewBoxHeight}"
	class="book-cover"
	role="img"
	aria-label="{title} by {author}"
>
	<defs>
		{#if cover.bgColorEnd}
			<linearGradient id="bg-grad-{cover.letter}-{title.length}" x1="0%" y1="0%" x2="0%" y2="100%">
				<stop offset="0%" stop-color={cover.bgColor} />
				<stop offset="100%" stop-color={cover.bgColorEnd} />
			</linearGradient>
		{/if}
		<!-- Subtle noise texture -->
		<filter id="noise-{cover.letter}" x="0%" y="0%" width="100%" height="100%">
			<feTurbulence baseFrequency="0.9" numOctaves="4" result="noise" />
			<feColorMatrix type="saturate" values="0" />
			<feBlend in="SourceGraphic" in2="noise" mode="multiply" result="blend" />
			<feComposite in="blend" in2="SourceGraphic" operator="in" />
		</filter>
	</defs>

	<!-- Background -->
	{#if cover.style === 'split'}
		<rect x="0" y="0" width="80" height={viewBoxHeight} fill={cover.bgColor} />
		<rect x="80" y="0" width="80" height={viewBoxHeight} fill={cover.accentColor || cover.bgColorEnd || cover.bgColor} />
	{:else if cover.bgColorEnd}
		<rect x="0" y="0" width={viewBoxWidth} height={viewBoxHeight} fill="url(#bg-grad-{cover.letter}-{title.length})" />
	{:else}
		<rect x="0" y="0" width={viewBoxWidth} height={viewBoxHeight} fill={cover.bgColor} />
	{/if}

	<!-- Subtle texture overlay -->
	<rect x="0" y="0" width={viewBoxWidth} height={viewBoxHeight} fill={cover.bgColor} opacity="0.02" filter="url(#noise-{cover.letter})" />

	<!-- Decorative letter -->
	<g class="letter-group">
		{#if cover.style === 'outlined'}
			<text
				x="80"
				y="115"
				text-anchor="middle"
				dominant-baseline="middle"
				font-family="Georgia, 'Times New Roman', serif"
				font-size="100"
				font-weight="400"
				fill="none"
				stroke={cover.letterColor}
				stroke-width="1.5"
				opacity="0.85"
			>{cover.letter}</text>
		{:else}
			<text
				x="80"
				y="115"
				text-anchor="middle"
				dominant-baseline="middle"
				font-family="Georgia, 'Times New Roman', serif"
				font-size="100"
				font-weight="400"
				fill={cover.letterColor}
				opacity="0.9"
			>{cover.letter}</text>
		{/if}
	</g>

	<!-- Bottom section with title and author -->
	<g class="info-section">
		<!-- Separator line -->
		{#if cover.accentColor && cover.style !== 'split'}
			<line x1="25" y1="175" x2="135" y2="175" stroke={cover.accentColor} stroke-width="1" opacity="0.5" />
		{:else}
			<line x1="25" y1="175" x2="135" y2="175" stroke={cover.letterColor} stroke-width="0.5" opacity="0.3" />
		{/if}

		<!-- Title -->
		{#each titleLines as line, i}
			<text
				x="80"
				y={188 + (i * 12)}
				text-anchor="middle"
				font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"
				font-size="10"
				font-weight="500"
				fill={cover.letterColor}
				letter-spacing="0.3"
				opacity="0.95"
			>{line}</text>
		{/each}

		<!-- Author -->
		<text
			x="80"
			y={188 + (titleLines.length * 12) + 10}
			text-anchor="middle"
			font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"
			font-size="8"
			font-weight="300"
			fill={cover.letterColor}
			letter-spacing="0.2"
			opacity="0.7"
		>{shortAuthor}</text>
	</g>

	<!-- Spine shadow -->
	<rect x="0" y="0" width="4" height={viewBoxHeight} fill="black" opacity="0.12" />

	<!-- Page edge effect -->
	<rect x={viewBoxWidth - 2} y="0" width="2" height={viewBoxHeight} fill="white" opacity="0.08" />

	<!-- Corner highlight -->
	<polygon points="0,0 20,0 0,20" fill="white" opacity="0.05" />
</svg>

<style>
	.book-cover {
		border-radius: 3px;
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.1),
			0 8px 16px rgba(0, 0, 0, 0.1),
			0 16px 32px rgba(0, 0, 0, 0.05);
		transition: box-shadow 0.3s ease;
	}

	.book-cover:hover {
		box-shadow:
			0 4px 8px rgba(0, 0, 0, 0.12),
			0 12px 24px rgba(0, 0, 0, 0.12),
			0 24px 48px rgba(0, 0, 0, 0.08);
	}
</style>
