import { App } from 'obsidian';
import { matchesFolderFilter } from './folderFilter';

/** Count writing units: each CJK character + each English word. */
export function countWords(text: string): number {
	let body = text.replace(/^---[\r\n]+[\s\S]*?---[\r\n]+/, '');
	body = body.replace(/```[\s\S]*?```/g, ' ');
	body = body.replace(/`[^`]*`/g, ' ');
	body = body.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
	body = body.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
	body = body.replace(/<[^>]+>/g, ' ');
	body = body.replace(/[#>*_\-\[\]|]/g, ' ');

	const cjk = (body.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || [])
		.length;
	const withoutCjk = body.replace(
		/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g,
		' ',
	);
	const english = withoutCjk
		.split(/\s+/)
		.filter((w) => w.length > 0 && /[a-zA-Z0-9]/.test(w)).length;

	return cjk + english;
}

export function startOfDay(date: Date): number {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d.getTime();
}

export function endOfDay(date: Date): number {
	const d = new Date(date);
	d.setHours(23, 59, 59, 999);
	return d.getTime();
}

export function formatDateKey(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export async function countWordsForDay(
	app: App,
	date: Date,
	includeFolders: string[],
	excludeFolders: string[],
): Promise<number> {
	const dayStart = startOfDay(date);
	const dayEnd = endOfDay(date);
	let total = 0;

	for (const file of app.vault.getMarkdownFiles()) {
		if (!matchesFolderFilter(file.path, includeFolders, excludeFolders)) {
			continue;
		}

		const stat = await app.vault.adapter.stat(file.path);
		if (!stat) continue;

		const mtime = stat.mtime;
		if (mtime < dayStart || mtime > dayEnd) continue;

		const content = await app.vault.cachedRead(file);
		total += countWords(content);
	}

	return total;
}
