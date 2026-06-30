import fs from "node:fs/promises";
import path from "node:path";

export async function renderXhsPackage(content, outDir) {
  const xhsDir = path.join(outDir, "xhs");
  const imageDir = path.join(xhsDir, "cards");
  await fs.mkdir(imageDir, { recursive: true });

  const title = makeXhsTitle(content.title);
  const body = makeXhsBody(content);
  const hashtags = content.tags.map((tag) => `#${tag}`).join(" ");
  const cards = buildCards(content);

  await fs.writeFile(path.join(xhsDir, "title.txt"), title, "utf8");
  await fs.writeFile(path.join(xhsDir, "content.txt"), `${body}\n\n${hashtags}`.trim(), "utf8");
  await fs.writeFile(path.join(xhsDir, "hashtags.txt"), hashtags, "utf8");
  await fs.writeFile(path.join(xhsDir, "cards.html"), renderCardsHtml(cards), "utf8");

  return { title, body, hashtags, cardsHtml: path.join(xhsDir, "cards.html"), imageDir };
}

function makeXhsTitle(title) {
  const clean = title.replace(/[？?。！!]/g, "").trim();
  return clean.length > 20 ? `${clean.slice(0, 20)}...` : clean;
}

function makeXhsBody(content) {
  const sections = content.plainText
    .split(/\n{2,}/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8);

  return [
    content.summary,
    "",
    ...sections.map((section) => section.length > 80 ? `${section.slice(0, 80)}...` : section),
    "",
    "适合收藏后对照自己的项目检查。"
  ].join("\n");
}

function buildCards(content) {
  const headings = [...content.markdown.matchAll(/^#{2,3}\s+(.+)$/gm)].map((match) => match[1]);
  const points = headings.length ? headings : content.plainText.split(/\n{2,}/).slice(0, 5);
  return [
    { eyebrow: "知识卡片", title: content.title, body: content.summary },
    ...points.slice(0, 7).map((point, index) => ({
      eyebrow: `0${index + 1}`,
      title: point,
      body: extractParagraphAfterHeading(content.markdown, point) || "把这个点放进真实项目里检查，通常能很快看到问题。"
    }))
  ];
}

function extractParagraphAfterHeading(markdown, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^#{2,3}\\s+${escaped}\\s*\\n+([\\s\\S]*?)(\\n#{2,3}\\s+|$)`, "m");
  const match = markdown.match(pattern);
  if (!match) return "";
  return match[1].replace(/^#+\s+/gm, "").trim().split(/\n{2,}/)[0]?.slice(0, 120) || "";
}

function renderCardsHtml(cards) {
  const cardHtml = cards.map((card) => `<section class="card">
  <div class="eyebrow">${escapeHtml(card.eyebrow)}</div>
  <h1>${escapeHtml(card.title)}</h1>
  <p>${escapeHtml(card.body)}</p>
</section>`).join("\n");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>小红书卡片预览</title>
  <style>
    body { margin: 0; padding: 24px; background: #f4f1ea; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 20px; }
    .card { aspect-ratio: 3 / 4; box-sizing: border-box; padding: 34px 28px; background: #fffdf8; border: 1px solid #222; border-radius: 8px; display: flex; flex-direction: column; justify-content: center; }
    .eyebrow { font-size: 15px; color: #7a1f1f; margin-bottom: 28px; font-weight: 700; }
    h1 { font-size: 30px; line-height: 1.22; margin: 0 0 22px; color: #161616; letter-spacing: 0; }
    p { font-size: 17px; line-height: 1.65; margin: 0; color: #333; }
  </style>
</head>
<body>
  <main class="grid">
${cardHtml}
  </main>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
