/**
 * epub.ts
 *
 * Loads and parses EPUB files into chapters and table of contents.
 */
import ePub, { type Book as EpubBook } from 'epubjs';
import type Section from 'epubjs/types/section';
import DOMPurify from 'dompurify';
import type { Book, Chapter, TocItem } from '$lib/types/book';

export type ParseProgress = {
	stage: 'reading' | 'toc' | 'rendering' | 'finalizing';
	progress: number;
	chapterIndex?: number;
	totalChapters?: number;
};

export type ParseOptions = {
	onProgress?: (progress: ParseProgress) => void;
};

const ALLOWED_TAGS = [
	'div',
	'section',
	'article',
	'header',
	'footer',
	'main',
	'nav',
	'p',
	'span',
	'a',
	'em',
	'strong',
	'i',
	'b',
	'sup',
	'sub',
	'small',
	'cite',
	'code',
	'pre',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'blockquote',
	'figure',
	'figcaption',
	'ul',
	'ol',
	'li',
	'dl',
	'dt',
	'dd',
	'table',
	'thead',
	'tbody',
	'tfoot',
	'tr',
	'th',
	'td',
	'caption',
	'colgroup',
	'col',
	'br',
	'hr'
];

function sanitizeHtml(html: string): string {
	if (typeof window === 'undefined') {
		return html;
	}
	const normalized = normalizeInlineTypography(html);
	return DOMPurify.sanitize(normalized, {
		ALLOWED_TAGS,
		ALLOWED_ATTR: [
			'href',
			'id',
			'class',
			'title',
			'type',
			'role',
			'aria-label',
			'aria-describedby',
			'epub:type'
		],
		FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
		ALLOW_UNKNOWN_PROTOCOLS: false
	});
}

function normalizeInlineTypography(html: string): string {
	if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
		return html;
	}

	const doc = new DOMParser().parseFromString(html, 'text/html');
	normalizeInlineStageDirections(doc);
	normalizeInlineWhitespace(doc);
	return doc.body.innerHTML;
}

function normalizeInlineStageDirections(doc: Document): void {
	const candidates = doc.body.querySelectorAll(
		'[epub\\:type*=\"stage-direction\"], [epub\\:type*=\"stage\"], .stage-direction, .stagedirection'
	);

	candidates.forEach((node) => {
		const text = node.textContent?.trim() ?? '';
		if (!text) return;
		if (text.startsWith('(') && text.endsWith(')')) return;

		const parent = node.parentElement;
		if (!parent) return;

		// Preserve standalone dramatic directions like "Enter Jack."
		const isStandaloneParagraph =
			parent.tagName === 'P' &&
			parent.childElementCount === 1 &&
			(parent.textContent?.trim() ?? '') === text;
		if (isStandaloneParagraph) return;

		node.textContent = `(${text})`;
	});
}

function normalizeInlineWhitespace(doc: Document): void {
	const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
	const textNodes: Text[] = [];
	let current = walker.nextNode();
	while (current) {
		textNodes.push(current as Text);
		current = walker.nextNode();
	}

	for (const node of textNodes) {
		const parent = node.parentElement;
		if (!parent) continue;
		if (parent.closest('pre, code, kbd, samp, textarea')) continue;

		// Fix cases like "link ." and exaggerated spacing from source indentation.
		const normalized = node.data
			.replace(/[\s\u00A0]+([,.;:!?])/g, '$1')
			.replace(/[\s\u00A0]{2,}/g, ' ');
		if (normalized !== node.data) {
			node.data = normalized;
		}
	}
}

type TocMeta = {
	label: string;
	level: number;
};

function buildTocMap(book: EpubBook): Promise<Map<string, TocMeta>> {
	return book.loaded.navigation.then((navigation) => {
		const map = new Map<string, TocMeta>();

		const walk = (items: typeof navigation.toc, level: number) => {
			items.forEach((item) => {
				if (item.href) {
					map.set(item.href.split('#')[0], { label: item.label, level });
				}
				if (item.subitems && item.subitems.length > 0) {
					walk(item.subitems, level + 1);
				}
			});
		};

		walk(navigation.toc, 0);
		return map;
	});
}

