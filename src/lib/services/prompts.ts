/**
 * prompts.ts
 *
 * Prompt templates and response parsing helpers for the chat experience.
 */
import type { Chunk, SearchScope } from '$lib/types/retrieval';
import type { ChatMode, Citation } from '$lib/types/chat';
import type { HighlightAction } from '$lib/types/highlight';

const GROUNDED_SYSTEM_INSTRUCTIONS = `Use ONLY the provided book excerpts to answer questions.
Always quote passages verbatim and cite them by chunk_id.
If the answer is not in the excerpts, say "I could not find this in the book."
Do not provide external context unless the user explicitly asks for it.`;

const COMPANION_SYSTEM_INSTRUCTIONS = `You are a reading companion. Clarify, teach, and expand comprehension.
When the reader refers to earlier discussion, use the conversation history to maintain continuity.
If asked to expand on a previous answer, build on it without repeating the same quotes unless requested.
Use provided excerpts when they are relevant, but you may answer using general literary knowledge.
Never invent quotes. Only quote if excerpts are provided.
If you answer without excerpts, label it "Context" and be explicit it is interpretive.
Be expansive but not verbose: 2-4 concise paragraphs, each with a clear point.
Avoid fluff. Prefer concrete analysis (themes, style, character dynamics, narrative technique, historical reception).
Adjust for genre:
- Poetry: voice, imagery, form, line breaks, rhythm.
- Drama: dialogue, staging, character motivation, dramatic tension.
- Nonfiction: argument, evidence, framing, historical context.
- Genre fiction: tropes, pacing, worldbuilding, theme.`;

function formatExcerpts(excerpts: Chunk[]): string {
	return excerpts
		.map(
			(excerpt) =>
				`[chunk_id: ${excerpt.id} | chapter: ${excerpt.chapterTitle}]\n${excerpt.text}`
		)
		.join('\n\n');
}

export function buildQaPrompt(
	excerpts: Chunk[],
	question: string,
	scope: SearchScope,
	mode: ChatMode,
	customSystemPrompt?: string
): {
	system: string;
	user: string;
} {
	const scopeLabel = scope === 'current_chapter' ? 'current_chapter' : 'whole_book';
	const excerptBlock = formatExcerpts(excerpts);

	const baseInstructions =
		mode === 'companion' ? COMPANION_SYSTEM_INSTRUCTIONS : GROUNDED_SYSTEM_INSTRUCTIONS;
	// Combine custom prompt with base instructions
	const systemParts = [customSystemPrompt, baseInstructions].filter(Boolean);
	const system = systemParts.join('\n\n');

	return {
		system,
		user:
			mode === 'companion'
				? `Question: ${question}\nScope: ${scopeLabel}\n\nBook excerpts:\n${excerptBlock}\n\nResponse format:\nIf excerpts are relevant:\nQuoted passages:\n- "quote" (chunk_id: X, chapter: Y)\n\nExplanation:\n<grounded in quotes>\n\nOptional Context:\n<labeled "Context" if needed>\n\nIf excerpts are not relevant:\nContext:\n<2-4 short paragraphs, interpretive, no quotes>`
				: `Question: ${question}\nScope: ${scopeLabel}\n\nBook excerpts:\n${excerptBlock}\n\nResponse format:\nQuoted passages:\n- "quote" (chunk_id: X, chapter: Y)\n\nExplanation:\n<grounded in quotes>\n\nContext (only if asked):\n<external knowledge, labeled>`
	};
}

export function parseCitations(
	responseText: string,
	chunkLookup: Map<string, Chunk>
): Citation[] {
	const citations: Citation[] = [];
	const regex = /-\s+"([^"]+)"\s+\(chunk_id:\s*([^,\)]+)(?:,\s*chapter:\s*([^\)]+))?\)/g;

	let match = regex.exec(responseText);
	while (match) {
		const quote = match[1]?.trim();
		const chunkId = match[2]?.trim();
		const chapterTitle = match[3]?.trim();
		if (quote && chunkId) {
			const chunk = chunkLookup.get(chunkId);
			citations.push({
				chunkId,
				chapterId: chunk?.chapterId,
				chapterTitle: chapterTitle || chunk?.chapterTitle,
				quote
			});
		}
		match = regex.exec(responseText);
	}

	return citations;
}

export function isNotFoundResponse(responseText: string): boolean {
	return responseText.includes('I could not find this in the book.');
}

export function buildHighlightPrompt(params: {
	bookTitle: string;
	author: string;
	chapterTitle: string;
	action: HighlightAction;
	selectedText: string;
	context: string;
	customSystemPrompt?: string;
}): { system: string; user: string } {
	const baseSystem = `You are a reading companion helping with a specific passage.\nThe reader is reading \"${params.bookTitle}\" by ${params.author}, Chapter ${params.chapterTitle}.\n\nAction: ${params.action}`;

	// Combine custom prompt with base system for consistency
	const systemParts = [params.customSystemPrompt, baseSystem].filter(Boolean);
	const system = systemParts.join('\n\n');

	const user = `Selected text: \"${params.selectedText}\"\n\nSurrounding context:\n${params.context}\n\nRespond concisely. For \"define,\" include etymology if interesting. For \"translate,\" preserve tone. For \"simplify,\" keep the meaning intact.`;

	return { system, user };
}
