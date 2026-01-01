import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'system';

function createThemeStore() {
	// Get initial theme from localStorage or default to system
	const initialTheme: Theme = browser
		? (localStorage.getItem('theme') as Theme) || 'system'
		: 'system';

	const { subscribe, set } = writable<Theme>(initialTheme);

	return {
		subscribe,
		set: (theme: Theme) => {
			if (browser) {
				localStorage.setItem('theme', theme);
				applyTheme(theme);
			}
			set(theme);
		},
		init: () => {
			if (browser) {
				applyTheme(initialTheme);
			}
		}
	};
}

function applyTheme(theme: Theme) {
	const root = document.documentElement;

	if (theme === 'dark') {
		root.classList.add('dark');
	} else if (theme === 'light') {
		root.classList.remove('dark');
	} else {
		// System preference
		if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			root.classList.add('dark');
		} else {
			root.classList.remove('dark');
		}
	}
}

export const theme = createThemeStore();
