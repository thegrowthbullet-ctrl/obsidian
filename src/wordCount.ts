import { App, MarkdownView } from 'obsidian';
import { matchesFolderFilter } from './folderFilter';
import {
	endOfDay,
	formatDateKey,
	startOfDay,
} from './dateUtils';

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

/** Count today's words, using live editor content when the active note is open. */
export async function countWordsForTodayLive(
	app: App,
	includeFolders: string[],
	excludeFolders: string[],
): Promise<number> {
	const today = new Date();
	const dayStart = startOfDay(today);
	const dayEnd = endOfDay(today);
	let total = await countWordsForDay(app, today, includeFolders, excludeFolders);

	const activeFile = app.workspace.getActiveFile();
	if (!activeFile?.path.endsWith('.md')) return total;
	if (!matchesFolderFilter(activeFile.path, includeFolders, excludeFolders)) {
		return total;
	}

	const view = app.workspace.getActiveViewOfType(MarkdownView);
	if (!view || view.file !== activeFile) return total;

	const liveWords = countWords(view.editor.getValue());
	const stat = await app.vault.adapter.stat(activeFile.path);
	const alreadyCountedToday =
		stat && stat.mtime >= dayStart && stat.mtime <= dayEnd;

	if (alreadyCountedToday) {
		const savedContent = await app.vault.cachedRead(activeFile);
		total -= countWords(savedContent);
	}

	return total + liveWords;
}

export { formatDateKey } from './dateUtils';
