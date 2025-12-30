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
  // Use Function constructor to prevent TypeScript from converting to require()
  const dynamicImport = new Function("specifier", "return import(specifier)");
  const { unified } = await dynamicImport("unified");
  const { default: remarkParse } = await dynamicImport("remark-parse");
  const { default: remarkGfm } = await dynamicImport("remark-gfm");
  const { default: remarkFrontmatter } = await dynamicImport(
    "remark-frontmatter",
  );

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

    // Track section headings (## Section Name) - these are categories, not entities
    if (node.type === "heading" && node.depth === 2) {
      const text = extractText(node);

      if (
        text.toLowerCase().includes("overview") ||
        text.toLowerCase().includes("summary")
      ) {
        currentSection = "overview";
      } else if (text.toLowerCase().includes("relationship")) {
        currentSection = "relationships";
      } else {
        // It's just a category section (like "Core Entities")
        currentSection = text.toLowerCase();
      }
      currentEntity = null;
      currentSubSection = "";
      continue;
    }

    // Track entity headings (### Entity Name) - these ARE the entities
    if (node.type === "heading" && node.depth === 3) {
      const text = extractText(node);

      // Create new entity
      currentEntity = {
        name: text.trim(),
        description: null,
        attributes: [],
        relationships: [],
      };
      result.entities.push(currentEntity);
      currentSubSection = "";
      continue;
    }

    // Track subsections (#### Attributes, #### Relationships) or bold headers
    if (node.type === "heading" && node.depth === 4) {
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

    // Check for bold subsection markers (e.g., **Attributes**:, **Relationships**:)
    if (node.type === "paragraph" && currentEntity) {
      const text = extractText(node).trim();
      const lowerText = text.toLowerCase();

      // Check if this is a section marker
      if (
        lowerText.startsWith("**") ||
        /^\*\*[^*]+\*\*:?\s*$/.test(text)
      ) {
        if (lowerText.includes("attribute") || lowerText.includes("field")) {
          currentSubSection = "attributes";
          continue;
        } else if (
          lowerText.includes("relationship") ||
          lowerText.includes("association")
        ) {
          currentSubSection = "relationships";
          continue;
        } else if (
          lowerText.includes("lifecycle") || lowerText.includes("validation")
        ) {
          currentSubSection = lowerText.replace(/\*\*/g, "").replace(":", "")
            .trim();
          continue;
        }
      }
    }

    // Parse entity description (only if no subsection is active)
    if (
      node.type === "paragraph" && currentEntity &&
      !currentEntity.description &&
      !currentSubSection
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
          // Handle format: `name` (TYPE, CONSTRAINTS...): Description
          // or: name (TYPE, CONSTRAINTS...): Description
          const match = item.match(/^`?([^`(]+)`?\s*\(([^)]+)\)\s*:\s*(.*)$/);
          if (match) {
            const name = match[1].trim();
            const typeInfo = match[2].trim();
            const description = match[3].trim();

            // Split type information by comma to separate type from constraints
            const typeParts = typeInfo.split(",").map((p) => p.trim());
            const type = typeParts[0]; // First part is the data type
            const constraints = typeParts.slice(1).join(", ") || null;

            currentEntity!.attributes.push({
              name,
              type,
              constraints: constraints || description || null,
            });
          } else {
            // Fallback: try simpler patterns
            const simpleMatch = item.match(/^`?([^`:]+)`?:?\s*(.+)$/);
            if (simpleMatch) {
              currentEntity!.attributes.push({
                name: simpleMatch[1].trim(),
                type: simpleMatch[2].trim(),
                constraints: null,
              });
            }
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
