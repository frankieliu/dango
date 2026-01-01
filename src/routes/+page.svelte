<script lang="ts">
	import { onMount } from 'svelte';
	import { deckOperations, cardOperations } from '$lib/db';
	import type { Deck, Card } from '$lib/types';
	import Button from '$lib/components/atoms/Button.svelte';
	import Input from '$lib/components/atoms/Input.svelte';
	import SearchBar from '$lib/components/atoms/SearchBar.svelte';
	import MarkdownRenderer from '$lib/components/atoms/MarkdownRenderer.svelte';
	import CardForm from '$lib/components/organisms/CardForm.svelte';
	import CardEditModal from '$lib/components/organisms/CardEditModal.svelte';
	import DeckEditModal from '$lib/components/organisms/DeckEditModal.svelte';
	import ThemeToggle from '$lib/components/atoms/ThemeToggle.svelte';

	let decks = $state<Deck[]>([]);
	let selectedDeck = $state<Deck | null>(null);
	let cards = $state<Card[]>([]);
	let isLoading = $state(true);
	let showNewDeckForm = $state(false);
	let newDeckName = $state('');
	let editingCard = $state<Card | null>(null);
	let editingDeck = $state<Deck | null>(null);
	let searchQuery = $state('');
	let selectedTags = $state<string[]>([]);

	// Filtered cards based on search and tags
	let filteredCards = $derived(() => {
		let filtered = cards;

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(card) =>
					card.front.toLowerCase().includes(query) || card.back.toLowerCase().includes(query)
			);
		}

		// Filter by tags
		if (selectedTags.length > 0) {
			filtered = filtered.filter((card) => selectedTags.some((tag) => card.tags.includes(tag)));
		}

		return filtered;
	});

	// Get all unique tags from cards
	let allTags = $derived(() => {
		const tagsSet = new Set<string>();
		cards.forEach((card) => {
			card.tags.forEach((tag) => tagsSet.add(tag));
		});
		return Array.from(tagsSet).sort();
	});

	onMount(async () => {
		await loadDecks();
		isLoading = false;
	});

	async function loadDecks() {
		decks = await deckOperations.getAll();
		if (decks.length > 0 && !selectedDeck) {
			selectedDeck = decks[0];
			await loadCards();
		}
	}

	async function loadCards() {
		if (selectedDeck) {
			cards = await cardOperations.getByDeck(selectedDeck.id!);
		}
	}

	async function createDeck() {
		if (!newDeckName.trim()) return;

		await deckOperations.create({
			name: newDeckName
		});

		newDeckName = '';
		showNewDeckForm = false;
		await loadDecks();
	}

	async function selectDeck(deck: Deck) {
		selectedDeck = deck;
		await loadCards();
	}

	async function handleCardAdded() {
		await loadCards();
	}

	async function deleteCard(cardId: number) {
		if (!confirm('Are you sure you want to delete this card?')) return;

		await cardOperations.delete(cardId);
		await loadCards();
	}

	function editCard(card: Card) {
		editingCard = card;
	}

	async function deleteDeck(deckId: number) {
		if (!confirm('Are you sure you want to delete this deck? All cards in this deck will also be deleted.')) return;

		await deckOperations.delete(deckId);
		if (selectedDeck?.id === deckId) {
			selectedDeck = null;
			cards = [];
		}
		await loadDecks();
	}

	function editDeck(deck: Deck) {
		editingDeck = deck;
	}

	function toggleTag(tag: string) {
		if (selectedTags.includes(tag)) {
			selectedTags = selectedTags.filter((t) => t !== tag);
		} else {
			selectedTags = [...selectedTags, tag];
		}
	}

	function clearFilters() {
		searchQuery = '';
		selectedTags = [];
	}

