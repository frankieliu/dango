<script lang="ts">
	interface Props {
		variant?: 'primary' | 'secondary' | 'danger';
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		onclick?: () => void;
		children?: any;
	}

	let { variant = 'primary', type = 'button', disabled = false, onclick, children }: Props = $props();

	const variants = {
		primary: 'bg-blue-600 hover:bg-blue-700 text-white',
		secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100',
		danger: 'bg-red-600 hover:bg-red-700 text-white'
	};
</script>

<button
	{type}
	{disabled}
	onclick={onclick}
	class="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed {variants[variant]}"
>
	{@render children?.()}
</button>
