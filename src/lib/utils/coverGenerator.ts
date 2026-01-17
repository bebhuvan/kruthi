/**
 * Generative Book Cover System
 * Creates unique, beautiful covers based on book metadata
 */

export interface GeneratedCover {
	bgColor: string;
	bgColorEnd: string;
	accentColor: string;
	textColor: string;
	pattern: 'gradient' | 'geometric' | 'minimal' | 'duotone' | 'classic';
	patternData?: string;
}

// Refined color palettes - sophisticated and book-appropriate (30 palettes for variety)
const COLOR_PALETTES = [
	// Warm neutrals
	{ bg: '#2C2825', bgEnd: '#1A1815', accent: '#D4A574', text: '#F5F0EB' },
	{ bg: '#3D3330', bgEnd: '#252120', accent: '#C9A87C', text: '#F2EDE8' },
	{ bg: '#4A3F3A', bgEnd: '#2D2522', accent: '#E8C59A', text: '#FAF7F4' },

	// Deep blues
	{ bg: '#1E2A38', bgEnd: '#0F1620', accent: '#7BA3C9', text: '#E8EEF4' },
	{ bg: '#243B4A', bgEnd: '#152330', accent: '#8BB8D0', text: '#EDF3F7' },
	{ bg: '#2A3E50', bgEnd: '#1A2835', accent: '#A4C8E0', text: '#F0F5F9' },

	// Forest greens
	{ bg: '#2A3830', bgEnd: '#1A2420', accent: '#8BAA8C', text: '#EDF2ED' },
	{ bg: '#324035', bgEnd: '#1E2820', accent: '#9DB89E', text: '#F0F5F0' },
	{ bg: '#384538', bgEnd: '#222C22', accent: '#B0C8A8', text: '#F3F7F2' },

	// Burgundy & wine
	{ bg: '#3A2832', bgEnd: '#241820', accent: '#C89898', text: '#F5EDEE' },
	{ bg: '#452D38', bgEnd: '#2A1C24', accent: '#D4A5A5', text: '#F8F0F2' },
	{ bg: '#4A3040', bgEnd: '#2E1E28', accent: '#E0B0B0', text: '#FAF3F5' },

	// Slate & charcoal
	{ bg: '#32363A', bgEnd: '#1E2124', accent: '#9CA3AB', text: '#ECEEF0' },
	{ bg: '#3A4045', bgEnd: '#24282C', accent: '#A8B0B8', text: '#EEF0F2' },
	{ bg: '#424850', bgEnd: '#2A3038', accent: '#B5BDC5', text: '#F0F2F4' },

	// Warm earth
	{ bg: '#4A4035', bgEnd: '#2C2620', accent: '#C4A882', text: '#F5F0EA' },
	{ bg: '#524838', bgEnd: '#342C22', accent: '#D0B890', text: '#F7F3EC' },
	{ bg: '#5A5040', bgEnd: '#3A3428', accent: '#DCC8A0', text: '#FAF6F0' },

	// Plum & violet
	{ bg: '#352838', bgEnd: '#201820', accent: '#A888B0', text: '#F2ECF4' },
	{ bg: '#3E3042', bgEnd: '#261E2A', accent: '#B898C0', text: '#F5F0F6' },
	{ bg: '#48384A', bgEnd: '#2E2430', accent: '#C8A8D0', text: '#F8F4F9' },

	// Ocean teal
	{ bg: '#253538', bgEnd: '#152022', accent: '#78A8A8', text: '#E8F2F2' },
	{ bg: '#2D3E40', bgEnd: '#1C2828', accent: '#88B8B8', text: '#ECF5F5' },
	{ bg: '#354848', bgEnd: '#223030', accent: '#98C8C8', text: '#F0F8F8' },

	// Coral & terracotta
	{ bg: '#4A3530', bgEnd: '#2E2018', accent: '#E0A090', text: '#FAF5F2' },
	{ bg: '#503832', bgEnd: '#32201C', accent: '#D89080', text: '#F8F2EE' },
	{ bg: '#5A4038', bgEnd: '#382820', accent: '#C88878', text: '#F5F0EC' },

	// Indigo night
	{ bg: '#282848', bgEnd: '#181830', accent: '#9898D0', text: '#F0F0FA' },
	{ bg: '#303058', bgEnd: '#1C1C38', accent: '#A8A8E0', text: '#F2F2FC' },
	{ bg: '#383868', bgEnd: '#202040', accent: '#B8B8F0', text: '#F5F5FE' },

	// Moss & sage
	{ bg: '#3A4538', bgEnd: '#242C24', accent: '#A8C090', text: '#F2F5F0' },
	{ bg: '#404A3C', bgEnd: '#283028', accent: '#B8D0A0', text: '#F5F8F2' },
	{ bg: '#485040', bgEnd: '#2C3428', accent: '#C8E0B0', text: '#F8FAF5' },
];

