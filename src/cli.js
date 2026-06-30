#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { loadMarkdown } from "./core/content-model.js";
import { loadConfig, outputRoot } from "./core/config.js";
import { renderWechatArticle } from "./renderers/wechat-renderer.js";
import { renderXhsPackage } from "./renderers/xhs-renderer.js";
import { publishWechatDraft } from "./publishers/wechat-api.js";
import { writeXhsBrowserHelper } from "./publishers/xhs-browser.js";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const mdPath = args[1];
  if (!command || !mdPath || !["prepare", "publish"].includes(command)) {
    usage();
    process.exit(1);
  }

  const platform = readFlag(args, "--platform");
  const dryRun = args.includes("--dry-run");
  const configPath = readFlag(args, "--config") || "config/config.json";
  const config = await loadConfig(configPath);
  const content = await loadMarkdown(mdPath);
  const outDir = path.join(outputRoot(config), content.slug);
  await fs.mkdir(outDir, { recursive: true });

  const result = command === "prepare"
    ? await prepareAll(content, config, outDir)
    : await publish(content, config, outDir, platform, dryRun);

  console.log(JSON.stringify(result, null, 2));
}

async function prepareAll(content, config, outDir) {
  const wechat = renderWechatArticle(content);
  await fs.writeFile(path.join(outDir, "wechat.html"), wechat.content, "utf8");
  await fs.writeFile(path.join(outDir, "wechat.article.json"), JSON.stringify(wechat, null, 2), "utf8");

  const xhs = await renderXhsPackage(content, outDir);
  const xhsHelper = await writeXhsBrowserHelper(xhs, config.xhs || {}, outDir);

  return {
    mode: "prepare",
    outDir,
    wechatHtml: path.join(outDir, "wechat.html"),
    wechatArticle: path.join(outDir, "wechat.article.json"),
    xhsContent: path.join(outDir, "xhs", "content.txt"),
    xhsCardsPreview: xhs.cardsHtml,
    xhsHelper: xhsHelper.scriptPath
  };
}

async function publish(content, config, outDir, platform, dryRun) {
  if (!platform) {
    throw new Error("Missing --platform. Use --platform wechat or --platform xhs.");
  }

  if (platform === "wechat") {
    const wechat = renderWechatArticle(content);
    await fs.writeFile(path.join(outDir, "wechat.html"), wechat.content, "utf8");
    return publishWechatDraft(wechat, config.wechat || {}, { dryRun });
  }

  if (platform === "xhs") {
    const xhs = await renderXhsPackage(content, outDir);
    const helper = await writeXhsBrowserHelper(xhs, config.xhs || {}, outDir);
    return {
      mode: dryRun ? "xhs-dry-run" : "xhs-browser-assisted",
      title: xhs.title,
      contentFile: path.join(outDir, "xhs", "content.txt"),
      cardsPreview: xhs.cardsHtml,
      helperScript: helper.scriptPath,
      note: "小红书第一版是浏览器辅助发布：先人工登录与确认，再发布。"
    };
  }

  throw new Error(`Unsupported platform: ${platform}`);
}

function readFlag(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : "";
}

function usage() {
  console.log(`Usage:
  node src/cli.js prepare <file.md> [--config config/config.json]
  node src/cli.js publish <file.md> --platform wechat [--dry-run]
  node src/cli.js publish <file.md> --platform xhs [--dry-run]`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
