import type { Card, ReviewResult } from '../types';

/**
 * FSRS (Free Spaced Repetition Scheduler) Algorithm
 * A modern alternative to SM-2, based on research from 2023
 * https://github.com/open-spaced-repetition/fsrs4anki
 */

interface FSRSParameters {
	// Default parameters optimized for general learning
	w: number[]; // Weight parameters
	requestRetention: number; // Target retention rate (0-1)
	maximumInterval: number; // Maximum interval in days
	enableFuzz: boolean; // Add randomness to intervals
}

interface ScheduleResult {
	interval: number; // Days until next review
	stability: number; // Memory stability
	difficulty: number; // Card difficulty (0-10)
	nextReview: number; // Unix timestamp for next review
	state: 'new' | 'learning' | 'review' | 'relearning';
}

// Default FSRS parameters (optimized from research)
const DEFAULT_PARAMETERS: FSRSParameters = {
	w: [
		0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616, 0.1544, 1.0824,
		1.9813, 0.0953, 0.2975, 2.2042, 0.2407, 2.9466, 0.5034, 0.6567
	],
	requestRetention: 0.9, // 90% retention target
	maximumInterval: 36500, // 100 years
	enableFuzz: true
};

/**
 * Calculate initial difficulty based on first rating
 */
function initDifficulty(rating: ReviewResult): number {
	const ratingMap = { again: 1, hard: 2, good: 3, easy: 4 };
	const r = ratingMap[rating];
	const w = DEFAULT_PARAMETERS.w;
	return w[4] - (r - 3) * w[5];
}

/**
 * Calculate initial stability based on first rating
 */
function initStability(rating: ReviewResult): number {
	const ratingMap = { again: 1, hard: 2, good: 3, easy: 4 };
	const r = ratingMap[rating];
	const w = DEFAULT_PARAMETERS.w;
	return Math.max(w[r - 1], 0.1);
}

/**
 * Calculate next difficulty
 */
function nextDifficulty(d: number, rating: ReviewResult): number {
	const ratingMap = { again: 1, hard: 2, good: 3, easy: 4 };
	const r = ratingMap[rating];
	const w = DEFAULT_PARAMETERS.w;
	const nextD = d - w[6] * (r - 3);
	return constrainDifficulty(meanReversion(w[4], nextD));
}

/**
 * Mean reversion for difficulty
 */
function meanReversion(init: number, current: number): number {
	const w = DEFAULT_PARAMETERS.w;
	return w[7] * init + (1 - w[7]) * current;
}

/**
 * Constrain difficulty to valid range
 */
function constrainDifficulty(d: number): number {
	return Math.min(Math.max(d, 1), 10);
}

/**
 * Calculate next stability after successful recall
 */
function nextRecallStability(d: number, s: number, r: number, rating: ReviewResult): number {
	const ratingMap = { again: 1, hard: 2, good: 3, easy: 4 };
	const grade = ratingMap[rating];
	const w = DEFAULT_PARAMETERS.w;
	const hardPenalty = rating === 'hard' ? w[15] : 1;
	const easyBonus = rating === 'easy' ? w[16] : 1;
	return s * (1 + Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9]) * (Math.exp((1 - r) * w[10]) - 1) * hardPenalty * easyBonus);
}

/**
 * Calculate next stability after forgetting
 */
function nextForgetStability(d: number, s: number, r: number): number {
	const w = DEFAULT_PARAMETERS.w;
	return w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp((1 - r) * w[14]);
}

/**
 * Calculate retrievability (probability of recall)
 */
function retrievability(elapsedDays: number, stability: number): number {
	return Math.pow(1 + elapsedDays / (9 * stability), -1);
}

/**
 * Calculate optimal interval based on target retention
 */
function nextInterval(s: number, retention: number = DEFAULT_PARAMETERS.requestRetention): number {
	const newInterval = s / retention * (Math.pow(retention, 1 / retention) - 1);
	return Math.min(Math.max(Math.round(newInterval), 1), DEFAULT_PARAMETERS.maximumInterval);
}

/**
 * Add fuzz to interval to prevent review clustering
 */
