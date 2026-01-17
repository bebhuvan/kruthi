// Curated classics collection
// All books are available from Standard Ebooks or Project Gutenberg

export interface CuratedBook {
	id: string;
	title: string;
	author: string;
	year?: number;
	hours: number; // Approximate reading time
	hook: string; // One-line description
	collections: CollectionId[];
	cover: CoverDesign;
	source: BookSource;
}

export interface CoverDesign {
	letter: string;
	bgColor: string;
	bgColorEnd?: string; // For gradients
	letterColor: string;
	accentColor?: string;
	style: 'filled' | 'outlined' | 'split';
}

export interface BookSource {
	name: 'standard-ebooks' | 'gutenberg';
	url: string;
	epubUrl: string;
}

export type CollectionId =
	| 'bucket-list'
	| 'all-time-greats'
	| 'start-here'
	| 'world-classics'
	| 'indian-classics'
	| 'east-asian'
	| 'middle-eastern'
	| 'latin-american'
	| 'african-diaspora'
	| 'american'
	| 'french'
	| 'russian'
	| 'poetry'
	| 'mystery'
	| 'gothic'
	| 'love-society'
	| 'adventure'
	| 'speculative'
	| 'political-dystopia'
	| 'wit-wonder'
	| 'drama'
	| 'short-stories'
	| 'philosophy'
	| 'economics'
	| 'epic'
	| 'short'
	| 'history'
	| 'mythology'
	| 'religion';

export interface Collection {
	id: CollectionId;
	name: string;
	icon: string;
	description: string;
}

export const collections: Collection[] = [
	{
		id: 'bucket-list',
		name: 'Read Before You Die',
		icon: '💀',
		description: 'The essential lifetime reading list'
	},
	{
		id: 'start-here',
		name: 'Start Here',
		icon: '📖',
		description: 'Short, gripping, unforgettable'
	},
	{
		id: 'world-classics',
		name: 'World Classics',
		icon: '🌍',
		description: 'Landmark texts across civilizations'
	},
	{
		id: 'all-time-greats',
		name: 'All Time Greats',
		icon: '⭐',
		description: 'The essential classics'
	},
	{
		id: 'short',
		name: 'Under 4 Hours',
		icon: '⚡',
		description: 'Quick but powerful'
	},
	{
		id: 'short-stories',
		name: 'Short Story Masters',
		icon: '📚',
		description: 'The art of the short form'
	},
	{
		id: 'drama',
		name: 'Drama & Theatre',
		icon: '🎭',
		description: 'Plays meant to be heard aloud'
	},
	{
		id: 'adventure',
		name: 'Adventure & Intrigue',
		icon: '⚔️',
		description: 'Danger, journey, revenge'
	},
	{
		id: 'mystery',
		name: 'Mystery & Detection',
		icon: '🔍',
		description: 'The game is afoot'
	},
	{
		id: 'gothic',
		name: 'Gothic & Horror',
		icon: '🌑',
		description: 'Darkness and dread'
	},
	{
		id: 'love-society',
		name: 'Love & Society',
		icon: '💔',
		description: 'Hearts against the world'
	},
	{
		id: 'speculative',
		name: 'Speculative Visions',
		icon: '🧪',
		description: 'Thought experiments and strange futures'
	},
	{
		id: 'political-dystopia',
		name: 'Power & Dystopia',
		icon: '🛑',
		description: 'Surveillance, ideology, and resistance'
	},
	{
		id: 'wit-wonder',
		name: 'Wit & Wonder',
		icon: '😄',
		description: 'Pure enjoyment'
	},
	{
		id: 'philosophy',
		name: 'Philosophy',
		icon: '🏛',
		description: 'The examined life'
	},
	{
		id: 'religion',
		name: 'Religion & Spirituality',
		icon: '✨',
		description: 'Sacred texts and seekers'
	},
	{
		id: 'poetry',
		name: 'Poetry',
		icon: '🪶',
		description: 'Verse that endures'
	},
	{
		id: 'russian',
		name: 'Russian Literature',
		icon: '🇷🇺',
		description: 'The depths of the soul'
	},
	{
		id: 'indian-classics',
		name: 'Indian Classics',
		icon: '🪷',
		description: 'From the subcontinent'
	},
	{
		id: 'east-asian',
		name: 'East Asian Classics',
		icon: '🌸',
		description: 'From China, Japan, and beyond'
	},
	{
		id: 'middle-eastern',
		name: 'Middle Eastern Classics',
		icon: '🌙',
		description: 'Ancient and medieval worlds'
	},
	{
		id: 'latin-american',
		name: 'Latin American Classics',
		icon: '🌎',
		description: 'Foundational voices and myths'
	},
	{
		id: 'african-diaspora',
		name: 'African Diaspora',
		icon: '🪘',
		description: 'Black voices and histories'
	},
	{
		id: 'american',
		name: 'American Classics',
		icon: '🗽',
		description: 'The new world voice'
	},
	{
		id: 'french',
		name: 'French Literature',
		icon: '🇫🇷',
		description: 'Art, revolution, passion'
	},
	{
		id: 'mythology',
		name: 'Mythology & Legend',
		icon: '🏺',
		description: 'Stories that shaped civilizations'
	},
	{
		id: 'history',
		name: 'History',
		icon: '📜',
		description: 'Understanding our past'
	},
	{
		id: 'economics',
		name: 'Economics & Politics',
		icon: '📊',
		description: 'How the world works'
	},
	{
		id: 'epic',
		name: 'Epic Journeys',
		icon: '🏔',
		description: 'The big commitments'
	}
];

