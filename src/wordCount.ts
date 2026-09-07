import { App, MarkdownView, TFile } from 'obsidian';
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

/** Sum positive word-count deltas vs a per-file baseline snapshot. */
export function countDeltaWords(
	currentByPath: Record<string, number>,
	baselineByPath: Record<string, number>,
): number {
	let total = 0;

	for (const [path, current] of Object.entries(currentByPath)) {
		const baseline = baselineByPath[path] ?? 0;
		total += Math.max(0, current - baseline);
	}

	return total;
}

function getScopedMarkdownFiles(
	app: App,
	includeFolders: string[],
	excludeFolders: string[],
): TFile[] {
	return app.vault.getMarkdownFiles().filter((file) =>
		matchesFolderFilter(file.path, includeFolders, excludeFolders),
	);
}

export async function buildWordCountSnapshot(
	app: App,
	includeFolders: string[],
	excludeFolders: string[],
): Promise<Record<string, number>> {
	const snapshot: Record<string, number> = {};

	for (const file of getScopedMarkdownFiles(
		app,
		includeFolders,
		excludeFolders,
	)) {
		const content = await app.vault.cachedRead(file);
		snapshot[file.path] = countWords(content);
	}

	return snapshot;
}

export async function buildCurrentWordCounts(
	app: App,
	includeFolders: string[],
	excludeFolders: string[],
): Promise<Record<string, number>> {
	const counts: Record<string, number> = {};
	const activeFile = app.workspace.getActiveFile();
	const view = app.workspace.getActiveViewOfType(MarkdownView);

	for (const file of getScopedMarkdownFiles(
		app,
		includeFolders,
		excludeFolders,
	)) {
		if (activeFile?.path === file.path && view?.file === file) {
			counts[file.path] = countWords(view.editor.getValue());
			continue;
		}

		const content = await app.vault.cachedRead(file);
		counts[file.path] = countWords(content);
	}

	return counts;
}

/** Words added today = current counts minus the snapshot taken at day start. */
export async function countWordsWrittenToday(
	app: App,
	includeFolders: string[],
	excludeFolders: string[],
	dayStartSnapshot: Record<string, number>,
): Promise<number> {
	const current = await buildCurrentWordCounts(app, includeFolders, excludeFolders);
	return countDeltaWords(current, dayStartSnapshot);
}

/** Legacy: total words in files modified on a given day (not recommended). */
export async function countWordsForDay(
	app: App,
	date: Date,
	includeFolders: string[],
	excludeFolders: string[],
): Promise<number> {
	const dayStart = startOfDay(date);
	const dayEnd = endOfDay(date);
	let total = 0;

	for (const file of getScopedMarkdownFiles(
		app,
		includeFolders,
		excludeFolders,
	)) {
		const stat = await app.vault.adapter.stat(file.path);
		if (!stat) continue;

		const mtime = stat.mtime;
		if (mtime < dayStart || mtime > dayEnd) continue;

		const content = await app.vault.cachedRead(file);
		total += countWords(content);
	}

	return total;
}

export { formatDateKey } from './dateUtils';
