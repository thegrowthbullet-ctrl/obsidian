#!/bin/bash
# Reinstall Daily Word Tracker without git clone.
# Usage: bash reinstall-without-git.sh

set -e

PLUGIN_DIR="${HOME}/obsidian-plugins/my-obsidian-plugin"
BRANCH="cursor/obsidian-plugin-scaffold-59fe"
BASE_URL="https://raw.githubusercontent.com/thegrowthbullet-ctrl/obsidian/${BRANCH}"

echo "→ Installing to ${PLUGIN_DIR}"
mkdir -p "${PLUGIN_DIR}"
cd "${PLUGIN_DIR}"

download() {
	local file="$1"
	echo "  downloading ${file}..."
	if curl -fsSL "${BASE_URL}/${file}" -o "${file}"; then
		return 0
	fi
	return 1
}

if ! download "manifest.json" || ! download "main.js" || ! download "styles.css"; then
	echo ""
	echo "✗ Could not download from GitHub (may still be down)."
	echo "  Try copying from another vault — see README offline section."
	exit 1
fi

download "versions.json" || true

echo ""
echo "✓ Plugin files installed."
echo "  Next: symlink into each vault's .obsidian/plugins/"
echo "  Example:"
echo "    ln -sf ${PLUGIN_DIR} /path/to/vault/.obsidian/plugins/my-obsidian-plugin"
