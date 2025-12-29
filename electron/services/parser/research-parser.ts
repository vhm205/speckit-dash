/**
 * Speckit Dashboard - Research Parser
 * Parse research.md files to extract decisions, rationale, and alternatives
 */

import fs from "fs";

interface ParsedDecision {
    title: string;
    decision: string;
    rationale: string | null;
    alternatives: string[];
    context: string | null;
}

interface ParsedResearch {
    decisions: ParsedDecision[];
}

interface MarkdownNode {
    type: string;
    depth?: number;
    children?: MarkdownNode[];
    value?: string;
}

/**
 * Extract text content from a markdown node
 */
function extractText(node: MarkdownNode): string {
    if (node.value) return node.value;
    if (node.children) {
        return node.children.map(extractText).join("");
    }
    return "";
}

/**
 * Parse a research.md file and extract structured data
 */
export async function parseResearchFile(filePath: string): Promise<ParsedResearch> {
    const content = fs.readFileSync(filePath, "utf-8");
    return await parseResearchContent(content);
}

/**
 * Parse research.md content string
 */
export async function parseResearchContent(content: string): Promise<ParsedResearch> {
    const { unified } = await import("unified");
    const { default: remarkParse } = await import("remark-parse");
    const { default: remarkGfm } = await import("remark-gfm");
    const { default: remarkFrontmatter } = await import("remark-frontmatter");

    const tree = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkFrontmatter)
        .parse(content);

    const result: ParsedResearch = {
        decisions: [],
    };

    let currentSection = "";
    let currentDecision: ParsedDecision | null = null;
    let currentSubsection = "";
    let paragraphBuffer: string[] = [];

    const children = tree.children as MarkdownNode[];

    for (let i = 0; i < children.length; i++) {
        const node = children[i];

        // Track main section headings (H2)
        if (node.type === "heading" && node.depth === 2) {
            const headingText = extractText(node).toLowerCase();

            if (headingText.includes("phase") || headingText.includes("research")) {
                currentSection = "decisions";
            } else {
                currentSection = "";
            }
            continue;
        }

        // Track decision headings (H3) - each decision is a subsection
        if (node.type === "heading" && node.depth === 3 && currentSection === "decisions") {
            // Save previous decision if exists
            if (currentDecision) {
                result.decisions.push(currentDecision);
            }

            const title = extractText(node).replace(/^\d+\.\s*/, "").trim();
            currentDecision = {
                title,
                decision: "",
                rationale: null,
                alternatives: [],
                context: null,
            };
            currentSubsection = "";
            paragraphBuffer = [];
            continue;
        }

        // Track subsection headings (H4+) within a decision
        if (node.type === "heading" && node.depth && node.depth >= 4 && currentDecision) {
            const headingText = extractText(node).toLowerCase();

            // Flush paragraph buffer to appropriate field
            if (paragraphBuffer.length > 0 && currentSubsection) {
                const content = paragraphBuffer.join("\n\n");
                if (currentSubsection === "decision" && !currentDecision.decision) {
                    currentDecision.decision = content;
                } else if (currentSubsection === "rationale") {
                    currentDecision.rationale = content;
                } else if (currentSubsection === "context") {
                    currentDecision.context = content;
                }
                paragraphBuffer = [];
            }

            if (headingText.includes("decision")) {
                currentSubsection = "decision";
            } else if (headingText.includes("rationale") || headingText.includes("why")) {
                currentSubsection = "rationale";
            } else if (headingText.includes("alternative")) {
                currentSubsection = "alternatives";
            } else if (headingText.includes("implementation") || headingText.includes("approach")) {
                currentSubsection = "context";
            } else if (headingText.includes("context") || headingText.includes("background")) {
                currentSubsection = "context";
            } else {
                currentSubsection = "";
            }
            continue;
        }

        // Parse paragraphs
        if (node.type === "paragraph" && currentDecision) {
            const text = extractText(node);

            // Look for "Decision:" prefix
            if (text.match(/^\*\*Decision\*\*:/i)) {
                const decision = text.replace(/^\*\*Decision\*\*:\s*/i, "").trim();
                currentDecision.decision = decision;
                currentSubsection = "";
            } else if (paragraphBuffer.length === 0 && !currentDecision.decision && currentSubsection === "") {
                // First paragraph after title, treat as decision if not already set
                paragraphBuffer.push(text);
            } else if (currentSubsection) {
                paragraphBuffer.push(text);
            }
        }

        // Parse lists for alternatives or other content
        if (node.type === "list" && currentDecision) {
            const items = (node.children || []).map((item) => extractText(item).trim());

            if (currentSubsection === "alternatives") {
                // Parse alternatives - usually in format "**Name**: description"
                for (const item of items) {
                    const match = item.match(/^\*\*([^*]+)\*\*:\s*(.*)/);
                    if (match) {
                        currentDecision.alternatives.push(`${match[1]}: ${match[2]}`);
                    } else {
                        currentDecision.alternatives.push(item);
                    }
                }
            } else if (currentSubsection) {
                paragraphBuffer.push(items.map(item => `- ${item}`).join("\n"));
            }
        }

        // Parse code blocks for context
        if (node.type === "code" && currentDecision && currentSubsection === "context") {
            const codeContent = extractText(node);
            paragraphBuffer.push(`\`\`\`\n${codeContent}\n\`\`\``);
        }
    }

    // Save last decision
    if (currentDecision) {
        // Flush remaining buffer
        if (paragraphBuffer.length > 0 && currentSubsection) {
            const content = paragraphBuffer.join("\n\n");
            if (currentSubsection === "decision" && !currentDecision.decision) {
                currentDecision.decision = content;
            } else if (currentSubsection === "rationale") {
                currentDecision.rationale = content;
            } else if (currentSubsection === "context") {
                currentDecision.context = content;
            }
        }
        result.decisions.push(currentDecision);
    }

    return result;
}

export default { parseResearchFile, parseResearchContent };
