<script lang="ts">
	import { fileToBase64, isValidImageFile, formatFileSize } from '$lib/utils/file';

	interface Props {
		images: string[];
		onAdd: (dataUrl: string) => void;
		onRemove: (index: number) => void;
		maxImages?: number;
	}

	let { images = $bindable([]), onAdd, onRemove, maxImages = 5 }: Props = $props();

	let fileInput: HTMLInputElement;
	let error = $state('');

	async function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const files = input.files;

		if (!files || files.length === 0) return;

		const file = files[0];

		// Validate file
		if (!isValidImageFile(file)) {
			error = 'Invalid file. Please upload a JPEG, PNG, GIF, WebP, or SVG image under 5MB.';
			return;
		}

		if (images.length >= maxImages) {
			error = `Maximum ${maxImages} images allowed.`;
			return;
		}

		error = '';

		try {
			const dataUrl = await fileToBase64(file);
			onAdd(dataUrl);
		} catch (err) {
			error = 'Failed to upload image. Please try again.';
			console.error(err);
		}

		// Reset input
		input.value = '';
	}
</script>

<div class="space-y-3">
	<!-- Upload Button -->
	{#if images.length < maxImages}
		<div>
			<input
				type="file"
				accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
				bind:this={fileInput}
				onchange={handleFileSelect}
				class="hidden"
			/>
			<button
				type="button"
				onclick={() => fileInput.click()}
				class="px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600
					hover:border-blue-500 dark:hover:border-blue-400 transition-colors
					text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400
					flex items-center gap-2 w-full justify-center"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
					></path>
				</svg>
				<span>Add Image ({images.length}/{maxImages})</span>
			</button>
			<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
				Max 5MB • JPEG, PNG, GIF, WebP, SVG
			</p>
		</div>
	{/if}

	<!-- Error Message -->
	{#if error}
		<div class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-4 py-2 rounded">
			{error}
		</div>
	{/if}

	<!-- Image Preview Grid -->
	{#if images.length > 0}
		<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
			{#each images as image, index}
				<div class="relative group">
					<img
						src={image}
						alt="Attachment {index + 1}"
						class="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
					/>
					<button
						type="button"
						onclick={() => onRemove(index)}
						class="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1
							opacity-0 group-hover:opacity-100 transition-opacity"
						aria-label="Remove image"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							></path>
						</svg>
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
