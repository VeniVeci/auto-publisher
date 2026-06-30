import fs from "node:fs/promises";
import path from "node:path";

export async function writeXhsBrowserHelper(xhsPackage, config, outDir) {
  const scriptPath = path.join(outDir, "xhs", "open-and-fill.mjs");
  const creatorUrl = config.creatorUrl || "https://creator.xiaohongshu.com/publish/publish";
  const titlePath = path.join(outDir, "xhs", "title.txt");
  const contentPath = path.join(outDir, "xhs", "content.txt");

  const script = `import { chromium } from "playwright";
import fs from "node:fs/promises";

const title = await fs.readFile(${JSON.stringify(titlePath)}, "utf8");
const content = await fs.readFile(${JSON.stringify(contentPath)}, "utf8");
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();
await page.goto(${JSON.stringify(creatorUrl)}, { waitUntil: "domcontentloaded" });

console.log("小红书创作页已打开。请先登录，然后按页面实际控件选择图片。");
console.log("标题：\\n" + title);
console.log("正文：\\n" + content);
console.log("当前脚本只负责打开页面和准备文案，发布前请人工确认。");
`;

  await fs.writeFile(scriptPath, script, "utf8");
  return { scriptPath, ...xhsPackage };
}
