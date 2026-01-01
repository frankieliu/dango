/**
 * Convert a File to a base64 data URL
 */
export async function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

/**
 * Validate image file
 */
export function isValidImageFile(file: File): boolean {
	const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
	const maxSize = 5 * 1024 * 1024; // 5MB

	if (!validTypes.includes(file.type)) {
		return false;
	}

	if (file.size > maxSize) {
		return false;
	}

	return true;
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Extract file name from data URL
 */
export function getImageFileName(dataUrl: string, index: number): string {
	const match = dataUrl.match(/^data:image\/(\w+);/);
	const ext = match ? match[1] : 'jpg';
	return `image-${index}.${ext}`;
}
