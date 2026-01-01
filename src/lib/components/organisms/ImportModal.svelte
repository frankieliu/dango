<script lang="ts">
	import Button from '../atoms/Button.svelte';
	import {
		parseMarkdownFile,
		convertToCards,
		extractImageReferences,
		loadImageAsBase64
	} from '$lib/utils/import';
	import { cardOperations } from '$lib/db';
	import type { Card } from '$lib/types';

	interface Props {
		deckId: number;
		onClose: () => void;
		onSuccess: () => void;
	}

	let { deckId, onClose, onSuccess }: Props = $props();

	let markdownFile = $state<File | null>(null);
	let imageFiles = $state<File[]>([]);
	let isProcessing = $state(false);
	let error = $state('');
	let previewCards = $state<Partial<Card>[]>([]);
	let showPreview = $state(false);

	function handleMarkdownFile(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			markdownFile = input.files[0];
			error = '';
		}
	}

	function handleImageFiles(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files) {
			imageFiles = Array.from(input.files);
		}
	}

	async function handlePreview() {
		if (!markdownFile) {
			error = 'Please select a markdown file';
			return;
		}

		isProcessing = true;
		error = '';

		try {
			const content = await markdownFile.text();
			const parsedCards = parseMarkdownFile(content);

			if (parsedCards.length === 0) {
				error = 'No cards found in markdown file';
				isProcessing = false;
				return;
			}

			// Convert to Card objects
			previewCards = convertToCards(parsedCards, deckId);
			showPreview = true;
		} catch (e) {
			error = 'Failed to parse markdown file: ' + (e as Error).message;
			console.error(e);
		} finally {
			isProcessing = false;
		}
	}

	async function handleImport() {
		if (previewCards.length === 0) return;

		isProcessing = true;
		error = '';

		try {
			// First, process images and build attachment array
			const imageMap = new Map<string, number>(); // filename -> index in attachments
			const attachments: string[] = [];

			// Load all image files as base64
			for (const imageFile of imageFiles) {
				const base64 = await loadImageAsBase64(imageFile);
				imageMap.set(imageFile.name, attachments.length);
				attachments.push(base64);

				// Also map with ./ prefix
				imageMap.set('./' + imageFile.name, attachments.length - 1);
			}

			// Process each card
			for (const card of previewCards) {
				// Replace image references in front and back
				let front = card.front || '';
				let back = card.back || '';

				// Extract image references
				const frontImages = extractImageReferences(front);
				const backImages = extractImageReferences(back);
				const allImages = [...new Set([...frontImages, ...backImages])];

				// Replace image paths with indices
				for (const imagePath of allImages) {
					const imageIndex = imageMap.get(imagePath);
					if (imageIndex !== undefined) {
						const regex = new RegExp(
							`!\\[([^\\]]*)\\]\\(${imagePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`,
							'g'
						);
						front = front.replace(regex, `![$1](${imageIndex})`);
						back = back.replace(regex, `![$1](${imageIndex})`);
					}
				}

				// Create the card with attachments
				await cardOperations.create({
					...card,
					front,
					back,
					attachments: attachments.length > 0 ? [...attachments] : undefined
				} as Card);
			}

			onSuccess();
			onClose();
		} catch (e) {
			error = 'Failed to import cards: ' + (e as Error).message;
			console.error(e);
		} finally {
			isProcessing = false;
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
	<div
		class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
	>
		<h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Import Markdown</h2>

		{#if !showPreview}
			<!-- File Selection Step -->
			<div class="space-y-4">
				{#if error}
					<div class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-4 py-2 rounded">
						{error}
					</div>
				{/if}

				<!-- Markdown File -->
				<div>
					<label for="markdown-file" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Markdown File (.md)
					</label>
					<input
						id="markdown-file"
						type="file"
						accept=".md,.markdown,.txt"
						onchange={handleMarkdownFile}
						class="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 focus:outline-none"
					/>
					<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
						Selected: {markdownFile?.name || 'None'}
					</p>
				</div>

				<!-- Image Files -->
				<div>
					<label for="image-files" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Image Files (Optional)
					</label>
					<input
						id="image-files"
						type="file"
						accept="image/*"
						multiple
						onchange={handleImageFiles}
						class="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 focus:outline-none"
					/>
					<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
						Selected: {imageFiles.length} image(s)
					</p>
				</div>

				<!-- Format Info -->
				<div class="bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-100 p-4 rounded-lg">
					<h3 class="font-semibold mb-2">Markdown Format:</h3>
					<pre
						class="text-xs overflow-x-auto bg-white dark:bg-gray-800 p-2 rounded">{`---
tags: [vocabulary, spanish]
created: 2025-01-01T12:00:00Z
---

What is "hello" in Spanish?
![greeting](./image.png)

===

Hola
![greeting](./image.png)

---

[Next card...]`}</pre>
					<ul class="text-sm mt-2 space-y-1">
						<li>• Use <code>---</code> to separate cards</li>
						<li>• Use <code>===</code> or <code>***</code> to separate front/back</li>
						<li>• Optional YAML metadata between <code>---</code> markers</li>
						<li>• Reference images by filename: <code>![alt](./image.png)</code></li>
					</ul>
				</div>

				<div class="flex gap-2">
					<Button onclick={handlePreview} disabled={isProcessing || !markdownFile}>
						{isProcessing ? 'Processing...' : 'Preview Cards'}
					</Button>
					<Button variant="secondary" onclick={onClose}>Cancel</Button>
				</div>
			</div>
		{:else}
			<!-- Preview Step -->
			<div class="space-y-4">
				<div class="bg-green-50 dark:bg-green-900 text-green-900 dark:text-green-100 px-4 py-2 rounded">
					Found {previewCards.length} card(s) to import
				</div>

				<!-- Card Previews -->
				<div class="space-y-3 max-h-96 overflow-y-auto">
					{#each previewCards as card, index}
						<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
							<div class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
								Card {index + 1}
							</div>
							<div class="grid grid-cols-2 gap-2">
								<div>
									<div class="text-xs font-semibold text-gray-600 dark:text-gray-400">Front:</div>
									<div class="text-sm text-gray-900 dark:text-gray-100 line-clamp-3">
										{card.front}
									</div>
								</div>
								<div>
									<div class="text-xs font-semibold text-gray-600 dark:text-gray-400">Back:</div>
									<div class="text-sm text-gray-900 dark:text-gray-100 line-clamp-3">
										{card.back}
									</div>
								</div>
							</div>
							{#if card.tags && card.tags.length > 0}
								<div class="mt-2 flex gap-1 flex-wrap">
									{#each card.tags as tag}
										<span
											class="px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
										>
											{tag}
										</span>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>

				{#if error}
					<div class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-4 py-2 rounded">
						{error}
					</div>
				{/if}

				<div class="flex gap-2">
					<Button onclick={handleImport} disabled={isProcessing}>
						{isProcessing ? 'Importing...' : `Import ${previewCards.length} Card(s)`}
					</Button>
					<Button variant="secondary" onclick={() => (showPreview = false)}>Back</Button>
					<Button variant="secondary" onclick={onClose}>Cancel</Button>
				</div>
			</div>
		{/if}
	</div>
</div>