</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<div class="max-w-7xl mx-auto px-4 py-8">
		<header class="mb-8 flex items-start justify-between">
			<div>
				<h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">🍡 Dango</h1>
				<p class="text-gray-600 dark:text-gray-400">A modern flashcard app</p>
			</div>
			<div class="flex items-center gap-3">
				<a href="/stats">
					<Button variant="secondary">📊 Statistics</Button>
				</a>
				<ThemeToggle />
			</div>
		</header>

		{#if isLoading}
			<div class="text-center py-12">
				<p class="text-gray-600 dark:text-gray-400">Loading...</p>
			</div>
		{:else if decks.length === 0}
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
				<h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Welcome to Dango!</h2>
				<p class="text-gray-600 dark:text-gray-400 mb-6">
					Create your first deck to get started.
				</p>
				<Button onclick={() => (showNewDeckForm = true)}>Create Deck</Button>
			</div>
		{:else}
			<div class="grid md:grid-cols-3 gap-6">
				<!-- Deck Sidebar -->
				<div class="md:col-span-1">
					<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
						<div class="flex justify-between items-center mb-4">
							<h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">Decks</h2>
							<Button variant="secondary" onclick={() => (showNewDeckForm = true)}>+</Button>
						</div>

						<div class="space-y-2">
							{#each decks as deck}
								<div class="flex items-center gap-2">
									<button
										onclick={() => selectDeck(deck)}
										class="flex-1 text-left px-3 py-2 rounded-lg transition-colors {selectedDeck?.id ===
										deck.id
											? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
											: 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}"
									>
										<div class="font-medium">{deck.name}</div>
										<div class="text-sm opacity-75">
											{cards.filter((c) => c.deckId === deck.id).length} cards
										</div>
									</button>
									<div class="flex gap-1">
										<button
											onclick={(e) => {
												e.stopPropagation();
												editDeck(deck);
											}}
											class="px-2 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
											aria-label="Edit deck"
										>
											✏️
										</button>
										<button
											onclick={(e) => {
												e.stopPropagation();
												deleteDeck(deck.id!);
											}}
											class="px-2 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
											aria-label="Delete deck"
										>
											🗑️
										</button>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- Main Content -->
				<div class="md:col-span-2 space-y-6">
					{#if selectedDeck}
						<!-- Review Section -->
						<div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
							<div class="flex items-center justify-between">
								<div>
									<h2 class="text-2xl font-bold mb-1">Ready to Review?</h2>
									<p class="opacity-90">
										{cards.filter(c => c.nextReview <= Date.now()).length} cards due
									</p>
								</div>
								<a href="/review/{selectedDeck.id}">
									<Button variant="secondary">
										Start Review →
									</Button>
								</a>
							</div>
						</div>

						<!-- Add Card Form -->
						<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
							<h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
								Add Card to {selectedDeck.name}
							</h2>
							<CardForm deckId={selectedDeck.id!} onSuccess={handleCardAdded} />
						</div>

						<!-- Cards List -->
						<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
							<div class="flex items-center justify-between mb-4">
								<h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">
									Cards ({filteredCards().length}{filteredCards().length !== cards.length
										? ` of ${cards.length}`
										: ''})
								</h2>
								{#if searchQuery || selectedTags.length > 0}
									<Button variant="secondary" onclick={clearFilters}>Clear Filters</Button>
								{/if}
							</div>

							<!-- Search Bar -->
							<div class="mb-4">
								<SearchBar bind:value={searchQuery} placeholder="Search cards..." />
							</div>

							<!-- Tag Filter -->
							{#if allTags().length > 0}
								<div class="mb-4">
									<div class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
										Filter by tags:
									</div>
									<div class="flex flex-wrap gap-2">
										{#each allTags() as tag}
											<button
												onclick={() => toggleTag(tag)}
												class="px-3 py-1 rounded-full text-sm transition-colors {selectedTags.includes(
													tag
												)
													? 'bg-blue-600 dark:bg-blue-500 text-white'
													: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}"
											>
												{tag}
											</button>
										{/each}
									</div>
								</div>
							{/if}

							{#if cards.length === 0}
								<p class="text-gray-600 dark:text-gray-400 text-center py-8">
									No cards yet. Add your first card above!
								</p>
							{:else if filteredCards().length === 0}
								<p class="text-gray-600 dark:text-gray-400 text-center py-8">
									No cards match your search or filters.
								</p>
							{:else}
								<div class="space-y-3">
									{#each filteredCards() as card}
										<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
											<div class="flex justify-between items-start gap-4">
												<div class="flex-1 min-w-0">
													<div class="mb-2">
														<span class="text-sm font-semibold text-gray-500 dark:text-gray-400"
															>Front:</span
														>
														<div class="break-words">
															<MarkdownRenderer content={card.front} attachments={card.attachments} />
														</div>
													</div>
													<div>
														<span class="text-sm font-semibold text-gray-500 dark:text-gray-400"
															>Back:</span
														>
														<div class="break-words">
															<MarkdownRenderer content={card.back} attachments={card.attachments} />
														</div>
													</div>
													{#if card.tags.length > 0}
														<div class="mt-2 flex gap-1 flex-wrap">
															{#each card.tags as tag}
																<span
																	class="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
																>
																	{tag}
																</span>
															{/each}
														</div>
													{/if}
													{#if card.attachments && card.attachments.length > 0}
														<div class="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
															<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	stroke-width="2"
																	d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
																></path>
															</svg>
															<span>{card.attachments.length} image{card.attachments.length !== 1 ? 's' : ''}</span>
														</div>
													{/if}
												</div>
												<div class="flex gap-1 flex-shrink-0">
													<button
														onclick={() => editCard(card)}
														class="px-2 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
														aria-label="Edit card"
													>
														✏️
													</button>
													<button
														onclick={() => deleteCard(card.id!)}
														class="px-2 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
														aria-label="Delete card"
													>
														🗑️
													</button>
												</div>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- New Deck Modal -->
		{#if showNewDeckForm}
			<div
				role="button"
				tabindex="0"
				aria-label="Close modal"
				class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
				onclick={(e) => {
					if (e.target === e.currentTarget) showNewDeckForm = false;
				}}
				onkeydown={(e) => {
					if (e.key === 'Escape') showNewDeckForm = false;
				}}
			>
				<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
					<h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Create New Deck</h2>
					<form
						onsubmit={(e) => {
							e.preventDefault();
							createDeck();
						}}
						class="space-y-4"
					>
						<Input bind:value={newDeckName} label="Deck Name" placeholder="e.g., Spanish Vocabulary" required />
						<div class="flex gap-2">
							<Button type="submit" disabled={!newDeckName.trim()}>Create</Button>
							<Button variant="secondary" onclick={() => (showNewDeckForm = false)}>Cancel</Button>
						</div>
					</form>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Card Edit Modal -->
{#if editingCard}
	<CardEditModal
		card={editingCard}
		onClose={() => (editingCard = null)}
		onSuccess={handleCardAdded}
	/>
{/if}

<!-- Deck Edit Modal -->
{#if editingDeck}
	<DeckEditModal
		deck={editingDeck}
		onClose={() => (editingDeck = null)}
		onSuccess={loadDecks}
	/>
{/if}
