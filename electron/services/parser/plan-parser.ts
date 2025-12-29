/**
 * Speckit Dashboard - Plan Parser
 * Parse plan.md files to extract phases, tasks, and dependencies
 */

import fs from "fs";

interface ParsedPhase {
  name: string;
  goal: string;
  order: number;
  tasks: string[];
}

interface ParsedPlan {
  summary: string | null;
  techStack: Record<string, string>;
  phases: ParsedPhase[];
  dependencies: string[];
  risks: Array<{ risk: string; mitigation: string }>;
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
 * Parse a plan.md file and extract structured data
 */
export async function parsePlanFile(filePath: string): Promise<ParsedPlan> {
  const content = fs.readFileSync(filePath, "utf-8");
  return await parsePlanContent(content);
}

/**
 * Parse plan.md content string
 */
export async function parsePlanContent(content: string): Promise<ParsedPlan> {
  const { unified } = await import("unified");
  const { default: remarkParse } = await import("remark-parse");
  const { default: remarkGfm } = await import("remark-gfm");
  const { default: remarkFrontmatter } = await import("remark-frontmatter");

  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter)
    .parse(content);

  const result: ParsedPlan = {
    summary: null,
    techStack: {},
    phases: [],
    dependencies: [],
    risks: [],
  };

  let currentSection = "";
  let currentPhase: ParsedPhase | null = null;
  let phaseOrder = 0;

  const children = tree.children as MarkdownNode[];

  for (let i = 0; i < children.length; i++) {
    const node = children[i];

    // Track section headings
    if (node.type === "heading" && node.depth === 2) {
      const headingText = extractText(node).toLowerCase();

      if (headingText.includes("summary")) {
        currentSection = "summary";
      } else if (
        headingText.includes("technical context") ||
        headingText.includes("tech")
      ) {
        currentSection = "techStack";
      } else if (headingText.includes("phase")) {
        currentSection = "phase";
        phaseOrder++;
        currentPhase = {
          name: extractText(node),
          goal: "",
          order: phaseOrder,
          tasks: [],
        };
        result.phases.push(currentPhase);
      } else if (headingText.includes("dependencies")) {
        currentSection = "dependencies";
      } else if (headingText.includes("risk")) {
        currentSection = "risks";
      } else {
        currentSection = "";
      }
      continue;
    }

    // Parse content based on current section
    if (node.type === "paragraph") {
      const text = extractText(node);

      if (currentSection === "summary" && !result.summary) {
        result.summary = text;
      } else if (
        currentSection === "phase" && currentPhase && !currentPhase.goal
      ) {
        currentPhase.goal = text;
      }
    }

    // Parse lists
    if (node.type === "list") {
      const items = (node.children || []).map((item) =>
        extractText(item).trim()
      );

      if (currentSection === "phase" && currentPhase) {
        currentPhase.tasks.push(...items);
      } else if (currentSection === "dependencies") {
        result.dependencies.push(...items);
      } else if (currentSection === "risks") {
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

export default { parsePlanFile, parsePlanContent };
