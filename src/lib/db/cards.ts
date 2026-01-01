import { db } from './schema';
import type { Card } from '../types';

export const cardOperations = {
	/**
	 * Create a new card
	 */
	async create(card: Omit<Card, 'id'>): Promise<number> {
		const now = Date.now();
		return await db.cards.add({
			...card,
			created: now,
			modified: now
		});
	},

	/**
	 * Get a card by ID
	 */
	async getById(id: number): Promise<Card | undefined> {
		return await db.cards.get(id);
	},

	/**
	 * Get all cards in a deck
	 */
	async getByDeck(deckId: number): Promise<Card[]> {
		return await db.cards.where('deckId').equals(deckId).toArray();
	},

	/**
	 * Get cards due for review
	 */
	async getDueCards(deckId?: number): Promise<Card[]> {
		const now = Date.now();
		let query = db.cards.where('nextReview').belowOrEqual(now);

		if (deckId !== undefined) {
			query = query.and((card) => card.deckId === deckId);
		}

		return await query.toArray();
	},

	/**
	 * Update a card
	 */
	async update(id: number, updates: Partial<Card>): Promise<number> {
		return await db.cards.update(id, {
			...updates,
			modified: Date.now()
		});
	},

	/**
	 * Delete a card
	 */
	async delete(id: number): Promise<void> {
		await db.cards.delete(id);
	},

	/**
	 * Search cards by text (front or back content)
	 */
	async search(query: string): Promise<Card[]> {
		const lowerQuery = query.toLowerCase();
		return await db.cards
			.filter(
				(card) =>
					card.front.toLowerCase().includes(lowerQuery) ||
					card.back.toLowerCase().includes(lowerQuery)
			)
			.toArray();
	},

	/**
	 * Get cards by tags
	 */
	async getByTags(tags: string[]): Promise<Card[]> {
		return await db.cards.where('tags').anyOf(tags).toArray();
	}
};