function addFuzz(interval: number): number {
	if (!DEFAULT_PARAMETERS.enableFuzz || interval < 2.5) {
		return Math.round(interval);
	}
	const fuzzRange = interval < 7 ? 1 : interval < 30 ? Math.max(2, Math.floor(interval * 0.05)) : Math.max(4, Math.floor(interval * 0.05));
	const fuzz = (Math.random() * 2 - 1) * fuzzRange;
	return Math.round(Math.max(1, interval + fuzz));
}

/**
 * Main FSRS scheduling function
 */
export function calculateNextReview(card: Card, result: ReviewResult): ScheduleResult {
	const now = Date.now();
	const lastReview = card.modified || card.created;
	const elapsedDays = Math.max(0, (now - lastReview) / (24 * 60 * 60 * 1000));

	// Initialize for new cards
	if (card.repetitions === 0) {
		const stability = initStability(result);
		const difficulty = initDifficulty(result);
		const interval = result === 'again' ? 0 : result === 'hard' ? 0.25 : result === 'good' ? 1 : 3;
		const state = result === 'again' ? 'learning' : 'review';

		return {
			interval: addFuzz(interval),
			stability,
			difficulty,
			nextReview: now + interval * 24 * 60 * 60 * 1000,
			state
		};
	}

	// For cards in learning/review
	const currentStability = card.interval || 0.1;
	const currentDifficulty = card.easeFactor || 5; // Use easeFactor as difficulty storage
	const retrievabilityRate = retrievability(elapsedDays, currentStability);

	let newStability: number;
	let newDifficulty: number;
	let interval: number;
	let state: 'new' | 'learning' | 'review' | 'relearning';

	if (result === 'again') {
		// Forgot the card
		newStability = nextForgetStability(currentDifficulty, currentStability, retrievabilityRate);
		newDifficulty = nextDifficulty(currentDifficulty, result);
		interval = 0.25; // Review again in 6 hours
		state = card.repetitions > 1 ? 'relearning' : 'learning';
	} else {
		// Remembered the card
		newStability = nextRecallStability(currentDifficulty, currentStability, retrievabilityRate, result);
		newDifficulty = nextDifficulty(currentDifficulty, result);
		interval = nextInterval(newStability);
		state = 'review';
	}

	return {
		interval: addFuzz(interval),
		stability: newStability,
		difficulty: newDifficulty,
		nextReview: now + addFuzz(interval) * 24 * 60 * 60 * 1000,
		state
	};
}

/**
 * Get a human-readable description of the next interval
 */
export function getIntervalDescription(days: number): string {
	if (days < 1) {
		const hours = Math.round(days * 24);
		return hours <= 1 ? 'Less than an hour' : `${hours} hours`;
	}
	if (days === 1) return '1 day';
	if (days < 7) return `${Math.round(days)} days`;
	if (days < 30) {
		const weeks = Math.round(days / 7);
		return weeks === 1 ? '1 week' : `${weeks} weeks`;
	}
	if (days < 365) {
		const months = Math.round(days / 30);
		return months === 1 ? '1 month' : `${months} months`;
	}
	const years = Math.round(days / 365);
	return years === 1 ? '1 year' : `${years} years`;
}

/**
 * Get recommended button labels based on current card state
 */
export function getButtonLabels(card: Card): { again: string; hard: string; good: string; easy: string } {
	if (card.repetitions === 0) {
		return {
			again: '< 6h',
			hard: '< 6h',
			good: '1d',
			easy: '3d'
		};
	}

	// Estimate intervals for each button
	const now = Date.now();
	const elapsedDays = Math.max(0, (now - (card.modified || card.created)) / (24 * 60 * 60 * 1000));

	const againSchedule = calculateNextReview(card, 'again');
	const hardSchedule = calculateNextReview(card, 'hard');
	const goodSchedule = calculateNextReview(card, 'good');
	const easySchedule = calculateNextReview(card, 'easy');

	return {
		again: getIntervalDescription(againSchedule.interval),
		hard: getIntervalDescription(hardSchedule.interval),
		good: getIntervalDescription(goodSchedule.interval),
		easy: getIntervalDescription(easySchedule.interval)
	};
}