const sectionRegistry = new Map<string, Map<string, Section>>();

function registerSections(bookId: string, sections: Section[]): void {
	const map = new Map<string, Section>();
	sections.forEach((section) => {
		if (section.idref) {
			map.set(section.idref, section);
		}
		if (section.href) {
			map.set(section.href, section);
		}
	});
	sectionRegistry.set(bookId, map);
}

export function getSectionForChapter(
	bookId: string,
	chapterId: string,
	chapterHref?: string
): Section | null {
	const map = sectionRegistry.get(bookId);
	if (!map) {
		return null;
	}
	return map.get(chapterId) ?? (chapterHref ? map.get(chapterHref) : null) ?? null;
}

async function extractChapters(
	book: EpubBook,
	tocMap: Map<string, TocMeta>,
	onProgress?: (progress: ParseProgress) => void
): Promise<{ chapters: Chapter[]; sections: Section[] }> {
	const chapters: Chapter[] = [];
	const sections: Section[] = [];
	const renderBatchSize = 3;
	let renderCount = 0;
	let chapterIndex = 0;
	const renderBase = 15;
	const renderBudget = 80;

	book.spine.each((section: Section) => {
		sections.push(section);
	});
	const totalChapters = sections.length;

	for (const section of sections) {
		const tocMeta = tocMap.get(section.href);
		const title = tocMeta?.label ?? section.idref ?? 'Untitled';
		let html = '';
		try {
			html = await section.render(book.load.bind(book));
		} catch {
			html = '<p>Unable to render this section.</p>';
		}
		section.unload();
		chapters.push({
			id: section.idref ?? section.href,
			title,
			href: section.href,
			html: sanitizeHtml(html)
		});
		chapterIndex += 1;
		if (onProgress && totalChapters > 0) {
			const progress = renderBase + Math.round((chapterIndex / totalChapters) * renderBudget);
			onProgress({
				stage: 'rendering',
				progress,
				chapterIndex,
				totalChapters
			});
		}
		renderCount += 1;
		if (renderCount % renderBatchSize === 0) {
			await yieldToBrowser();
		}
	}

	return { chapters, sections };
}

function yieldToBrowser(): Promise<void> {
	if (typeof window === 'undefined') {
		return Promise.resolve();
	}
	return new Promise((resolve) => {
		const idle = (window as Window & {
			requestIdleCallback?: (cb: () => void) => number;
		}).requestIdleCallback;
		if (idle) {
			idle(() => resolve());
		} else {
			setTimeout(resolve, 0);
		}
	});
}

function buildToc(chapters: Chapter[], tocMap: Map<string, TocMeta>): TocItem[] {
	return chapters.map((chapter, index) => ({
		label: tocMap.get(chapter.href)?.label ?? chapter.title,
		href: chapter.href,
		chapterIndex: index,
		level: tocMap.get(chapter.href)?.level ?? 0
	}));
}

export async function parseEpub(file: Blob, id: string, options: ParseOptions = {}): Promise<Book> {
	try {
		options.onProgress?.({ stage: 'reading', progress: 0 });
		const data = await file.arrayBuffer();
		options.onProgress?.({ stage: 'reading', progress: 10 });
		const book = ePub(data, { openAs: 'binary', replacements: 'blobUrl' });
		await book.ready;

		options.onProgress?.({ stage: 'toc', progress: 15 });
		const metadata = await book.loaded.metadata;
		const tocMap = await buildTocMap(book).catch(() => new Map());
		const { chapters, sections } = await extractChapters(book, tocMap, options.onProgress);

		const title = metadata.title || 'Untitled';
		const author = metadata.creator || 'Unknown author';

		registerSections(id, sections);
		options.onProgress?.({ stage: 'finalizing', progress: 100 });

		return {
			id,
			title,
			author,
			chapters,
			toc: buildToc(chapters, tocMap)
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		throw new Error(`Failed to parse EPUB: ${message}`);
	}
}
