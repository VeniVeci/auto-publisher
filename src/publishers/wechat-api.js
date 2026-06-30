import fs from "node:fs/promises";

const API_BASE = "https://api.weixin.qq.com/cgi-bin";

export async function publishWechatDraft(article, config, options = {}) {
  const dryRun = Boolean(options.dryRun);
  if (dryRun) {
    return {
      mode: "dry-run",
      title: article.title,
      digest: article.digest,
      contentLength: article.content.length,
      coverPath: article.coverPath || ""
    };
  }

  assertWechatConfig(config);
  const accessToken = await getAccessToken(config.appId, config.appSecret);
  const thumbMediaId = await uploadThumbMedia(accessToken, article.coverPath);
  const payload = {
    articles: [{
      title: article.title,
      author: article.author || config.defaultAuthor || "",
      digest: article.digest,
      content: article.content,
      content_source_url: "",
      thumb_media_id: thumbMediaId,
      need_open_comment: config.defaultNeedOpenComment ?? 1,
      only_fans_can_comment: config.defaultOnlyFansCanComment ?? 0
    }]
  };

  const draft = await postJson(`${API_BASE}/draft/add?access_token=${accessToken}`, payload);
  return { mode: "wechat-draft", mediaId: draft.media_id, title: article.title };
}

export async function submitWechatPublish(mediaId, config) {
  assertWechatConfig(config);
  const accessToken = await getAccessToken(config.appId, config.appSecret);
  return postJson(`${API_BASE}/freepublish/submit?access_token=${accessToken}`, { media_id: mediaId });
}

async function getAccessToken(appId, appSecret) {
  const url = `${API_BASE}/token?grant_type=client_credential&appid=${encodeURIComponent(appId)}&secret=${encodeURIComponent(appSecret)}`;
  const response = await fetch(url);
  const data = await response.json();
  assertWxOk(data, "get access_token");
  return data.access_token;
}

async function uploadThumbMedia(accessToken, coverPath) {
  if (!coverPath) {
    throw new Error("Wechat publish requires a cover image path in frontmatter: cover: ./cover.png");
  }

  const buffer = await fs.readFile(coverPath);
  const form = new FormData();
  form.append("media", new Blob([buffer]), fileName(coverPath));
  const response = await fetch(`${API_BASE}/material/add_material?access_token=${accessToken}&type=thumb`, {
    method: "POST",
    body: form
  });
  const data = await response.json();
  assertWxOk(data, "upload thumb media");
  return data.media_id;
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  assertWxOk(data, "wechat post");
  return data;
}

function assertWechatConfig(config = {}) {
  if (!config.appId || !config.appSecret || config.appId.startsWith("YOUR_")) {
    throw new Error("Wechat config is missing. Copy config/config.example.json to config/config.json and fill appId/appSecret.");
  }
}

function assertWxOk(data, action) {
  if (data.errcode && data.errcode !== 0) {
    throw new Error(`Wechat API failed during ${action}: ${data.errcode} ${data.errmsg || ""}`);
  }
}

function fileName(filePath) {
  return filePath.split(/[\\/]/).pop() || "cover.png";
}
