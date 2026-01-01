export interface Card {
	id?: number;
	deckId: number;
	front: string; // Markdown
	back: string; // Markdown
	created: number; // Unix timestamp
	modified: number; // Unix timestamp
	nextReview: number; // Unix timestamp
	interval: number; // Days
	easeFactor: number; // FSRS ease factor
	repetitions: number;
	tags: string[];
	fields?: Record<string, string>;
	attachments?: string[];
}
