<script lang="ts">
	interface Props {
		value: string;
		placeholder?: string;
		onInput?: (value: string) => void;
	}

	let { value = $bindable(''), placeholder = 'Search...', onInput }: Props = $props();

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		value = target.value;
		onInput?.(value);
	}
</script>

<div class="relative">
	<div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
		<svg
			class="w-5 h-5 text-gray-400 dark:text-gray-500"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
			></path>
		</svg>
	</div>
	<input
		type="text"
		{value}
		oninput={handleInput}
		{placeholder}
		class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
			bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
			placeholder-gray-500 dark:placeholder-gray-400
			focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
			focus:border-transparent transition-colors"
	/>
	{#if value}
		<button
			onclick={() => {
				value = '';
				onInput?.('');
			}}
			class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
			aria-label="Clear search"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				></path>
			</svg>
		</button>
	{/if}
</div>
