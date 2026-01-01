import { marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';

/**
 * Configure marked options
 */
marked.setOptions({
	breaks: true, // Convert \n to <br>
	gfm: true, // GitHub Flavored Markdown
	headerIds: false, // Don't add IDs to headers
	mangle: false // Don't mangle email addresses
});

/**
 * Render inline and block math with KaTeX
 */
function renderMath(text: string): string {
	// Render block math: $$...$$ or \[...\]
	text = text.replace(/\$\$([\s\S]+?)\$\$/g, (match, math) => {
		try {
			return katex.renderToString(math.trim(), {
				displayMode: true,
				throwOnError: false,
				errorColor: '#cc0000'
			});
		} catch (e) {
			return `<span class="text-red-600 dark:text-red-400">Math Error: ${match}</span>`;
		}
	});

	text = text.replace(/\\\[([\s\S]+?)\\\]/g, (match, math) => {
		try {
			return katex.renderToString(math.trim(), {
				displayMode: true,
				throwOnError: false,
				errorColor: '#cc0000'
			});
		} catch (e) {
			return `<span class="text-red-600 dark:text-red-400">Math Error: ${match}</span>`;
		}
	});

	// Render inline math: $...$ or \(...\)
	text = text.replace(/\$(.+?)\$/g, (match, math) => {
		try {
			return katex.renderToString(math, {
				displayMode: false,
				throwOnError: false,
				errorColor: '#cc0000'
			});
		} catch (e) {
			return `<span class="text-red-600 dark:text-red-400">Math Error: ${match}</span>`;
		}
	});

	text = text.replace(/\\\((.+?)\\\)/g, (match, math) => {
		try {
			return katex.renderToString(math, {
				displayMode: false,
				throwOnError: false,
				errorColor: '#cc0000'
			});
		} catch (e) {
			return `<span class="text-red-600 dark:text-red-400">Math Error: ${match}</span>`;
		}
	});

	return text;
}

/**
 * Render markdown to safe HTML
 */
export function renderMarkdown(markdown: string): string {
	if (!markdown) return '';

	try {
		// First, render math expressions
		let processed = renderMath(markdown);

		// Then, render markdown
		const html = marked.parse(processed) as string;

		// Sanitize HTML to prevent XSS attacks
		return DOMPurify.sanitize(html, {
			ALLOWED_TAGS: [
				'p',
				'br',
				'strong',
				'em',
				'u',
				'code',
				'pre',
				'a',
				'ul',
				'ol',
				'li',
				'blockquote',
				'h1',
				'h2',
				'h3',
				'h4',
				'h5',
				'h6',
				'hr',
				'del',
				'mark',
				'sup',
				'sub',
				'span', // KaTeX uses spans
				'div' // KaTeX uses divs
			],
			ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class', 'style', 'aria-hidden'] // KaTeX needs class and style
		});
	} catch (error) {
		console.error('Error rendering markdown:', error);
		return markdown; // Fallback to plain text
	}
}

/**
 * Check if text contains markdown syntax
 */
export function hasMarkdown(text: string): boolean {
	if (!text) return false;

	// Check for common markdown patterns
	const markdownPatterns = [
		/\*\*.+\*\*/, // Bold
		/\*.+\*/, // Italic
		/__.+__/, // Bold (underscore)
		/_.+_/, // Italic (underscore)
		/``.+``/, // Inline code
		/^\s*[-*+]\s/, // Unordered list
		/^\s*\d+\.\s/, // Ordered list
		/^\s*>\s/, // Blockquote
		/^\s*#{1,6}\s/, // Headers
		/\[.+\]\(.+\)/, // Links
		/```[\s\S]*```/ // Code blocks
	];

	return markdownPatterns.some((pattern) => pattern.test(text));
}
