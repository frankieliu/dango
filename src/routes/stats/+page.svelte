<script lang="ts">
	import { onMount } from 'svelte';
	import type { Statistics } from '$lib/db';
	import { statsOperations } from '$lib/db';
	import Button from '$lib/components/atoms/Button.svelte';

	let stats = $state<Statistics | null>(null);
	let isLoading = $state(true);

	onMount(async () => {
		await loadStats();
		isLoading = false;
	});

	async function loadStats() {
		stats = await statsOperations.getStatistics();
	}
</script>

<svelte:head>
	<title>Statistics - Dango</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<div class="max-w-7xl mx-auto px-4 py-8">
		<header class="mb-8 flex items-center justify-between">
			<div>
				<h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
					📊 Statistics
				</h1>
				<p class="text-gray-600 dark:text-gray-400">Your learning progress</p>
			</div>
			<a href="/">
				<Button variant="secondary">← Back to Dashboard</Button>
			</a>
		</header>

		{#if isLoading}
			<div class="text-center py-12">
				<p class="text-gray-600 dark:text-gray-400">Loading statistics...</p>
			</div>
		{:else if stats}
			<!-- Overview Cards -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
				<!-- Total Decks -->
				<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
					<div class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
						Total Decks
					</div>
					<div class="text-3xl font-bold text-gray-900 dark:text-gray-100">
						{stats.totalDecks}
					</div>
				</div>

				<!-- Total Cards -->
				<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
					<div class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
						Total Cards
					</div>
					<div class="text-3xl font-bold text-gray-900 dark:text-gray-100">
						{stats.totalCards}
					</div>
					<div class="text-xs text-gray-500 dark:text-gray-400 mt-2">
						{stats.newCards} new · {stats.youngCards} young · {stats.matureCards} mature
					</div>
				</div>

				<!-- Due Cards -->
				<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
					<div class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Due Today</div>
					<div class="text-3xl font-bold text-blue-600 dark:text-blue-400">
						{stats.dueCards}
					</div>
					<div class="text-xs text-gray-500 dark:text-gray-400 mt-2">cards to review</div>
				</div>

				<!-- Retention Rate -->
				<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
					<div class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
						Retention Rate
					</div>
					<div class="text-3xl font-bold text-green-600 dark:text-green-400">
						{stats.averageRetention}%
					</div>
					<div class="text-xs text-gray-500 dark:text-gray-400 mt-2">last 30 days</div>
				</div>
			</div>

			<!-- Review Activity -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
				<!-- Review Stats -->
				<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
					<h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
						Review Activity
					</h2>
					<div class="space-y-4">
						<div class="flex justify-between items-center">
							<span class="text-gray-600 dark:text-gray-400">Today</span>
							<span class="text-2xl font-bold text-gray-900 dark:text-gray-100">
								{stats.reviewsToday}
							</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-gray-600 dark:text-gray-400">This Week</span>
							<span class="text-xl font-semibold text-gray-900 dark:text-gray-100">
								{stats.reviewsThisWeek}
							</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-gray-600 dark:text-gray-400">This Month</span>
							<span class="text-xl font-semibold text-gray-900 dark:text-gray-100">
								{stats.reviewsThisMonth}
							</span>
						</div>
						<div class="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
							<span class="text-gray-600 dark:text-gray-400">All Time</span>
							<span class="text-xl font-semibold text-gray-900 dark:text-gray-100">
								{stats.totalReviews}
							</span>
						</div>
					</div>
				</div>

				<!-- Study Streaks -->
				<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
					<h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Study Streaks</h2>
					<div class="space-y-6">
						<div>
							<div class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
								Current Streak
							</div>
							<div class="flex items-baseline gap-2">
								<span class="text-4xl font-bold text-orange-600 dark:text-orange-400">
									{stats.currentStreak}
								</span>
								<span class="text-gray-600 dark:text-gray-400">
									{stats.currentStreak === 1 ? 'day' : 'days'}
								</span>
							</div>
							{#if stats.currentStreak > 0}
								<div class="text-sm text-gray-500 dark:text-gray-400 mt-2">
									🔥 Keep it up!
								</div>
							{:else}
								<div class="text-sm text-gray-500 dark:text-gray-400 mt-2">
									Review some cards to start your streak!
								</div>
							{/if}
						</div>

						<div>
							<div class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
								Longest Streak
							</div>
							<div class="flex items-baseline gap-2">
								<span class="text-3xl font-bold text-gray-900 dark:text-gray-100">
									{stats.longestStreak}
								</span>
								<span class="text-gray-600 dark:text-gray-400">
									{stats.longestStreak === 1 ? 'day' : 'days'}
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Daily Review Heatmap -->
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
				<h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
					Review Heatmap (Last 30 Days)
				</h2>
				<div class="overflow-x-auto">
					<div class="flex gap-1 min-w-max">
						{#each stats.dailyReviewCounts as day}
							{@const maxReviews = Math.max(...stats.dailyReviewCounts.map(d => d.count))}
							{@const intensity = maxReviews > 0 ? day.count / maxReviews : 0}
							{@const bgColor = intensity === 0 ? 'bg-gray-100 dark:bg-gray-700' : intensity < 0.25 ? 'bg-green-200 dark:bg-green-900' : intensity < 0.5 ? 'bg-green-400 dark:bg-green-700' : intensity < 0.75 ? 'bg-green-600 dark:bg-green-500' : 'bg-green-800 dark:bg-green-300'}
							<div
								class="w-8 h-8 rounded {bgColor} flex items-center justify-center"
								title="{day.date}: {day.count} reviews"
							>
								<span class="text-xs font-medium text-gray-700 dark:text-gray-300">
									{day.count > 0 ? day.count : ''}
								</span>
							</div>
						{/each}
					</div>
				</div>
				<div class="flex items-center gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
					<span>Less</span>
					<div class="flex gap-1">
						<div class="w-4 h-4 rounded bg-gray-100 dark:bg-gray-700"></div>
						<div class="w-4 h-4 rounded bg-green-200 dark:bg-green-900"></div>
						<div class="w-4 h-4 rounded bg-green-400 dark:bg-green-700"></div>
						<div class="w-4 h-4 rounded bg-green-600 dark:bg-green-500"></div>
						<div class="w-4 h-4 rounded bg-green-800 dark:bg-green-300"></div>
					</div>
					<span>More</span>
				</div>
			</div>

			<!-- Card Distribution -->
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
				<h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
					Card Distribution
				</h2>
				<div class="space-y-4">
					<!-- New Cards -->
					<div>
						<div class="flex justify-between items-center mb-2">
							<span class="text-gray-600 dark:text-gray-400">New Cards</span>
							<span class="font-semibold text-gray-900 dark:text-gray-100">
								{stats.newCards} ({stats.totalCards > 0 ? Math.round((stats.newCards / stats.totalCards) * 100) : 0}%)
							</span>
						</div>
						<div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
							<div
								class="h-full bg-blue-600 dark:bg-blue-400"
								style="width: {stats.totalCards > 0 ? (stats.newCards / stats.totalCards) * 100 : 0}%"
							></div>
						</div>
					</div>

					<!-- Young Cards -->
					<div>
						<div class="flex justify-between items-center mb-2">
							<span class="text-gray-600 dark:text-gray-400">Young Cards (≤21 days)</span>
							<span class="font-semibold text-gray-900 dark:text-gray-100">
								{stats.youngCards} ({stats.totalCards > 0 ? Math.round((stats.youngCards / stats.totalCards) * 100) : 0}%)
							</span>
						</div>
						<div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
							<div
								class="h-full bg-yellow-600 dark:bg-yellow-400"
								style="width: {stats.totalCards > 0 ? (stats.youngCards / stats.totalCards) * 100 : 0}%"
							></div>
						</div>
					</div>

					<!-- Mature Cards -->
					<div>
						<div class="flex justify-between items-center mb-2">
							<span class="text-gray-600 dark:text-gray-400">Mature Cards (>21 days)</span>
							<span class="font-semibold text-gray-900 dark:text-gray-100">
								{stats.matureCards} ({stats.totalCards > 0 ? Math.round((stats.matureCards / stats.totalCards) * 100) : 0}%)
							</span>
						</div>
						<div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
							<div
								class="h-full bg-green-600 dark:bg-green-400"
								style="width: {stats.totalCards > 0 ? (stats.matureCards / stats.totalCards) * 100 : 0}%"
							></div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
