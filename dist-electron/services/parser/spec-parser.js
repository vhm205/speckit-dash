"use strict";
/**
 * Speckit Dashboard - Spec Parser
 * Parse spec.md files to extract title, status, requirements, and user stories
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSpecFile = parseSpecFile;
exports.parseSpecContent = parseSpecContent;
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
 * Parse a spec.md file and extract structured data
 */
async function parseSpecFile(filePath) {
    const content = fs_1.default.readFileSync(filePath, "utf-8");
    return await parseSpecContent(content);
}
/**
 * Parse spec.md content string
 */
async function parseSpecContent(content) {
    const { unified } = await Promise.resolve().then(() => __importStar(require("unified")));
    const { default: remarkParse } = await Promise.resolve().then(() => __importStar(require("remark-parse")));
    const { default: remarkGfm } = await Promise.resolve().then(() => __importStar(require("remark-gfm")));
    const { default: remarkFrontmatter } = await Promise.resolve().then(() => __importStar(require("remark-frontmatter")));
    const tree = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkFrontmatter)
        .parse(content);
    const result = {
        title: null,
        status: "draft",
        createdDate: null,
        featureBranch: null,
        userStories: [],
        requirements: [],
    };
    let currentSection = "";
    let currentStory = null;
    const children = tree.children;
    console.log({ children });
    for (let i = 0; i < children.length; i++) {
        const node = children[i];
        console.log({ node });
        // Extract title from H1
        if (node.type === "heading" && node.depth === 1) {
            const text = extractText(node);
            // Remove "Feature Specification:" prefix if present
            result.title = text.replace(/^Feature Specification:\s*/i, "").trim();
            continue;
        }
        // Track section headings
        if (node.type === "heading" && node.depth === 2) {
            const headingText = extractText(node).toLowerCase();
            if (headingText.includes("user") && headingText.includes("scenario")) {
                currentSection = "userStories";
            }
            else if (headingText.includes("requirement")) {
                currentSection = "requirements";
            }
            else {
                currentSection = "";
            }
            continue;
        }
        // Parse user story headings (H3)
        if (node.type === "heading" && node.depth === 3 &&
            currentSection === "userStories") {
            const text = extractText(node);
            const priorityMatch = text.match(/\(Priority:\s*(P[123])\)/i);
            currentStory = {
                title: text.replace(/\s*\(Priority:.*\)/i, "").trim(),
                priority: priorityMatch ? priorityMatch[1].toUpperCase() : "P2",
                description: "",
                acceptanceScenarios: [],
            };
            result.userStories.push(currentStory);
            continue;
        }
        // Parse paragraphs
        if (node.type === "paragraph") {
            const text = extractText(node);
            // Extract metadata from top of file
            if (text.includes("**Status**:")) {
                const match = text.match(/\*\*Status\*\*:\s*(\w+)/i);
                if (match)
                    result.status = match[1].toLowerCase();
            }
            if (text.includes("**Created**:")) {
                const match = text.match(/\*\*Created\*\*:\s*([\d-]+)/);
                if (match)
                    result.createdDate = match[1];
            }
            if (text.includes("**Feature Branch**:")) {
                const match = text.match(/\*\*Feature Branch\*\*:\s*`?([^`\n]+)`?/);
                if (match)
                    result.featureBranch = match[1].trim();
            }
            // Store description for current user story
            if (currentStory && currentSection === "userStories" &&
                !currentStory.description) {
                if (!text.startsWith("**")) {
                    currentStory.description = text;
                }
            }
        }
        // Parse acceptance scenarios (numbered lists)
        if (node.type === "list" && currentStory && currentSection === "userStories") {
            const items = (node.children || []).map((item) => extractText(item).trim());
            currentStory.acceptanceScenarios.push(...items);
        }
        // Parse requirements lists
        if (node.type === "list" && currentSection === "requirements") {
            const items = (node.children || []).map((item) => extractText(item).trim());
            items.forEach((item) => {
                // Extract FR-XXX style IDs
                const idMatch = item.match(/^(FR-\d+|NFR-\d+)/i);
                if (idMatch) {
                    result.requirements.push({
                        id: idMatch[1].toUpperCase(),
                        description: item.replace(idMatch[0], "").replace(/^[:\s-]+/, "")
                            .trim(),
                        priority: null,
                    });
                }
            });
        }
    }
    return result;
}
exports.default = { parseSpecFile, parseSpecContent };
