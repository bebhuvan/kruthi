<script lang="ts">
	import { get } from 'svelte/store';
	import { onDestroy, onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import ChapterContent from '$lib/components/reader/ChapterContent.svelte';
	import SelectionMenu from '$lib/components/reader/SelectionMenu.svelte';
	import ActionResponse from '$lib/components/reader/ActionResponse.svelte';
	import HighlightNote from '$lib/components/reader/HighlightNote.svelte';
	import SearchPanel from '$lib/components/reader/SearchPanel.svelte';
	import SummaryPanel from '$lib/components/reader/SummaryPanel.svelte';
	import AnalysisPanel from '$lib/components/reader/AnalysisPanel.svelte';
	import ChatPanel from '$lib/components/ai/ChatPanel.svelte';
	import { getSectionForChapter } from '$lib/services/epub';
	import {
		applyHighlightToRoot,
		clearHighlightMarks,
		removeHighlightMarks,
		resolveHighlightRange,
		serializeRange
	} from '$lib/services/highlights';
	import { streamHighlightAction } from '$lib/services/highlightActions';
	import { addVocabularyEntry } from '$lib/services/vocabulary';
	import { adapter } from '$lib/platform';
	import { chatStore } from '$lib/stores/chatStore';
	import { readerProfileStore } from '$lib/stores/readerProfileStore';
	import { settingsStore } from '$lib/stores/settingsStore';
	import { indexingStore } from '$lib/stores/indexingStore';
	import type { Book } from '$lib/types/book';
	import type { Highlight, HighlightAction, HighlightSelection, SelectionAction } from '$lib/types/highlight';

	export let book: Book;
	export let highlightId: string | null = null;

	let currentChapter = 0;
	let tocOpen = false;
	let headerVisible = true;
	let lastScrollY = 0;
	let contentRoot: HTMLElement | null = null;
	let scrollTimeout: number | null = null;
	let selectionTimeout: number | null = null;
	let observer: IntersectionObserver | null = null;
	let focusObserver: IntersectionObserver | null = null;
	let lastBookId: string | null = null;
	let pendingHighlightId: string | null = null;
	let highlightsLoaded = false;
	let activeActionRequestId: string | null = null;
	let chatPanelOpen = false;
	let searchOpen = false;
	let summaryPanelOpen = false;
	let summaryPanelTab: 'summary' | 'discussion' | 'recap' = 'summary';
	let summaryChapterIndex = 0;
	let analysisPanelOpen = false;
	let analysisPanelTab: 'analysis' | 'themes' | 'characters' = 'analysis';
	let returningReader = false;
	let currentFocusElement: HTMLElement | null = null;
	let toastTimeout: number | null = null;

	// Subscribe to chat store for keyboard handling
	$: chatPanelOpen = $chatStore.isOpen;

	let selectionMenu = { open: false, x: 0, y: 0 };
	let selectionAnchor = { x: 0, y: 0, bottom: 0 };
	let currentSelection: HighlightSelection | null = null;
	let currentRange: Range | null = null;
	let currentSelectionRoot: HTMLElement | null = null;
	let highlights: Highlight[] = [];
	let actionResponse = {
		open: false,
		action: 'explain' as HighlightAction,
		text: '',
		isLoading: false,
		error: null as string | null,
		x: 0,
		y: 0
	};
	let noteEditor = {
		open: false,
		highlightId: null as string | null,
		note: '',
		saving: false,
		error: null as string | null,
		x: 0,
		y: 0
	};
	let toast = { open: false, message: '' };
	let scrollProgress = 0;
	let lastProfileChapterId: string | null = null;

	const INITIAL_RENDER_COUNT = 3;
	const RENDER_BATCH_SIZE = 2;
	const RENDER_PREFETCH_THRESHOLD = 1;
	const RENDER_BATCH_DELAY_MS = 0;
	let renderedChapterCount = 0;
	let renderInProgress = false;
	let pendingRenderTarget: number | null = null;

	// Swipe gesture tracking
	let touchStartX = 0;
	let touchStartY = 0;
	let touchEndX = 0;
	let touchEndY = 0;
	let touchActive = false;
	let maxDeltaX = 0;
	let maxDeltaY = 0;
	const SWIPE_THRESHOLD = 80; // Minimum distance for a swipe
	const SWIPE_RESTRAINT = 100; // Maximum perpendicular distance
	const SWIPE_RATIO = 1.2; // Horizontal dominance ratio

	const shouldIgnoreSwipe = (target: EventTarget | null): boolean => {
		if (
			tocOpen ||
			chatPanelOpen ||
			searchOpen ||
			summaryPanelOpen ||
			analysisPanelOpen ||
			selectionMenu.open ||
			noteEditor.open ||
			actionResponse.open
		) {
			return true;
		}
		const element = target instanceof HTMLElement ? target : null;
		if (!element) return true;
		if (contentRoot && !contentRoot.contains(element)) {
			return true;
		}
		if (
			element.closest(
				'button, a, input, textarea, select, [role="button"], [role="switch"], [data-selection-menu], [data-action-response], [data-note-popover], .chat-panel, .toc-sidebar, .search-panel, .summary-panel, .analysis-panel'
			)
		) {
			return true;
		}
		return false;
	};

	const handleTouchStart = (e: TouchEvent) => {
		if (!$settingsStore.swipeNavigation) {
			touchActive = false;
			return;
		}
		if (e.touches.length !== 1) {
			touchActive = false;
			return;
		}
		if (shouldIgnoreSwipe(e.target)) {
			touchActive = false;
			return;
		}
		touchActive = true;
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
		maxDeltaX = 0;
		maxDeltaY = 0;
	};

	const handleTouchMove = (e: TouchEvent) => {
		if (!$settingsStore.swipeNavigation) return;
		if (!touchActive) return;
		if (e.touches.length !== 1) {
			touchActive = false;
			return;
		}
		const deltaX = e.touches[0].clientX - touchStartX;
		const deltaY = e.touches[0].clientY - touchStartY;
		maxDeltaX = Math.max(maxDeltaX, Math.abs(deltaX));
		maxDeltaY = Math.max(maxDeltaY, Math.abs(deltaY));
	};

	const handleTouchEnd = (e: TouchEvent) => {
		if (!$settingsStore.swipeNavigation) return;
		if (!touchActive) return;
		if (e.changedTouches.length !== 1) {
			touchActive = false;
			return;
		}
		touchEndX = e.changedTouches[0].clientX;
		touchEndY = e.changedTouches[0].clientY;
		handleSwipeGesture();
		touchActive = false;
	};

	const handleSwipeGesture = () => {
		const deltaX = touchEndX - touchStartX;
		const deltaY = touchEndY - touchStartY;

		// Check if horizontal swipe is dominant and meets threshold
		if (
			maxDeltaX > SWIPE_THRESHOLD &&
			maxDeltaY < SWIPE_RESTRAINT &&
			maxDeltaX > maxDeltaY * SWIPE_RATIO
		) {
			if (deltaX > 0 && currentChapter > 0) {
				// Swipe right -> previous chapter
				void scrollToChapter(currentChapter - 1);
			} else if (deltaX < 0 && currentChapter < totalChapters - 1) {
				// Swipe left -> next chapter
				void scrollToChapter(currentChapter + 1);
			}
		}
	};

	$: totalChapters = book.chapters.length;
	$: currentChapterTitle = book.chapters[currentChapter]?.title || '';
	$: showProgress = $settingsStore.showReadingProgress;
	$: if (renderedChapterCount === 0 && totalChapters > 0) {
		renderedChapterCount = Math.min(totalChapters, INITIAL_RENDER_COUNT);
	}
	$: {
		const chapter = book.chapters[currentChapter];
		if (chapter && chapter.id !== lastProfileChapterId) {
			lastProfileChapterId = chapter.id;
			readerProfileStore.startChapterSession(book.id, chapter.id, chapter.title);
		}
	}

	const delayRenderBatch = () => new Promise((resolve) => setTimeout(resolve, RENDER_BATCH_DELAY_MS));

	const ensureChaptersRenderedThrough = async (targetIndex: number) => {
		if (totalChapters === 0) return;
		const clampedTarget = Math.min(Math.max(targetIndex, 0), totalChapters - 1);
		if (clampedTarget < renderedChapterCount - 1) return;
		if (renderInProgress) {
			pendingRenderTarget = Math.max(pendingRenderTarget ?? -1, clampedTarget);
			return;
		}

		renderInProgress = true;
		while (renderedChapterCount - 1 < clampedTarget) {
			renderedChapterCount = Math.min(totalChapters, renderedChapterCount + RENDER_BATCH_SIZE);
			await tick();
			observeChapters();
			applyHighlights();
			await delayRenderBatch();
		}
		renderInProgress = false;

		if (pendingRenderTarget !== null && pendingRenderTarget > renderedChapterCount - 1) {
			const nextTarget = pendingRenderTarget;
			pendingRenderTarget = null;
			await ensureChaptersRenderedThrough(nextTarget);
		} else {
			pendingRenderTarget = null;
		}
	};

	const extendRenderedChapters = () => {
		const nextTarget = Math.min(totalChapters - 1, renderedChapterCount + RENDER_BATCH_SIZE - 1);
		if (nextTarget >= renderedChapterCount) {
			void ensureChaptersRenderedThrough(nextTarget);
		}
	};

	const scrollToChapter = async (index: number) => {
		await ensureChaptersRenderedThrough(index);
		currentChapter = index;
		await tick();
		const target = document.getElementById(`chapter-${index}`);
		target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		tocOpen = false;
	};

	const handleCitationJump = (event: CustomEvent<{ chapterId?: string }>) => {
		if (!event.detail.chapterId) return;
		const index = book.chapters.findIndex((chapter) => chapter.id === event.detail.chapterId);
		if (index >= 0) void scrollToChapter(index);
	};

	const handleScroll = () => {
		// Header visibility based on scroll direction
		const currentScrollY = window.scrollY;
		if (currentScrollY > 100) {
			headerVisible = currentScrollY < lastScrollY;
		} else {
			headerVisible = true;
		}
		lastScrollY = currentScrollY;

		// Calculate scroll progress
		const docHeight = document.documentElement.scrollHeight - window.innerHeight;
		scrollProgress = docHeight > 0 ? Math.min((currentScrollY / docHeight) * 100, 100) : 0;

		// Close selection menu on scroll
		if (selectionMenu.open) {
			selectionMenu = { ...selectionMenu, open: false };
		}
		if (noteEditor.open) {
			closeNoteEditor();
		}

		// Update focus mode paragraph
		if ($settingsStore.focusMode) {
			updateFocusParagraph();
		}

		// Debounced position save
		if (scrollTimeout) window.clearTimeout(scrollTimeout);
		scrollTimeout = window.setTimeout(() => {
			void adapter.savePosition(book.id, currentChapter, window.scrollY);
			readerProfileStore.recordReadingProgress();
		}, 500);
	};

	const observeChapters = () => {
		observer?.disconnect();
		observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const index = Number(entry.target.getAttribute('data-chapter-index'));
						if (!Number.isNaN(index)) {
							currentChapter = index;
							if (index >= renderedChapterCount - RENDER_PREFETCH_THRESHOLD) {
								extendRenderedChapters();
							}
						}
					}
				}
			},
			{ rootMargin: '-30% 0px -60% 0px', threshold: 0 }
		);
		document.querySelectorAll('[data-chapter-index]').forEach((el) => observer?.observe(el));
	};

	const updateFocusParagraph = () => {
		if (!$settingsStore.focusMode || !contentRoot) return;

		// Find all readable elements
		const elements = contentRoot.querySelectorAll<HTMLElement>(
			'.chapter-body p, .chapter-body blockquote, .chapter-body li, .chapter-body h1, .chapter-body h2, .chapter-body h3, .chapter-body h4, .chapter-body h5, .chapter-body h6'
		);

		if (!elements.length) return;

		const viewportCenter = window.innerHeight / 2;
		const elementsArray = Array.from(elements);

		// Find the element closest to viewport center
		let closestIndex = 0;
		let closestDistance = Infinity;

		elementsArray.forEach((el, i) => {
			const rect = el.getBoundingClientRect();
			const elementCenter = rect.top + rect.height / 2;
			const distance = Math.abs(elementCenter - viewportCenter);

			if (distance < closestDistance) {
				closestDistance = distance;
				closestIndex = i;
			}
		});

		const closestElement = elementsArray[closestIndex];
		if (!closestElement || closestElement === currentFocusElement) return;

		// Remove all focus classes
		elementsArray.forEach((el) => {
			el.classList.remove('focus-paragraph', 'focus-context');
		});

		// Add focus class to current element
		closestElement.classList.add('focus-paragraph');

		// Add context class to previous and next elements
		if (closestIndex > 0) {
			elementsArray[closestIndex - 1]?.classList.add('focus-context');
		}
		if (closestIndex < elementsArray.length - 1) {
			elementsArray[closestIndex + 1]?.classList.add('focus-context');
		}

		currentFocusElement = closestElement;
	};

	const clearFocusMode = () => {
		if (!contentRoot) return;
		const elements = contentRoot.querySelectorAll<HTMLElement>('.focus-paragraph, .focus-context');
		elements.forEach((el) => {
			el.classList.remove('focus-paragraph', 'focus-context');
		});
		currentFocusElement = null;
	};

	const getClosestChapterElement = (node: Node | null): HTMLElement | null => {
		const element = node instanceof HTMLElement ? node : node?.parentElement ?? null;
		return element?.closest('[data-chapter-index]') ?? null;
	};

	const clampX = (x: number): number => {
		const padding = 16;
		return Math.min(Math.max(x, padding), window.innerWidth - padding);
	};

	const buildContextFromRange = (chapterEl: HTMLElement, range: Range, selectedText: string): string => {
		const paragraphs = Array.from(
			chapterEl.querySelectorAll<HTMLElement>('.chapter-body p, .chapter-body li, .chapter-body blockquote')
		);
		const selectedIndex = paragraphs.findIndex((p) => range.intersectsNode(p));
		if (selectedIndex >= 0) {
			const start = Math.max(0, selectedIndex - 1);
			const end = Math.min(paragraphs.length, selectedIndex + 2);
			const context = paragraphs
				.slice(start, end)
				.map((p) => p.textContent?.trim())
				.filter(Boolean)
				.join('\n\n');
			if (context) return context;
		}

		const normalizedSelection = selectedText.replace(/\s+/g, ' ').trim();
		const chapterText = chapterEl.textContent?.replace(/\s+/g, ' ').trim() ?? '';
		if (!chapterText) return normalizedSelection;
		const index = chapterText.indexOf(normalizedSelection);
		if (index === -1) return normalizedSelection;
		const windowSize = 400;
		const start = Math.max(0, index - windowSize);
		const end = Math.min(chapterText.length, index + normalizedSelection.length + windowSize);
		return chapterText.slice(start, end).trim();
	};

	const updateSelectionState = () => {
		if (!contentRoot) return;
		const selection = window.getSelection();
		if (!selection || selection.isCollapsed) {
			selectionMenu = { ...selectionMenu, open: false };
			currentSelection = null;
			currentRange = null;
			currentSelectionRoot = null;
			return;
		}
		if (
			!selection.anchorNode ||
			!selection.focusNode ||
			!contentRoot.contains(selection.anchorNode) ||
			!contentRoot.contains(selection.focusNode)
		) {
			selectionMenu = { ...selectionMenu, open: false };
			currentSelection = null;
			currentRange = null;
			currentSelectionRoot = null;
			return;
		}

		const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
		if (!range) return;

		const anchorChapter = getClosestChapterElement(selection.anchorNode);
		const focusChapter = getClosestChapterElement(selection.focusNode);
		if (!anchorChapter || !focusChapter || anchorChapter !== focusChapter) {
			selectionMenu = { ...selectionMenu, open: false };
			currentSelection = null;
			currentRange = null;
			currentSelectionRoot = null;
			return;
		}

		const chapterIndex = Number(anchorChapter.dataset.chapterIndex);
		if (Number.isNaN(chapterIndex)) return;

		const selectedText = selection.toString().trim();
		if (!selectedText) return;

		const chapter = book.chapters[chapterIndex];
		if (!chapter) return;

		const rect = range.getBoundingClientRect();
		if (!rect || (rect.width === 0 && rect.height === 0)) return;

		const chapterBody = anchorChapter.querySelector<HTMLElement>('.chapter-body');
		if (!chapterBody) return;

		const positionX = clampX(rect.left + rect.width / 2);
		const positionY = Math.max(rect.top, 12);
		const positionBottom = Math.min(rect.bottom + 8, window.innerHeight - 12);
		selectionAnchor = { x: positionX, y: positionY, bottom: positionBottom };
		selectionMenu = { open: true, x: positionX, y: positionY };

		let cfi: string | undefined;
		try {
			const section = getSectionForChapter(book.id, chapter.id, chapter.href);
			if (section) cfi = section.cfiFromRange(range);
		} catch {
			cfi = undefined;
		}

		currentSelection = {
			bookId: book.id,
			bookTitle: book.title,
			author: book.author,
			chapterId: chapter.id,
			chapterTitle: chapter.title,
			selectedText,
			context: buildContextFromRange(anchorChapter, range, selectedText),
			cfi
		};
		currentRange = range.cloneRange();
		currentSelectionRoot = chapterBody;
	};

	const scheduleSelectionUpdate = () => {
		if (selectionTimeout) window.clearTimeout(selectionTimeout);
		selectionTimeout = window.setTimeout(updateSelectionState, 0);
	};

	const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
		const target = event.target as HTMLElement | null;
		if (!target) return;
		if (
			target.closest('[data-selection-menu]') ||
			target.closest('[data-action-response]') ||
			target.closest('[data-note-popover]')
		) {
			return;
		}
		selectionMenu = { ...selectionMenu, open: false };
		closeNoteEditor();
	};

	const showToast = (message: string) => {
		toast = { open: true, message };
		if (toastTimeout) window.clearTimeout(toastTimeout);
		toastTimeout = window.setTimeout(() => {
			toast = { open: false, message: '' };
		}, 1800);
	};

	const createHighlight = async (note?: string | null, openNoteEditorOnSave = false) => {
		if (!currentSelection || !currentRange || !currentSelectionRoot) return;
		const rangeData = serializeRange(currentRange, currentSelectionRoot);
		const now = Date.now();
		const highlight: Highlight = {
			id: crypto.randomUUID(),
			bookId: currentSelection.bookId,
			bookTitle: currentSelection.bookTitle,
			author: currentSelection.author,
			chapterId: currentSelection.chapterId,
			chapterTitle: currentSelection.chapterTitle,
			bookChapter: `${currentSelection.bookId}:${currentSelection.chapterId}`,
			selectedText: currentSelection.selectedText,
			context: currentSelection.context,
			cfi: currentSelection.cfi,
			range: rangeData ?? undefined,
			note: note?.trim() ? note.trim() : undefined,
			createdAt: now,
			updatedAt: now
		};

		await adapter.saveHighlight(highlight);
		highlights = [...highlights, highlight];
		applyHighlightToRoot(currentSelectionRoot, highlight);
		window.getSelection()?.removeAllRanges();

		if (openNoteEditorOnSave) {
			openNoteEditor(highlight, selectionAnchor.x, selectionAnchor.bottom);
		} else {
			showToast('Highlight saved.');
		}
	};

	const handleSelectionAction = async (event: CustomEvent<{ action: SelectionAction }>) => {
		if (!currentSelection) return;
		const action = event.detail.action;
		if (action === 'highlight') {
			selectionMenu = { ...selectionMenu, open: false };
			await createHighlight();
			return;
		}
		if (action === 'note') {
			selectionMenu = { ...selectionMenu, open: false };
			await createHighlight('', true);
			return;
		}
		const settings = get(settingsStore);
		selectionMenu = { ...selectionMenu, open: false };
		actionResponse = {
			open: true,
			action,
			text: '',
			isLoading: true,
			error: null,
			x: selectionAnchor.x,
			y: selectionAnchor.bottom
		};

		if (settings.llmProvider === 'openrouter' && !settings.openRouterApiKey) {
			actionResponse = {
				...actionResponse,
				isLoading: false,
				error: 'Add your OpenRouter API key in Settings to use this feature.'
			};
			return;
		}

		if (settings.llmProvider === 'openai' && !settings.openAiApiKey) {
			actionResponse = {
				...actionResponse,
				isLoading: false,
				error: 'Add your OpenAI API key in Settings to use this feature.'
			};
			return;
		}

		if (settings.llmProvider === 'gemini' && !settings.geminiApiKey) {
			actionResponse = {
				...actionResponse,
				isLoading: false,
				error: 'Add your Gemini API key in Settings to use this feature.'
			};
			return;
		}

		if (settings.llmProvider === 'anthropic' && !settings.anthropicApiKey) {
			actionResponse = {
				...actionResponse,
				isLoading: false,
				error: 'Add your Anthropic API key in Settings to use this feature.'
			};
			return;
		}

		const requestId = crypto.randomUUID();
		activeActionRequestId = requestId;

		try {
			const response = await streamHighlightAction({
				provider: settings.llmProvider,
				openRouterModel: settings.openRouterModel,
				openAiModel: settings.openAiModel,
				geminiModel: settings.geminiModel,
				systemPrompt: settings.systemPrompt,
				action,
				selection: currentSelection,
				onToken:
					action === 'define'
						? undefined
						: (delta) => {
								if (activeActionRequestId !== requestId) return;
								actionResponse = { ...actionResponse, text: actionResponse.text + delta };
							}
			});

			if (activeActionRequestId !== requestId) return;
			actionResponse = { ...actionResponse, text: response.text, isLoading: false };

			if (action === 'define' && response.vocabulary) {
				try {
					await addVocabularyEntry(
						response.vocabulary.word,
						response.vocabulary.definition,
						{
							bookId: currentSelection.bookId,
							bookTitle: currentSelection.bookTitle,
							chapterId: currentSelection.chapterId,
							context: currentSelection.context
						},
						response.vocabulary.etymology
					);
					readerProfileStore.recordWordLookup();
					showToast('Saved to vocabulary.');
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Failed to save vocabulary.';
					showToast(message);
				}
			}
		} catch (error) {
			if (activeActionRequestId !== requestId) return;
			const message = error instanceof Error ? error.message : 'Failed to reach the AI provider.';
			actionResponse = { ...actionResponse, text: message, isLoading: false, error: message };
		}
	};

	const closeActionResponse = () => {
		actionResponse = { ...actionResponse, open: false };
	};

	const openNoteEditor = (highlight: Highlight, x: number, y: number) => {
		noteEditor = {
			open: true,
			highlightId: highlight.id,
			note: highlight.note ?? '',
			saving: false,
			error: null,
			x,
			y
		};
	};

	const closeNoteEditor = () => {
		noteEditor = { ...noteEditor, open: false };
	};

	const handleNoteSave = async (event: CustomEvent<{ note: string }>) => {
		if (!noteEditor.highlightId) return;
		const highlight = highlights.find((item) => item.id === noteEditor.highlightId);
		if (!highlight) return;
		noteEditor = { ...noteEditor, saving: true, error: null };
		try {
			const updated: Highlight = {
				...highlight,
				note: event.detail.note || undefined,
				updatedAt: Date.now()
			};
			await adapter.saveHighlight(updated);
			highlights = highlights.map((item) => (item.id === updated.id ? updated : item));
			noteEditor = { ...noteEditor, saving: false, open: false };
			showToast('Note saved.');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to save note.';
			noteEditor = { ...noteEditor, saving: false, error: message };
		}
	};

	const handleNoteDelete = async () => {
		if (!noteEditor.highlightId) return;
		const highlight = highlights.find((item) => item.id === noteEditor.highlightId);
		if (!highlight) return;
		noteEditor = { ...noteEditor, saving: true, error: null };
		try {
			await adapter.deleteHighlight(highlight.id);
			highlights = highlights.filter((item) => item.id !== highlight.id);
			if (contentRoot) {
				const chapterEl = contentRoot.querySelector<HTMLElement>(
					`[data-chapter-id="${highlight.chapterId}"] .chapter-body`
				);
				removeHighlightMarks(chapterEl, highlight.id);
			}
			noteEditor = { ...noteEditor, saving: false, open: false };
			showToast('Highlight removed.');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to remove highlight.';
			noteEditor = { ...noteEditor, saving: false, error: message };
		}
	};

	const closeToc = () => {
		tocOpen = false;
	};

	const handleSearchResult = (event: CustomEvent<{ chapterIndex: number; text: string }>) => {
		const { chapterIndex } = event.detail;
		void scrollToChapter(chapterIndex);
	};

	const openSummaryPanel = (tab: 'summary' | 'discussion' | 'recap', chapterIndex = currentChapter) => {
		summaryPanelTab = tab;
		summaryChapterIndex = chapterIndex;
		summaryPanelOpen = true;
	};

	const closeSummaryPanel = () => {
		summaryPanelOpen = false;
	};

	const openAnalysisPanel = (tab: 'analysis' | 'themes' | 'characters' = 'analysis') => {
		analysisPanelTab = tab;
		analysisPanelOpen = true;
	};

	const closeAnalysisPanel = () => {
		analysisPanelOpen = false;
	};

	const applyHighlights = () => {
		if (!contentRoot) return;
		const chapterBodies = contentRoot.querySelectorAll<HTMLElement>('.chapter-body');
		chapterBodies.forEach((body) => clearHighlightMarks(body));
		for (const highlight of highlights) {
			const chapterBody = contentRoot.querySelector<HTMLElement>(
				`[data-chapter-id="${highlight.chapterId}"] .chapter-body`
			);
			applyHighlightToRoot(chapterBody, highlight);
		}
		if (pendingHighlightId) {
			void revealHighlight(pendingHighlightId);
		}
	};

	const revealHighlight = async (id: string) => {
		if (!contentRoot) return;
		let mark = contentRoot.querySelector<HTMLElement>(
			`mark.reader-highlight[data-highlight-id="${id}"]`
		);
		if (!mark) {
			const highlight = highlights.find((item) => item.id === id);
			if (highlight) {
				const chapterIndex = book.chapters.findIndex((chapter) => chapter.id === highlight.chapterId);
				if (chapterIndex >= 0) {
					await ensureChaptersRenderedThrough(chapterIndex);
					await tick();
				}
				const chapterBody = contentRoot.querySelector<HTMLElement>(
					`[data-chapter-id="${highlight.chapterId}"] .chapter-body`
				);
				if (chapterBody) {
					applyHighlightToRoot(chapterBody, highlight);
					const range = resolveHighlightRange(chapterBody, highlight);
					if (range) {
						const rect = range.getBoundingClientRect();
						const scrollTop = window.scrollY + rect.top - 120;
						window.scrollTo({ top: Math.max(scrollTop, 0), behavior: 'smooth' });
					}
					mark = contentRoot.querySelector<HTMLElement>(
						`mark.reader-highlight[data-highlight-id="${id}"]`
					);
				}
			}
		}
		if (!mark) return;
		mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
		mark.classList.add('highlight-pulse');
		window.setTimeout(() => mark.classList.remove('highlight-pulse'), 1400);
		pendingHighlightId = null;
	};

	const handleContentClick = (event: MouseEvent) => {
		const target = event.target as HTMLElement | null;
		if (!target) return;
		const mark = target.closest('mark.reader-highlight') as HTMLElement | null;
		if (!mark || !contentRoot) return;
		const highlightId = mark.dataset.highlightId;
		if (!highlightId) return;
		const highlight = highlights.find((item) => item.id === highlightId);
		if (!highlight) return;
		const rect = mark.getBoundingClientRect();
		openNoteEditor(highlight, clampX(rect.left + rect.width / 2), rect.bottom + 8);
	};

	const SCROLL_AMOUNT = 100;
	const getPageScrollAmount = () => (typeof window !== 'undefined' ? window.innerHeight * 0.8 : 600);

	const handleKeydown = (event: KeyboardEvent) => {
		// Don't handle if user is typing in an input/textarea
		const target = event.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
			return;
		}

		// Don't handle if chat panel is open (let it handle its own keys)
		if (chatPanelOpen) {
			// Only handle Escape to close chat
			if (event.key === 'Escape') {
				chatStore.close();
				event.preventDefault();
			}
			return;
		}

		switch (event.key) {
			// Scroll down
			case 'j':
			case 'ArrowDown':
				window.scrollBy({ top: SCROLL_AMOUNT, behavior: 'smooth' });
				event.preventDefault();
				break;

			// Scroll up
			case 'k':
			case 'ArrowUp':
				window.scrollBy({ top: -SCROLL_AMOUNT, behavior: 'smooth' });
				event.preventDefault();
				break;

			// Page down
			case ' ':
			case 'PageDown':
				if (!event.shiftKey) {
					window.scrollBy({ top: getPageScrollAmount(), behavior: 'smooth' });
					event.preventDefault();
				}
				break;

			// Page up
			case 'PageUp':
				window.scrollBy({ top: -getPageScrollAmount(), behavior: 'smooth' });
				event.preventDefault();
				break;

			// Shift+Space for page up
			case ' ':
				if (event.shiftKey) {
					window.scrollBy({ top: -getPageScrollAmount(), behavior: 'smooth' });
					event.preventDefault();
				}
				break;

			// Next chapter
			case 'ArrowRight':
			case 'n':
				if (currentChapter < totalChapters - 1) {
					void scrollToChapter(currentChapter + 1);
					event.preventDefault();
				}
				break;

			// Previous chapter
			case 'ArrowLeft':
			case 'p':
				if (currentChapter > 0) {
					void scrollToChapter(currentChapter - 1);
					event.preventDefault();
				}
				break;

			// Go to beginning of book
			case 'Home':
				if (event.ctrlKey || event.metaKey) {
					void scrollToChapter(0);
					event.preventDefault();
				}
				break;

			// Go to end of book
			case 'End':
				if (event.ctrlKey || event.metaKey) {
					void scrollToChapter(totalChapters - 1);
					event.preventDefault();
				}
				break;

			// Toggle table of contents
			case 't':
				tocOpen = !tocOpen;
				event.preventDefault();
				break;

			// Open chat
			case 'c':
				chatStore.toggle();
				event.preventDefault();
				break;

			// Toggle focus mode
			case 'f':
				settingsStore.toggleFocusMode();
				event.preventDefault();
				break;

			// Open search
			case '/':
				searchOpen = true;
				event.preventDefault();
				break;

			// Escape - close panels
			case 'Escape':
				if (actionResponse.open) {
					closeActionResponse();
					event.preventDefault();
				} else if (noteEditor.open) {
					closeNoteEditor();
					event.preventDefault();
				} else if (summaryPanelOpen) {
					closeSummaryPanel();
					event.preventDefault();
				} else if (analysisPanelOpen) {
					closeAnalysisPanel();
					event.preventDefault();
				} else if (tocOpen) {
					closeToc();
					event.preventDefault();
				} else if (selectionMenu.open) {
					selectionMenu = { ...selectionMenu, open: false };
					window.getSelection()?.removeAllRanges();
					event.preventDefault();
				}
				break;

			// Go to settings
			case ',':
				if (event.ctrlKey || event.metaKey) {
					goto('/settings');
					event.preventDefault();
				}
				break;
		}
	};

	onMount(async () => {
		const saved = await adapter.getPosition(book.id);
		returningReader = Boolean(saved && (saved.chapterIndex > 0 || saved.scrollY > 0));
		highlights = await adapter.getHighlights(book.id);
		highlightsLoaded = true;
		if (saved) {
			await ensureChaptersRenderedThrough(saved.chapterIndex);
		}
		await tick();
		observeChapters();
		applyHighlights();
		if (saved) {
			currentChapter = saved.chapterIndex;
			window.setTimeout(() => window.scrollTo({ top: saved.scrollY, behavior: 'auto' }), 0);
		}

		window.addEventListener('scroll', handleScroll, { passive: true });
		window.addEventListener('keydown', handleKeydown);
		document.addEventListener('selectionchange', scheduleSelectionUpdate);
		document.addEventListener('mouseup', scheduleSelectionUpdate);
		document.addEventListener('touchend', scheduleSelectionUpdate, { passive: true });
		document.addEventListener('keyup', scheduleSelectionUpdate);
		document.addEventListener('mousedown', handleOutsideClick);
		contentRoot?.addEventListener('click', handleContentClick);

		// Swipe gesture listeners
		document.addEventListener('touchstart', handleTouchStart, { passive: true });
		document.addEventListener('touchmove', handleTouchMove, { passive: true });
		document.addEventListener('touchend', handleTouchEnd, { passive: true });
	});

	onDestroy(() => {
		observer?.disconnect();
		window.removeEventListener('scroll', handleScroll);
		window.removeEventListener('keydown', handleKeydown);
		document.removeEventListener('selectionchange', scheduleSelectionUpdate);
		document.removeEventListener('mouseup', scheduleSelectionUpdate);
		document.removeEventListener('touchend', scheduleSelectionUpdate);
		document.removeEventListener('keyup', scheduleSelectionUpdate);
		document.removeEventListener('mousedown', handleOutsideClick);
		contentRoot?.removeEventListener('click', handleContentClick);
		// Swipe gesture cleanup
		document.removeEventListener('touchstart', handleTouchStart);
		document.removeEventListener('touchmove', handleTouchMove);
		document.removeEventListener('touchend', handleTouchEnd);
		if (scrollTimeout) window.clearTimeout(scrollTimeout);
		if (selectionTimeout) window.clearTimeout(selectionTimeout);
		if (toastTimeout) window.clearTimeout(toastTimeout);
	});

	$: if (book?.id && book.id !== lastBookId) {
		chatStore.reset();
		lastBookId = book.id;
	}

	$: if (highlightId && highlightId !== pendingHighlightId) {
		pendingHighlightId = highlightId;
		// Only attempt to reveal if highlights have been loaded
		// Otherwise, applyHighlights() will handle it after loading
		if (contentRoot && highlightsLoaded) {
			void revealHighlight(highlightId);
		}
	}

	// React to focus mode changes
	$: if (typeof window !== 'undefined') {
		if ($settingsStore.focusMode) {
			// Initialize focus mode after a short delay to ensure DOM is ready
			window.setTimeout(updateFocusParagraph, 100);
		} else {
			clearFocusMode();
		}
	}
