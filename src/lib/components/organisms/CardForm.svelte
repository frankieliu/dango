<script lang="ts">
	import { cardOperations } from '$lib/db';
	import Button from '../atoms/Button.svelte';
	import Input from '../atoms/Input.svelte';
	import Textarea from '../atoms/Textarea.svelte';
	import ImageUpload from '../atoms/ImageUpload.svelte';

	interface Props {
		deckId: number;
		onSuccess?: () => void;
	}

	let { deckId, onSuccess }: Props = $props();

	let front = $state('');
	let back = $state('');
	let tags = $state('');
	let attachments = $state<string[]>([]);
	let isSubmitting = $state(false);

	function handleAddImage(dataUrl: string) {
		attachments = [...attachments, dataUrl];
	}

	function handleRemoveImage(index: number) {
		attachments = attachments.filter((_, i) => i !== index);
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;

		try {
			const now = Date.now();
			await cardOperations.create({
				deckId,
				front,
				back,
				created: now,
				modified: now,
				nextReview: now, // Available immediately
				interval: 0,
				easeFactor: 2.5, // Default FSRS value
				repetitions: 0,
				tags: tags
					.split(',')
					.map((t) => t.trim())
					.filter((t) => t.length > 0),
				attachments: attachments.length > 0 ? attachments : undefined
			});

			// Reset form
			front = '';
			back = '';
			tags = '';
			attachments = [];

			if (onSuccess) {
				onSuccess();
			}
		} catch (error) {
			console.error('Failed to create card:', error);
			alert('Failed to create card. Please try again.');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	<div>
		<Textarea
			bind:value={front}
			label="Front"
			placeholder="Enter the question or prompt..."
			required
			rows={3}
		/>
	</div>

	<div>
		<Textarea
			bind:value={back}
			label="Back"
			placeholder="Enter the answer..."
			required
			rows={3}
		/>
	</div>

	<div>
		<Input bind:value={tags} label="Tags (comma-separated)" placeholder="e.g., vocabulary, grammar" />
	</div>

	<div>
		<div class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
			Images (Optional)
		</div>
		<ImageUpload images={attachments} onAdd={handleAddImage} onRemove={handleRemoveImage} />
	</div>

	<div class="flex gap-2">
		<Button type="submit" disabled={isSubmitting || !front || !back}>
			{isSubmitting ? 'Adding...' : 'Add Card'}
		</Button>
	</div>
</form>
