import { db } from './schema';
import type { Deck } from '../types';
import { defaultDeckSettings } from '../types';

export const deckOperations = {
	/**
	 * Create a new deck
	 */
	async create(deck: Omit<Deck, 'id' | 'created' | 'modified' | 'settings' | 'archived'> & { settings?: Partial<Deck['settings']> }): Promise<number> {
		const now = Date.now();
		return await db.decks.add({
			...deck,
			created: now,
			modified: now,
			archived: false,
			settings: { ...defaultDeckSettings, ...deck.settings }
		});
	},

	/**
	 * Get a deck by ID
	 */
	async getById(id: number): Promise<Deck | undefined> {
		return await db.decks.get(id);
	},

	/**
	 * Get all decks (excluding archived by default)
	 */
	async getAll(includeArchived = false): Promise<Deck[]> {
		let query = db.decks.toCollection();

		if (!includeArchived) {
			query = query.filter((deck) => !deck.archived);
		}

		return await query.sortBy('name');
	},

	/**
	 * Get child decks of a parent deck
	 */
	async getChildren(parentId: number): Promise<Deck[]> {
		return await db.decks.where('parentId').equals(parentId).sortBy('name');
	},

	/**
	 * Get root level decks (no parent)
	 */
	async getRootDecks(): Promise<Deck[]> {
		return await db.decks.filter((deck) => !deck.parentId && !deck.archived).sortBy('name');
	},

	/**
	 * Update a deck
	 */
	async update(id: number, updates: Partial<Deck>): Promise<number> {
		return await db.decks.update(id, {
			...updates,
			modified: Date.now()
		});
	},

	/**
	 * Archive a deck
	 */
	async archive(id: number): Promise<number> {
		return await db.decks.update(id, {
			archived: true,
			modified: Date.now()
		});
	},

	/**
	 * Unarchive a deck
	 */
	async unarchive(id: number): Promise<number> {
		return await db.decks.update(id, {
			archived: false,
			modified: Date.now()
		});
	},

	/**
	 * Delete a deck and all its cards
	 */
	async delete(id: number): Promise<void> {
		// Delete all cards in this deck first
		await db.cards.where('deckId').equals(id).delete();
		// Then delete the deck
		await db.decks.delete(id);
	}
};
