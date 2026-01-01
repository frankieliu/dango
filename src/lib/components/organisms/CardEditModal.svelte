<script lang="ts">
	import type { Card } from '$lib/types';
	import Button from '../atoms/Button.svelte';
	import Input from '../atoms/Input.svelte';
	import Textarea from '../atoms/Textarea.svelte';
	import { cardOperations } from '$lib/db';

	interface Props {
		card: Card;
		onClose: () => void;
		onSuccess: () => void;
	}

	let { card, onClose, onSuccess }: Props = $props();

	let front = $state(card.front);
	let back = $state(card.back);
	let tags = $state(card.tags.join(', '));
	let isSubmitting = $state(false);
	let error = $state('');

	async function handleSubmit() {
		if (!front.trim() || !back.trim()) {
			error = 'Front and back are required';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			await cardOperations.update(card.id!, {
				front: front.trim(),
				back: back.trim(),
				tags: tags
					.split(',')
					.map((t) => t.trim())
					.filter((t) => t.length > 0),
				modified: Date.now()
			});

			onSuccess();
			onClose();
		} catch (e) {
			error = 'Failed to update card';
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
	<div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
		<h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Edit Card</h2>

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

			<Textarea bind:value={front} label="Front" placeholder="Question or prompt" required rows={3} />

			<Textarea bind:value={back} label="Back" placeholder="Answer" required rows={3} />

			<Input
				bind:value={tags}
				label="Tags"
				placeholder="Comma-separated tags (e.g., vocabulary, grammar)"
			/>

			<div class="flex gap-2">
				<Button type="submit" disabled={isSubmitting || !front.trim() || !back.trim()}>
					{isSubmitting ? 'Saving...' : 'Save Changes'}
				</Button>
				<Button variant="secondary" onclick={onClose} type="button">Cancel</Button>
			</div>
		</form>
	</div>
</div>
