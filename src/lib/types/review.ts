export type ReviewResult = 'again' | 'hard' | 'good' | 'easy';

export interface Review {
	id?: number;
	cardId: number;
	date: number; // Unix timestamp
	result: ReviewResult;
	interval: number; // Days after review
	timeSpent: number; // Milliseconds
}