export const curatedBooks: CuratedBook[] = [
	// === START HERE ===
	{
		id: 'great-gatsby',
		title: 'The Great Gatsby',
		author: 'F. Scott Fitzgerald',
		year: 1925,
		hours: 3,
		hook: 'The American Dream, shattered',
		collections: ['bucket-list', 'all-time-greats', 'start-here', 'american', 'short'],
		cover: {
			letter: 'G',
			bgColor: '#1a3a4a',
			bgColorEnd: '#0d252f',
			letterColor: '#d4af37',
			style: 'outlined'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/f-scott-fitzgerald/the-great-gatsby',
			epubUrl: 'https://standardebooks.org/ebooks/f-scott-fitzgerald/the-great-gatsby/downloads/f-scott-fitzgerald_the-great-gatsby.epub'
		}
	},
	{
		id: 'island-of-dr-moreau',
		title: 'The Island of Dr. Moreau',
		author: 'H. G. Wells',
		year: 1896,
		hours: 3.5,
		hook: 'A remote island, a mad experiment',
		collections: ['start-here', 'speculative', 'gothic', 'short'],
		cover: {
			letter: 'M',
			bgColor: '#3d1f1f',
			letterColor: '#f3e5c0',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/159',
			epubUrl: 'https://www.gutenberg.org/cache/epub/159/pg159-images.epub'
		}
	},
	{
		id: 'christmas-carol',
		title: 'A Christmas Carol',
		author: 'Charles Dickens',
		year: 1843,
		hours: 2,
		hook: 'Redemption in one night',
		collections: ['start-here', 'short'],
		cover: {
			letter: 'C',
			bgColor: '#1a472a',
			letterColor: '#c9a227',
			accentColor: '#8b0000',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/charles-dickens/a-christmas-carol',
			epubUrl: 'https://standardebooks.org/ebooks/charles-dickens/a-christmas-carol/downloads/charles-dickens_a-christmas-carol.epub'
		}
	},
	{
		id: 'metamorphosis',
		title: 'The Metamorphosis',
		author: 'Franz Kafka',
		year: 1915,
		hours: 1.5,
		hook: 'You wake up as a bug. Now what?',
		collections: ['start-here', 'short', 'gothic'],
		cover: {
			letter: 'K',
			bgColor: '#2c2c2c',
			letterColor: '#a0522d',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/5200',
			epubUrl: 'https://www.gutenberg.org/cache/epub/5200/pg5200-images.epub'
		}
	},
	{
		id: 'jekyll-hyde',
		title: 'Strange Case of Dr. Jekyll and Mr. Hyde',
		author: 'Robert Louis Stevenson',
		year: 1886,
		hours: 2,
		hook: 'The monster is you',
		collections: ['start-here', 'gothic', 'short'],
		cover: {
			letter: 'J',
			bgColor: '#1a1a2e',
			bgColorEnd: '#16213e',
			letterColor: '#e8e8e8',
			accentColor: '#4a1a2e',
			style: 'split'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/robert-louis-stevenson/the-strange-case-of-dr-jekyll-and-mr-hyde',
			epubUrl: 'https://standardebooks.org/ebooks/robert-louis-stevenson/the-strange-case-of-dr-jekyll-and-mr-hyde/downloads/robert-louis-stevenson_the-strange-case-of-dr-jekyll-and-mr-hyde.epub'
		}
	},
	{
		id: 'hound-baskervilles',
		title: 'The Hound of the Baskervilles',
		author: 'Arthur Conan Doyle',
		year: 1902,
		hours: 4,
		hook: 'A demon hound on the moors',
		collections: ['start-here', 'mystery', 'gothic'],
		cover: {
			letter: 'H',
			bgColor: '#2a2a28',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/arthur-conan-doyle/the-hound-of-the-baskervilles',
			epubUrl: 'https://standardebooks.org/ebooks/arthur-conan-doyle/the-hound-of-the-baskervilles/downloads/arthur-conan-doyle_the-hound-of-the-baskervilles.epub'
		}
	},
	{
		id: 'time-machine',
		title: 'The Time Machine',
		author: 'H. G. Wells',
		year: 1895,
		hours: 3,
		hook: 'Journey to the end of humanity',
		collections: ['start-here', 'speculative', 'short'],
		cover: {
			letter: 'T',
			bgColor: '#0f1626',
			letterColor: '#6eb5ff',
			style: 'outlined'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/h-g-wells/the-time-machine',
			epubUrl: 'https://standardebooks.org/ebooks/h-g-wells/the-time-machine/downloads/h-g-wells_the-time-machine.epub'
		}
	},
	{
		id: 'siddhartha',
		title: 'Siddhartha',
		author: 'Hermann Hesse',
		year: 1922,
		hours: 3,
		hook: 'Finding meaning, beautifully',
		collections: ['start-here', 'religion', 'short'],
		cover: {
			letter: 'S',
			bgColor: '#e8dcc8',
			letterColor: '#5d4e37',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/hermann-hesse/siddhartha/gunther-olesch_anke-dreher_amy-coulter_stefan-langer_semyon-chaichenets',
			epubUrl: 'https://standardebooks.org/ebooks/hermann-hesse/siddhartha/gunther-olesch_anke-dreher_amy-coulter_stefan-langer_semyon-chaichenets/downloads/hermann-hesse_siddhartha_gunther-olesch_anke-dreher_amy-coulter_stefan-langer_semyon-chaichenets.epub'
		}
	},

	// === MYSTERY & DETECTION ===
	{
		id: 'sherlock-adventures',
		title: 'The Adventures of Sherlock Holmes',
		author: 'Arthur Conan Doyle',
		year: 1892,
		hours: 8,
		hook: 'The greatest detective, 12 cases',
		collections: ['mystery', 'short-stories'],
		cover: {
			letter: 'S',
			bgColor: '#2a2a28',
			bgColorEnd: '#3d3d3a',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/arthur-conan-doyle/the-adventures-of-sherlock-holmes',
			epubUrl: 'https://standardebooks.org/ebooks/arthur-conan-doyle/the-adventures-of-sherlock-holmes/downloads/arthur-conan-doyle_the-adventures-of-sherlock-holmes.epub'
		}
	},
	{
		id: 'study-scarlet',
		title: 'A Study in Scarlet',
		author: 'Arthur Conan Doyle',
		year: 1887,
		hours: 4,
		hook: 'Where Holmes and Watson meet',
		collections: ['mystery', 'short'],
		cover: {
			letter: 'A',
			bgColor: '#2a2a28',
			letterColor: '#8b0000',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/arthur-conan-doyle/a-study-in-scarlet',
			epubUrl: 'https://standardebooks.org/ebooks/arthur-conan-doyle/a-study-in-scarlet/downloads/arthur-conan-doyle_a-study-in-scarlet.epub'
		}
	},
	{
		id: 'moonstone',
		title: 'The Moonstone',
		author: 'Wilkie Collins',
		year: 1868,
		hours: 16,
		hook: 'The first detective novel',
		collections: ['mystery'],
		cover: {
			letter: 'M',
			bgColor: '#1a1a3a',
			letterColor: '#e8e8ff',
			accentColor: '#ffd700',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/wilkie-collins/the-moonstone',
			epubUrl: 'https://standardebooks.org/ebooks/wilkie-collins/the-moonstone/downloads/wilkie-collins_the-moonstone.epub'
		}
	},
	{
		id: 'woman-white',
		title: 'The Woman in White',
		author: 'Wilkie Collins',
		year: 1859,
		hours: 20,
		hook: 'Identity, madness, conspiracy',
		collections: ['mystery', 'gothic'],
		cover: {
			letter: 'W',
			bgColor: '#2c2c2c',
			letterColor: '#f5f5f5',
			style: 'outlined'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/wilkie-collins/the-woman-in-white',
			epubUrl: 'https://standardebooks.org/ebooks/wilkie-collins/the-woman-in-white/downloads/wilkie-collins_the-woman-in-white.epub'
		}
	},
	{
		id: 'father-brown',
		title: 'The Innocence of Father Brown',
		author: 'G. K. Chesterton',
		year: 1911,
		hours: 6,
		hook: 'A priest who understands criminals',
		collections: ['mystery', 'short-stories'],
		cover: {
			letter: 'F',
			bgColor: '#3d2914',
			letterColor: '#f5e6d3',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/g-k-chesterton/the-innocence-of-father-brown',
			epubUrl: 'https://standardebooks.org/ebooks/g-k-chesterton/the-innocence-of-father-brown/downloads/g-k-chesterton_the-innocence-of-father-brown.epub'
		}
	},
	{
		id: 'arsene-lupin',
		title: 'Arsène Lupin, Gentleman Burglar',
		author: 'Maurice Leblanc',
		year: 1907,
		hours: 5,
		hook: 'The charming thief',
		collections: ['mystery', 'adventure', 'short-stories'],
		cover: {
			letter: 'L',
			bgColor: '#1a1a1a',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/6133',
			epubUrl: 'https://www.gutenberg.org/cache/epub/6133/pg6133-images.epub'
		}
	},

	// === GOTHIC & HORROR ===
	{
		id: 'frankenstein',
		title: 'Frankenstein',
		author: 'Mary Shelley',
		year: 1818,
		hours: 7,
		hook: 'Creator and creature',
		collections: ['bucket-list', 'all-time-greats', 'start-here', 'gothic', 'speculative'],
		cover: {
			letter: 'F',
			bgColor: '#1f2f1f',
			bgColorEnd: '#0f170f',
			letterColor: '#9cb99c',
			accentColor: '#7fff7f',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/mary-shelley/frankenstein',
			epubUrl: 'https://standardebooks.org/ebooks/mary-shelley/frankenstein/downloads/mary-shelley_frankenstein.epub'
		}
	},
	{
		id: 'dracula',
		title: 'Dracula',
		author: 'Bram Stoker',
		year: 1897,
		hours: 12,
		hook: 'The original vampire',
		collections: ['gothic'],
		cover: {
			letter: 'D',
			bgColor: '#2d0a0a',
			bgColorEnd: '#0d0303',
			letterColor: '#8b0000',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/bram-stoker/dracula',
			epubUrl: 'https://standardebooks.org/ebooks/bram-stoker/dracula/downloads/bram-stoker_dracula.epub'
		}
	},
	{
		id: 'dorian-gray',
		title: 'The Picture of Dorian Gray',
		author: 'Oscar Wilde',
		year: 1890,
		hours: 5,
		hook: 'Beauty corrupts absolutely',
		collections: ['gothic', 'start-here'],
		cover: {
			letter: 'D',
			bgColor: '#2c2c2c',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/oscar-wilde/the-picture-of-dorian-gray',
			epubUrl: 'https://standardebooks.org/ebooks/oscar-wilde/the-picture-of-dorian-gray/downloads/oscar-wilde_the-picture-of-dorian-gray.epub'
		}
	},
	{
		id: 'turn-screw',
		title: 'The Turn of the Screw',
		author: 'Henry James',
		year: 1898,
		hours: 3,
		hook: 'Ghosts or madness?',
		collections: ['gothic', 'short'],
		cover: {
			letter: 'T',
			bgColor: '#1a1a1a',
			letterColor: '#8b8b8b',
			style: 'outlined'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/henry-james/the-turn-of-the-screw',
			epubUrl: 'https://standardebooks.org/ebooks/henry-james/the-turn-of-the-screw/downloads/henry-james_the-turn-of-the-screw.epub'
		}
	},
	{
		id: 'yellow-wallpaper',
		title: 'The Yellow Wallpaper',
		author: 'Charlotte Perkins Gilman',
		year: 1892,
		hours: 1.5,
		hook: 'A room, a diary, and a mind unravels',
		collections: ['gothic', 'american', 'short'],
		cover: {
			letter: 'Y',
			bgColor: '#f0e4a8',
			letterColor: '#2c2c2c',
			accentColor: '#8b7a3d',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/1952',
			epubUrl: 'https://www.gutenberg.org/cache/epub/1952/pg1952-images.epub'
		}
	},
	{
		id: 'phantom-opera',
		title: 'The Phantom of the Opera',
		author: 'Gaston Leroux',
		year: 1910,
		hours: 6,
		hook: 'Obsession beneath the stage',
		collections: ['gothic'],
		cover: {
			letter: 'P',
			bgColor: '#1a0a0a',
			letterColor: '#f5f5f5',
			accentColor: '#c9a227',
			style: 'split'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/gaston-leroux/the-phantom-of-the-opera/alexander-teixeira-de-mattos',
			epubUrl: 'https://standardebooks.org/ebooks/gaston-leroux/the-phantom-of-the-opera/alexander-teixeira-de-mattos/downloads/gaston-leroux_the-phantom-of-the-opera_alexander-teixeira-de-mattos.epub'
		}
	},

	// === LOVE & SOCIETY ===
	{
		id: 'pride-prejudice',
		title: 'Pride and Prejudice',
		author: 'Jane Austen',
		year: 1813,
		hours: 10,
		hook: 'Wit, romance, perfection',
		collections: ['bucket-list', 'all-time-greats', 'start-here', 'love-society'],
		cover: {
			letter: 'P',
			bgColor: '#8b4557',
			bgColorEnd: '#5c2e3a',
			letterColor: '#f5e6d3',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/jane-austen/pride-and-prejudice',
			epubUrl: 'https://standardebooks.org/ebooks/jane-austen/pride-and-prejudice/downloads/jane-austen_pride-and-prejudice.epub'
		}
	},
	{
		id: 'jane-eyre',
		title: 'Jane Eyre',
		author: 'Charlotte Brontë',
		year: 1847,
		hours: 14,
		hook: 'Reader, I married him',
		collections: ['bucket-list', 'love-society', 'gothic'],
		cover: {
			letter: 'J',
			bgColor: '#4a3728',
			letterColor: '#e8d5c4',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/charlotte-bronte/jane-eyre',
			epubUrl: 'https://standardebooks.org/ebooks/charlotte-bronte/jane-eyre/downloads/charlotte-bronte_jane-eyre.epub'
		}
	},
	{
		id: 'wuthering-heights',
		title: 'Wuthering Heights',
		author: 'Emily Brontë',
		year: 1847,
		hours: 10,
		hook: 'Love as destruction',
		collections: ['love-society', 'gothic'],
		cover: {
			letter: 'W',
			bgColor: '#2c2416',
			letterColor: '#a89070',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/emily-bronte/wuthering-heights',
			epubUrl: 'https://standardebooks.org/ebooks/emily-bronte/wuthering-heights/downloads/emily-bronte_wuthering-heights.epub'
		}
	},
	{
		id: 'awakening-stories',
		title: 'The Awakening, and Selected Short Stories',
		author: 'Kate Chopin',
		year: 1899,
		hours: 7,
		hook: 'Desire, defiance, and the sea',
		collections: ['love-society', 'american', 'short-stories'],
		cover: {
			letter: 'A',
			bgColor: '#0f3d4a',
			bgColorEnd: '#0a2630',
			letterColor: '#f5e6d3',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/160',
			epubUrl: 'https://www.gutenberg.org/cache/epub/160/pg160-images.epub'
		}
	},
	{
		id: 'house-of-mirth',
		title: 'The House of Mirth',
		author: 'Edith Wharton',
		year: 1905,
		hours: 12,
		hook: 'A society beauty meets a pitiless world',
		collections: ['all-time-greats', 'love-society', 'american'],
		cover: {
			letter: 'H',
			bgColor: '#3d3225',
			letterColor: '#f5e6d3',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/edith-wharton/the-house-of-mirth',
			epubUrl: 'https://standardebooks.org/ebooks/edith-wharton/the-house-of-mirth/downloads/edith-wharton_the-house-of-mirth.epub'
		}
	},
	{
		id: 'great-expectations',
		title: 'Great Expectations',
		author: 'Charles Dickens',
		year: 1861,
		hours: 14,
		hook: 'From shame to self-knowledge',
		collections: ['love-society', 'adventure'],
		cover: {
			letter: 'G',
			bgColor: '#3d3225',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/charles-dickens/great-expectations',
			epubUrl: 'https://standardebooks.org/ebooks/charles-dickens/great-expectations/downloads/charles-dickens_great-expectations.epub'
		}
	},
	{
		id: 'emma',
		title: 'Emma',
		author: 'Jane Austen',
		year: 1815,
		hours: 12,
		hook: 'A matchmaker who cannot see herself',
		collections: ['love-society'],
		cover: {
			letter: 'E',
			bgColor: '#6b8e6b',
			letterColor: '#f5f5f0',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/jane-austen/emma',
			epubUrl: 'https://standardebooks.org/ebooks/jane-austen/emma/downloads/jane-austen_emma.epub'
		}
	},
	{
		id: 'middlemarch',
		title: 'Middlemarch',
		author: 'George Eliot',
		year: 1871,
		hours: 30,
		hook: 'The greatest English novel',
		collections: ['bucket-list', 'all-time-greats', 'love-society', 'epic'],
		cover: {
			letter: 'M',
			bgColor: '#5c4a3d',
			letterColor: '#e8dcc8',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/george-eliot/middlemarch',
			epubUrl: 'https://standardebooks.org/ebooks/george-eliot/middlemarch/downloads/george-eliot_middlemarch.epub'
		}
	},
	{
		id: 'anna-karenina',
		title: 'Anna Karenina',
		author: 'Leo Tolstoy',
		year: 1877,
		hours: 30,
		hook: 'Love, society, everything',
		collections: ['bucket-list', 'all-time-greats', 'love-society', 'russian', 'epic'],
		cover: {
			letter: 'A',
			bgColor: '#4a1a1a',
			letterColor: '#e8d5c4',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/leo-tolstoy/anna-karenina/constance-garnett',
			epubUrl: 'https://standardebooks.org/ebooks/leo-tolstoy/anna-karenina/constance-garnett/downloads/leo-tolstoy_anna-karenina_constance-garnett.epub'
		}
	},

	// === ADVENTURE & INTRIGUE ===
	{
		id: 'treasure-island',
		title: 'Treasure Island',
		author: 'Robert Louis Stevenson',
		year: 1883,
		hours: 6,
		hook: 'The adventure blueprint',
		collections: ['adventure'],
		cover: {
			letter: 'T',
			bgColor: '#1a3a4a',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/robert-louis-stevenson/treasure-island',
			epubUrl: 'https://standardebooks.org/ebooks/robert-louis-stevenson/treasure-island/downloads/robert-louis-stevenson_treasure-island.epub'
		}
	},
	{
		id: 'count-monte-cristo',
		title: 'The Count of Monte Cristo',
		author: 'Alexandre Dumas',
		year: 1844,
		hours: 40,
		hook: 'Revenge, perfectly plotted',
		collections: ['bucket-list', 'all-time-greats', 'french', 'adventure', 'epic'],
		cover: {
			letter: 'C',
			bgColor: '#1a1a2e',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/alexandre-dumas/the-count-of-monte-cristo/chapman-and-hall',
			epubUrl: 'https://standardebooks.org/ebooks/alexandre-dumas/the-count-of-monte-cristo/chapman-and-hall/downloads/alexandre-dumas_the-count-of-monte-cristo_chapman-and-hall.epub'
		}
	},
	{
		id: 'three-musketeers',
		title: 'The Three Musketeers',
		author: 'Alexandre Dumas',
		year: 1844,
		hours: 20,
		hook: 'All for one, one for all',
		collections: ['french', 'adventure'],
		cover: {
			letter: '3',
			bgColor: '#2e1a1a',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/alexandre-dumas/the-three-musketeers/william-robson',
			epubUrl: 'https://standardebooks.org/ebooks/alexandre-dumas/the-three-musketeers/william-robson/downloads/alexandre-dumas_the-three-musketeers_william-robson.epub'
		}
	},
	{
		id: 'tale-two-cities',
		title: 'A Tale of Two Cities',
		author: 'Charles Dickens',
		year: 1859,
		hours: 12,
		hook: 'Revolution and sacrifice',
		collections: ['adventure', 'history'],
		cover: {
			letter: '2',
			bgColor: '#1a1a3e',
			bgColorEnd: '#3e1a1a',
			letterColor: '#e8e8e8',
			style: 'split'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/charles-dickens/a-tale-of-two-cities',
			epubUrl: 'https://standardebooks.org/ebooks/charles-dickens/a-tale-of-two-cities/downloads/charles-dickens_a-tale-of-two-cities.epub'
		}
	},
	{
		id: 'call-wild',
		title: 'The Call of the Wild',
		author: 'Jack London',
		year: 1903,
		hours: 4,
		hook: 'Civilization stripped away',
		collections: ['adventure', 'short'],
		cover: {
			letter: 'C',
			bgColor: '#f5f5f0',
			letterColor: '#2c3e50',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/jack-london/the-call-of-the-wild',
			epubUrl: 'https://standardebooks.org/ebooks/jack-london/the-call-of-the-wild/downloads/jack-london_the-call-of-the-wild.epub'
		}
	},
	{
		id: '20000-leagues',
		title: 'Twenty Thousand Leagues Under the Seas',
		author: 'Jules Verne',
		year: 1870,
		hours: 11,
		hook: 'Captain Nemo awaits',
		collections: ['adventure', 'speculative'],
		cover: {
			letter: 'N',
			bgColor: '#0a2540',
			letterColor: '#6eb5ff',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/164',
			epubUrl: 'https://www.gutenberg.org/cache/epub/164/pg164-images.epub'
		}
	},

	// === RUSSIAN LITERATURE ===
	{
		id: 'crime-punishment',
		title: 'Crime and Punishment',
		author: 'Fyodor Dostoevsky',
		year: 1866,
		hours: 16,
		hook: 'Murder, guilt, salvation',
		collections: ['bucket-list', 'all-time-greats', 'start-here', 'russian'],
		cover: {
			letter: 'Д',
			bgColor: '#1a1a1a',
			letterColor: '#d4d4d4',
			accentColor: '#8b0000',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/fyodor-dostoevsky/crime-and-punishment/constance-garnett',
			epubUrl: 'https://standardebooks.org/ebooks/fyodor-dostoevsky/crime-and-punishment/constance-garnett/downloads/fyodor-dostoevsky_crime-and-punishment_constance-garnett.epub'
		}
	},
	{
		id: 'brothers-karamazov',
		title: 'The Brothers Karamazov',
		author: 'Fyodor Dostoevsky',
		year: 1880,
		hours: 28,
		hook: 'Faith, doubt, patricide',
		collections: ['bucket-list', 'all-time-greats', 'russian', 'epic', 'religion'],
		cover: {
			letter: 'K',
			bgColor: '#1a1a1a',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/fyodor-dostoevsky/the-brothers-karamazov/constance-garnett',
			epubUrl: 'https://standardebooks.org/ebooks/fyodor-dostoevsky/the-brothers-karamazov/constance-garnett/downloads/fyodor-dostoevsky_the-brothers-karamazov_constance-garnett.epub'
		}
	},
	{
		id: 'war-peace',
		title: 'War and Peace',
		author: 'Leo Tolstoy',
		year: 1869,
		hours: 50,
		hook: 'Life itself, in a book',
		collections: ['bucket-list', 'all-time-greats', 'russian', 'epic', 'history'],
		cover: {
			letter: 'W',
			bgColor: '#f0ebe3',
			letterColor: '#2c3e50',
			accentColor: '#c9a227',
			style: 'split'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/leo-tolstoy/war-and-peace/louise-maude_aylmer-maude',
			epubUrl: 'https://standardebooks.org/ebooks/leo-tolstoy/war-and-peace/louise-maude_aylmer-maude/downloads/leo-tolstoy_war-and-peace_louise-maude_aylmer-maude.epub'
		}
	},
	{
		id: 'notes-underground',
		title: 'Notes from Underground',
		author: 'Fyodor Dostoevsky',
		year: 1864,
		hours: 4,
		hook: 'The first existentialist rant',
		collections: ['russian', 'short'],
		cover: {
			letter: 'N',
			bgColor: '#2c2c2c',
			letterColor: '#8b8b8b',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/fyodor-dostoevsky/notes-from-underground/constance-garnett',
			epubUrl: 'https://standardebooks.org/ebooks/fyodor-dostoevsky/notes-from-underground/constance-garnett/downloads/fyodor-dostoevsky_notes-from-underground_constance-garnett.epub'
		}
	},
	{
		id: 'kreutzer-sonata',
		title: 'The Kreutzer Sonata and Other Stories',
		author: 'Leo Tolstoy',
		year: 1889,
		hours: 6,
		hook: 'Jealousy, confession, and a marriage undone',
		collections: ['russian', 'short', 'short-stories'],
		cover: {
			letter: 'K',
			bgColor: '#2c2c2c',
			letterColor: '#e8dcc8',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/689',
			epubUrl: 'https://www.gutenberg.org/cache/epub/689/pg689-images.epub'
		}
	},
	{
		id: 'dead-souls',
		title: 'Dead Souls',
		author: 'Nikolai Gogol',
		year: 1842,
		hours: 12,
		hook: 'A con man buys deceased serfs',
		collections: ['russian', 'wit-wonder'],
		cover: {
			letter: 'Г',
			bgColor: '#3d3225',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/nikolai-gogol/dead-souls/d-j-hogarth',
			epubUrl: 'https://standardebooks.org/ebooks/nikolai-gogol/dead-souls/d-j-hogarth/downloads/nikolai-gogol_dead-souls_d-j-hogarth.epub'
		}
	},
	{
		id: 'the-idiot',
		title: 'The Idiot',
		author: 'Fyodor Dostoevsky',
		year: 1869,
		hours: 20,
		hook: 'A good man destroyed by society',
		collections: ['russian', 'love-society', 'epic'],
		cover: {
			letter: 'И',
			bgColor: '#2c2c2c',
			letterColor: '#e8dcc8',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/fyodor-dostoevsky/the-idiot/eva-m-martin',
			epubUrl: 'https://standardebooks.org/ebooks/fyodor-dostoevsky/the-idiot/eva-m-martin/downloads/fyodor-dostoevsky_the-idiot_eva-m-martin.epub'
		}
	},
	{
		id: 'fathers-sons',
		title: 'Fathers and Sons',
		author: 'Ivan Turgenev',
		year: 1862,
		hours: 7,
		hook: 'Nihilism meets the old order',
		collections: ['russian', 'love-society'],
		cover: {
			letter: 'T',
			bgColor: '#4a3728',
			letterColor: '#e8dcc8',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/47935',
			epubUrl: 'https://www.gutenberg.org/cache/epub/47935/pg47935-images.epub'
		}
	},
	{
		id: 'hero-our-time',
		title: 'A Hero of Our Time',
		author: 'Mikhail Lermontov',
		year: 1840,
		hours: 5,
		hook: 'The first psychological novel',
		collections: ['russian', 'adventure', 'short'],
		cover: {
			letter: 'Л',
			bgColor: '#1a3a4a',
			letterColor: '#f5f5f0',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/913',
			epubUrl: 'https://www.gutenberg.org/cache/epub/913/pg913-images.epub'
		}
	},
	{
		id: 'chekhov-stories',
		title: 'Short Stories',
		author: 'Anton Chekhov',
		year: 1886,
		hours: 8,
		hook: 'Master of the modern short story',
		collections: ['russian', 'short', 'short-stories'],
		cover: {
			letter: 'Ч',
			bgColor: '#5c4a3d',
			letterColor: '#f5e6d3',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/anton-chekhov/short-fiction/constance-garnett',
			epubUrl: 'https://standardebooks.org/ebooks/anton-chekhov/short-fiction/constance-garnett/downloads/anton-chekhov_short-fiction_constance-garnett.epub'
		}
	},
	{
		id: 'cherry-orchard',
		title: 'The Cherry Orchard',
		author: 'Anton Chekhov',
		year: 1904,
		hours: 2,
		hook: 'The old world fades away',
		collections: ['russian', 'short', 'drama'],
		cover: {
			letter: 'C',
			bgColor: '#8b4557',
			letterColor: '#f5f5f0',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/anton-chekhov/the-cherry-orchard/constance-garnett',
			epubUrl: 'https://standardebooks.org/ebooks/anton-chekhov/the-cherry-orchard/constance-garnett/downloads/anton-chekhov_the-cherry-orchard_constance-garnett.epub'
		}
	},

	// === WIT & WONDER ===
	{
		id: 'alice-wonderland',
		title: "Alice's Adventures in Wonderland",
		author: 'Lewis Carroll',
		year: 1865,
		hours: 2.5,
		hook: 'Down the rabbit hole',
		collections: ['wit-wonder', 'short'],
		cover: {
			letter: 'A',
			bgColor: '#4a90a4',
			letterColor: '#f5f5f0',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/lewis-carroll/alices-adventures-in-wonderland/john-tenniel',
			epubUrl: 'https://standardebooks.org/ebooks/lewis-carroll/alices-adventures-in-wonderland/john-tenniel/downloads/lewis-carroll_alices-adventures-in-wonderland_john-tenniel.epub'
		}
	},
	{
		id: 'three-men-boat',
		title: 'Three Men in a Boat',
		author: 'Jerome K. Jerome',
		year: 1889,
		hours: 5,
		hook: 'Comic perfection on the Thames',
		collections: ['wit-wonder'],
		cover: {
			letter: '3',
			bgColor: '#5b8a72',
			letterColor: '#f5f5f0',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/jerome-k-jerome/three-men-in-a-boat',
			epubUrl: 'https://standardebooks.org/ebooks/jerome-k-jerome/three-men-in-a-boat/downloads/jerome-k-jerome_three-men-in-a-boat.epub'
		}
	},
	{
		id: 'importance-earnest',
		title: 'The Importance of Being Earnest',
		author: 'Oscar Wilde',
		year: 1895,
		hours: 2,
		hook: 'Wit weaponized',
		collections: ['wit-wonder', 'drama', 'short'],
		cover: {
			letter: 'E',
			bgColor: '#c9a227',
			letterColor: '#1a1a1a',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/oscar-wilde/the-importance-of-being-earnest',
			epubUrl: 'https://standardebooks.org/ebooks/oscar-wilde/the-importance-of-being-earnest/downloads/oscar-wilde_the-importance-of-being-earnest.epub'
		}
	},
	{
		id: 'don-quixote',
		title: 'Don Quixote',
		author: 'Miguel de Cervantes',
		year: 1605,
		hours: 35,
		hook: 'The first novel. Mad and beautiful',
		collections: ['bucket-list', 'all-time-greats', 'world-classics', 'wit-wonder', 'adventure', 'epic'],
		cover: {
			letter: 'Q',
			bgColor: '#c4a35a',
			bgColorEnd: '#8b7355',
			letterColor: '#3d2914',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/miguel-de-cervantes-saavedra/don-quixote/john-ormsby',
			epubUrl: 'https://standardebooks.org/ebooks/miguel-de-cervantes-saavedra/don-quixote/john-ormsby/downloads/miguel-de-cervantes-saavedra_don-quixote_john-ormsby.epub'
		}
	},

	// === DRAMA & THEATRE ===
	{
		id: 'sophocles-plays',
		title: 'Plays of Sophocles',
		author: 'Sophocles',
		year: -429,
		hours: 4,
		hook: 'Oedipus and Antigone confront fate and law',
		collections: ['world-classics', 'drama', 'mythology', 'short'],
		cover: {
			letter: 'Σ',
			bgColor: '#1a2a3a',
			bgColorEnd: '#0f1d28',
			letterColor: '#e8dcc8',
			style: 'outlined'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/31',
			epubUrl: 'https://www.gutenberg.org/cache/epub/31/pg31-images.epub'
		}
	},
	{
		id: 'dolls-house',
		title: "A Doll's House",
		author: 'Henrik Ibsen',
		year: 1879,
		hours: 3,
		hook: 'A door slam heard round the world',
		collections: ['world-classics', 'drama', 'love-society', 'short'],
		cover: {
			letter: 'D',
			bgColor: '#3a2a2a',
			letterColor: '#f5e6d3',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/2542',
			epubUrl: 'https://www.gutenberg.org/cache/epub/2542/pg2542-images.epub'
		}
	},
	{
		id: 'pygmalion',
		title: 'Pygmalion',
		author: 'George Bernard Shaw',
		year: 1913,
		hours: 3,
		hook: 'Language as class warfare',
		collections: ['drama', 'wit-wonder', 'love-society', 'short'],
		cover: {
			letter: 'P',
			bgColor: '#2d3a4a',
			bgColorEnd: '#1b2430',
			letterColor: '#f5f5f0',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/3825',
			epubUrl: 'https://www.gutenberg.org/cache/epub/3825/pg3825-images.epub'
		}
	},

	// === SHORT STORY MASTERS ===
	{
		id: 'maupassant-stories',
		title: 'Complete Original Short Stories',
		author: 'Guy de Maupassant',
		year: 1903,
		hours: 20,
		hook: 'Realism with a razor edge',
		collections: ['short-stories', 'french'],
		cover: {
			letter: 'M',
			bgColor: '#5c4a3d',
			letterColor: '#f5e6d3',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/3090',
			epubUrl: 'https://www.gutenberg.org/cache/epub/3090/pg3090-images.epub'
		}
	},
	{
		id: 'saki-beasts',
		title: 'Beasts and Super-Beasts',
		author: 'Saki',
		year: 1914,
		hours: 4,
		hook: 'Elegant cruelty, perfectly timed',
		collections: ['short-stories', 'wit-wonder', 'short'],
		cover: {
			letter: 'S',
			bgColor: '#2c2c2c',
			letterColor: '#e8dcc8',
			style: 'outlined'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/269',
			epubUrl: 'https://www.gutenberg.org/cache/epub/269/pg269-images.epub'
		}
	},

	// === POLITICAL DYSTOPIA & UTOPIAS ===
	{
		id: 'we',
		title: 'We',
		author: 'Yevgeny Zamyatin',
		year: 1924,
		hours: 6,
		hook: 'The original dystopia behind the dystopias',
		collections: ['bucket-list', 'all-time-greats', 'world-classics', 'political-dystopia', 'russian'],
		cover: {
			letter: 'W',
			bgColor: '#1a1a1a',
			letterColor: '#e8e4dc',
			style: 'outlined'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/yevgeny-zamyatin/we/gregory-zilboorg',
			epubUrl: 'https://standardebooks.org/ebooks/yevgeny-zamyatin/we/gregory-zilboorg/downloads/yevgeny-zamyatin_we_gregory-zilboorg.epub'
		}
	},
	{
		id: 'iron-heel',
		title: 'The Iron Heel',
		author: 'Jack London',
		year: 1908,
		hours: 8,
		hook: 'A brutal oligarchy rises in America',
		collections: ['political-dystopia', 'speculative', 'american'],
		cover: {
			letter: 'I',
			bgColor: '#1a1a1a',
			letterColor: '#8b0000',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/1164',
			epubUrl: 'https://www.gutenberg.org/cache/epub/1164/pg1164-images.epub'
		}
	},
	{
		id: 'looking-backward',
		title: 'Looking Backward',
		author: 'Edward Bellamy',
		year: 1888,
		hours: 10,
		hook: 'A utopian America, imagined from the 19th century',
		collections: ['speculative', 'economics', 'history'],
		cover: {
			letter: 'L',
			bgColor: '#1a3a4a',
			letterColor: '#e8dcc8',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/624',
			epubUrl: 'https://www.gutenberg.org/cache/epub/624/pg624-images.epub'
		}
	},

	// === IDEAS & INNER LIFE ===
	{
		id: 'meditations',
		title: 'Meditations',
		author: 'Marcus Aurelius',
		year: 180,
		hours: 4,
		hook: 'A Roman emperor talks to himself',
		collections: ['philosophy', 'short', 'religion'],
		cover: {
			letter: 'M',
			bgColor: '#f5f2eb',
			letterColor: '#2c2c2c',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/marcus-aurelius/meditations/george-long',
			epubUrl: 'https://standardebooks.org/ebooks/marcus-aurelius/meditations/george-long/downloads/marcus-aurelius_meditations_george-long.epub'
		}
	},
	{
		id: 'walden',
		title: 'Walden',
		author: 'Henry David Thoreau',
		year: 1854,
		hours: 8,
		hook: 'Simplify, simplify',
		collections: ['american', 'philosophy'],
		cover: {
			letter: 'W',
			bgColor: '#2d4a2d',
			letterColor: '#e8dcc8',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/henry-david-thoreau/walden',
			epubUrl: 'https://standardebooks.org/ebooks/henry-david-thoreau/walden/downloads/henry-david-thoreau_walden.epub'
		}
	},

	// === MYTHOLOGY ===
	{
		id: 'odyssey',
		title: 'The Odyssey',
		author: 'Homer',
		year: -700,
		hours: 10,
		hook: 'The original journey home',
		collections: ['bucket-list', 'all-time-greats', 'world-classics', 'mythology', 'adventure', 'epic'],
		cover: {
			letter: 'O',
			bgColor: '#1e3d59',
			bgColorEnd: '#0f1e2d',
			letterColor: '#e8d5b5',
			style: 'outlined'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/homer/the-odyssey/william-cullen-bryant',
			epubUrl: 'https://standardebooks.org/ebooks/homer/the-odyssey/william-cullen-bryant/downloads/homer_the-odyssey_william-cullen-bryant.epub'
		}
	},
	{
		id: 'iliad',
		title: 'The Iliad',
		author: 'Homer',
		year: -750,
		hours: 15,
		hook: 'Rage, war, glory',
		collections: ['world-classics', 'mythology', 'epic'],
		cover: {
			letter: 'I',
			bgColor: '#8b0000',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/homer/the-iliad/william-cullen-bryant',
			epubUrl: 'https://standardebooks.org/ebooks/homer/the-iliad/william-cullen-bryant/downloads/homer_the-iliad_william-cullen-bryant.epub'
		}
	},
	{
		id: 'aeneid',
		title: 'The Aeneid',
		author: 'Virgil',
		year: -19,
		hours: 12,
		hook: "Rome's founding myth",
		collections: ['world-classics', 'mythology', 'epic'],
		cover: {
			letter: 'A',
			bgColor: '#4a3728',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/virgil/the-aeneid/john-dryden',
			epubUrl: 'https://standardebooks.org/ebooks/virgil/the-aeneid/john-dryden/downloads/virgil_the-aeneid_john-dryden.epub'
		}
	},
	{
		id: 'beowulf',
		title: 'Beowulf',
		author: 'Anonymous',
		year: 1000,
		hours: 3,
		hook: 'Monsters and heroism',
		collections: ['world-classics', 'mythology', 'short'],
		cover: {
			letter: 'B',
			bgColor: '#2c3e50',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/anonymous/beowulf/john-lesslie-hall',
			epubUrl: 'https://standardebooks.org/ebooks/anonymous/beowulf/john-lesslie-hall/downloads/anonymous_beowulf_john-lesslie-hall.epub'
		}
	},

	// === WORLD CLASSICS ===
	{
		id: 'gilgamesh',
		title: 'The Epic of Gilgamesh',
		author: 'Anonymous',
		year: -1800,
		hours: 3,
		hook: 'The oldest epic of friendship and loss',
		collections: ['world-classics', 'mythology', 'middle-eastern', 'epic', 'short'],
		cover: {
			letter: 'G',
			bgColor: '#2b2b1a',
			letterColor: '#e8dcc8',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/11000',
			epubUrl: 'https://www.gutenberg.org/cache/epub/11000/pg11000-images.epub'
		}
	},
	{
		id: 'arabian-nights',
		title: 'The Arabian Nights',
		author: 'Anonymous',
		year: 1706,
		hours: 12,
		hook: 'Scheherazade keeps the dawn away',
		collections: ['world-classics', 'mythology', 'middle-eastern', 'adventure', 'wit-wonder'],
		cover: {
			letter: 'A',
			bgColor: '#2a1a3a',
			bgColorEnd: '#140a1f',
			letterColor: '#f5e6d3',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/128',
			epubUrl: 'https://www.gutenberg.org/cache/epub/128/pg128-images.epub'
		}
	},
	{
		id: 'popol-vuh',
		title: 'The Popol Vuh',
		author: 'Anonymous',
		year: 1550,
		hours: 4,
		hook: 'Maya creation myths and hero twins',
		collections: ['world-classics', 'latin-american', 'mythology', 'religion', 'short'],
		cover: {
			letter: 'P',
			bgColor: '#3d2914',
			letterColor: '#f5e6d3',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/56550',
			epubUrl: 'https://www.gutenberg.org/cache/epub/56550/pg56550-images.epub'
		}
	},
	{
		id: 'tale-genji',
		title: 'The Tale of Genji',
		author: 'Murasaki Shikibu',
		year: 1021,
		hours: 35,
		hook: 'Courtly love and politics in Heian Japan',
		collections: ['world-classics', 'east-asian', 'epic', 'love-society'],
		cover: {
			letter: 'G',
			bgColor: '#6b3a5c',
			bgColorEnd: '#40263a',
			letterColor: '#f5e6d3',
			style: 'outlined'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/66057',
			epubUrl: 'https://www.gutenberg.org/cache/epub/66057/pg66057-images.epub'
		}
	},
	{
		id: 'pillow-book',
		title: 'The Pillow-Book of Sei Shōnagon',
		author: 'Sei Shōnagon',
		year: 1002,
		hours: 10,
		hook: 'Lists, gossip, and beauty at court',
		collections: ['world-classics', 'east-asian'],
		cover: {
			letter: 'P',
			bgColor: '#d4a574',
			letterColor: '#3d1a0a',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/76016',
			epubUrl: 'https://www.gutenberg.org/cache/epub/76016/pg76016-images.epub'
		}
	},

	// === RELIGION & SPIRITUALITY ===
	{
		id: 'divine-comedy',
		title: 'The Divine Comedy',
		author: 'Dante Alighieri',
		year: 1320,
		hours: 15,
		hook: 'Through Hell to Paradise',
		collections: ['bucket-list', 'all-time-greats', 'world-classics', 'poetry', 'religion', 'epic', 'mythology'],
		cover: {
			letter: 'D',
			bgColor: '#1a0a0a',
			bgColorEnd: '#c9a227',
			letterColor: '#f5e6d3',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/dante-alighieri/the-divine-comedy/henry-wadsworth-longfellow',
			epubUrl: 'https://standardebooks.org/ebooks/dante-alighieri/the-divine-comedy/henry-wadsworth-longfellow/downloads/dante-alighieri_the-divine-comedy_henry-wadsworth-longfellow.epub'
		}
	},
	{
		id: 'paradise-lost',
		title: 'Paradise Lost',
		author: 'John Milton',
		year: 1667,
		hours: 12,
		hook: "Satan's rebellion, humanity's fall",
		collections: ['all-time-greats', 'world-classics', 'poetry', 'religion', 'epic'],
		cover: {
			letter: 'P',
			bgColor: '#1a1a2e',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/john-milton/paradise-lost',
			epubUrl: 'https://standardebooks.org/ebooks/john-milton/paradise-lost/downloads/john-milton_paradise-lost.epub'
		}
	},
	{
		id: 'tao-te-ching',
		title: 'Tao Te Ching',
		author: 'Lao Tzu',
		year: -400,
		hours: 2,
		hook: 'The way that can be told',
		collections: ['world-classics', 'east-asian', 'religion', 'philosophy', 'short'],
		cover: {
			letter: '道',
			bgColor: '#f5f2eb',
			letterColor: '#2c2c2c',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/laozi/tao-te-ching/james-legge',
			epubUrl: 'https://standardebooks.org/ebooks/laozi/tao-te-ching/james-legge/downloads/laozi_tao-te-ching_james-legge.epub'
		}
	},

	// === HISTORY ===
	{
		id: 'autobiography-franklin',
		title: 'The Autobiography of Benjamin Franklin',
		author: 'Benjamin Franklin',
		year: 1791,
		hours: 5,
		hook: 'Self-made American',
		collections: ['history'],
		cover: {
			letter: 'F',
			bgColor: '#3d2914',
			letterColor: '#e8dcc8',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/benjamin-franklin/the-autobiography-of-benjamin-franklin',
			epubUrl: 'https://standardebooks.org/ebooks/benjamin-franklin/the-autobiography-of-benjamin-franklin/downloads/benjamin-franklin_the-autobiography-of-benjamin-franklin.epub'
		}
	},
	{
		id: 'narrative-douglass',
		title: 'Narrative of the Life of Frederick Douglass',
		author: 'Frederick Douglass',
		year: 1845,
		hours: 3,
		hook: "Freedom's voice",
		collections: ['bucket-list', 'american', 'african-diaspora', 'history', 'short'],
		cover: {
			letter: 'D',
			bgColor: '#1a1a1a',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/frederick-douglass/narrative-of-the-life-of-frederick-douglass',
			epubUrl: 'https://standardebooks.org/ebooks/frederick-douglass/narrative-of-the-life-of-frederick-douglass/downloads/frederick-douglass_narrative-of-the-life-of-frederick-douglass.epub'
		}
	},
	{
		id: 'equiano-narrative',
		title: 'The Interesting Narrative of the Life of Olaudah Equiano',
		author: 'Olaudah Equiano',
		year: 1789,
		hours: 6,
		hook: 'A firsthand account of slavery and freedom',
		collections: ['history', 'african-diaspora'],
		cover: {
			letter: 'E',
			bgColor: '#2c2c2c',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/15399',
			epubUrl: 'https://www.gutenberg.org/cache/epub/15399/pg15399-images.epub'
		}
	},
	{
		id: 'slave-girl',
		title: 'Incidents in the Life of a Slave Girl',
		author: 'Harriet Jacobs',
		year: 1861,
		hours: 6,
		hook: "An enslaved woman's testimony of survival",
		collections: ['history', 'american', 'african-diaspora'],
		cover: {
			letter: 'S',
			bgColor: '#3d3225',
			letterColor: '#f5e6d3',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/11030',
			epubUrl: 'https://www.gutenberg.org/cache/epub/11030/pg11030-images.epub'
		}
	},
	{
		id: 'common-sense',
		title: 'Common Sense',
		author: 'Thomas Paine',
		year: 1776,
		hours: 2,
		hook: 'The pamphlet that sparked revolution',
		collections: ['history', 'philosophy', 'short'],
		cover: {
			letter: 'C',
			bgColor: '#1a3a4a',
			letterColor: '#e8dcc8',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/147',
			epubUrl: 'https://www.gutenberg.org/cache/epub/147/pg147-images.epub'
		}
	},
	{
		id: 'vindication-rights-woman',
		title: 'A Vindication of the Rights of Woman',
		author: 'Mary Wollstonecraft',
		year: 1792,
		hours: 6,
		hook: 'The founding text of modern feminism',
		collections: ['world-classics', 'philosophy', 'history'],
		cover: {
			letter: 'V',
			bgColor: '#4a1a2e',
			letterColor: '#f5e6d3',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/mary-wollstonecraft/a-vindication-of-the-rights-of-woman',
			epubUrl: 'https://standardebooks.org/ebooks/mary-wollstonecraft/a-vindication-of-the-rights-of-woman/downloads/mary-wollstonecraft_a-vindication-of-the-rights-of-woman.epub'
		}
	},

	// === PHILOSOPHY ===
	{
		id: 'republic',
		title: 'The Republic',
		author: 'Plato',
		year: -380,
		hours: 10,
		hook: 'Justice, truth, the ideal state',
		collections: ['all-time-greats', 'philosophy', 'bucket-list'],
		cover: {
			letter: 'P',
			bgColor: '#2c3e50',
			letterColor: '#ecf0f1',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/1497',
			epubUrl: 'https://www.gutenberg.org/cache/epub/1497/pg1497-images.epub'
		}
	},
	{
		id: 'nicomachean-ethics',
		title: 'Nicomachean Ethics',
		author: 'Aristotle',
		year: -340,
		hours: 8,
		hook: 'How to live a good life',
		collections: ['philosophy'],
		cover: {
			letter: 'A',
			bgColor: '#5d4e37',
			letterColor: '#f5e6d3',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/aristotle/nicomachean-ethics/f-h-peters',
			epubUrl: 'https://standardebooks.org/ebooks/aristotle/nicomachean-ethics/f-h-peters/downloads/aristotle_nicomachean-ethics_f-h-peters.epub'
		}
	},
	{
		id: 'the-prince',
		title: 'The Prince',
		author: 'Niccolo Machiavelli',
		year: 1532,
		hours: 3,
		hook: 'Power without illusions',
		collections: ['philosophy', 'history', 'short'],
		cover: {
			letter: 'M',
			bgColor: '#1a1a1a',
			letterColor: '#8b0000',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/niccolo-machiavelli/the-prince/w-k-marriott',
			epubUrl: 'https://standardebooks.org/ebooks/niccolo-machiavelli/the-prince/w-k-marriott/downloads/niccolo-machiavelli_the-prince_w-k-marriott.epub'
		}
	},
	{
		id: 'beyond-good-evil',
		title: 'Beyond Good and Evil',
		author: 'Friedrich Nietzsche',
		year: 1886,
		hours: 6,
		hook: 'Philosophy with a hammer',
		collections: ['philosophy'],
		cover: {
			letter: 'N',
			bgColor: '#2c2c2c',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/friedrich-nietzsche/beyond-good-and-evil/helen-zimmern',
			epubUrl: 'https://standardebooks.org/ebooks/friedrich-nietzsche/beyond-good-and-evil/helen-zimmern/downloads/friedrich-nietzsche_beyond-good-and-evil_helen-zimmern.epub'
		}
	},
	{
		id: 'thus-spake-zarathustra',
		title: 'Thus Spake Zarathustra',
		author: 'Friedrich Nietzsche',
		year: 1885,
		hours: 10,
		hook: 'God is dead. Now what?',
		collections: ['philosophy', 'religion'],
		cover: {
			letter: 'Z',
			bgColor: '#4a3728',
			bgColorEnd: '#1a1a1a',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/friedrich-nietzsche/thus-spake-zarathustra/thomas-common',
			epubUrl: 'https://standardebooks.org/ebooks/friedrich-nietzsche/thus-spake-zarathustra/thomas-common/downloads/friedrich-nietzsche_thus-spake-zarathustra_thomas-common.epub'
		}
	},
	{
		id: 'on-liberty',
		title: 'On Liberty',
		author: 'John Stuart Mill',
		year: 1859,
		hours: 4,
		hook: 'The limits of power over the individual',
		collections: ['philosophy', 'economics', 'short'],
		cover: {
			letter: 'L',
			bgColor: '#1a3a4a',
			letterColor: '#e8dcc8',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/john-stuart-mill/on-liberty',
			epubUrl: 'https://standardebooks.org/ebooks/john-stuart-mill/on-liberty/downloads/john-stuart-mill_on-liberty.epub'
		}
	},

	// === ECONOMICS & SOCIETY ===
	{
		id: 'wealth-of-nations',
		title: 'The Wealth of Nations',
		author: 'Adam Smith',
		year: 1776,
		hours: 35,
		hook: 'The invisible hand',
		collections: ['economics', 'philosophy', 'epic'],
		cover: {
			letter: 'W',
			bgColor: '#2e4a1a',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/adam-smith/the-wealth-of-nations',
			epubUrl: 'https://standardebooks.org/ebooks/adam-smith/the-wealth-of-nations/downloads/adam-smith_the-wealth-of-nations.epub'
		}
	},
	{
		id: 'communist-manifesto',
		title: 'The Communist Manifesto',
		author: 'Karl Marx and Friedrich Engels',
		year: 1848,
		hours: 1,
		hook: 'Workers of the world, unite',
		collections: ['economics', 'philosophy', 'history', 'short'],
		cover: {
			letter: 'M',
			bgColor: '#8b0000',
			letterColor: '#f5f5f0',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/karl-marx_friedrich-engels/the-communist-manifesto/samuel-moore',
			epubUrl: 'https://standardebooks.org/ebooks/karl-marx_friedrich-engels/the-communist-manifesto/samuel-moore/downloads/karl-marx_friedrich-engels_the-communist-manifesto_samuel-moore.epub'
		}
	},

	// === INDIAN CLASSICS ===
	{
		id: 'ramayana',
		title: 'The Ramayana',
		author: 'Valmiki',
		year: -500,
		hours: 20,
		hook: 'Dharma, devotion, the ideal hero',
		collections: ['indian-classics', 'world-classics', 'mythology', 'religion', 'epic'],
		cover: {
			letter: 'R',
			bgColor: '#d4a574',
			bgColorEnd: '#8b4513',
			letterColor: '#1a0a0a',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/24869',
			epubUrl: 'https://www.gutenberg.org/cache/epub/24869/pg24869-images.epub'
		}
	},
	{
		id: 'mahabharata',
		title: 'The Mahabharata',
		author: 'Vyasa',
		year: -400,
		hours: 80,
		hook: 'The great war, the great questions',
		collections: ['all-time-greats', 'indian-classics', 'world-classics', 'mythology', 'religion', 'epic', 'philosophy'],
		cover: {
			letter: 'M',
			bgColor: '#4a3728',
			bgColorEnd: '#1a0a0a',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/15474',
			epubUrl: 'https://www.gutenberg.org/cache/epub/15474/pg15474-images.epub'
		}
	},
	{
		id: 'bhagavad-gita',
		title: 'The Bhagavad Gita',
		author: 'Vyasa',
		year: -200,
		hours: 2,
		hook: 'Action, duty, the eternal self',
		collections: ['all-time-greats', 'indian-classics', 'world-classics', 'mythology', 'religion', 'philosophy', 'short'],
		cover: {
			letter: 'G',
			bgColor: '#e8dcc8',
			letterColor: '#4a3728',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/2388',
			epubUrl: 'https://www.gutenberg.org/cache/epub/2388/pg2388-images.epub'
		}
	},
	{
		id: 'gitanjali',
		title: 'Gitanjali',
		author: 'Rabindranath Tagore',
		year: 1910,
		hours: 2,
		hook: 'Song offerings to the divine',
		collections: ['indian-classics', 'poetry', 'religion', 'short'],
		cover: {
			letter: 'G',
			bgColor: '#c9a227',
			bgColorEnd: '#8b6914',
			letterColor: '#1a0a0a',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/7164',
			epubUrl: 'https://www.gutenberg.org/cache/epub/7164/pg7164-images.epub'
		}
	},
	{
		id: 'home-and-world',
		title: 'The Home and the World',
		author: 'Rabindranath Tagore',
		year: 1916,
		hours: 6,
		hook: 'Love, nationalism, the modern woman',
		collections: ['indian-classics', 'love-society'],
		cover: {
			letter: 'H',
			bgColor: '#8b4513',
			bgColorEnd: '#5d2e0a',
			letterColor: '#f5e6d3',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/7166',
			epubUrl: 'https://www.gutenberg.org/cache/epub/7166/pg7166-images.epub'
		}
	},
	{
		id: 'sadhana',
		title: 'Sadhana: The Realisation of Life',
		author: 'Rabindranath Tagore',
		year: 1913,
		hours: 3,
		hook: 'The spiritual path, beautifully told',
		collections: ['indian-classics', 'religion', 'philosophy', 'short'],
		cover: {
			letter: 'S',
			bgColor: '#e8dcc8',
			letterColor: '#4a3728',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/6842',
			epubUrl: 'https://www.gutenberg.org/cache/epub/6842/pg6842-images.epub'
		}
	},
	{
		id: 'upanishads',
		title: 'The Upanishads',
		author: 'Various',
		year: -800,
		hours: 4,
		hook: 'Tat tvam asi — You are that',
		collections: ['indian-classics', 'world-classics', 'religion', 'philosophy'],
		cover: {
			letter: 'ॐ',
			bgColor: '#d4a574',
			letterColor: '#3d1a0a',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/3283',
			epubUrl: 'https://www.gutenberg.org/cache/epub/3283/pg3283-images.epub'
		}
	},
	{
		id: 'shakuntala',
		title: 'Shakuntala',
		author: 'Kalidasa',
		year: 400,
		hours: 3,
		hook: 'Love, loss, recognition',
		collections: ['indian-classics', 'world-classics', 'love-society', 'drama', 'short'],
		cover: {
			letter: 'S',
			bgColor: '#2d4a2d',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/16659',
			epubUrl: 'https://www.gutenberg.org/cache/epub/16659/pg16659-images.epub'
		}
	},
	{
		id: 'dhammapada',
		title: 'The Dhammapada',
		author: 'Buddha',
		year: -300,
		hours: 2,
		hook: 'The path of wisdom',
		collections: ['indian-classics', 'world-classics', 'religion', 'philosophy', 'short'],
		cover: {
			letter: 'D',
			bgColor: '#c9a227',
			letterColor: '#3d1a0a',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/2017',
			epubUrl: 'https://www.gutenberg.org/cache/epub/2017/pg2017-images.epub'
		}
	},
	{
		id: 'kabuliwala',
		title: 'The Hungry Stones and Other Stories',
		author: 'Rabindranath Tagore',
		year: 1916,
		hours: 4,
		hook: 'Tales of human connection',
		collections: ['indian-classics', 'short', 'short-stories'],
		cover: {
			letter: 'T',
			bgColor: '#5d4e37',
			letterColor: '#f5e6d3',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/10637',
			epubUrl: 'https://www.gutenberg.org/cache/epub/10637/pg10637-images.epub'
		}
	},
	{
		id: 'panchatantra',
		title: 'The Panchatantra',
		author: 'Vishnu Sharma',
		year: 300,
		hours: 6,
		hook: 'Ancient wisdom through animal fables',
		collections: ['indian-classics', 'wit-wonder'],
		cover: {
			letter: 'P',
			bgColor: '#2e4a1a',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/25545',
			epubUrl: 'https://www.gutenberg.org/cache/epub/25545/pg25545-images.epub'
		}
	},
	{
		id: 'jataka-tales',
		title: 'The Jataka Tales',
		author: 'Various',
		year: -300,
		hours: 5,
		hook: "Buddha's past lives as moral tales",
		collections: ['indian-classics', 'religion', 'wit-wonder'],
		cover: {
			letter: 'J',
			bgColor: '#c9a227',
			letterColor: '#1a0a0a',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/20737',
			epubUrl: 'https://www.gutenberg.org/cache/epub/20737/pg20737-images.epub'
		}
	},
	{
		id: 'raja-yoga',
		title: 'Raja Yoga',
		author: 'Swami Vivekananda',
		year: 1896,
		hours: 5,
		hook: 'The science of mind control',
		collections: ['indian-classics', 'religion', 'philosophy'],
		cover: {
			letter: 'R',
			bgColor: '#d4a574',
			letterColor: '#1a0a0a',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/35951',
			epubUrl: 'https://www.gutenberg.org/cache/epub/35951/pg35951-images.epub'
		}
	},
	{
		id: 'karma-yoga',
		title: 'Karma Yoga',
		author: 'Swami Vivekananda',
		year: 1896,
		hours: 3,
		hook: 'Work as worship',
		collections: ['indian-classics', 'religion', 'philosophy', 'short'],
		cover: {
			letter: 'K',
			bgColor: '#e8dcc8',
			letterColor: '#4a3728',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/35955',
			epubUrl: 'https://www.gutenberg.org/cache/epub/35955/pg35955-images.epub'
		}
	},
	{
		id: 'arthashastra',
		title: 'Arthashastra',
		author: 'Kautilya',
		year: -300,
		hours: 15,
		hook: 'Ancient statecraft and economics',
		collections: ['indian-classics', 'philosophy', 'economics', 'history'],
		cover: {
			letter: 'A',
			bgColor: '#4a3728',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/50370',
			epubUrl: 'https://www.gutenberg.org/cache/epub/50370/pg50370-images.epub'
		}
	},
	{
		id: 'anandamath',
		title: 'Anandamath',
		author: 'Bankim Chandra Chattopadhyay',
		year: 1882,
		hours: 5,
		hook: 'Vande Mataram - birth of a nation',
		collections: ['indian-classics', 'adventure', 'history'],
		cover: {
			letter: 'A',
			bgColor: '#2e4a1a',
			bgColorEnd: '#1a2e0a',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/30574',
			epubUrl: 'https://www.gutenberg.org/cache/epub/30574/pg30574-images.epub'
		}
	},
	{
		id: 'yoga-sutras',
		title: 'The Yoga Sutras of Patanjali',
		author: 'Patanjali',
		year: -200,
		hours: 2,
		hook: 'The foundation of yoga philosophy',
		collections: ['indian-classics', 'religion', 'philosophy', 'short'],
		cover: {
			letter: 'Y',
			bgColor: '#5d4e37',
			letterColor: '#e8dcc8',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/2526',
			epubUrl: 'https://www.gutenberg.org/cache/epub/2526/pg2526-images.epub'
		}
	},
	{
		id: 'meghaduta',
		title: 'The Cloud Messenger',
		author: 'Kalidasa',
		year: 400,
		hours: 1,
		hook: 'A love letter carried by clouds',
		collections: ['indian-classics', 'love-society', 'short'],
		cover: {
			letter: 'M',
			bgColor: '#4a90a4',
			letterColor: '#f5f5f0',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/17817',
			epubUrl: 'https://www.gutenberg.org/cache/epub/17817/pg17817-images.epub'
		}
	},
	{
		id: 'songs-kabir',
		title: 'Songs of Kabir',
		author: 'Kabir',
		year: 1440,
		hours: 2,
		hook: 'Mystic poetry transcending religions',
		collections: ['indian-classics', 'poetry', 'religion', 'short'],
		cover: {
			letter: 'K',
			bgColor: '#8b4513',
			letterColor: '#f5e6d3',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/6519',
			epubUrl: 'https://www.gutenberg.org/cache/epub/6519/pg6519-images.epub'
		}
	},

	// === MORE CANONICAL WORKS ===
	{
		id: 'moby-dick',
		title: 'Moby Dick',
		author: 'Herman Melville',
		year: 1851,
		hours: 20,
		hook: 'Obsession, the whale, America',
		collections: ['bucket-list', 'all-time-greats', 'american', 'adventure', 'epic'],
		cover: {
			letter: 'M',
			bgColor: '#1e3d59',
			bgColorEnd: '#0a1628',
			letterColor: '#f5f5f0',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/herman-melville/moby-dick',
			epubUrl: 'https://standardebooks.org/ebooks/herman-melville/moby-dick/downloads/herman-melville_moby-dick.epub'
		}
	},
	{
		id: 'heart-of-darkness',
		title: 'Heart of Darkness',
		author: 'Joseph Conrad',
		year: 1899,
		hours: 3,
		hook: 'The horror, the horror',
		collections: ['all-time-greats', 'start-here', 'adventure', 'short'],
		cover: {
			letter: 'H',
			bgColor: '#1a1a1a',
			bgColorEnd: '#2c2c2c',
			letterColor: '#8b8b8b',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/joseph-conrad/heart-of-darkness',
			epubUrl: 'https://standardebooks.org/ebooks/joseph-conrad/heart-of-darkness/downloads/joseph-conrad_heart-of-darkness.epub'
		}
	},
	{
		id: 'dubliners',
		title: 'Dubliners',
		author: 'James Joyce',
		year: 1914,
		hours: 6,
		hook: 'Epiphanies of ordinary lives',
		collections: ['all-time-greats', 'short', 'short-stories'],
		cover: {
			letter: 'D',
			bgColor: '#4a5568',
			letterColor: '#e8dcc8',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/james-joyce/dubliners',
			epubUrl: 'https://standardebooks.org/ebooks/james-joyce/dubliners/downloads/james-joyce_dubliners.epub'
		}
	},
	{
		id: 'portrait-artist',
		title: 'A Portrait of the Artist as a Young Man',
		author: 'James Joyce',
		year: 1916,
		hours: 10,
		hook: 'An artist forms himself against family and faith',
		collections: ['all-time-greats', 'world-classics'],
		cover: {
			letter: 'P',
			bgColor: '#1a3a4a',
			letterColor: '#e8dcc8',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/james-joyce/a-portrait-of-the-artist-as-a-young-man',
			epubUrl: 'https://standardebooks.org/ebooks/james-joyce/a-portrait-of-the-artist-as-a-young-man/downloads/james-joyce_a-portrait-of-the-artist-as-a-young-man.epub'
		}
	},
	{
		id: 'ulysses',
		title: 'Ulysses',
		author: 'James Joyce',
		year: 1922,
		hours: 25,
		hook: 'One day. All of life.',
		collections: ['all-time-greats', 'epic'],
		cover: {
			letter: 'U',
			bgColor: '#1a3a4a',
			letterColor: '#c9a227',
			style: 'outlined'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/james-joyce/ulysses',
			epubUrl: 'https://standardebooks.org/ebooks/james-joyce/ulysses/downloads/james-joyce_ulysses.epub'
		}
	},
	{
		id: 'the-trial',
		title: 'The Trial',
		author: 'Franz Kafka',
		year: 1925,
		hours: 6,
		hook: 'Guilty of what? Everything.',
		collections: ['all-time-greats', 'gothic', 'political-dystopia', 'philosophy'],
		cover: {
			letter: 'K',
			bgColor: '#2c2c2c',
			letterColor: '#a0a0a0',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/7849',
			epubUrl: 'https://www.gutenberg.org/cache/epub/7849/pg7849-images.epub'
		}
	},
	{
		id: 'madame-bovary',
		title: 'Madame Bovary',
		author: 'Gustave Flaubert',
		year: 1857,
		hours: 10,
		hook: 'Desire, delusion, the modern novel',
		collections: ['bucket-list', 'all-time-greats', 'french', 'love-society'],
		cover: {
			letter: 'B',
			bgColor: '#5c4a3d',
			letterColor: '#e8d5c4',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/gustave-flaubert/madame-bovary/eleanor-marx-aveling',
			epubUrl: 'https://standardebooks.org/ebooks/gustave-flaubert/madame-bovary/eleanor-marx-aveling/downloads/gustave-flaubert_madame-bovary_eleanor-marx-aveling.epub'
		}
	},

	// === ESSENTIAL ADDITIONS ===
	{
		id: 'poe-tales',
		title: 'Tales of Mystery and Imagination',
		author: 'Edgar Allan Poe',
		year: 1845,
		hours: 8,
		hook: 'The master of macabre',
		collections: ['all-time-greats', 'american', 'gothic', 'mystery', 'short', 'short-stories'],
		cover: {
			letter: 'P',
			bgColor: '#1a0a0a',
			bgColorEnd: '#2d0a0a',
			letterColor: '#8b0000',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/edgar-allan-poe/short-fiction',
			epubUrl: 'https://standardebooks.org/ebooks/edgar-allan-poe/short-fiction/downloads/edgar-allan-poe_short-fiction.epub'
		}
	},
	{
		id: 'gullivers-travels',
		title: "Gulliver's Travels",
		author: 'Jonathan Swift',
		year: 1726,
		hours: 8,
		hook: 'Savage satire disguised as adventure',
		collections: ['all-time-greats', 'wit-wonder', 'adventure', 'speculative'],
		cover: {
			letter: 'G',
			bgColor: '#1a3a4a',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/jonathan-swift/gullivers-travels',
			epubUrl: 'https://standardebooks.org/ebooks/jonathan-swift/gullivers-travels/downloads/jonathan-swift_gullivers-travels.epub'
		}
	},
	{
		id: 'candide',
		title: 'Candide',
		author: 'Voltaire',
		year: 1759,
		hours: 3,
		hook: 'Optimism destroyed, brilliantly',
		collections: ['all-time-greats', 'french', 'wit-wonder', 'short'],
		cover: {
			letter: 'C',
			bgColor: '#c9a227',
			letterColor: '#1a1a1a',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/voltaire/candide/the-modern-library',
			epubUrl: 'https://standardebooks.org/ebooks/voltaire/candide/the-modern-library/downloads/voltaire_candide_the-modern-library.epub'
		}
	},
	{
		id: 'robinson-crusoe',
		title: 'Robinson Crusoe',
		author: 'Daniel Defoe',
		year: 1719,
		hours: 10,
		hook: 'Survival, solitude, the self',
		collections: ['adventure', 'start-here'],
		cover: {
			letter: 'R',
			bgColor: '#8b6914',
			letterColor: '#f5f5f0',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/daniel-defoe/the-life-and-adventures-of-robinson-crusoe',
			epubUrl: 'https://standardebooks.org/ebooks/daniel-defoe/the-life-and-adventures-of-robinson-crusoe/downloads/daniel-defoe_the-life-and-adventures-of-robinson-crusoe.epub'
		}
	},
	{
		id: 'war-of-worlds',
		title: 'The War of the Worlds',
		author: 'H. G. Wells',
		year: 1898,
		hours: 5,
		hook: 'The Martians have landed',
		collections: ['speculative', 'gothic', 'short'],
		cover: {
			letter: 'W',
			bgColor: '#0a1628',
			letterColor: '#8b0000',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/h-g-wells/the-war-of-the-worlds',
			epubUrl: 'https://standardebooks.org/ebooks/h-g-wells/the-war-of-the-worlds/downloads/h-g-wells_the-war-of-the-worlds.epub'
		}
	},
	{
		id: 'invisible-man',
		title: 'The Invisible Man',
		author: 'H. G. Wells',
		year: 1897,
		hours: 4,
		hook: 'Power corrupts, invisibly',
		collections: ['speculative', 'gothic', 'short'],
		cover: {
			letter: 'I',
			bgColor: '#e8e8e8',
			letterColor: '#2c2c2c',
			style: 'outlined'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/h-g-wells/the-invisible-man',
			epubUrl: 'https://standardebooks.org/ebooks/h-g-wells/the-invisible-man/downloads/h-g-wells_the-invisible-man.epub'
		}
	},
	{
		id: 'hamlet',
		title: 'Hamlet',
		author: 'William Shakespeare',
		year: 1601,
		hours: 4,
		hook: 'To be or not to be',
		collections: ['all-time-greats', 'gothic', 'drama', 'short'],
		cover: {
			letter: 'H',
			bgColor: '#1a1a1a',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/william-shakespeare/hamlet',
			epubUrl: 'https://standardebooks.org/ebooks/william-shakespeare/hamlet/downloads/william-shakespeare_hamlet.epub'
		}
	},
	{
		id: 'macbeth',
		title: 'Macbeth',
		author: 'William Shakespeare',
		year: 1606,
		hours: 2,
		hook: 'Ambition, murder, madness',
		collections: ['gothic', 'drama', 'short'],
		cover: {
			letter: 'M',
			bgColor: '#2d0a0a',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/william-shakespeare/macbeth',
			epubUrl: 'https://standardebooks.org/ebooks/william-shakespeare/macbeth/downloads/william-shakespeare_macbeth.epub'
		}
	},
	{
		id: 'faust',
		title: 'Faust',
		author: 'Johann Wolfgang von Goethe',
		year: 1808,
		hours: 8,
		hook: 'A deal with the devil',
		collections: ['all-time-greats', 'gothic', 'poetry', 'drama'],
		cover: {
			letter: 'F',
			bgColor: '#1a1a2e',
			bgColorEnd: '#2d0a0a',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/14591',
			epubUrl: 'https://www.gutenberg.org/cache/epub/14591/pg14591-images.epub'
		}
	},
	{
		id: 'metamorphoses',
		title: 'Metamorphoses',
		author: 'Ovid',
		year: 8,
		hours: 15,
		hook: 'Every myth, transformed',
		collections: ['world-classics', 'mythology', 'epic'],
		cover: {
			letter: 'O',
			bgColor: '#4a3728',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/ovid/metamorphoses/john-dryden_joseph-addison_laurence-eusden_arthur-maynwaring_samuel-croxall_nahum-tate_william-stonestreet_thomas-vernon_john-gay_alexander-pope_stephen-harvey_william-congreve_et-al',
			epubUrl: 'https://standardebooks.org/ebooks/ovid/metamorphoses/john-dryden_joseph-addison_laurence-eusden_arthur-maynwaring_samuel-croxall_nahum-tate_william-stonestreet_thomas-vernon_john-gay_alexander-pope_stephen-harvey_william-congreve_et-al/downloads/ovid_metamorphoses_john-dryden_joseph-addison_laurence-eusden_arthur-maynwaring_samuel-croxall_nahum-tate_william-stonestreet_thomas-vernon_john-gay_alexander-pope_stephen-harvey_william-congreve_et-al.epub'
		}
	},
	{
		id: 'scarlet-pimpernel',
		title: 'The Scarlet Pimpernel',
		author: 'Baroness Orczy',
		year: 1905,
		hours: 6,
		hook: 'The original masked hero',
		collections: ['adventure', 'history'],
		cover: {
			letter: 'S',
			bgColor: '#8b0000',
			letterColor: '#f5f5f0',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/baroness-orczy/the-scarlet-pimpernel',
			epubUrl: 'https://standardebooks.org/ebooks/baroness-orczy/the-scarlet-pimpernel/downloads/baroness-orczy_the-scarlet-pimpernel.epub'
		}
	},
	{
		id: 'around-world-80-days',
		title: 'Around the World in Eighty Days',
		author: 'Jules Verne',
		year: 1872,
		hours: 6,
		hook: 'The ultimate wager',
		collections: ['adventure', 'wit-wonder'],
		cover: {
			letter: '80',
			bgColor: '#1a3a4a',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/jules-verne/around-the-world-in-eighty-days/george-makepeace-towle',
			epubUrl: 'https://standardebooks.org/ebooks/jules-verne/around-the-world-in-eighty-days/george-makepeace-towle/downloads/jules-verne_around-the-world-in-eighty-days_george-makepeace-towle.epub'
		}
	},
	{
		id: 'kim',
		title: 'Kim',
		author: 'Rudyard Kipling',
		year: 1901,
		hours: 10,
		hook: 'The Great Game in India',
		collections: ['adventure', 'indian-classics'],
		cover: {
			letter: 'K',
			bgColor: '#d4a574',
			letterColor: '#1a0a0a',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/rudyard-kipling/kim',
			epubUrl: 'https://standardebooks.org/ebooks/rudyard-kipling/kim/downloads/rudyard-kipling_kim.epub'
		}
	},
	{
		id: 'les-miserables',
		title: 'Les Misérables',
		author: 'Victor Hugo',
		year: 1862,
		hours: 50,
		hook: 'Justice, mercy, redemption',
		collections: ['bucket-list', 'all-time-greats', 'french', 'epic', 'history'],
		cover: {
			letter: 'L',
			bgColor: '#1a1a2e',
			letterColor: '#e8dcc8',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/victor-hugo/les-miserables/isabel-f-hapgood',
			epubUrl: 'https://standardebooks.org/ebooks/victor-hugo/les-miserables/isabel-f-hapgood/downloads/victor-hugo_les-miserables_isabel-f-hapgood.epub'
		}
	},
	{
		id: 'hunchback',
		title: 'The Hunchback of Notre-Dame',
		author: 'Victor Hugo',
		year: 1831,
		hours: 15,
		hook: 'Sanctuary! Sanctuary!',
		collections: ['french', 'gothic', 'love-society', 'history'],
		cover: {
			letter: 'N',
			bgColor: '#3d3225',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/2610',
			epubUrl: 'https://www.gutenberg.org/cache/epub/2610/pg2610-images.epub'
		}
	},
	{
		id: 'leaves-of-grass',
		title: 'Leaves of Grass',
		author: 'Walt Whitman',
		year: 1855,
		hours: 8,
		hook: 'I contain multitudes',
		collections: ['bucket-list', 'all-time-greats', 'american', 'poetry'],
		cover: {
			letter: 'W',
			bgColor: '#2d4a2d',
			letterColor: '#f5f5f0',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/walt-whitman/leaves-of-grass',
			epubUrl: 'https://standardebooks.org/ebooks/walt-whitman/leaves-of-grass/downloads/walt-whitman_leaves-of-grass.epub'
		}
	},
	{
		id: 'scarlet-letter',
		title: 'The Scarlet Letter',
		author: 'Nathaniel Hawthorne',
		year: 1850,
		hours: 6,
		hook: 'Sin, shame, and Puritan America',
		collections: ['american', 'love-society', 'gothic', 'history'],
		cover: {
			letter: 'A',
			bgColor: '#8b0000',
			letterColor: '#f5f5f0',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/nathaniel-hawthorne/the-scarlet-letter',
			epubUrl: 'https://standardebooks.org/ebooks/nathaniel-hawthorne/the-scarlet-letter/downloads/nathaniel-hawthorne_the-scarlet-letter.epub'
		}
	},

	// === POETRY ===
	{
		id: 'dickinson-poems',
		title: 'Poems',
		author: 'Emily Dickinson',
		year: 1890,
		hours: 4,
		hook: 'Tell all the truth but tell it slant',
		collections: ['all-time-greats', 'american', 'poetry', 'short'],
		cover: {
			letter: 'D',
			bgColor: '#f5f2eb',
			letterColor: '#4a3728',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/12242',
			epubUrl: 'https://www.gutenberg.org/cache/epub/12242/pg12242-images.epub'
		}
	},
	{
		id: 'blake-poems',
		title: 'Songs of Innocence and Experience',
		author: 'William Blake',
		year: 1794,
		hours: 2,
		hook: 'Tyger Tyger, burning bright',
		collections: ['poetry', 'short'],
		cover: {
			letter: 'B',
			bgColor: '#c9a227',
			letterColor: '#1a1a1a',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/574',
			epubUrl: 'https://www.gutenberg.org/cache/epub/574/pg574-images.epub'
		}
	},
	{
		id: 'keats-poems',
		title: 'Poems',
		author: 'John Keats',
		year: 1820,
		hours: 4,
		hook: 'Beauty is truth, truth beauty',
		collections: ['poetry'],
		cover: {
			letter: 'K',
			bgColor: '#5b8a72',
			letterColor: '#f5f5f0',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/john-keats/poetry',
			epubUrl: 'https://standardebooks.org/ebooks/john-keats/poetry/downloads/john-keats_poetry.epub'
		}
	},
	{
		id: 'shelley-poems',
		title: 'The Complete Poetical Works',
		author: 'Percy Bysshe Shelley',
		year: 1820,
		hours: 12,
		hook: 'Radical lyricism, from “Ozymandias” onward',
		collections: ['poetry'],
		cover: {
			letter: 'S',
			bgColor: '#4a90a4',
			letterColor: '#f5f5f0',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/4800',
			epubUrl: 'https://www.gutenberg.org/cache/epub/4800/pg4800-images.epub'
		}
	},
	{
		id: 'rubaiyat',
		title: 'Rubáiyát of Omar Khayyám',
		author: 'Omar Khayyám',
		year: 1120,
		hours: 1,
		hook: 'A jug of wine, a loaf of bread',
		collections: ['poetry', 'short', 'middle-eastern', 'world-classics'],
		cover: {
			letter: 'R',
			bgColor: '#8b4513',
			bgColorEnd: '#5d2e0a',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/omar-khayyam/the-rubaiyat-of-omar-khayyam/edward-fitzgerald',
			epubUrl: 'https://standardebooks.org/ebooks/omar-khayyam/the-rubaiyat-of-omar-khayyam/edward-fitzgerald/downloads/omar-khayyam_the-rubaiyat-of-omar-khayyam_edward-fitzgerald.epub'
		}
	},
	{
		id: 'shakespeare-sonnets',
		title: 'Sonnets',
		author: 'William Shakespeare',
		year: 1609,
		hours: 2,
		hook: 'Shall I compare thee to a summers day?',
		collections: ['all-time-greats', 'poetry', 'love-society', 'short'],
		cover: {
			letter: 'S',
			bgColor: '#1a1a2e',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/1041',
			epubUrl: 'https://www.gutenberg.org/cache/epub/1041/pg1041-images.epub'
		}
	},
	{
		id: 'wordsworth-poems',
		title: 'The Poetical Works — Volume 1',
		author: 'William Wordsworth',
		year: 1807,
		hours: 6,
		hook: 'Wandered lonely as a cloud',
		collections: ['poetry'],
		cover: {
			letter: 'W',
			bgColor: '#2d4a2d',
			letterColor: '#e8dcc8',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/10219',
			epubUrl: 'https://www.gutenberg.org/cache/epub/10219/pg10219-images.epub'
		}
	},
	{
		id: 'rumi-poems',
		title: 'Selected Poems',
		author: 'Rumi',
		year: 1260,
		hours: 3,
		hook: 'Out beyond ideas of wrongdoing',
		collections: ['poetry', 'religion', 'middle-eastern', 'world-classics', 'short'],
		cover: {
			letter: 'R',
			bgColor: '#1a3a4a',
			bgColorEnd: '#0d252f',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/56701',
			epubUrl: 'https://www.gutenberg.org/cache/epub/56701/pg56701-images.epub'
		}
	},
	{
		id: 'browning-poems',
		title: 'Sonnets from the Portuguese',
		author: 'Elizabeth Barrett Browning',
		year: 1850,
		hours: 1,
		hook: 'How do I love thee? Let me count',
		collections: ['poetry', 'love-society', 'short'],
		cover: {
			letter: 'B',
			bgColor: '#8b4557',
			letterColor: '#f5e6d3',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/elizabeth-barrett-browning/sonnets-from-the-portuguese',
			epubUrl: 'https://standardebooks.org/ebooks/elizabeth-barrett-browning/sonnets-from-the-portuguese/downloads/elizabeth-barrett-browning_sonnets-from-the-portuguese.epub'
		}
	},

	// === WESTERN PHILOSOPHY ===
	{
		id: 'pensees',
		title: 'Pensées',
		author: 'Blaise Pascal',
		year: 1670,
		hours: 8,
		hook: 'The heart has reasons that reason cannot know',
		collections: ['philosophy', 'religion', 'french'],
		cover: {
			letter: 'P',
			bgColor: '#3d3225',
			letterColor: '#e8dcc8',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/18269',
			epubUrl: 'https://www.gutenberg.org/cache/epub/18269/pg18269-images.epub'
		}
	},

	// === STOIC PHILOSOPHY ===
	{
		id: 'seneca-letters',
		title: "Seneca's Morals of a Happy Life",
		author: 'Seneca',
		year: 65,
		hours: 8,
		hook: 'A Stoic guide to calm, anger, and clemency',
		collections: ['philosophy', 'religion'],
		cover: {
			letter: 'S',
			bgColor: '#2c3e50',
			letterColor: '#ecf0f1',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/56075',
			epubUrl: 'https://www.gutenberg.org/cache/epub/56075/pg56075-images.epub'
		}
	},
	{
		id: 'epictetus-discourses',
		title: 'Discourses',
		author: 'Epictetus',
		year: 108,
		hours: 10,
		hook: 'What is in your control?',
		collections: ['philosophy', 'religion'],
		cover: {
			letter: 'E',
			bgColor: '#5d4e37',
			letterColor: '#f5e6d3',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/epictetus/discourses/george-long',
			epubUrl: 'https://standardebooks.org/ebooks/epictetus/discourses/george-long/downloads/epictetus_discourses_george-long.epub'
		}
	},
	{
		id: 'epictetus-enchiridion',
		title: 'The Enchiridion',
		author: 'Epictetus',
		year: 125,
		hours: 1,
		hook: 'Stoicism in 53 principles',
		collections: ['philosophy', 'short', 'start-here'],
		cover: {
			letter: 'E',
			bgColor: '#34495e',
			letterColor: '#bdc3c7',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/epictetus/the-enchiridion/elizabeth-carter',
			epubUrl: 'https://standardebooks.org/ebooks/epictetus/the-enchiridion/elizabeth-carter/downloads/epictetus_the-enchiridion_elizabeth-carter.epub'
		}
	},
	{
		id: 'seneca-dialogues',
		title: 'Dialogues',
		author: 'Seneca',
		year: 49,
		hours: 8,
		hook: 'On anger, tranquility, and the shortness of life',
		collections: ['philosophy', 'religion'],
		cover: {
			letter: 'S',
			bgColor: '#1a1a2e',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/seneca/dialogues/aubrey-stewart',
			epubUrl: 'https://standardebooks.org/ebooks/seneca/dialogues/aubrey-stewart/downloads/seneca_dialogues_aubrey-stewart.epub'
		}
	},

	// === NON-WESTERN PHILOSOPHY ===
	{
		id: 'analects',
		title: 'The Analects',
		author: 'Confucius',
		year: -479,
		hours: 4,
		hook: 'Wisdom, virtue, and the good life',
		collections: ['world-classics', 'east-asian', 'philosophy', 'religion', 'bucket-list'],
		cover: {
			letter: '論',
			bgColor: '#8b0000',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/3330',
			epubUrl: 'https://www.gutenberg.org/cache/epub/3330/pg3330-images.epub'
		}
	},
	{
		id: 'art-of-war',
		title: 'The Art of War',
		author: 'Sun Tzu',
		year: -500,
		hours: 2,
		hook: 'Strategy beyond the battlefield',
		collections: ['philosophy', 'history', 'short'],
		cover: {
			letter: '兵',
			bgColor: '#1a1a1a',
			letterColor: '#8b0000',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/sun-tzu/the-art-of-war/lionel-giles',
			epubUrl: 'https://standardebooks.org/ebooks/sun-tzu/the-art-of-war/lionel-giles/downloads/sun-tzu_the-art-of-war_lionel-giles.epub'
		}
	},
	{
		id: 'zhuangzi',
		title: 'Zhuangzi',
		author: 'Zhuang Zhou',
		year: -300,
		hours: 8,
		hook: 'Dream of the butterfly',
		collections: ['world-classics', 'east-asian', 'philosophy', 'religion', 'wit-wonder'],
		cover: {
			letter: '莊',
			bgColor: '#2d4a2d',
			letterColor: '#f5f5f0',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/939',
			epubUrl: 'https://www.gutenberg.org/cache/epub/939/pg939-images.epub'
		}
	},
	{
		id: 'mencius',
		title: 'Mencius',
		author: 'Mencius',
		year: -300,
		hours: 6,
		hook: 'Human nature is good',
		collections: ['world-classics', 'east-asian', 'philosophy', 'religion'],
		cover: {
			letter: '孟',
			bgColor: '#4a3728',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/895',
			epubUrl: 'https://www.gutenberg.org/cache/epub/895/pg895-images.epub'
		}
	},
	{
		id: 'i-ching',
		title: 'I Ching',
		author: 'Various',
		year: -1000,
		hours: 5,
		hook: 'The book of changes',
		collections: ['world-classics', 'east-asian', 'philosophy', 'religion'],
		cover: {
			letter: '易',
			bgColor: '#1a1a1a',
			letterColor: '#f5f5f0',
			style: 'filled'
		},
		source: {
			name: 'gutenberg',
			url: 'https://www.gutenberg.org/ebooks/339',
			epubUrl: 'https://www.gutenberg.org/cache/epub/339/pg339-images.epub'
		}
	},
	{
		id: 'african-philosophy',
		title: 'The Souls of Black Folk',
		author: 'W. E. B. Du Bois',
		year: 1903,
		hours: 5,
		hook: 'Double consciousness and the color line',
		collections: ['philosophy', 'american', 'african-diaspora', 'history', 'bucket-list'],
		cover: {
			letter: 'D',
			bgColor: '#2c2c2c',
			letterColor: '#c9a227',
			style: 'filled'
		},
		source: {
			name: 'standard-ebooks',
			url: 'https://standardebooks.org/ebooks/w-e-b-du-bois/the-souls-of-black-folk',
			epubUrl: 'https://standardebooks.org/ebooks/w-e-b-du-bois/the-souls-of-black-folk/downloads/w-e-b-du-bois_the-souls-of-black-folk.epub'
		}
	}
];

// Helper function to get books by collection
export function getBooksByCollection(collectionId: CollectionId): CuratedBook[] {
	return curatedBooks.filter(book => book.collections.includes(collectionId));
}

// Helper function to get a collection by ID
export function getCollection(collectionId: CollectionId): Collection | undefined {
	return collections.find(c => c.id === collectionId);
}

// Helper function to search books
export function searchBooks(query: string): CuratedBook[] {
	const q = query.toLowerCase();
	return curatedBooks.filter(book =>
		book.title.toLowerCase().includes(q) ||
		book.author.toLowerCase().includes(q) ||
		book.hook.toLowerCase().includes(q)
	);
}
