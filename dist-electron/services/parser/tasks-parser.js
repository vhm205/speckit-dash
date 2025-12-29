"use strict";
/**
 * Speckit Dashboard - Tasks Parser
 * Parse tasks.md files to extract tasks with status, phases, and dependencies
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTasksFile = parseTasksFile;
exports.parseTasksContent = parseTasksContent;
const fs_1 = __importDefault(require("fs"));
/**
 * Parse checkbox status from markdown task item
 */
function parseCheckboxStatus(text) {
    if (text.match(/^\s*-\s*\[x\]/i))
        return "done";
    if (text.match(/^\s*-\s*\[\/\]/))
        return "in_progress";
    return "not_started";
}
/**
 * Extract task ID from task text (e.g., T001, T002)
 */
function extractTaskId(text) {
    const match = text.match(/\b(T\d{3})\b/i);
    return match ? match[1].toUpperCase() : null;
}
/**
 * Extract story label from task text (e.g., [US1], [US2])
 */
function extractStoryLabel(text) {
    const match = text.match(/\[(US\d+)\]/i);
    return match ? match[1].toUpperCase() : null;
}
/**
 * Check if task is marked as parallel [P]
 */
function isParallelTask(text) {
    return /\[P\]/.test(text);
}
/**
 * Extract file path from task description
 */
function extractFilePath(text) {
    // Match patterns like `path/to/file.ts` or in `path/to/file.ts`
    const match = text.match(/`([^`]+\.[a-z]+)`/i);
    return match ? match[1] : null;
}
/**
 * Clean task description by removing markers
 */
function cleanDescription(text) {
    return text
        .replace(/^\s*-\s*\[[x\/\s]\]\s*/i, "") // Remove checkbox
        .replace(/\bT\d{3}\b/i, "") // Remove task ID
        .replace(/\[P\]/g, "") // Remove parallel marker
        .replace(/\[(US\d+)\]/gi, "") // Remove story label
        .trim();
}
/**
 * Parse a tasks.md file
 */
function parseTasksFile(filePath) {
    const content = fs_1.default.readFileSync(filePath, "utf-8");
    return parseTasksContent(content);
}
/**
 * Parse tasks.md content string
 */
function parseTasksContent(content) {
    const lines = content.split("\n");
    const result = {
        title: null,
        tasks: [],
        phaseNames: [],
    };
    let currentPhase = null;
    let phaseOrder = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;
        // Extract title from H1
        if (line.match(/^#\s+/) && !result.title) {
            result.title = line.replace(/^#\s+/, "").trim();
            continue;
        }
        // Track phase headings (## Phase X: Name)
        if (line.match(/^##\s+Phase\s+\d+/i)) {
            currentPhase = line.replace(/^##\s+/, "").trim();
            phaseOrder++;
            result.phaseNames.push(currentPhase);
            continue;
        }
        // Parse task items (checkbox lines)
        if (line.match(/^\s*-\s*\[[x\/\s]\]/i)) {
            const taskId = extractTaskId(line);
            if (!taskId)
                continue; // Skip non-task items
            const task = {
                taskId,
                description: cleanDescription(line),
                status: parseCheckboxStatus(line),
                phase: currentPhase,
                phaseOrder,
                isParallel: isParallelTask(line),
                storyLabel: extractStoryLabel(line),
                filePath: extractFilePath(line),
                lineNumber,
            };
            result.tasks.push(task);
        }
    }
    return result;
}
exports.default = { parseTasksFile, parseTasksContent };
