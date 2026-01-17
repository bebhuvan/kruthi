export interface Chapter {
	id: string;
	title: string;
	href: string;
	html: string;
}

export interface TocItem {
	label: string;
	href: string;
	chapterIndex: number;
	level: number;
}

export interface Book {
	id: string;
	title: string;
	author: string;
	chapters: Chapter[];
	toc: TocItem[];
}

export interface StoredBook {
	id: string;
	title: string;
	author: string;
	file: Blob;
	addedAt: number;
}

export interface ReadingPosition {
	bookId: string;
	scrollY: number;
	chapterIndex: number;
	updatedAt: number;
}
