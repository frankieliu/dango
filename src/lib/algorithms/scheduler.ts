import type { Card, ReviewResult } from '../types';
import * as FSRS from './fsrs';

/**
 * Scheduler with support for both SM-2 and FSRS algorithms
 * FSRS is used by default as it's more accurate and modern
 */

export type SchedulerAlgorithm = 'fsrs' | 'sm2';

interface ScheduleResult {
	interval: number; // Days until next review
	easeFactor: number; // New ease factor (or difficulty for FSRS)
	repetitions: number; // Number of successful repetitions
	nextReview: number; // Unix timestamp for next review
}

// Current algorithm setting (can be changed via settings)
let currentAlgorithm: SchedulerAlgorithm = 'fsrs';

/**
 * Set the algorithm to use for scheduling
 */
export function setAlgorithm(algorithm: SchedulerAlgorithm) {
	currentAlgorithm = algorithm;
}

/**
 * Get the current algorithm
 */
export function getAlgorithm(): SchedulerAlgorithm {
	return currentAlgorithm;
}

/**
 * Calculate the next review schedule based on the user's rating
 * Uses FSRS by default, falls back to SM-2 if specified
 */
export function calculateNextReview(card: Card, result: ReviewResult): ScheduleResult {
	if (currentAlgorithm === 'fsrs') {
		const fsrsResult = FSRS.calculateNextReview(card, result);
		// Map FSRS result to ScheduleResult format
		return {
			interval: fsrsResult.interval,
			easeFactor: fsrsResult.difficulty, // Store difficulty in easeFactor field
			repetitions: result === 'again' ? 0 : card.repetitions + 1,
			nextReview: fsrsResult.nextReview
		};
	}

	// SM-2 algorithm (legacy fallback)
	return calculateNextReviewSM2(card, result);
}

/**
 * SM-2 algorithm implementation (kept for compatibility)
 */
function calculateNextReviewSM2(card: Card, result: ReviewResult): ScheduleResult {
	let interval = card.interval;
	let easeFactor = card.easeFactor;
	let repetitions = card.repetitions;

	// SM-2 algorithm
	switch (result) {
		case 'again':
			// Failed - reset to beginning
			interval = 0;
			repetitions = 0;
			easeFactor = Math.max(1.3, easeFactor - 0.2);
			break;

		case 'hard':
			// Passed but difficult
			if (repetitions === 0) {
				interval = 1;
				repetitions = 1;
			} else {
				interval = Math.max(1, interval * 1.2);
			}
			easeFactor = Math.max(1.3, easeFactor - 0.15);
			break;

		case 'good':
			// Normal success
			if (repetitions === 0) {
				interval = 1;
			} else if (repetitions === 1) {
				interval = 6;
			} else {
				interval = Math.round(interval * easeFactor);
			}
			repetitions++;
			break;

		case 'easy':
			// Very easy
			if (repetitions === 0) {
				interval = 4;
			} else if (repetitions === 1) {
				interval = 10;
			} else {
				interval = Math.round(interval * easeFactor * 1.3);
			}
			repetitions++;
			easeFactor = Math.min(2.5, easeFactor + 0.15);
			break;
	}

	// Calculate next review timestamp (interval in days)
	const now = Date.now();
	const nextReview = now + interval * 24 * 60 * 60 * 1000;

	return {
		interval,
		easeFactor,
		repetitions,
		nextReview
	};
}

/**
 * Get a human-readable description of the next interval
 * Uses FSRS's more detailed interval descriptions
 */
export function getIntervalDescription(days: number): string {
	return FSRS.getIntervalDescription(days);
}

/**
 * Get recommended button labels with time intervals
 */
export function getButtonLabels(card: Card) {
	if (currentAlgorithm === 'fsrs') {
		return FSRS.getButtonLabels(card);
	}

	// Simple SM-2 labels
	if (card.repetitions === 0) {
		return { again: '< 1d', hard: '1d', good: '1d', easy: '4d' };
	}

	return {
		again: '< 1d',
		hard: getIntervalDescription(Math.max(1, card.interval * 1.2)),
		good: getIntervalDescription(Math.round(card.interval * card.easeFactor)),
		easy: getIntervalDescription(Math.round(card.interval * card.easeFactor * 1.3))
	};
}

