import Dexie, { type EntityTable } from 'dexie';
import type { Card, Deck, Review } from '../types';

export class DangoDB extends Dexie {
	cards!: EntityTable<Card, 'id'>;
	decks!: EntityTable<Deck, 'id'>;
	reviews!: EntityTable<Review, 'id'>;

	constructor() {
		super('DangoDB');

		this.version(1).stores({
			cards: '++id, deckId, nextReview, created, *tags',
			decks: '++id, name, parentId, created, archived',
			reviews: '++id, cardId, date'
		});
	}
}

// Export a singleton instance
export const db = new DangoDB();
