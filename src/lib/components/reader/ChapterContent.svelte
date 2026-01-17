<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Chapter } from '$lib/types/book';

	export let chapter: Chapter;
	export let index: number;

	const dispatch = createEventDispatcher<{
		discussion: { chapterId: string; chapterIndex: number };
	}>();
</script>

<section
	id={`chapter-${index}`}
	class="chapter"
	data-chapter-index={index}
	data-chapter-id={chapter.id}
	data-chapter-title={chapter.title}
>
	<h2 class="chapter-title">{chapter.title}</h2>
	<div class="chapter-body reading-content">
		{@html chapter.html}
	</div>
	<div class="chapter-reflection">
		<p class="reflection-text">Finished this chapter?</p>
		<button
			type="button"
			class="reflection-btn"
			on:click={() => dispatch('discussion', { chapterId: chapter.id, chapterIndex: index })}
		>
			Discuss this chapter
		</button>
	</div>
</section>

<style>
	.chapter {
		padding-bottom: var(--space-16);
		margin-bottom: var(--space-10);
		animation: chapter-enter 0.5s cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes chapter-enter {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.chapter:not(:last-child)::after {
		content: '';
		display: block;
		width: 80px;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			var(--border) 20%,
			var(--border) 80%,
			transparent 100%
		);
		margin: var(--space-16) auto 0;
	}

	.chapter-title {
		font-family: var(--font-reading);
		font-size: 1.625rem;
		font-weight: 400;
		color: var(--text-primary);
		margin-bottom: var(--space-10);
		line-height: 1.25;
		letter-spacing: -0.02em;
		text-align: center;
		font-variant-caps: small-caps;
		font-variant-numeric: oldstyle-nums;
		position: relative;
	}

	/* Elegant ornament before chapter title */
	.chapter-title::before {
		content: '❧';
		display: block;
		font-size: 1.25rem;
		color: var(--text-tertiary);
		margin-bottom: var(--space-5);
		font-variant-caps: normal;
		opacity: 0.6;
		letter-spacing: 0;
	}

	/* Reading content */
	.chapter-body {
		font-family: var(--font-reading);
		font-size: var(--text-reading);
		line-height: var(--line-height-reading);
		letter-spacing: var(--letter-spacing-reading);
		color: var(--text-primary);
		text-align: var(--text-align-reading, left);
		font-variant-numeric: oldstyle-nums;
		hanging-punctuation: first last;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	/* Paragraphs */
	.chapter-body :global(p) {
		margin-bottom: var(--paragraph-spacing, 1.5em);
		text-indent: 1.5em;
	}

	.chapter-body :global(p:first-of-type) {
		text-indent: 0;
	}

	/* Drop cap for first paragraph of chapter */
	.chapter-body :global(p:first-of-type::first-letter) {
		float: left;
		font-size: 3.5em;
		line-height: 0.75;
		font-weight: 400;
		padding-right: 0.08em;
		padding-top: 0.06em;
		margin-right: 0.02em;
		color: var(--text-primary);
		font-variant-numeric: lining-nums;
		/* Subtle styling for drop cap */
		font-feature-settings: 'swsh' 1, 'calt' 1;
	}


	/* Paragraphs that only contain links (navigation) */
	.chapter-body :global(p:has(> a:only-child)) {
		text-indent: 0;
		margin-bottom: 0.5em;
	}

	/* When a paragraph or div has multiple sibling links, treat as navigation */
	.chapter-body :global(p > a + a),
	.chapter-body :global(div > a + a) {
		margin-left: 0;
	}

	/* Style paragraphs/divs that contain only links as navigation blocks */
	.chapter-body :global(p:has(a):not(:has(:not(a):not(br):not(span)))) {
		text-indent: 0;
		line-height: 2;
	}

	.chapter-body :global(p:has(a):not(:has(:not(a):not(br):not(span))) a) {
		display: inline-block;
		margin-right: 1.5em;
		margin-bottom: 0.25em;
	}

	/* Headings */
	.chapter-body :global(h1),
	.chapter-body :global(h2),
	.chapter-body :global(h3),
	.chapter-body :global(h4),
	.chapter-body :global(h5),
	.chapter-body :global(h6) {
		font-family: var(--font-reading);
		font-weight: 500;
		margin-top: 2em;
		margin-bottom: 0.75em;
		text-indent: 0;
		line-height: 1.3;
		letter-spacing: -0.01em;
		color: var(--text-primary);
	}

	.chapter-body :global(h1) {
		font-size: 1.5em;
		text-align: center;
		margin-top: 0;
		margin-bottom: 1.5em;
	}

	.chapter-body :global(h2) {
		font-size: 1.3em;
	}

	.chapter-body :global(h3) {
		font-size: 1.15em;
	}

	.chapter-body :global(h4),
	.chapter-body :global(h5),
	.chapter-body :global(h6) {
		font-size: 1.05em;
	}

	/* Blockquotes */
	.chapter-body :global(blockquote) {
		margin: 2em 1em;
		padding: 0.5em 0 0.5em 1.25em;
		border-left: 2px solid var(--border);
		font-style: italic;
		color: var(--text-secondary);
		position: relative;
	}

	/* Opening quote decoration for blockquotes */
	.chapter-body :global(blockquote)::before {
		content: '"';
		font-family: Georgia, serif;
		font-size: 3em;
		line-height: 1;
		color: var(--border);
		position: absolute;
		left: -0.3em;
		top: -0.15em;
	}

	.chapter-body :global(blockquote p) {
		text-indent: 0;
	}

	.chapter-body :global(em) {
		font-style: italic;
	}

	.chapter-body :global(strong) {
		font-weight: 600;
	}

	/* Lists */
	.chapter-body :global(ul),
	.chapter-body :global(ol) {
		margin: 1.25em 0;
		padding-left: 1.5em;
	}

	.chapter-body :global(li) {
		margin-bottom: 0.4em;
		text-indent: 0;
		line-height: 1.6;
	}

	/* Navigation lists - links displayed as blocks */
	.chapter-body :global(nav),
	.chapter-body :global([class*="toc"]),
	.chapter-body :global([class*="contents"]) {
		margin: 1em 0;
	}

	.chapter-body :global(nav a),
	.chapter-body :global([class*="toc"] a),
	.chapter-body :global([class*="contents"] a) {
		display: block;
		padding: 0.5em 0;
		text-decoration: none;
		color: var(--text-primary);
		transition: color var(--transition-fast);
	}

	.chapter-body :global(nav a:hover),
	.chapter-body :global([class*="toc"] a:hover),
	.chapter-body :global([class*="contents"] a:hover) {
		color: var(--text-secondary);
	}

	/* Direct child links (often navigation) - make them block */
	.chapter-body :global(> a) {
		display: block;
		padding: 0.4em 0;
		text-decoration: none;
		color: var(--text-primary);
	}

	.chapter-body :global(> a:hover) {
		color: var(--text-secondary);
	}

	/* Inline links within text */
	.chapter-body :global(p a),
	.chapter-body :global(li a),
	.chapter-body :global(blockquote a) {
		display: inline;
		color: var(--text-primary);
		text-decoration: underline;
		text-decoration-color: var(--border);
		text-decoration-thickness: 1px;
		text-underline-offset: 3px;
		transition: text-decoration-color var(--transition-fast);
	}

	.chapter-body :global(p a:hover),
	.chapter-body :global(li a:hover),
	.chapter-body :global(blockquote a:hover) {
		text-decoration-color: var(--text-secondary);
	}

	/* Horizontal rules - scene breaks */
	.chapter-body :global(hr) {
		border: none;
		text-align: center;
		margin: 3.5em 0;
		height: auto;
		overflow: visible;
		background: none;
	}

	.chapter-body :global(hr)::before {
		content: '⁂';
		display: block;
		color: var(--text-tertiary);
		font-size: 1.25em;
		letter-spacing: 0;
		opacity: 0.5;
	}

	/* Alternative scene break styles */
	.chapter-body :global(hr.dots)::before {
		content: '• • •';
		letter-spacing: 0.75em;
		font-size: 0.6em;
	}

	.chapter-body :global(hr.flourish)::before {
		content: '❦';
	}

	.chapter-body :global(hr.line)::before {
		content: '';
		display: block;
		width: 40px;
		height: 1px;
		background: var(--border);
		margin: 0 auto;
	}

	/* Poetry, verse, and preformatted text */
	.chapter-body :global(pre) {
		font-family: var(--font-reading);
		font-size: 0.95em;
		white-space: pre-wrap;
		margin: 1.75em 0;
		padding-left: 2em;
		line-height: 1.6;
		color: var(--text-secondary);
	}

	/* Code within text */
	.chapter-body :global(code) {
		font-family: 'SF Mono', Menlo, monospace;
		font-size: 0.9em;
		background: var(--bg-secondary);
		padding: 0.15em 0.4em;
		border-radius: 3px;
	}

	/* Images */
	.chapter-body :global(img) {
		max-width: 100%;
		height: auto;
		margin: 2em auto;
		display: block;
	}

	/* Figure and captions */
	.chapter-body :global(figure) {
		margin: 2em 0;
		text-align: center;
	}

	.chapter-body :global(figcaption) {
		font-size: 0.85em;
		color: var(--text-secondary);
		margin-top: 0.75em;
		font-style: italic;
	}

	/* Tables */
	.chapter-body :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: 1.75em 0;
		font-size: 0.9em;
	}

	.chapter-body :global(th),
	.chapter-body :global(td) {
		padding: 0.6em 0.75em;
		border-bottom: 1px solid var(--border);
		text-align: left;
	}

	.chapter-body :global(th) {
		font-weight: 500;
		border-bottom-width: 2px;
	}

	.chapter-body :global(tr:last-child td) {
		border-bottom: none;
	}

	/* Divs - sometimes used for structure */
	.chapter-body :global(div) {
		margin-bottom: 1em;
	}

	.chapter-body :global(div:empty) {
		display: none;
	}

	/* Spans with line breaks - common in poetry */
	.chapter-body :global(span) {
		display: inline;
	}

	/* Break elements */
	.chapter-body :global(br) {
		display: block;
		content: '';
		margin-bottom: 0.5em;
	}

	/* Subscript and superscript */
	.chapter-body :global(sub),
	.chapter-body :global(sup) {
		font-size: 0.75em;
		line-height: 0;
		position: relative;
		vertical-align: baseline;
	}

	.chapter-body :global(sup) {
		top: -0.5em;
	}

	.chapter-body :global(sub) {
		bottom: -0.25em;
	}

	/* Small text */
	.chapter-body :global(small) {
		font-size: 0.85em;
		color: var(--text-secondary);
	}

	/* Centered text - common for titles, dedications */
	.chapter-body :global([style*="text-align: center"]),
	.chapter-body :global([align="center"]),
	.chapter-body :global(.center),
	.chapter-body :global(.centered) {
		text-align: center;
		text-indent: 0;
	}

	/* Right-aligned text - signatures, dates */
	.chapter-body :global([style*="text-align: right"]),
	.chapter-body :global([align="right"]),
	.chapter-body :global(.right) {
		text-align: right;
		text-indent: 0;
	}

	/* Letter formatting */
	.chapter-body :global(.letter),
	.chapter-body :global(.epistle) {
		margin: 1.5em 0;
		padding: 1em 1.5em;
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
	}

	/* Verse/poetry blocks */
	.chapter-body :global(.verse),
	.chapter-body :global(.poem),
	.chapter-body :global(.poetry),
	.chapter-body :global(.stanza) {
		margin: 1.5em 0;
		padding-left: 1.5em;
		font-style: italic;
	}

	/* Epigraphs */
	.chapter-body :global(.epigraph) {
		margin: 1.5em 0 2em;
		padding-left: 1.5em;
		font-style: italic;
		color: var(--text-secondary);
		font-size: 0.95em;
	}

	/* Focus Mode - refined spotlight effect */
	:global([data-focus-mode="true"]) .chapter-body :global(p),
	:global([data-focus-mode="true"]) .chapter-body :global(blockquote),
	:global([data-focus-mode="true"]) .chapter-body :global(li),
	:global([data-focus-mode="true"]) .chapter-body :global(h1),
	:global([data-focus-mode="true"]) .chapter-body :global(h2),
	:global([data-focus-mode="true"]) .chapter-body :global(h3),
	:global([data-focus-mode="true"]) .chapter-body :global(h4),
	:global([data-focus-mode="true"]) .chapter-body :global(h5),
	:global([data-focus-mode="true"]) .chapter-body :global(h6) {
		opacity: 0.25;
		filter: blur(0.3px);
		transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1),
					filter 0.35s cubic-bezier(0.4, 0, 0.2, 1),
					transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
	}

	:global([data-focus-mode="true"]) .chapter-body :global(.focus-paragraph),
	:global([data-focus-mode="true"]) .chapter-body :global(p.focus-paragraph),
	:global([data-focus-mode="true"]) .chapter-body :global(blockquote.focus-paragraph),
	:global([data-focus-mode="true"]) .chapter-body :global(li.focus-paragraph),
	:global([data-focus-mode="true"]) .chapter-body :global(h1.focus-paragraph),
	:global([data-focus-mode="true"]) .chapter-body :global(h2.focus-paragraph),
	:global([data-focus-mode="true"]) .chapter-body :global(h3.focus-paragraph),
	:global([data-focus-mode="true"]) .chapter-body :global(h4.focus-paragraph),
	:global([data-focus-mode="true"]) .chapter-body :global(h5.focus-paragraph),
	:global([data-focus-mode="true"]) .chapter-body :global(h6.focus-paragraph) {
		opacity: 1;
		filter: blur(0);
		transform: scale(1);
	}

	/* Smooth gradient for surrounding context */
	:global([data-focus-mode="true"]) .chapter-body :global(.focus-context) {
		opacity: 0.55;
		filter: blur(0);
	}

	/* Second level context for even smoother fade */
	:global([data-focus-mode="true"]) .chapter-body :global(.focus-context-2) {
		opacity: 0.35;
		filter: blur(0.2px);
	}

	/* Mobile refinements */
	@media (max-width: 640px) {
		.chapter-title {
			font-size: 1.35rem;
		}

		.chapter-body {
			font-size: 17px;
			line-height: 1.65;
		}

		.chapter-body :global(p) {
			text-indent: 1.25em;
			margin-bottom: 1.35em;
		}
	}

	.chapter-reflection {
		margin-top: var(--space-12);
		padding: var(--space-5);
		border: 1px dashed var(--border);
		border-radius: var(--radius-lg);
		text-align: center;
		background: var(--bg-secondary);
	}

	.reflection-text {
		font-size: var(--text-sm);
		color: var(--text-secondary);
		margin-bottom: var(--space-3);
	}

	.reflection-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		font-size: var(--text-sm);
		color: var(--text-primary);
		background: var(--bg-primary);
		transition: all var(--transition-fast);
	}

	.reflection-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
</style>
