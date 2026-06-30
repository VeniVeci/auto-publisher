import { chromium } from "playwright";
import fs from "node:fs/promises";

const title = await fs.readFile("D:\\MyProject\\Articles\\auto-publisher\\outputs\\自我进化论-适合那些想慢一点-也想更诚实地理解自己的人\\xhs\\title.txt", "utf8");
const content = await fs.readFile("D:\\MyProject\\Articles\\auto-publisher\\outputs\\自我进化论-适合那些想慢一点-也想更诚实地理解自己的人\\xhs\\content.txt", "utf8");
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();
await page.goto("https://creator.xiaohongshu.com/publish/publish", { waitUntil: "domcontentloaded" });

console.log("小红书创作页已打开。请先登录，然后按页面实际控件选择图片。");
console.log("标题：\n" + title);
console.log("正文：\n" + content);
console.log("当前脚本只负责打开页面和准备文案，发布前请人工确认。");
