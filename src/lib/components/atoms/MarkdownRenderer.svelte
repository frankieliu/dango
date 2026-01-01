<script lang="ts">
	import { renderMarkdown } from '$lib/utils/markdown';

	interface Props {
		content: string;
		class?: string;
	}

	let { content, class: className = '' }: Props = $props();

	let htmlPromise = $derived(renderMarkdown(content));
</script>

{#await htmlPromise}
	<div class="markdown-content {className} text-gray-600 dark:text-gray-400">
		Loading...
	</div>
{:then html}
	<div
		class="markdown-content {className}"
		data-testid="markdown-renderer"
	>
		{@html html}
	</div>
{:catch error}
	<div class="markdown-content {className} text-red-600 dark:text-red-400">
		Error rendering content: {error.message}
	</div>
{/await}

<style>
	@reference '../../../app.css';

	:global(.markdown-content) {
		@apply text-gray-900 dark:text-gray-100;
	}

	:global(.markdown-content p) {
		@apply mb-2;
	}

	:global(.markdown-content p:last-child) {
		@apply mb-0;
	}

	:global(.markdown-content strong) {
		@apply font-bold;
	}

	:global(.markdown-content em) {
		@apply italic;
	}

	:global(.markdown-content code) {
		@apply px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono text-blue-600 dark:text-blue-400;
	}

	:global(.markdown-content pre) {
		@apply mb-4 rounded-lg overflow-x-auto;
	}

	:global(.markdown-content pre code) {
		@apply p-0 bg-transparent;
	}

	/* Shiki pre elements already have background colors */
	:global(.markdown-content pre.shiki),
	:global(.markdown-content pre.shiki code) {
		@apply bg-transparent;
	}

	:global(.markdown-content a) {
		@apply text-blue-600 dark:text-blue-400 hover:underline;
	}

	:global(.markdown-content ul) {
		@apply list-disc list-inside mb-2 ml-4;
	}

	:global(.markdown-content ol) {
		@apply list-decimal list-inside mb-2 ml-4;
	}

	:global(.markdown-content li) {
		@apply mb-1;
	}

	:global(.markdown-content blockquote) {
		@apply border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-700 dark:text-gray-300 mb-2;
	}

	:global(.markdown-content h1) {
		@apply text-2xl font-bold mb-2 mt-4;
	}

	:global(.markdown-content h2) {
		@apply text-xl font-bold mb-2 mt-3;
	}

	:global(.markdown-content h3) {
		@apply text-lg font-bold mb-2 mt-3;
	}

	:global(.markdown-content h4) {
		@apply text-base font-bold mb-2 mt-2;
	}

	:global(.markdown-content h1:first-child),
	:global(.markdown-content h2:first-child),
	:global(.markdown-content h3:first-child),
	:global(.markdown-content h4:first-child) {
		@apply mt-0;
	}

	:global(.markdown-content hr) {
		@apply my-4 border-gray-300 dark:border-gray-600;
	}

	:global(.markdown-content del) {
		@apply line-through text-gray-500 dark:text-gray-400;
	}

	:global(.markdown-content mark) {
		@apply bg-yellow-200 dark:bg-yellow-800;
	}
</style>