// Geometric pattern generators
const PATTERNS = {
	circles: (color: string) => `
		<pattern id="circles" width="40" height="40" patternUnits="userSpaceOnUse">
			<circle cx="20" cy="20" r="8" fill="none" stroke="${color}" stroke-width="0.5" opacity="0.15"/>
		</pattern>
	`,
	dots: (color: string) => `
		<pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
			<circle cx="10" cy="10" r="1.5" fill="${color}" opacity="0.12"/>
		</pattern>
	`,
	lines: (color: string) => `
		<pattern id="lines" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
			<line x1="0" y1="0" x2="0" y2="20" stroke="${color}" stroke-width="0.5" opacity="0.1"/>
		</pattern>
	`,
	grid: (color: string) => `
		<pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
			<rect x="0" y="0" width="30" height="30" fill="none" stroke="${color}" stroke-width="0.3" opacity="0.08"/>
		</pattern>
	`,
	diamonds: (color: string) => `
		<pattern id="diamonds" width="24" height="24" patternUnits="userSpaceOnUse">
			<polygon points="12,2 22,12 12,22 2,12" fill="none" stroke="${color}" stroke-width="0.5" opacity="0.1"/>
		</pattern>
	`,
};

/**
 * Generate a deterministic hash from a string (improved distribution)
 * Uses FNV-1a hash for better distribution across the palette
 */
function hashString(str: string): number {
	// FNV-1a hash - better distribution than simple djb2
	let hash = 2166136261; // FNV offset basis
	for (let i = 0; i < str.length; i++) {
		hash ^= str.charCodeAt(i);
		hash = Math.imul(hash, 16777619); // FNV prime
	}
	return Math.abs(hash >>> 0);
}

/**
 * Generate a secondary hash for pattern selection (prevents correlation with color)
 */
function hashStringSecondary(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = ((hash << 7) - hash) + char + (i * 31);
		hash = hash & 0x7fffffff;
	}
	return hash;
}

/**
 * Generate a cover design based on book metadata
 */
export function generateCover(title: string, author: string = ''): GeneratedCover {
	// Use title for color, author for pattern - ensures different books by same author get different colors
	// and same title by different authors also varies
	const colorSeed = hashString(title.toLowerCase().trim());
	const patternSeed = hashStringSecondary(author.toLowerCase().trim() + title.slice(0, 3));

	// Select palette based on title hash - use prime multiplier for better spread
	const paletteIndex = (colorSeed * 7) % COLOR_PALETTES.length;
	const palette = COLOR_PALETTES[paletteIndex];

	// Select pattern type independently from color
	const patterns: GeneratedCover['pattern'][] = ['gradient', 'geometric', 'minimal', 'duotone', 'classic'];
	const patternType = patterns[patternSeed % patterns.length];

	// Generate pattern data if geometric - use combined hash for variety
	let patternData: string | undefined;
	if (patternType === 'geometric') {
		const patternKeys = Object.keys(PATTERNS) as (keyof typeof PATTERNS)[];
		const patternKey = patternKeys[(colorSeed + patternSeed) % patternKeys.length];
		patternData = PATTERNS[patternKey](palette.accent);
	}

	return {
		bgColor: palette.bg,
		bgColorEnd: palette.bgEnd,
		accentColor: palette.accent,
		textColor: palette.text,
		pattern: patternType,
		patternData,
	};
}

/**
 * Get the first letter of a title (handling special cases)
 */
export function getInitialLetter(title: string): string {
	const cleaned = title.replace(/^(the|a|an)\s+/i, '').trim();
	return cleaned.charAt(0).toUpperCase();
}

/**
 * Format author name for display
 */
export function formatAuthorShort(author: string): string {
	if (!author || author.length <= 20) return author || '';
	const parts = author.split(' ');
	if (parts.length >= 2) {
		return `${parts[0][0]}. ${parts[parts.length - 1]}`;
	}
	return author.slice(0, 18) + '…';
}

/**
 * Split title into display lines
 */
export function splitTitleLines(title: string, maxChars: number = 16): string[] {
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
	return lines.slice(0, 3);
}
