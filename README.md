# Auto Publisher

基于一个 Markdown 文件，生成公众号文章资料和小红书笔记资料，并提供第一版发布链路。

## 第一版能力

- Markdown + frontmatter 解析为统一内容模型
- 生成公众号 HTML 和草稿发布 payload
- 通过微信公众号 API 创建草稿，支持 dry-run
- 生成小红书标题、正文、话题和卡片预览 HTML
- 生成小红书浏览器辅助脚本，先打开创作页并输出待复制文案

## 使用

```bash
cd auto-publisher
node src/cli.js prepare examples/demo.md
```

输出在 `outputs/<文章标题>/` 下：

- `wechat.html`：公众号正文 HTML
- `wechat.article.json`：公众号草稿对象
- `xhs/content.txt`：小红书正文
- `xhs/hashtags.txt`：小红书话题
- `xhs/cards.html`：小红书卡片预览
- `xhs/open-and-fill.mjs`：小红书浏览器辅助脚本

## 公众号

先复制配置：

```bash
copy config\config.example.json config\config.json
```

填写：

```json
{
  "wechat": {
    "appId": "公众号 appId",
    "appSecret": "公众号 appSecret"
  }
}
```

dry-run：

```bash
node src/cli.js publish examples/demo.md --platform wechat --dry-run
```

创建公众号草稿：

```bash
node src/cli.js publish examples/demo.md --platform wechat
```

注意：

- Markdown frontmatter 里需要配置 `cover`，真实发布时公众号草稿必须有封面图。
- 当前版本创建草稿，不自动 `freepublish/submit` 群发，避免误发布。
- 正文图片上传和替换还没有做成完整链路，第一版先处理纯文本和本地图片占位。

## 小红书

生成素材：

```bash
node src/cli.js publish examples/demo.md --platform xhs --dry-run
```

如果要用浏览器辅助，需要安装 Playwright：

```bash
npm install -D playwright
npx playwright install chromium
node outputs\<文章标题>\xhs\open-and-fill.mjs
```

当前小红书第一版不模拟点击发布，原因是普通创作者发布 API 不稳定且账号风险较高。建议先自动生成素材和文案，打开创作页后人工登录、上传图片、确认发布。

## Markdown 格式

```markdown
---
title: "文章标题"
author: "作者"
cover: "./cover.png"
tags: ["RAG", "AI工程"]
summary: "文章摘要"
platforms:
  wechat:
    publish: "draft"
  xhs:
    style: "knowledge-note"
---

# 正文标题

正文内容...
```

## 后续迭代建议

1. 公众号正文图片上传并自动替换 URL。
2. 小红书卡片从 HTML 预览升级为 PNG 导出。
3. 接入 LLM，对同一篇 Markdown 自动改写出平台化标题和文案。
4. 增加 SQLite 发布记录，保存文章、平台、草稿 ID、发布时间和失败原因。
