/**
 * edit override: whitespace-insensitive exact matching (robust v2).
 *
 * Matching strategy per oldText:
 *   1. Exact match (verbatim). Must be unique.
 *   2. Line-based normalized match: split into lines, compare lines with
 *      trimmed + internal whitespace collapsed. Indentation (tabs/spaces,
 *      any width, or none) is fully ignored, as are line endings.
 *      4. Whitespace runs vs no whitespace, CRLF vs LF, and internal
 *      spacing differences all tolerated.
 *
 * When duplicate matches differ only by skipped blank lines, the latest
 * (tightest) start wins.
 *
 * The matched region in the file is replaced with newText verbatim
 * (preserve tabs in newText).
 */

import { withFileMutationQueue, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Type } from "typebox";

/** Normalize a line for comparison: trim + collapse internal whitespace runs to one space */
function normLine(line: string): string {
	return line.replace(/\s+/g, "");
}

/**
 * Find all whitespace-insensitive matches of oldText in content.
 * Returns [startIndex, endIndex] ranges.
 */
function findLooseMatches(content: string, oldText: string): Array<[number, number]> {
	const contentLines = content.split(/\r?\n/);
	const oldLines = oldText.split(/\r?\n/).map(normLine).filter((l) => l.length > 0);
	if (oldLines.length === 0) return [];

	const normContent = contentLines.map(normLine);
	const ranges: Array<[number, number]> = [];

	for (let start = 0; start <= normContent.length - oldLines.length; start++) {
		let ci = start;
		let oi = 0;
		let ok = true;
		while (oi < oldLines.length) {
			if (ci >= normContent.length) { ok = false; break; }
			if (normContent[ci] === oldLines[oi]) {
				ci++;
				oi++;
			} else if (normContent[ci].length === 0) {
				// blank line in file not present in oldText -> skip it
				ci++;
			} else if (oldLines[oi].length === 0) {
				// shouldn't happen (filtered), but be safe
				oi++;
			} else {
				ok = false;
				break;
			}
		}
		if (ok) ranges.push([start, ci]);
	}
	// a match may also "start" on a blank line that then gets skipped;
	// dedupe by end offset, keeping the latest (tightest) start.
	const dedup = new Map<number, number>();
	for (const [ls, le] of ranges) {
		const prev = dedup.get(le);
		if (prev === undefined || ls > prev) dedup.set(le, ls);
	}
	ranges.length = 0;
	for (const [le, ls] of dedup) ranges.push([ls, le]);

	// convert line ranges to char offsets
	const out: Array<[number, number]> = [];
	for (const [ls, le] of ranges) {
		let startOffset = -1;
		let offset = 0;
		for (let i = 0; i < contentLines.length; i++) {
			if (i === ls) startOffset = offset;
			offset += contentLines[i].length + 1; // +1 for newline
			if (i === le - 1) {
				out.push([startOffset, offset]); // [start, end-exclusive incl. newline]
				break;
			}
		}
	}
	return out;
}

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "edit", // overrides built-in
		label: "edit (ws-insensitive)",
		description:
			"Edit a file using exact text replacement with whitespace-insensitive fallback matching. Every edits[].oldText must match a unique region. Replacement text is inserted verbatim (preserve tabs).",
		promptSnippet: "Edit a single file; exact-text replacement, whitespace-insensitive fallback",
		parameters: Type.Object({
			path: Type.String({ description: "File to edit (relative or absolute)" }),
			edits: Type.Array(
				Type.Object({
					oldText: Type.String({ description: "Exact text to find" }),
					newText: Type.String({ description: "Replacement text" }),
				}),
				{ description: "One or more targeted replacements" },
			),
		}),

		async execute(_id, params, _signal, _onUpdate, ctx) {
			const absolutePath = resolve(ctx.cwd, params.path.replace(/^@/, ""));

			return withFileMutationQueue(absolutePath, async () => {
				let content: string;
				try {
					content = await readFile(absolutePath, "utf8");
				} catch (e: any) {
					return { content: [{ type: "text", text: `Error reading ${params.path}: ${e.message}` }], details: { error: true } };
				}

				const notes: string[] = [];
				let working = content;

				for (const [i, edit] of params.edits.entries()) {
					const { oldText, newText } = edit;

					// 1. exact match
					const exactCount = working.split(oldText).length - 1;
					if (exactCount === 1) {
						working = working.replace(oldText, newText);
						continue;
					}
					if (exactCount > 1) {
						return {
							content: [{ type: "text", text: `Error: edits[${i}].oldText matches ${exactCount} regions exactly in ${params.path}. Provide more surrounding context to make it unique.` }],
							details: { error: true },
						};
					}

					// 2. whitespace-insensitive line-based fallback
					const matches = findLooseMatches(working, oldText);
					if (matches.length === 0) {
						return {
							content: [{ type: "text", text: `Error: edits[${i}].oldText not found in ${params.path} (exact, whitespace-insensitive, or line-normalized).` }],
							details: { error: true },
						};
					}
					if (matches.length > 1) {
						return {
							content: [{ type: "text", text: `Error: edits[${i}].oldText matches ${matches.length} regions (whitespace-insensitive) in ${params.path}. Provide more context.` }],
							details: { error: true },
						};
					}
					const [start, end] = matches[0];
					working = working.slice(0, start) + newText + working.slice(end);
					notes.push(`edits[${i}]: matched via whitespace-insensitive fallback`);
				}

				await writeFile(absolutePath, working, "utf8");
				return {
					content: [
						{
							type: "text",
							text: `Edited ${params.path}${notes.length ? `\n${notes.join("\n")}` : ""}`,
						},
					],
					details: { path: absolutePath },
				};
			});
		},
	});
}
