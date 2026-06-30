import fs from "node:fs/promises";
import path from "node:path";

export async function loadMarkdown(filePath) {
  const absPath = path.resolve(filePath);
  const raw = await fs.readFile(absPath, "utf8");
  const { frontmatter, body } = parseFrontmatter(raw);
  const title = String(frontmatter.title || firstHeading(body) || path.basename(filePath, ".md")).trim();
  const plainText = markdownToPlainText(body);
  const summary = String(frontmatter.summary || summarize(plainText)).trim();
  const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags.map(String) : [];

  return {
    sourcePath: absPath,
    baseDir: path.dirname(absPath),
    slug: slugify(title),
    title,
    author: frontmatter.author ? String(frontmatter.author) : "",
    cover: frontmatter.cover ? path.resolve(path.dirname(absPath), String(frontmatter.cover)) : "",
    tags,
    summary,
    markdown: body.trim(),
    plainText,
    frontmatter
  };
}

export function parseFrontmatter(raw) {
  if (!raw.startsWith("---")) {
    return { frontmatter: {}, body: raw };
  }

  const end = raw.indexOf("\n---", 3);
  if (end === -1) {
    return { frontmatter: {}, body: raw };
  }

  const yaml = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\r?\n/, "");
  return { frontmatter: parseSimpleYaml(yaml), body };
}

function parseSimpleYaml(yaml) {
  const root = {};
  const stack = [{ indent: -1, value: root }];

  for (const line of yaml.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const indent = line.match(/^\s*/)[0].length;
    const trimmed = line.trim();
    const match = trimmed.match(/^([^:]+):\s*(.*)$/);
    if (!match) continue;

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].value;
    const key = match[1].trim();
    const rawValue = match[2].trim();

    if (!rawValue) {
      parent[key] = {};
      stack.push({ indent, value: parent[key] });
    } else {
      parent[key] = parseScalar(rawValue);
    }
  }

  return root;
}

function parseScalar(value) {
  const unquoted = value.replace(/^["']|["']$/g, "");
  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  if (unquoted === "true") return true;
  if (unquoted === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(unquoted)) return Number(unquoted);
  return unquoted;
}

function firstHeading(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1] : "";
}

export function markdownToPlainText(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`>~-]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function summarize(text) {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length > 110 ? `${compact.slice(0, 110)}...` : compact;
}

function slugify(input) {
  const ascii = input
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || `post-${Date.now()}`;
}
