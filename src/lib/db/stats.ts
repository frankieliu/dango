import { db } from './schema';
import type { Review } from '../types';

export interface Statistics {
	// Overview
	totalDecks: number;
	totalCards: number;
	dueCards: number;
	newCards: number;

	// Review stats
	totalReviews: number;
	reviewsToday: number;
	reviewsThisWeek: number;
	reviewsThisMonth: number;

	// Performance
	averageRetention: number;
	matureCards: number; // Cards with interval > 21 days
	youngCards: number; // Cards with interval <= 21 days

	// Streak
	currentStreak: number;
	longestStreak: number;

	// Recent activity
	recentReviews: Review[];
	dailyReviewCounts: { date: string; count: number }[];
}

export const statsOperations = {
	/**
	 * Get comprehensive statistics
	 */
	async getStatistics(): Promise<Statistics> {
		const now = Date.now();
		const today = new Date().setHours(0, 0, 0, 0);
		const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
		const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

		// Get all data
		const [decks, cards, reviews] = await Promise.all([
			db.decks.filter(d => !d.archived).toArray(),
			db.cards.toArray(),
			db.reviews.toArray()
		]);

		// Calculate metrics
		const totalDecks = decks.length;
		const totalCards = cards.length;
		const dueCards = cards.filter(c => c.nextReview <= now).length;
		const newCards = cards.filter(c => c.repetitions === 0).length;

		const totalReviews = reviews.length;
		const reviewsToday = reviews.filter(r => r.date >= today).length;
		const reviewsThisWeek = reviews.filter(r => r.date >= weekAgo).length;
		const reviewsThisMonth = reviews.filter(r => r.date >= monthAgo).length;

		// Calculate retention (% of reviews that weren't "again")
		const recentReviews = reviews.filter(r => r.date >= monthAgo);
		const successfulReviews = recentReviews.filter(r => r.result !== 'again').length;
		const averageRetention = recentReviews.length > 0
			? (successfulReviews / recentReviews.length) * 100
			: 0;

		// Calculate mature/young cards
		const matureCards = cards.filter(c => c.interval > 21).length;
		const youngCards = cards.filter(c => c.interval > 0 && c.interval <= 21).length;

		// Calculate streaks
		const { currentStreak, longestStreak } = calculateStreaks(reviews);

		// Get daily review counts for last 30 days
		const dailyReviewCounts = calculateDailyReviews(reviews, 30);

		// Get recent reviews (last 10)
		const recentReviewsList = reviews
			.sort((a, b) => b.date - a.date)
			.slice(0, 10);

		return {
			totalDecks,
			totalCards,
			dueCards,
			newCards,
			totalReviews,
			reviewsToday,
			reviewsThisWeek,
			reviewsThisMonth,
			averageRetention: Math.round(averageRetention),
			matureCards,
			youngCards,
			currentStreak,
			longestStreak,
			recentReviews: recentReviewsList,
			dailyReviewCounts
		};
	},

	/**
	 * Get statistics for a specific deck
	 */
	async getDeckStatistics(deckId: number): Promise<Partial<Statistics>> {
		const now = Date.now();
		const today = new Date().setHours(0, 0, 0, 0);
		const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

		const cards = await db.cards.where('deckId').equals(deckId).toArray();
		const cardIds = cards.map(c => c.id!);
		const reviews = await db.reviews.filter(r => cardIds.includes(r.cardId)).toArray();

		const totalCards = cards.length;
		const dueCards = cards.filter(c => c.nextReview <= now).length;
		const newCards = cards.filter(c => c.repetitions === 0).length;

		const reviewsToday = reviews.filter(r => r.date >= today).length;
		const recentReviews = reviews.filter(r => r.date >= monthAgo);
		const successfulReviews = recentReviews.filter(r => r.result !== 'again').length;
		const averageRetention = recentReviews.length > 0
			? Math.round((successfulReviews / recentReviews.length) * 100)
			: 0;

		const matureCards = cards.filter(c => c.interval > 21).length;
		const youngCards = cards.filter(c => c.interval > 0 && c.interval <= 21).length;

		return {
			totalCards,
			dueCards,
			newCards,
			reviewsToday,
			averageRetention,
			matureCards,
			youngCards
		};
	}
};

/**
 * Calculate current and longest study streaks
 */
function calculateStreaks(reviews: Review[]): { currentStreak: number; longestStreak: number } {
	if (reviews.length === 0) return { currentStreak: 0, longestStreak: 0 };

	// Group reviews by date
	const reviewsByDate = new Map<string, number>();
	reviews.forEach(review => {
		const date = new Date(review.date).toDateString();
		reviewsByDate.set(date, (reviewsByDate.get(date) || 0) + 1);
	});

	// Sort dates
	const sortedDates = Array.from(reviewsByDate.keys())
		.map(d => new Date(d))
		.sort((a, b) => a.getTime() - b.getTime());

	if (sortedDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

	// Calculate streaks
	let currentStreak = 0;
	let longestStreak = 0;
	let tempStreak = 1;

	// Check if today or yesterday was reviewed
	const today = new Date().setHours(0, 0, 0, 0);
	const lastReviewDate = sortedDates[sortedDates.length - 1].setHours(0, 0, 0, 0);
	const daysSinceLastReview = Math.floor((today - lastReviewDate) / (24 * 60 * 60 * 1000));

	if (daysSinceLastReview <= 1) {
		currentStreak = 1;

		// Calculate current streak backwards
		for (let i = sortedDates.length - 2; i >= 0; i--) {
			const current = new Date(sortedDates[i + 1]).setHours(0, 0, 0, 0);
			const previous = new Date(sortedDates[i]).setHours(0, 0, 0, 0);
			const daysDiff = Math.floor((current - previous) / (24 * 60 * 60 * 1000));

			if (daysDiff === 1) {
				currentStreak++;
			} else {
				break;
			}
		}
	}

	// Calculate longest streak
	for (let i = 1; i < sortedDates.length; i++) {
		const current = new Date(sortedDates[i]).setHours(0, 0, 0, 0);
		const previous = new Date(sortedDates[i - 1]).setHours(0, 0, 0, 0);
		const daysDiff = Math.floor((current - previous) / (24 * 60 * 60 * 1000));

		if (daysDiff === 1) {
			tempStreak++;
		} else {
			longestStreak = Math.max(longestStreak, tempStreak);
			tempStreak = 1;
		}
	}
	longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

	return { currentStreak, longestStreak };
}

/**
 * Calculate daily review counts for the last N days
 */
function calculateDailyReviews(reviews: Review[], days: number): { date: string; count: number }[] {
	const dailyCounts = new Map<string, number>();
	const now = new Date();

	// Initialize all dates
	for (let i = days - 1; i >= 0; i--) {
		const date = new Date(now);
		date.setDate(date.getDate() - i);
		const dateStr = date.toISOString().split('T')[0];
		dailyCounts.set(dateStr, 0);
	}

	// Count reviews per day
	reviews.forEach(review => {
		const dateStr = new Date(review.date).toISOString().split('T')[0];
		if (dailyCounts.has(dateStr)) {
			dailyCounts.set(dateStr, (dailyCounts.get(dateStr) || 0) + 1);
		}
	});

	// Convert to array
	return Array.from(dailyCounts.entries())
		.map(([date, count]) => ({ date, count }))
		.sort((a, b) => a.date.localeCompare(b.date));
}
