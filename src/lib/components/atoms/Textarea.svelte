<script lang="ts">
	interface Props {
		value?: string;
		placeholder?: string;
		label?: string;
		id?: string;
		required?: boolean;
		rows?: number;
		oninput?: (e: Event) => void;
	}

	let { value = $bindable(''), placeholder = '', label, id, required = false, rows = 4, oninput }: Props = $props();
</script>

{#if label}
	<label for={id} class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
		{label}
		{#if required}
			<span class="text-red-500">*</span>
		{/if}
	</label>
{/if}

<textarea
	{id}
	bind:value
	{placeholder}
	{required}
	{rows}
	{oninput}
	class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
		focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
		bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-y"
></textarea>
