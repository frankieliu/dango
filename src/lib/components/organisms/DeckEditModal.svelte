<script lang="ts">
	import type { Deck } from '$lib/types';
	import Button from '../atoms/Button.svelte';
	import Input from '../atoms/Input.svelte';
	import { deckOperations } from '$lib/db';

	interface Props {
		deck: Deck;
		onClose: () => void;
		onSuccess: () => void;
	}

	let { deck, onClose, onSuccess }: Props = $props();

	let name = $state('');
	let description = $state('');
	let isSubmitting = $state(false);
	let error = $state('');

	// Initialize form when deck changes
	$effect(() => {
		name = deck.name;
		description = deck.description || '';
	});

	async function handleSubmit() {
		if (!name.trim()) {
			error = 'Deck name is required';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			await deckOperations.update(deck.id!, {
				name: name.trim(),
				description: description.trim(),
				modified: Date.now()
			});

			onSuccess();
			onClose();
		} catch (e) {
			error = 'Failed to update deck';
			console.error(e);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div
	role="button"
	tabindex="0"
	aria-label="Close modal"
	class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
	onclick={(e) => {
		if (e.target === e.currentTarget) onClose();
	}}
	onkeydown={(e) => {
		if (e.key === 'Escape') onClose();
	}}
>
	<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
		<h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Edit Deck</h2>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleSubmit();
			}}
			class="space-y-4"
		>
			{#if error}
				<div class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-4 py-2 rounded">
					{error}
				</div>
			{/if}

			<Input bind:value={name} label="Deck Name" placeholder="e.g., Spanish Vocabulary" required />

			<Input
				bind:value={description}
				label="Description (optional)"
				placeholder="Brief description of this deck"
			/>

			<div class="flex gap-2">
				<Button type="submit" disabled={isSubmitting || !name.trim()}>
					{isSubmitting ? 'Saving...' : 'Save Changes'}
				</Button>
				<Button variant="secondary" onclick={onClose} type="button">Cancel</Button>
			</div>
		</form>
	</div>
</div>
