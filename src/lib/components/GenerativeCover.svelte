<script lang="ts">
	import {
		generateCover,
		getInitialLetter,
		formatAuthorShort,
		splitTitleLines,
		type GeneratedCover
	} from '$lib/utils/coverGenerator';

	export let title: string;
	export let author: string = '';
	export let width: number = 120;
	export let height: number = 168;

	const viewBoxWidth = 120;
	const viewBoxHeight = 168;

	$: cover = generateCover(title, author);
	$: initial = getInitialLetter(title);
	$: shortAuthor = formatAuthorShort(author);
	$: titleLines = splitTitleLines(title, 14);

	// Generate unique IDs for this instance
	$: gradientId = `grad-${title.replace(/\s/g, '').slice(0, 8)}-${author.slice(0, 4)}`;
</script>

<svg
	{width}
	{height}
	viewBox="0 0 {viewBoxWidth} {viewBoxHeight}"
	class="generative-cover"
	role="img"
	aria-label="{title} by {author}"
>
	<defs>
		<!-- Background gradient -->
		<linearGradient id="{gradientId}-bg" x1="0%" y1="0%" x2="0%" y2="100%">
			<stop offset="0%" stop-color={cover.bgColor} />
			<stop offset="100%" stop-color={cover.bgColorEnd} />
		</linearGradient>

		<!-- Subtle grain texture -->
		<filter id="{gradientId}-grain" x="0%" y="0%" width="100%" height="100%">
			<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="noise" />
			<feColorMatrix type="saturate" values="0" />
			<feBlend in="SourceGraphic" in2="noise" mode="soft-light" />
			<feComposite in2="SourceGraphic" operator="in" />
		</filter>

		<!-- Geometric pattern (if applicable) -->
		{#if cover.pattern === 'geometric' && cover.patternData}
			{@html cover.patternData}
		{/if}
	</defs>

	<!-- Base background -->
	<rect x="0" y="0" width={viewBoxWidth} height={viewBoxHeight} fill="url(#{gradientId}-bg)" />

	<!-- Pattern overlay for geometric style -->
	{#if cover.pattern === 'geometric'}
		<rect
			x="0"
			y="0"
			width={viewBoxWidth}
			height={viewBoxHeight}
			fill="url(#circles), url(#dots), url(#lines), url(#grid), url(#diamonds)"
			opacity="0.5"
		/>
	{/if}

	<!-- Duotone style: large initial with gradient -->
	{#if cover.pattern === 'duotone'}
		<text
			x="60"
			y="95"
			text-anchor="middle"
			dominant-baseline="middle"
			font-family="Georgia, 'Times New Roman', serif"
			font-size="90"
			font-weight="400"
			fill={cover.accentColor}
			opacity="0.12"
		>{initial}</text>
	{/if}

	<!-- Classic style: decorative border -->
	{#if cover.pattern === 'classic'}
		<rect
			x="8"
			y="8"
			width={viewBoxWidth - 16}
			height={viewBoxHeight - 16}
			fill="none"
			stroke={cover.accentColor}
			stroke-width="0.5"
			opacity="0.25"
			rx="1"
		/>
		<rect
			x="12"
			y="12"
			width={viewBoxWidth - 24}
			height={viewBoxHeight - 24}
			fill="none"
			stroke={cover.accentColor}
			stroke-width="0.3"
			opacity="0.15"
			rx="1"
		/>
	{/if}

	<!-- Minimal style: just a subtle line -->
	{#if cover.pattern === 'minimal'}
		<line
			x1="20"
			y1="55"
			x2="100"
			y2="55"
			stroke={cover.accentColor}
			stroke-width="0.5"
			opacity="0.3"
		/>
	{/if}

	<!-- Main initial letter -->
	<text
		x="60"
		y={cover.pattern === 'minimal' ? 42 : 65}
		text-anchor="middle"
		dominant-baseline="middle"
		font-family="Georgia, 'Times New Roman', serif"
		font-size={cover.pattern === 'minimal' ? 48 : 56}
		font-weight="400"
		fill={cover.textColor}
		opacity="0.9"
	>{initial}</text>

	<!-- Title and author section -->
	<g class="info">
		<!-- Separator -->
		{#if cover.pattern !== 'minimal'}
			<line
				x1="20"
				y1="115"
				x2="100"
				y2="115"
				stroke={cover.accentColor}
				stroke-width="0.5"
				opacity="0.4"
			/>
		{/if}

		<!-- Title lines -->
		{#each titleLines as line, i}
			<text
				x="60"
				y={125 + (i * 11)}
				text-anchor="middle"
				font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
				font-size="8"
				font-weight="500"
				fill={cover.textColor}
				letter-spacing="0.3"
				opacity="0.95"
			>{line}</text>
		{/each}

		<!-- Author -->
		{#if shortAuthor}
			<text
				x="60"
				y={125 + (titleLines.length * 11) + 8}
				text-anchor="middle"
				font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
				font-size="6.5"
				font-weight="400"
				fill={cover.textColor}
				letter-spacing="0.2"
				opacity="0.6"
			>{shortAuthor}</text>
		{/if}
	</g>

	<!-- Spine shadow -->
	<rect x="0" y="0" width="3" height={viewBoxHeight} fill="black" opacity="0.15" />

	<!-- Subtle page edge -->
	<rect x={viewBoxWidth - 1.5} y="0" width="1.5" height={viewBoxHeight} fill="white" opacity="0.05" />

	<!-- Top highlight -->
	<rect x="3" y="0" width={viewBoxWidth - 4.5} height="1" fill="white" opacity="0.08" />
</svg>

<style>
	.generative-cover {
		border-radius: 4px;
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.08),
			0 4px 12px rgba(0, 0, 0, 0.12),
			0 8px 24px rgba(0, 0, 0, 0.08);
		transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
					box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.generative-cover:hover {
		transform: translateY(-2px) scale(1.02);
		box-shadow:
			0 4px 8px rgba(0, 0, 0, 0.1),
			0 8px 20px rgba(0, 0, 0, 0.15),
			0 16px 40px rgba(0, 0, 0, 0.1);
	}
</style>
