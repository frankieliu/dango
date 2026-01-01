<script lang="ts">
	import { onMount } from 'svelte';
	import type { Card } from '$lib/types';
	import { cardOperations, db } from '$lib/db';
	import { calculateNextReview, getButtonLabels } from '$lib/algorithms/scheduler';
	import Button from '../atoms/Button.svelte';
	import MarkdownRenderer from '../atoms/MarkdownRenderer.svelte';

	interface Props {
		deckId: number;
		onComplete?: () => void;
	}

	let { deckId, onComplete }: Props = $props();

	let cards = $state<Card[]>([]);
	let currentIndex = $state(0);
	let showAnswer = $state(false);
	let isLoading = $state(true);
	let reviewedCount = $state(0);

	let currentCard = $derived(cards[currentIndex]);
	let hasMore = $derived(currentIndex < cards.length);
	let progress = $derived(cards.length > 0 ? ((reviewedCount / cards.length) * 100).toFixed(0) : 0);
	let buttonLabels = $derived(currentCard ? getButtonLabels(currentCard) : { again: '< 6h', hard: '< 6h', good: '1d', easy: '3d' });

	onMount(async () => {
		await loadDueCards();
		isLoading = false;

		// Add keyboard shortcuts
		document.addEventListener('keydown', handleKeyPress);
		return () => {
			document.removeEventListener('keydown', handleKeyPress);
		};
	});

	async function loadDueCards() {
		cards = await cardOperations.getDueCards(deckId);
	}

	function handleKeyPress(e: KeyboardEvent) {
		if (!hasMore) return;

		// Space to reveal answer
		if (e.code === 'Space' && !showAnswer) {
			e.preventDefault();
			showAnswer = true;
			return;
		}

		// Number keys for rating (only when answer is shown)
		if (showAnswer) {
			switch (e.code) {
				case 'Digit1':
					e.preventDefault();
					rateCard('again');
					break;
				case 'Digit2':
					e.preventDefault();
					rateCard('hard');
					break;
				case 'Digit3':
					e.preventDefault();
					rateCard('good');
					break;
				case 'Digit4':
					e.preventDefault();
					rateCard('easy');
					break;
			}
		}
	}

	function reveal() {
		showAnswer = true;
	}

	async function rateCard(result: 'again' | 'hard' | 'good' | 'easy') {
		if (!currentCard) return;

		const schedule = calculateNextReview(currentCard, result);

		// Update card in database
		await cardOperations.update(currentCard.id!, {
			interval: schedule.interval,
			easeFactor: schedule.easeFactor,
			repetitions: schedule.repetitions,
			nextReview: schedule.nextReview
		});

		// Record review
		await db.reviews.add({
			cardId: currentCard.id!,
			date: Date.now(),
			result,
			interval: schedule.interval,
			timeSpent: 0 // We can track this later
		});

		// Move to next card
		reviewedCount++;
		currentIndex++;
		showAnswer = false;

		// Check if done
		if (!hasMore && onComplete) {
			onComplete();
		}
	}
</script>

{#if isLoading}
	<div class="text-center py-12">
		<p class="text-gray-600 dark:text-gray-400">Loading cards...</p>
	</div>
{:else if cards.length === 0}
	<div class="text-center py-12">
		<div class="text-6xl mb-4">🎉</div>
		<h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">All caught up!</h2>
		<p class="text-gray-600 dark:text-gray-400">No cards due for review right now.</p>
	</div>
{:else if !hasMore}
	<div class="text-center py-12">
		<div class="text-6xl mb-4">✨</div>
		<h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Review Complete!</h2>
		<p class="text-gray-600 dark:text-gray-400 mb-4">
			You reviewed {reviewedCount} card{reviewedCount !== 1 ? 's' : ''}.
		</p>
	</div>
{:else}
	<div class="max-w-2xl mx-auto">
		<!-- Progress Bar -->
		<div class="mb-6">
			<div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
				<span>{reviewedCount} / {cards.length} cards</span>
				<span>{progress}%</span>
			</div>
			<div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
				<div
					class="h-full bg-blue-600 transition-all duration-300"
					style="width: {progress}%"
				></div>
			</div>
		</div>

		<!-- Card -->
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 min-h-[300px] flex flex-col">
			<div class="flex-1 flex flex-col justify-center">
				<!-- Front -->
				<div class="mb-6">
					<div class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Question</div>
					<div class="text-xl">
						<MarkdownRenderer content={currentCard.front} />
					</div>
				</div>

				<!-- Back (revealed) -->
				{#if showAnswer}
					<div class="border-t border-gray-200 dark:border-gray-700 pt-6">
						<div class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Answer</div>
						<div class="text-xl">
							<MarkdownRenderer content={currentCard.back} />
						</div>
					</div>
				{/if}
			</div>

			<!-- Actions -->
			<div class="mt-8">
				{#if !showAnswer}
					<Button onclick={reveal} variant="primary" class="w-full">
						Show Answer <span class="text-sm opacity-75 ml-2">(Space)</span>
					</Button>
				{:else}
					<div class="space-y-3">
						<p class="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">
							How well did you know this?
						</p>
						<div class="grid grid-cols-4 gap-2">
							<Button onclick={() => rateCard('again')} variant="danger">
								<div class="text-center">
									<div class="font-bold">Again</div>
									<div class="text-xs opacity-75 mt-1">{buttonLabels.again}</div>
									<div class="text-xs opacity-50">1</div>
								</div>
							</Button>
							<Button onclick={() => rateCard('hard')} variant="secondary">
								<div class="text-center">
									<div class="font-bold">Hard</div>
									<div class="text-xs opacity-75 mt-1">{buttonLabels.hard}</div>
									<div class="text-xs opacity-50">2</div>
								</div>
							</Button>
							<Button onclick={() => rateCard('good')} variant="primary">
								<div class="text-center">
									<div class="font-bold">Good</div>
									<div class="text-xs opacity-75 mt-1">{buttonLabels.good}</div>
									<div class="text-xs opacity-50">3</div>
								</div>
							</Button>
							<Button onclick={() => rateCard('easy')} variant="primary">
								<div class="text-center">
									<div class="font-bold">Easy</div>
									<div class="text-xs opacity-75 mt-1">{buttonLabels.easy}</div>
									<div class="text-xs opacity-50">4</div>
								</div>
							</Button>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Keyboard Shortcuts Help -->
		<div class="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
			{#if !showAnswer}
				Press <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Space</kbd> to reveal
			{:else}
				Press <kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">1-4</kbd> to rate
			{/if}
		</div>
	</div>
{/if}