</script>

<div class="reader">
	<!-- Reading Progress Bar -->
	{#if showProgress}
		<div class="progress-bar" style="--progress: {scrollProgress}%"></div>
	{/if}

	<!-- Header -->
	<header class="reader-header" class:hidden={!headerVisible} class:indexing={$indexingStore.isIndexing}>
		<button
			type="button"
			class="header-btn toc-btn"
			on:click={() => (tocOpen = !tocOpen)}
			aria-label="Toggle table of contents"
		>
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
				<path d="M3 5h14M3 10h14M3 15h14" />
			</svg>
		</button>

		<div class="header-center">
			<span class="chapter-indicator">{currentChapterTitle}</span>
		</div>

		<div class="header-actions">
			<button
				type="button"
				class="header-btn"
				on:click={() => (searchOpen = true)}
				aria-label="Search in book"
			>
				<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
					<circle cx="8" cy="8" r="5" />
					<path d="M12 12l4 4" />
				</svg>
			</button>
			<button
				type="button"
				class="header-btn"
				on:click={() => goto(`/highlights?bookId=${book.id}`)}
				aria-label="Open highlights"
			>
				Highlights
			</button>
			<button
				type="button"
				class="header-btn"
				on:click={() => goto('/vocabulary')}
				aria-label="Open vocabulary"
			>
				Vocabulary
			</button>
			<button
				type="button"
				class="header-btn"
				on:click={() => openSummaryPanel('summary')}
				aria-label="Summarize this chapter"
			>
				Summary
			</button>
			<button
				type="button"
				class="header-btn"
				on:click={() => openAnalysisPanel('analysis')}
				aria-label="Open deep analysis"
			>
				Analysis
			</button>
			{#if returningReader && currentChapter > 0}
				<button
					type="button"
					class="header-btn"
					on:click={() => openSummaryPanel('recap')}
					aria-label="Recap story so far"
				>
					Recap
				</button>
			{/if}
			<button
				type="button"
				class="header-btn"
				on:click={() => chatStore.toggle()}
				aria-label="Open AI chat"
			>
				Chat
			</button>
			<button
				type="button"
				class="header-btn"
				aria-label="Open settings"
				on:click={() => goto('/settings')}
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="3" />
					<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
				</svg>
			</button>
		</div>
	</header>

	<!-- Table of Contents Sidebar -->
	{#if tocOpen}
		<div class="toc-backdrop" on:click={closeToc} role="presentation"></div>
	{/if}
	<aside class="toc-sidebar" class:open={tocOpen} class:indexing={$indexingStore.isIndexing}>
		<header class="toc-header">
			<h2 class="toc-title">Contents</h2>
			<button type="button" class="close-toc" on:click={closeToc} aria-label="Close contents">
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
					<path d="M15 5L5 15M5 5l10 10" />
				</svg>
			</button>
		</header>
		<nav class="toc-nav">
			{#each book.toc as item, index}
				<button
					type="button"
					class="toc-item"
					class:active={index === currentChapter}
					on:click={() => void scrollToChapter(index)}
				>
					{#if index === currentChapter}
						<span class="toc-marker"></span>
					{/if}
					<span class="toc-label" style="padding-left: {item.level * 16}px">
						{item.label}
					</span>
				</button>
			{/each}
		</nav>
	</aside>

	<!-- Indexing Banner -->
	{#if $indexingStore.isIndexing}
		<div class="indexing-banner">
			<div class="indexing-content">
				<svg class="indexing-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
					<path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
				</svg>
				<span class="indexing-text">
					{#if $indexingStore.stage === 'chunking'}
						Preparing book for search...
					{:else if $indexingStore.stage === 'embedding'}
						Building search index ({$indexingStore.progress}%)
					{:else}
						Processing...
					{/if}
				</span>
			</div>
			<span class="indexing-hint">You can read while this runs. The page may feel slow briefly.</span>
		</div>
	{/if}

	<!-- Main Content -->
	<main
		class="reader-content"
		class:indexing={$indexingStore.isIndexing}
		style={`--max-width-reading: ${$settingsStore.readingWidth}em;`}
		bind:this={contentRoot}
	>
		{#each book.chapters.slice(0, renderedChapterCount) as chapter, index (chapter.id)}
			<ChapterContent
				{chapter}
				{index}
				on:discussion={(event) => openSummaryPanel('discussion', event.detail.chapterIndex)}
			/>
		{/each}
	</main>

	<!-- Progress Footer -->
	{#if showProgress}
		<footer class="reader-footer">
			<span class="progress-text">{currentChapter + 1} / {totalChapters} · {Math.round(scrollProgress)}%</span>
		</footer>
	{/if}

	<!-- Back to Library -->
	<a href="/" class="back-link">
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
			<path d="M10 12L6 8l4-4" />
		</svg>
		Library
	</a>
</div>

<ChatPanel {book} currentChapterIndex={currentChapter} on:jump={handleCitationJump} />
<SummaryPanel
	open={summaryPanelOpen}
	{book}
	chapterIndex={summaryChapterIndex}
	activeTab={summaryPanelTab}
	returning={returningReader}
	settings={$settingsStore}
	on:close={closeSummaryPanel}
/>
<AnalysisPanel
	open={analysisPanelOpen}
	{book}
	chapterIndex={currentChapter}
	activeTab={analysisPanelTab}
	settings={$settingsStore}
	on:close={closeAnalysisPanel}
/>
<SearchPanel
	{book}
	open={searchOpen}
	on:close={() => (searchOpen = false)}
	on:result={handleSearchResult}
/>

<SelectionMenu
	open={selectionMenu.open}
	x={selectionMenu.x}
	y={selectionMenu.y}
	on:action={handleSelectionAction}
/>

<ActionResponse
	open={actionResponse.open}
	x={actionResponse.x}
	y={actionResponse.y}
	action={actionResponse.action}
	text={actionResponse.text}
	isLoading={actionResponse.isLoading}
	error={actionResponse.error}
	on:close={closeActionResponse}
/>

<HighlightNote
	open={noteEditor.open}
	x={noteEditor.x}
	y={noteEditor.y}
	note={noteEditor.note}
	saving={noteEditor.saving}
	error={noteEditor.error}
	on:save={handleNoteSave}
	on:close={closeNoteEditor}
	on:delete={handleNoteDelete}
/>

{#if toast.open}
	<div class="toast" role="status" aria-live="polite">
		{toast.message}
	</div>
{/if}

<style>
	.reader {
		min-height: 100vh;
		position: relative;
		background: var(--bg-primary);
	}

	/* Reading Progress Bar */
	.progress-bar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		z-index: 100;
		background: var(--border-subtle, var(--border));
		overflow: hidden;
	}

	.progress-bar::after {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: var(--progress, 0%);
		background: linear-gradient(
			90deg,
			var(--text-tertiary) 0%,
			var(--text-secondary) 100%
		);
		transition: width 100ms ease-out;
	}

	/* Header */
	.reader-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 40;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3) var(--space-5);
		background: var(--bg-primary);
		transition: transform var(--transition-base), opacity var(--transition-base);
	}

	.reader-header.hidden {
		transform: translateY(-100%);
		opacity: 0;
		pointer-events: none;
	}

	/* Offset header when indexing banner is visible */
	.reader-header.indexing {
		top: 2.5rem;
	}

	.header-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		color: var(--text-tertiary);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
		text-decoration: none;
	}

	.header-btn:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
		text-decoration: none;
	}

	.toc-btn {
		padding: var(--space-2);
	}

	.header-center {
		flex: 1;
		text-align: center;
		min-width: 0;
	}

	.chapter-indicator {
		font-family: var(--font-reading);
		font-size: var(--text-sm);
		color: var(--text-tertiary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		display: block;
		max-width: 320px;
		margin: 0 auto;
		letter-spacing: 0.01em;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	/* TOC Sidebar */
	.toc-backdrop {
		position: fixed;
		inset: 0;
		z-index: 45;
		background: var(--overlay);
		animation: fade-in var(--transition-base) ease-out;
	}

	.toc-sidebar {
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		z-index: 50;
		width: 340px;
		max-width: 85vw;
		background: var(--bg-primary);
		box-shadow: var(--shadow-lg);
		transform: translateX(-100%);
		transition: transform var(--transition-base) ease-out;
		display: flex;
		flex-direction: column;
	}

	.toc-sidebar.open {
		transform: translateX(0);
	}

	/* Offset TOC when indexing banner is visible */
	.toc-sidebar.indexing {
		top: 2.5rem;
	}

	.toc-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-5) var(--space-6);
		border-bottom: 1px solid var(--border);
	}

	.toc-title {
		font-family: var(--font-reading);
		font-size: var(--text-lg);
		font-weight: 400;
		color: var(--text-primary);
		letter-spacing: -0.01em;
	}

	.close-toc {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		color: var(--text-tertiary);
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.close-toc:hover {
		color: var(--text-primary);
		background: var(--bg-secondary);
	}

	.toc-nav {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-4) var(--space-3);
	}

	.toc-item {
		display: flex;
		align-items: center;
		width: 100%;
		padding: var(--space-3) var(--space-4);
		font-size: var(--text-sm);
		color: var(--text-secondary);
		text-align: left;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.toc-item:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.toc-item.active {
		color: var(--text-primary);
		background: var(--bg-secondary);
	}

	.toc-marker {
		width: 5px;
		height: 5px;
		background: var(--text-secondary);
		border-radius: 50%;
		margin-right: var(--space-3);
		flex-shrink: 0;
	}

	.toc-label {
		flex: 1;
		line-height: 1.4;
	}

	/* Main Content */
	.reader-content {
		max-width: var(--max-width-reading);
		margin: 0 auto;
		padding: calc(48px + var(--space-10)) var(--space-6) var(--space-16);
	}

	/* Extra top padding when indexing banner is visible */
	.reader-content.indexing {
		padding-top: calc(48px + var(--space-10) + 2.5rem);
	}

	/* Footer */
	.reader-footer {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 30;
		display: flex;
		justify-content: center;
		padding: var(--space-4);
		pointer-events: none;
	}

	.progress-text {
		font-size: 11px;
		color: var(--text-tertiary);
		letter-spacing: 0.05em;
	}

	/* Back Link */
	.back-link {
		position: fixed;
		bottom: var(--space-6);
		left: var(--space-6);
		z-index: 35;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		color: var(--text-tertiary);
		background: var(--bg-primary);
		border-radius: var(--radius-md);
		text-decoration: none;
		transition: all var(--transition-fast);
		opacity: 0.7;
	}

	.back-link:hover {
		color: var(--text-primary);
		opacity: 1;
		text-decoration: none;
	}

	.toast {
		position: fixed;
		left: 50%;
		bottom: var(--space-6);
		transform: translateX(-50%);
		padding: 10px 16px;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 999px;
		font-size: var(--text-sm);
		color: var(--text-primary);
		box-shadow: var(--shadow-md);
		z-index: 80;
		animation: toast-in 140ms ease-out;
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	/* Animations */
	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	/* Responsive */
	@media (max-width: 768px) {
		.reader-header {
			padding: var(--space-2) var(--space-3);
		}

		.reader-content {
			padding: calc(44px + var(--space-6)) var(--space-5) var(--space-12);
		}

		.reader-content.indexing {
			padding-top: calc(44px + var(--space-6) + 2.5rem);
		}

		.chapter-indicator {
			max-width: 140px;
			font-size: var(--text-xs);
		}

		.header-btn {
			padding: var(--space-2);
			font-size: var(--text-xs);
		}

		.back-link {
			bottom: var(--space-4);
			left: var(--space-4);
			font-size: var(--text-xs);
			padding: var(--space-1) var(--space-2);
		}

		.progress-text {
			font-size: 10px;
		}
	}

	/* Indexing Banner */
	.indexing-banner {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		background: var(--color-accent, #3b82f6);
		color: white;
		padding: 0.5rem 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		font-size: 0.875rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.indexing-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.indexing-spinner {
		width: 1rem;
		height: 1rem;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.indexing-text {
		font-weight: 500;
	}

	.indexing-hint {
		opacity: 0.8;
		font-size: 0.75rem;
	}

	@media (max-width: 600px) {
		.indexing-banner {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
			padding: 0.75rem 1rem;
		}

		.indexing-hint {
			font-size: 0.7rem;
		}
	}
</style>
