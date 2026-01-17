import type { Highlight, HighlightRange } from '$lib/types/highlight';

type PathRoot = HTMLElement | null;

const getNodePath = (node: Node, root: HTMLElement): number[] => {
	const path: number[] = [];
	let current: Node | null = node;
	while (current && current !== root) {
		const parentNodeRef: Node | null = current.parentNode;
		if (!parentNodeRef) return [];
		const index = Array.prototype.indexOf.call(parentNodeRef.childNodes, current);
		path.unshift(index);
		current = parentNodeRef;
	}
	return path;
};

const resolveNodePath = (root: HTMLElement, path: number[]): Node | null => {
	let current: Node = root;
	for (const index of path) {
		if (!current.childNodes[index]) return null;
		current = current.childNodes[index];
	}
	return current;
};

export const serializeRange = (range: Range, root: HTMLElement): HighlightRange | null => {
	const startPath = getNodePath(range.startContainer, root);
	const endPath = getNodePath(range.endContainer, root);
	if (!startPath.length || !endPath.length) return null;
	return {
		startPath,
		startOffset: range.startOffset,
		endPath,
		endOffset: range.endOffset
	};
};

export const resolveRange = (data: HighlightRange, root: HTMLElement): Range | null => {
	const startNode = resolveNodePath(root, data.startPath);
	const endNode = resolveNodePath(root, data.endPath);
	if (!startNode || !endNode) return null;
	const range = document.createRange();
	try {
		range.setStart(startNode, data.startOffset);
		range.setEnd(endNode, data.endOffset);
	} catch {
		return null;
	}
	return range;
};

export const clearHighlightMarks = (root: HTMLElement): void => {
	const marks = root.querySelectorAll('mark.reader-highlight');
	marks.forEach((mark) => {
		const parent = mark.parentNode;
		if (!parent) return;
		while (mark.firstChild) {
			parent.insertBefore(mark.firstChild, mark);
		}
		parent.removeChild(mark);
		parent.normalize();
	});
};

const wrapRangeWithMarks = (range: Range, highlightId: string): HTMLElement[] => {
	const marks: HTMLElement[] = [];
	const ancestor = range.commonAncestorContainer;

	if (ancestor.nodeType === Node.TEXT_NODE) {
		const mark = document.createElement('mark');
		mark.className = 'reader-highlight';
		mark.dataset.highlightId = highlightId;
		try {
			range.surroundContents(mark);
			marks.push(mark);
		} catch {
			// Ignore ranges that can't be wrapped.
		}
		return marks;
	}

	const walkerRoot = ancestor instanceof HTMLElement ? ancestor : ancestor.parentNode;
	if (!walkerRoot) return marks;

	const walker = document.createTreeWalker(
		walkerRoot,
		NodeFilter.SHOW_TEXT,
		{
			acceptNode: (node) => (range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT)
		}
	);
	const textNodes: Text[] = [];
	while (walker.nextNode()) {
		textNodes.push(walker.currentNode as Text);
	}

	textNodes.forEach((node) => {
		const nodeRange = document.createRange();
		nodeRange.selectNodeContents(node);
		if (node === range.startContainer) {
			nodeRange.setStart(node, range.startOffset);
		}
		if (node === range.endContainer) {
			nodeRange.setEnd(node, range.endOffset);
		}
		if (nodeRange.collapsed) return;
		const mark = document.createElement('mark');
		mark.className = 'reader-highlight';
		mark.dataset.highlightId = highlightId;
		try {
			nodeRange.surroundContents(mark);
			marks.push(mark);
		} catch {
			// Ignore ranges that can't be wrapped.
		}
	});

	return marks;
};

const normalizeWithMap = (value: string): { normalized: string; map: number[] } => {
	const map: number[] = [];
	let normalized = '';
	let lastWasSpace = false;

	for (let i = 0; i < value.length; i += 1) {
		const ch = value[i];
		const isSpace = /\s/.test(ch);
		if (isSpace) {
			if (lastWasSpace) continue;
			normalized += ' ';
			map.push(i);
			lastWasSpace = true;
		} else {
			normalized += ch;
			map.push(i);
			lastWasSpace = false;
		}
	}

	return { normalized, map };
};

const normalizeText = (value: string): string => normalizeWithMap(value).normalized.trim();

const findRangeFromText = (root: HTMLElement, text: string): Range | null => {
	const target = normalizeText(text);
	if (!target) return null;
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
	const nodes: { node: Text; start: number; end: number }[] = [];
	let combined = '';
	while (walker.nextNode()) {
		const node = walker.currentNode as Text;
		const value = node.textContent ?? '';
		const start = combined.length;
		combined += value;
		nodes.push({ node, start, end: combined.length });
	}

	const { normalized, map } = normalizeWithMap(combined);
	const normalizedTarget = target;
	const normalizedIndex = normalized.indexOf(normalizedTarget);
	if (normalizedIndex === -1) return null;

	const originalStart = map[normalizedIndex];
	const originalEnd =
		map[normalizedIndex + normalizedTarget.length - 1] !== undefined
			? map[normalizedIndex + normalizedTarget.length - 1] + 1
			: originalStart + normalizedTarget.length;

	const range = document.createRange();
	const startEntry = nodes.find((entry) => originalStart >= entry.start && originalStart <= entry.end);
	const endEntry = nodes.find((entry) => originalEnd >= entry.start && originalEnd <= entry.end);
	if (!startEntry || !endEntry) return null;
	range.setStart(startEntry.node, Math.max(0, originalStart - startEntry.start));
	range.setEnd(endEntry.node, Math.max(0, originalEnd - endEntry.start));
	return range;
};

export const resolveHighlightRange = (root: PathRoot, highlight: Highlight): Range | null => {
	if (!root) return null;
	let range: Range | null = null;
	if (highlight.range) {
		range = resolveRange(highlight.range, root);
	}
	if (!range) {
		range = findRangeFromText(root, highlight.selectedText);
	}
	return range;
};

export const applyHighlightToRoot = (
	root: PathRoot,
	highlight: Highlight
): HTMLElement[] => {
	if (!root) return [];
	const range = resolveHighlightRange(root, highlight);
	if (!range) return [];
	return wrapRangeWithMarks(range, highlight.id);
};

export const removeHighlightMarks = (root: PathRoot, highlightId: string): void => {
	if (!root) return;
	const marks = root.querySelectorAll(`mark.reader-highlight[data-highlight-id="${highlightId}"]`);
	marks.forEach((mark) => {
		const parent = mark.parentNode;
		if (!parent) return;
		while (mark.firstChild) {
			parent.insertBefore(mark.firstChild, mark);
		}
		parent.removeChild(mark);
		parent.normalize();
	});
};
