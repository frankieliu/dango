import type { Card } from '$lib/types';

/**
 * Card format in markdown:
 *
 * ---
 * tags: [vocabulary, spanish]
 * created: 2025-01-01T12:00:00Z
 * modified: 2025-01-01T12:00:00Z
 * nextReview: 2025-01-02T12:00:00Z
 * interval: 1
 * easeFactor: 2.5
 * repetitions: 0
 * ---
 *
 * Front content here
 * ![image](0)
 *
 * ===
 *
 * Back content here
 * ![image](0)
 *
 * ---
 *
 * [next card]
 */

interface CardMetadata {
	tags?: string[];
	created?: string;
	modified?: string;
	nextReview?: string;
	interval?: number;
	easeFactor?: number;
	repetitions?: number;
}

interface ParsedCard {
	metadata: CardMetadata;
	front: string;
	back: string;
}

/**
 * Parse YAML-like frontmatter
 */
function parseFrontmatter(yaml: string): CardMetadata {
	const metadata: CardMetadata = {};
	const lines = yaml.trim().split('\n');

	for (const line of lines) {
		const match = line.match(/^(\w+):\s*(.+)$/);
		if (!match) continue;

		const [, key, value] = match;
		const trimmedValue = value.trim();

		switch (key) {
			case 'tags':
				// Parse [tag1, tag2] or ["tag1", "tag2"]
				const tagsMatch = trimmedValue.match(/\[(.*)\]/);
				if (tagsMatch) {
					metadata.tags = tagsMatch[1]
						.split(',')
						.map((t) => t.trim().replace(/['"]/g, ''))
						.filter((t) => t.length > 0);
				}
				break;
			case 'created':
			case 'modified':
			case 'nextReview':
				metadata[key] = trimmedValue;
				break;
			case 'interval':
			case 'easeFactor':
			case 'repetitions':
				metadata[key] = parseFloat(trimmedValue);
				break;
		}
	}

	return metadata;
}

/**
 * Parse a single card from markdown text
 */
function parseCard(cardText: string): ParsedCard | null {
	let front = '';
	let back = '';
	let metadata: CardMetadata = {};

	// Check if card starts with frontmatter
	if (cardText.trim().startsWith('---')) {
		// Extract frontmatter
		const parts = cardText.split('---');
		if (parts.length >= 3) {
			// parts[0] is empty, parts[1] is frontmatter, parts[2]+ is content
			metadata = parseFrontmatter(parts[1]);
			cardText = parts.slice(2).join('---');
		}
	}

	// Split front and back by === or ***
	let separator = '===';
	let separatorIndex = cardText.indexOf('\n===\n');
	if (separatorIndex === -1) {
		separatorIndex = cardText.indexOf('\n***\n');
		separator = '***';
	}
	if (separatorIndex === -1) {
		separatorIndex = cardText.indexOf('\n___\n');
		separator = '___';
	}

	if (separatorIndex !== -1) {
		front = cardText.substring(0, separatorIndex).trim();
		back = cardText.substring(separatorIndex + separator.length + 2).trim();
	} else {
		// No separator found - treat entire content as front
		front = cardText.trim();
		back = '';
	}

	if (!front) {
		return null; // Invalid card
	}

	return { metadata, front, back };
}

/**
 * Parse markdown file content into cards
 */
export function parseMarkdownFile(content: string): ParsedCard[] {
	const cards: ParsedCard[] = [];

	// Split by card separator (--- at the beginning of a line, not part of frontmatter)
	// We need to be careful not to split on frontmatter ---
	const lines = content.split('\n');
	const cardSections: string[] = [];
	let currentSection = '';
	let inFrontmatter = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Check if this is a --- line
		if (line.trim() === '---') {
			// If we're at the start of a section or just after content, this might be frontmatter start
			if (currentSection.trim() === '') {
				inFrontmatter = true;
				currentSection += line + '\n';
			} else if (inFrontmatter) {
				// This is the end of frontmatter
				inFrontmatter = false;
				currentSection += line + '\n';
			} else {
				// This is a card separator
				if (currentSection.trim()) {
					cardSections.push(currentSection);
				}
				currentSection = '';
			}
		} else {
			currentSection += line + '\n';
		}
	}

	// Don't forget the last section
	if (currentSection.trim()) {
		cardSections.push(currentSection);
	}

	// Parse each card section
	for (const section of cardSections) {
		const parsed = parseCard(section);
		if (parsed) {
			cards.push(parsed);
		}
	}

	return cards;
}

/**
 * Convert parsed cards to Card objects
 */
export function convertToCards(parsedCards: ParsedCard[], deckId: number): Partial<Card>[] {
	const now = Date.now();

	return parsedCards.map((parsed) => {
		const card: Partial<Card> = {
			deckId,
			front: parsed.front,
			back: parsed.back,
			tags: parsed.metadata.tags || [],
			created: parsed.metadata.created ? new Date(parsed.metadata.created).getTime() : now,
			modified: parsed.metadata.modified ? new Date(parsed.metadata.modified).getTime() : now,
			nextReview: parsed.metadata.nextReview
				? new Date(parsed.metadata.nextReview).getTime()
				: now,
			interval: parsed.metadata.interval ?? 0,
			easeFactor: parsed.metadata.easeFactor ?? 2.5,
			repetitions: parsed.metadata.repetitions ?? 0
		};

		return card;
	});
}

/**
 * Extract image references from markdown text
 * Returns array of image paths/URLs referenced
 */
export function extractImageReferences(markdown: string): string[] {
	const images: string[] = [];
	const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
	let match;

	while ((match = regex.exec(markdown)) !== null) {
		const ref = match[2];
		// Skip if it's already a data URL or numeric index
		if (!ref.startsWith('data:') && isNaN(parseInt(ref)) && !ref.match(/^image-\d+$/)) {
			images.push(ref);
		}
	}

	return images;
}

/**
 * Load image file and convert to base64
 */
export async function loadImageAsBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}
