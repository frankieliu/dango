import type { Deck } from '$lib/types';

export interface DeckNode extends Deck {
	children: DeckNode[];
	level: number;
}

/**
 * Build a hierarchical tree from a flat list of decks
 */
export function buildDeckTree(decks: Deck[]): DeckNode[] {
	const deckMap = new Map<number, DeckNode>();
	const roots: DeckNode[] = [];

	// First pass: create DeckNode for each deck
	decks.forEach((deck) => {
		if (deck.id) {
			deckMap.set(deck.id, {
				...deck,
				children: [],
				level: 0
			});
		}
	});

	// Second pass: build parent-child relationships
	decks.forEach((deck) => {
		if (!deck.id) return;

		const node = deckMap.get(deck.id);
		if (!node) return;

		if (deck.parentId && deckMap.has(deck.parentId)) {
			// This is a child deck
			const parent = deckMap.get(deck.parentId)!;
			node.level = parent.level + 1;
			parent.children.push(node);
		} else {
			// This is a root deck
			roots.push(node);
		}
	});

	return roots;
}

/**
 * Flatten a deck tree back to a list (depth-first)
 */
export function flattenDeckTree(nodes: DeckNode[]): DeckNode[] {
	const result: DeckNode[] = [];

	function traverse(node: DeckNode) {
		result.push(node);
		node.children.forEach(traverse);
	}

	nodes.forEach(traverse);
	return result;
}

/**
 * Get all descendant deck IDs (children, grandchildren, etc.)
 */
export function getDescendantDeckIds(deckId: number, decks: Deck[]): number[] {
	const descendants: number[] = [];
	const children = decks.filter((d) => d.parentId === deckId);

	children.forEach((child) => {
		if (child.id) {
			descendants.push(child.id);
			// Recursively get grandchildren
			descendants.push(...getDescendantDeckIds(child.id, decks));
		}
	});

	return descendants;
}

/**
 * Check if moving a deck would create a circular reference
 */
export function wouldCreateCircularReference(
	deckId: number,
	newParentId: number | undefined,
	decks: Deck[]
): boolean {
	if (!newParentId) return false;
	if (deckId === newParentId) return true;

	// Check if newParent is a descendant of deck
	const descendants = getDescendantDeckIds(deckId, decks);
	return descendants.includes(newParentId);
}
