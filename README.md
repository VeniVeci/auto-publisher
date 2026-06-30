# Auto Publisher

基于一个 Markdown 文件，生成公众号文章资料和小红书笔记资料，并提供第一版发布链路。

## 排版效果展示

### 输入：Markdown

```markdown
---
title: "《自我进化论》适合那些想慢一点、也想更诚实地理解自己的人"
author: "Seeek X"
cover: "./cover.png"
tags: ["播客推荐", "自我探索", "情绪成长"]
summary: "一档持续分享自我探索与自我养育的播客推荐"
---

# 标题

> 真正的成长，不一定总是更强、更快、更高效。

正文段落。加粗文字使用**蓝色高亮**，代码使用 `inline code` 样式。

## 二级标题带蓝色左侧竖线

### 三级标题

- 列表项 1
- 列表项 2
```

### 输出：壹伴风格公众号 HTML

> 微信公众号会剥离 `<style>` 标签和 class，必须使用 inline style。渲染引擎将以下排版规则转译为 WeChat 兼容的 HTML。

| 元素 | 渲染规则 | 效果示意 |
|------|----------|----------|
| **顶部卡片** | 灰底圆角，作者 + 摘要 | <table><tr><td style="background:#f7f8fa;border-radius:8px;padding:12px 16px;text-align:center;font-size:13px;color:#999;line-height:1.6">文 / Seeek X<br>一档持续分享自我探索与自我养育的播客推荐</td></tr></table> |
| **H1 大标题** | 22px, 加粗, 居中 | <span style="font-size:22px;font-weight:bold;color:#333">《自我进化论》适合那些想慢一点...</span> |
| **H2 二级标题** | 18px, 左侧 4px 蓝色竖线 | <span style="font-size:18px;font-weight:bold;color:#333;border-left:4px solid #027aff;padding-left:10px">一档持续分享"自我探索"的播客</span> |
| **H3 三级标题** | 16px, 加粗 | <span style="font-size:16px;font-weight:bold;color:#333">1. 它谈成长，但不是"优化自己"的逻辑</span> |
| **正文段落** | 15px, #595959, 行距 1.75 | <span style="font-size:15px;color:#595959;line-height:1.75;letter-spacing:1px">它不是快节奏的"效率升级"播客，也不是灌输正能量的成长节目...</span> |
| **加粗文字** | 蓝色 #027aff 高亮 | 由 <strong style="color:#027aff;font-weight:bold">颜晓静Athena</strong> 创作 |
| **引用块** | 灰底 + 左侧蓝线 + 圆角 | <blockquote style="font-size:14px;color:#888;line-height:1.8;padding:15px 20px;background:#f7f8fa;border-left:4px solid #027aff;border-radius:4px">真正的成长，不一定总是更强、更快、更高效。</blockquote> |
| **列表** | • 符号前缀, 15px | <span style="font-size:15px;color:#595959">&bull; 列表项 1</span> |
| **分割线** | 浅灰细线 | <hr style="border:none;border-top:1px solid #e8e8e8"> |
| **底部引导卡片** | 灰底圆角，"感谢阅读" + 点赞/在看/转发 | <table><tr><td style="background:#f7f8fa;border-radius:8px;padding:16px;text-align:center"><b style="color:#333">感谢阅读</b><br><span style="font-size:13px;color:#999">欢迎 <strong style="color:#027aff">点赞、在看、转发</strong></span></td></tr></table> |

### 示例代码片段

```html
<!-- H2 标题：左侧蓝色竖线 -->
<h2 style="font-size:18px;font-weight:bold;color:#333;line-height:1.5;
    padding-left:10px;border-left:4px solid #027aff">
  一档持续分享"自我探索"和"自我养育"的播客
</h2>

<!-- 正文段落：15px, #595959, 行距 1.75 -->
<p style="font-size:15px;color:#595959;line-height:1.75;letter-spacing:1px;
   margin-top:15px;margin-bottom:25px">
  《自我进化论》由 <strong style="color:#027aff;font-weight:bold">颜晓静Athena</strong> 创作。
</p>

<!-- 引用块：灰底 + 左侧蓝线 -->
<blockquote style="font-size:14px;color:#888;line-height:1.8;letter-spacing:1px;
   padding:15px 20px;margin:20px 0;background-color:#f7f8fa;
   border-left:4px solid #027aff;border-radius:4px">
  真正的成长，不一定总是更强、更快、更高效。
</blockquote>
```

> 完整示例文件：[`outputs/自我进化论-适合那些想慢一点-也想更诚实地理解自己的人/wechat.html`](outputs/自我进化论-适合那些想慢一点-也想更诚实地理解自己的人/wechat.html)

## 第一版能力

- Markdown + frontmatter 解析为统一内容模型
- 壹伴编辑器风格自动排版（inline CSS，零浏览器依赖）
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
