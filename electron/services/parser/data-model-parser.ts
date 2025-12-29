/**
 * Speckit Dashboard - Data Model Parser
 * Parse data-model.md files to extract entities and relationships
 */

import fs from "fs";

interface EntityAttribute {
  name: string;
  type: string;
  constraints: string | null;
}

interface EntityRelationship {
  target: string;
  type: "1:1" | "1:N" | "N:1" | "N:N";
  description: string | null;
}

interface ParsedEntity {
  name: string;
  description: string | null;
  attributes: EntityAttribute[];
  relationships: EntityRelationship[];
}

interface ParsedDataModel {
  entities: ParsedEntity[];
  overview: string | null;
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
 * Parse relationship type from text
 */
function parseRelationType(text: string): "1:1" | "1:N" | "N:1" | "N:N" {
  if (text.includes("1:N") || text.includes("one-to-many")) return "1:N";
  if (text.includes("N:1") || text.includes("many-to-one")) return "N:1";
  if (text.includes("N:N") || text.includes("many-to-many")) return "N:N";
  return "1:1";
}

/**
 * Parse a data-model.md file
 */
export async function parseDataModelFile(
  filePath: string,
): Promise<ParsedDataModel> {
  const content = fs.readFileSync(filePath, "utf-8");
  return await parseDataModelContent(content);
}

/**
 * Parse data-model.md content string
 */
export async function parseDataModelContent(
  content: string,
): Promise<ParsedDataModel> {
  const { unified } = await import("unified");
  const { default: remarkParse } = await import("remark-parse");
  const { default: remarkGfm } = await import("remark-gfm");
  const { default: remarkFrontmatter } = await import("remark-frontmatter");

  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter)
    .parse(content);

  const result: ParsedDataModel = {
    entities: [],
    overview: null,
  };

  let currentSection = "";
  let currentEntity: ParsedEntity | null = null;
  let currentSubSection = "";

  const children = tree.children as MarkdownNode[];

  for (let i = 0; i < children.length; i++) {
    const node = children[i];

    // Track main section headings (## Entity Name)
    if (node.type === "heading" && node.depth === 2) {
      const text = extractText(node);

      if (
        text.toLowerCase().includes("overview") ||
        text.toLowerCase().includes("summary")
      ) {
        currentSection = "overview";
        currentEntity = null;
      } else if (text.toLowerCase().includes("relationship")) {
        currentSection = "relationships";
      } else {
        // Assume it's an entity name
        currentSection = "entity";
        currentEntity = {
          name: text.trim(),
          description: null,
          attributes: [],
          relationships: [],
        };
        result.entities.push(currentEntity);
      }
      currentSubSection = "";
      continue;
    }

    // Track subsections (### Attributes, ### Relationships)
    if (node.type === "heading" && node.depth === 3) {
      const text = extractText(node).toLowerCase();

      if (
        text.includes("attribute") || text.includes("field") ||
        text.includes("column")
      ) {
        currentSubSection = "attributes";
      } else if (
        text.includes("relationship") || text.includes("association")
      ) {
        currentSubSection = "relationships";
      } else {
        currentSubSection = text;
      }
      continue;
    }

    // Parse overview paragraph
    if (
      node.type === "paragraph" && currentSection === "overview" &&
      !result.overview
    ) {
      result.overview = extractText(node);
      continue;
    }

    // Parse entity description
    if (
      node.type === "paragraph" && currentEntity && !currentEntity.description
    ) {
      currentEntity.description = extractText(node);
      continue;
    }

    // Parse attribute/relationship lists
    if (node.type === "list" && currentEntity) {
      const items = (node.children || []).map((item) =>
        extractText(item).trim()
      );

      if (currentSubSection === "attributes") {
        items.forEach((item) => {
          // Parse patterns like "name (type): constraint" or "name: type"
          const match = item.match(/^([^(:]+)\s*(?:\(([^)]+)\))?[:\s]*(.*)$/);
          if (match) {
            currentEntity!.attributes.push({
              name: match[1].trim(),
              type: match[2]?.trim() || "string",
              constraints: match[3]?.trim() || null,
            });
          }
        });
      } else if (currentSubSection === "relationships") {
        items.forEach((item) => {
          // Parse patterns like "has many Tasks" or "belongs to Project"
          const targetMatch = item.match(
            /(?:has|belongs|references)\s+(?:many|one|to)?\s*(\w+)/i,
          );
          if (targetMatch) {
            currentEntity!.relationships.push({
              target: targetMatch[1],
              type: parseRelationType(item),
              description: item,
            });
          }
        });
      }
    }

    // Parse tables (for structured entity definitions)
    if (
      node.type === "table" && currentEntity &&
      currentSubSection === "attributes"
    ) {
      // Tables have rows as children, first row is header
      const rows = (node.children || []).slice(1); // Skip header
      rows.forEach((row) => {
        const cells = (row.children || []).map((cell) =>
          extractText(cell).trim()
        );
        if (cells.length >= 2) {
          currentEntity!.attributes.push({
            name: cells[0],
            type: cells[1],
            constraints: cells[2] || null,
          });
        }
      });
    }
  }

  return result;
}

export default { parseDataModelFile, parseDataModelContent };
