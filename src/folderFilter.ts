/** Parse comma or newline separated folder paths into trimmed segments. */
export function parseFolderList(raw: string): string[] {
	return raw
		.split(/[,\n]/)
		.map((s) => s.trim().replace(/^\/+|\/+$/g, ''))
		.filter((s) => s.length > 0);
}

export function isPathInFolder(path: string, folder: string): boolean {
	const normalized = folder.replace(/^\/+|\/+$/g, '');
	if (!normalized) return false;
	return path === normalized || path.startsWith(`${normalized}/`);
}

export function matchesFolderFilter(
	path: string,
	includeFolders: string[],
	excludeFolders: string[],
): boolean {
	if (excludeFolders.some((folder) => isPathInFolder(path, folder))) {
		return false;
	}
	if (includeFolders.length === 0) return true;
	return includeFolders.some((folder) => isPathInFolder(path, folder));
}
