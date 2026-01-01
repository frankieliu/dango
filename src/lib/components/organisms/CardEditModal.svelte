<script lang="ts">
	import { onMount } from 'svelte';
	import type { Card } from '$lib/types';
	import Button from '../atoms/Button.svelte';
	import Input from '../atoms/Input.svelte';
	import Textarea from '../atoms/Textarea.svelte';
	import ImageUpload from '../atoms/ImageUpload.svelte';
	import { cardOperations } from '$lib/db';
	import { fileToBase64, isValidImageFile } from '$lib/utils/file';

	interface Props {
		card: Card;
		onClose: () => void;
		onSuccess: () => void;
	}

	let { card, onClose, onSuccess }: Props = $props();

	let front = $state('');
	let back = $state('');
	let tags = $state('');
	let attachments = $state<string[]>([]);
	let isSubmitting = $state(false);
	let error = $state('');

	// Initialize form when card changes
	$effect(() => {
		front = card.front;
		back = card.back;
		tags = card.tags.join(', ');
		attachments = card.attachments || [];
	});

	function handleAddImage(dataUrl: string) {
		attachments = [...attachments, dataUrl];
	}

	function handleRemoveImage(index: number) {
		attachments = attachments.filter((_, i) => i !== index);
	}

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
				attachments: attachments.length > 0 ? [...attachments] : undefined,
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

			<div>
				<div class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Images (Optional)
				</div>
				<ImageUpload images={attachments} onAdd={handleAddImage} onRemove={handleRemoveImage} />
			</div>

			<div class="flex gap-2">
				<Button type="submit" disabled={isSubmitting || !front.trim() || !back.trim()}>
					{isSubmitting ? 'Saving...' : 'Save Changes'}
				</Button>
				<Button variant="secondary" onclick={onClose} type="button">Cancel</Button>
			</div>
		</form>
	</div>
</div>
