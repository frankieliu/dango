<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { deckOperations } from '$lib/db';
	import type { Deck } from '$lib/types';
	import ReviewSession from '$lib/components/organisms/ReviewSession.svelte';
	import Button from '$lib/components/atoms/Button.svelte';

	let deck = $state<Deck | null>(null);
	let isLoading = $state(true);
	let deckId = $derived(parseInt($page.params.deckId));

	onMount(async () => {
		deck = await deckOperations.getById(deckId);
		isLoading = false;
	});

	function handleComplete() {
		goto('/');
	}
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
	<div class="max-w-7xl mx-auto px-4">
		{#if isLoading}
			<div class="text-center py-12">
				<p class="text-gray-600 dark:text-gray-400">Loading...</p>
			</div>
		{:else if !deck}
			<div class="text-center py-12">
				<h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Deck not found</h2>
				<Button onclick={() => goto('/')}>Go Home</Button>
			</div>
		{:else}
			<div class="mb-8">
				<button
					onclick={() => goto('/')}
					class="text-blue-600 dark:text-blue-400 hover:underline mb-4"
				>
					← Back to Dashboard
				</button>
				<h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
					Review: {deck.name}
				</h1>
			</div>

			<ReviewSession {deckId} onComplete={handleComplete} />
		{/if}
	</div>
</div>
