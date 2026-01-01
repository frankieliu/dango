import { marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';
import { highlightCode } from './highlight';

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
 * Detect if we're in dark mode
 */
function isDarkMode(): boolean {
	if (typeof window === 'undefined') return false;
	return document.documentElement.classList.contains('dark');
}

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
export async function renderMarkdown(markdown: string): Promise<string> {
	if (!markdown) return '';

	try {
		// First, render math expressions
		let processed = renderMath(markdown);

		// Extract code blocks and highlight them
		const codeBlocks: { placeholder: string; html: string }[] = [];
		const isDark = isDarkMode();

		// Match fenced code blocks
		const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
		const matches = Array.from(processed.matchAll(codeBlockRegex));

		// Process code blocks asynchronously
		for (let i = 0; i < matches.length; i++) {
			const match = matches[i];
			const lang = match[1] || 'text';
			const code = match[2];
			// Use HTML comment as placeholder (markdown won't touch it)
			const placeholder = `<!--CODE_BLOCK_${i}-->`;

			const highlightedHtml = await highlightCode(code, lang, isDark);
			codeBlocks.push({ placeholder, html: highlightedHtml });

			// Replace code block with placeholder
			processed = processed.replace(match[0], placeholder);
		}

		// Then, render markdown
		let html = marked.parse(processed) as string;

		// Replace placeholders with highlighted code (use regex to handle any whitespace)
		codeBlocks.forEach(({ placeholder, html: codeHtml }) => {
			const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			html = html.replace(new RegExp(escapedPlaceholder, 'g'), codeHtml);
		});

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
				'span', // KaTeX and Shiki use spans
				'div' // KaTeX and Shiki use divs
			],
			ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class', 'style', 'aria-hidden', 'data-language'], // KaTeX and Shiki need class and style
			ALLOW_DATA_ATTR: true, // Allow data-* attributes for Shiki
			KEEP_CONTENT: true // Keep content even if tag is not allowed
		});
	} catch (error) {
		console.error('Error rendering markdown:', error);
		return markdown; // Fallback to plain text
	}
}

/**
 * Synchronous version for simple cases (without code highlighting)
 */
export function renderMarkdownSync(markdown: string): string {
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
				'span',
				'div'
			],
			ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class', 'style', 'aria-hidden']
		});
	} catch (error) {
		console.error('Error rendering markdown:', error);
		return markdown;
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
