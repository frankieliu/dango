import { createHighlighter, type Highlighter } from 'shiki';

let highlighter: Highlighter | null = null;

/**
 * Initialize the syntax highlighter (lazy loaded)
 */
async function getHighlighter(): Promise<Highlighter> {
	if (!highlighter) {
		highlighter = await createHighlighter({
			themes: ['github-dark', 'github-light'],
			langs: [
				'javascript',
				'typescript',
				'python',
				'java',
				'c',
				'cpp',
				'csharp',
				'go',
				'rust',
				'ruby',
				'php',
				'swift',
				'kotlin',
				'html',
				'css',
				'scss',
				'json',
				'yaml',
				'markdown',
				'bash',
				'shell',
				'sql',
				'graphql',
				'jsx',
				'tsx'
			]
		});
	}
	return highlighter;
}

/**
 * Highlight code with Shiki
 */
export async function highlightCode(code: string, lang: string, isDark: boolean): Promise<string> {
	try {
		const highlighter = await getHighlighter();
		const theme = isDark ? 'github-dark' : 'github-light';

		return highlighter.codeToHtml(code, {
			lang: lang || 'text',
			theme
		});
	} catch (error) {
		console.error('Error highlighting code:', error);
		// Fallback to pre-formatted code
		return `<pre><code>${escapeHtml(code)}</code></pre>`;
	}
}

/**
 * Check if a language is supported
 */
export async function isLanguageSupported(lang: string): Promise<boolean> {
	try {
		const highlighter = await getHighlighter();
		const langs = highlighter.getLoadedLanguages();
		return langs.includes(lang as any);
	} catch {
		return false;
	}
}

/**
 * Escape HTML characters
 */
function escapeHtml(text: string): string {
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	};
	return text.replace(/[&<>"']/g, (m) => map[m]);
}
