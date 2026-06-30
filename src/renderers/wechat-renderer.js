import path from "node:path";

// ============================================================
// 壹伴风格排版参数（inline styles for WeChat）
// 微信公众号会剥离 <style> 标签和 class，必须用内联样式
// ============================================================

const S = {
  // 正文段落
  body: "font-size:15px;color:#595959;line-height:1.75;letter-spacing:1px;margin-top:15px;margin-bottom:25px",
  // 一级标题（居中，22px）
  h1: "font-size:22px;font-weight:bold;color:#333;line-height:1.4;margin:30px 0 20px 0;text-align:center",
  // 二级标题（左侧蓝色竖线）
  h2: "font-size:18px;font-weight:bold;color:#333;line-height:1.5;margin:25px 0 15px 0;padding-left:10px;border-left:4px solid #027aff",
  // 三级标题
  h3: "font-size:16px;font-weight:bold;color:#333;line-height:1.5;margin:20px 0 10px 0",
  // 列表项
  bullet: "font-size:15px;color:#595959;line-height:1.75;letter-spacing:1px;margin-bottom:8px",
  // 引用块
  bq: "font-size:14px;color:#888;line-height:1.8;letter-spacing:1px;padding:15px 20px;margin:20px 0;background-color:#f7f8fa;border-left:4px solid #027aff;border-radius:4px",
  // 分割线
  hr: "border:none;border-top:1px solid #e8e8e8;margin:30px 0",
  // 强调文字（蓝色）
  strong: "color:#027aff;font-weight:bold",
  // 整体容器内边距
  container: "padding:0 8px",
  // 引导关注卡片
  guideBg: "padding:20px 16px;margin:30px 0 0 0;background-color:#f7f8fa;border-radius:8px;text-align:center",
  guideText: "font-size:13px;color:#999;line-height:1.6;letter-spacing:1px"
};

// ============================================================
// 公开接口
// ============================================================

export function renderWechatArticle(content) {
  const html = markdownToWechatHtml(content.markdown, content.baseDir, content);
  return {
    title: content.title,
    author: content.author,
    digest: content.summary,
    content: html,
    coverPath: content.cover
  };
}

// ============================================================
// Markdown → 壹伴风格 HTML
// ============================================================

function markdownToWechatHtml(markdown, baseDir, meta) {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let paragraph = [];
  let quoteLines = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(para(inline(paragraph.join("<br>"))));
      paragraph = [];
    }
  };

  const flushQuote = () => {
    if (quoteLines.length) {
      blocks.push(blockquote(inline(quoteLines.join("<br>"))));
      quoteLines = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // 引用块
    if (trimmed.startsWith(">")) {
      flushParagraph();
      const quoteContent = trimmed.slice(1).trim();
      quoteLines.push(quoteContent || "&nbsp;");
      continue;
    }
    flushQuote();

    // 空行 → 刷新当前段落
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    // 分割线
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      flushParagraph();
      blocks.push(divider());
      continue;
    }

    // 标题
    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      const text = inline(heading[2]);
      blocks.push(headingHtml(level, text));
      continue;
    }

    // 图片
    const image = trimmed.match(/^!\[([^\]]*)]\(([^)]+)\)$/);
    if (image) {
      flushParagraph();
      const imagePath = path.resolve(baseDir, image[2]);
      blocks.push(`<figure style="margin:20px 0;text-align:center"><img src="${escapeAttr(imagePath)}" alt="${escapeAttr(image[1])}" style="max-width:100%;border-radius:6px"/></figure>`);
      continue;
    }

    // 无序列表
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      blocks.push(bulletItem(inline(bullet[1])));
      continue;
    }

    // 有序列表
    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      blocks.push(bulletItem(inline(ordered[1]), true));
      continue;
    }

    // 普通文本
    paragraph.push(trimmed);
  }

  flushQuote();
  flushParagraph();

  // 组装
  const body = blocks.join("\n");
  return wrapPage(body, meta);
}

// ============================================================
// HTML 构建器
// ============================================================

function headingHtml(level, text) {
  const styleMap = { 1: S.h1, 2: S.h2, 3: S.h3 };
  const tag = level <= 3 ? `h${level}` : "h3";
  const style = styleMap[Math.min(level, 3)] || S.h3;
  return `<${tag} style="${style}">${text}</${tag}>`;
}

function para(text) {
  return `<p style="${S.body}">${text}</p>`;
}

function bulletItem(text, isOrdered = false) {
  const prefix = isOrdered ? "" : "&bull;&nbsp;";
  return `<p style="${S.bullet}">${prefix}${text}</p>`;
}

function blockquote(text) {
  return `<blockquote style="${S.bq}">${text}</blockquote>`;
}

function divider() {
  return `<hr style="${S.hr}"/>`;
}

// ============================================================
// 内联处理（加粗、代码、链接）
// ============================================================

function inline(text) {
  return escapeHtml(text)
    // 加粗 → 壹伴蓝色强调
    .replace(/\*\*([^*]+)\*\*/g, (_m, inner) => `<strong style="${S.strong}">${inner}</strong>`)
    // 行内代码
    .replace(/`([^`]+)`/g, '<code style="font-family:Consolas,monospace;font-size:13px;background-color:#f0f0f0;padding:2px 6px;border-radius:3px;color:#c7254e">$1</code>')
    // 链接
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, '<a href="$2" style="color:#027aff;text-decoration:none;border-bottom:1px solid #027aff">$1</a>');
}

// ============================================================
// 页面包装（顶部引导 + 正文容器 + 底部引导关注）
// ============================================================

function wrapPage(body, meta) {
  const author = meta.author ? `<p style="${S.guideText}">文 / ${escapeHtml(meta.author)}</p>` : "";
  const summary = meta.summary ? `<p style="${S.guideText}">${escapeHtml(meta.summary)}</p>` : "";

  const guideTop = meta.author || meta.summary ?
    `<section style="${S.guideBg}">${author}${summary}</section>` : "";

  const guideBottom = `<section style="${S.guideBg};margin-top:40px">
<p style="font-size:15px;font-weight:bold;color:#333;margin-bottom:8px">感谢阅读</p>
<p style="${S.guideText}">如果觉得有收获，欢迎 <strong style="color:#027aff">点赞、在看、转发</strong></p>
</section>`;

  return `<section style="${S.container}">
${guideTop}
${body}
${guideBottom}
</section>`;
}

// ============================================================
// 工具函数
// ============================================================

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}