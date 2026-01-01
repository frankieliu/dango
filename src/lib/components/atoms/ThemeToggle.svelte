<script lang="ts">
	import { theme } from '$lib/stores/theme';

	let currentTheme = $state<'light' | 'dark' | 'system'>('system');

	theme.subscribe((value) => {
		currentTheme = value;
	});

	function cycleTheme() {
		const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
		const currentIndex = themes.indexOf(currentTheme);
		const nextIndex = (currentIndex + 1) % themes.length;
		theme.set(themes[nextIndex]);
	}

	const icons = {
		light: '☀️',
		dark: '🌙',
		system: '💻'
	};

	const labels = {
		light: 'Light',
		dark: 'Dark',
		system: 'System'
	};
</script>

<button
	onclick={cycleTheme}
	class="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600
		text-gray-900 dark:text-gray-100 transition-colors flex items-center gap-2"
	aria-label="Toggle theme"
	title="Current theme: {labels[currentTheme]}"
>
	<span class="text-xl">{icons[currentTheme]}</span>
	<span class="text-sm font-medium hidden sm:inline">{labels[currentTheme]}</span>
</button>
