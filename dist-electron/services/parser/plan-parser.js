"use strict";
/**
 * Speckit Dashboard - Plan Parser
 * Parse plan.md files to extract phases, tasks, and dependencies
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePlanFile = parsePlanFile;
exports.parsePlanContent = parsePlanContent;
const fs_1 = __importDefault(require("fs"));
/**
 * Extract text content from a markdown node
 */
function extractText(node) {
    if (node.value)
        return node.value;
    if (node.children) {
        return node.children.map(extractText).join("");
    }
    return "";
}
/**
 * Parse a plan.md file and extract structured data
 */
async function parsePlanFile(filePath) {
    const content = fs_1.default.readFileSync(filePath, "utf-8");
    return await parsePlanContent(content);
}
/**
 * Parse plan.md content string
 */
async function parsePlanContent(content) {
    // Use Function constructor to prevent TypeScript from converting to require()
    const dynamicImport = new Function("specifier", "return import(specifier)");
    const { unified } = await dynamicImport("unified");
    const { default: remarkParse } = await dynamicImport("remark-parse");
    const { default: remarkGfm } = await dynamicImport("remark-gfm");
    const { default: remarkFrontmatter } = await dynamicImport("remark-frontmatter");
    const tree = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkFrontmatter)
        .parse(content);
    const result = {
        summary: null,
        techStack: {},
        phases: [],
        dependencies: [],
        risks: [],
    };
    let currentSection = "";
    let currentPhase = null;
    let phaseOrder = 0;
    const children = tree.children;
    for (let i = 0; i < children.length; i++) {
        const node = children[i];
        // Track section headings
        if (node.type === "heading" && node.depth === 2) {
            const headingText = extractText(node).toLowerCase();
            if (headingText.includes("summary")) {
                currentSection = "summary";
            }
            else if (headingText.includes("technical context") ||
                headingText.includes("tech")) {
                currentSection = "techStack";
            }
            else if (headingText.includes("phase")) {
                currentSection = "phase";
                phaseOrder++;
                currentPhase = {
                    name: extractText(node),
                    goal: "",
                    order: phaseOrder,
                    tasks: [],
                };
                result.phases.push(currentPhase);
            }
            else if (headingText.includes("dependencies")) {
                currentSection = "dependencies";
            }
            else if (headingText.includes("risk")) {
                currentSection = "risks";
            }
            else {
                currentSection = "";
            }
            continue;
        }
        // Parse content based on current section
        if (node.type === "paragraph") {
            const text = extractText(node);
            if (currentSection === "summary" && !result.summary) {
                result.summary = text;
            }
            else if (currentSection === "phase" && currentPhase && !currentPhase.goal) {
                currentPhase.goal = text;
            }
        }
        // Parse lists
        if (node.type === "list") {
            const items = (node.children || []).map((item) => extractText(item).trim());
            if (currentSection === "phase" && currentPhase) {
                currentPhase.tasks.push(...items);
            }
            else if (currentSection === "dependencies") {
                result.dependencies.push(...items);
            }
            else if (currentSection === "risks") {
                items.forEach((item) => {
                    const parts = item.split(/[-–:]/).map((p) => p.trim());
                    if (parts.length >= 2) {
                        result.risks.push({
                            risk: parts[0],
                            mitigation: parts.slice(1).join(": "),
                        });
                    }
                });
            }
        }
        // Parse tech stack from key-value patterns
        if (currentSection === "techStack" && node.type === "paragraph") {
            const text = extractText(node);
            const matches = text.match(/\*\*([^*]+)\*\*:\s*([^\n]+)/g);
            if (matches) {
                matches.forEach((match) => {
                    const [, key, value] = match.match(/\*\*([^*]+)\*\*:\s*(.+)/) || [];
                    if (key && value) {
                        result.techStack[key.trim()] = value.trim();
                    }
                });
            }
        }
    }
    return result;
}
exports.default = { parsePlanFile, parsePlanContent };
