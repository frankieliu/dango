export interface DeckSettings {
	newCardsPerDay: number;
	reviewsPerDay: number;
	easyBonus: number;
	intervalModifier: number;
}

export interface Deck {
	id?: number;
	name: string;
	description?: string;
	parentId?: number; // For nested decks
	created: number; // Unix timestamp
	modified: number; // Unix timestamp
	settings: DeckSettings;
	archived: boolean;
}

export const defaultDeckSettings: DeckSettings = {
	newCardsPerDay: 20,
	reviewsPerDay: 200,
	easyBonus: 1.3,
	intervalModifier: 1.0
};
