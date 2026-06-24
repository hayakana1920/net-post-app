(function (root) {
  const REQUIRED_SYSTEM = `あなたはSNS投稿の編集支援者です。
特定人物本人として書かないでください。
参考文の固有表現、口癖、文をコピーしないでください。
参考にするのは、長さ、構造、話題、感情強度など抽象的特徴だけです。
生成文は、利用者が入力した実体験と意見を中心にしてください。
個人、勤務先、患者、顧客を特定できる内容を生成しないでください。
誹謗中傷、差別、属性攻撃を避けてください。
医療、法律、投資に関する断定的助言を避けてください。
JSON以外を返さないでください。`;

  function normalizePostText(text) {
    return String(text || "")
      .normalize("NFKC")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/^\s*RT\s+/i, "")
      .replace(/@\w+/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function parseCsv(text) {
    const rows = String(text || "").split(/\r?\n/).filter(Boolean);
    if (!rows.length) return [];
    const headers = rows.shift().split(",").map((h) => h.trim());
    const textIndex = headers.indexOf("text");
    if (textIndex < 0) throw new Error("CSVには text 列が必要です");
    return rows.map((row) => {
      const cols = row.match(/("([^"]|"")*"|[^,]+)/g) || [];
      const value = (cols[textIndex] || "").replace(/^"|"$/g, "").replace(/""/g, '"');
      const item = { text: value };
      ["likes", "reposts", "replies", "views"].forEach((key) => {
        const idx = headers.indexOf(key);
        if (idx >= 0) item[key] = Number(cols[idx] || 0);
      });
      return item;
    });
  }

  function prepareReferencePosts(rawItems) {
    const seen = new Set();
    const posts = [];
    rawItems.forEach((item) => {
      const text = normalizePostText(typeof item === "string" ? item : item.text);
      if (!text || seen.has(text)) return;
      seen.add(text);
      const metrics = typeof item === "string" ? {} : item;
      const weighted_engagement = Number(metrics.likes || 0) + Number(metrics.reposts || 0) * 2 + Number(metrics.replies || 0) * 1.5;
      const engagement_rate = metrics.views ? weighted_engagement / Math.max(Number(metrics.views), 1) : null;
      posts.push({ text, weighted_engagement, engagement_rate });
    });
    const totalChars = posts.reduce((sum, post) => sum + post.text.length, 0);
    if (posts.length < 5) throw new Error("参考投稿は最低5件必要です");
    if (posts.length > 100) throw new Error("参考投稿は100件以内にしてください");
    if (totalChars > 20000) throw new Error("参考投稿の合計は20,000文字以内にしてください");
    return posts;
  }

  function median(values) {
    const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
    if (!sorted.length) return 0;
    return sorted[Math.floor(sorted.length / 2)];
  }

  function localProfile(profileName, posts) {
    const lengths = posts.map((p) => [...p.text].length);
    const medianLength = median(lengths);
    const engagementMedian = median(posts.map((p) => p.weighted_engagement));
    const topPosts = posts.filter((p) => p.weighted_engagement >= engagementMedian).slice(0, 5);
    return {
      profile_name: profileName,
      summary: "短い本音と具体的な場面で共感を作る投稿型",
      audience: ["会社員", "ゲーム好き", "競馬好き", "日常の本音に反応する人"],
      core_topics: ["仕事", "APEX", "競馬", "日常の小さな本音"],
      hook_patterns: [{ name: "本音の先出し", description: "最初の一文で言いにくい感情を短く出す" }],
      tone: { empathy: 75, assertiveness: 65, humor: 45, anger: 20, casualness: 85 },
      length: { median: medianLength, recommended_min: Math.max(40, medianLength - 30), recommended_max: Math.min(180, medianLength + 50) },
      format_rules: ["一投稿一主張", "具体的な場面を一つ入れる", "説明しすぎない", "返信の余地を残す"],
      conversation_triggers: ["読者が自分の職場や趣味の体験を書ける余白", "賛否より共感を誘う短い問い"],
      avoid: ["参考投稿の言い換え", "個人攻撃", "属性への決めつけ", "秘密情報"],
      top_posts: topPosts
    };
  }

  async function analyzeWithAi(profileName, posts) {
    const compact = posts.map((p, i) => `${i + 1}. ${p.text} / weighted:${p.weighted_engagement}${p.engagement_rate == null ? "" : ` / rate:${p.engagement_rate.toFixed(4)}`}`).join("\n");
    const prompt = `${REQUIRED_SYSTEM}

以下の参考投稿を、本人になりきらず抽象的に分析してください。
プロフィール名: ${profileName}
参考投稿:
${compact}

指定JSON形式だけで返してください。`;
    const { text } = await root.NetPostApi.callClaude({ prompt, max_tokens: 1600, task: "analysis" });
    return root.NetPostSecurity.parseJsonLoose(text);
  }

  const api = { REQUIRED_SYSTEM, normalizePostText, parseCsv, prepareReferencePosts, localProfile, analyzeWithAi };
  root.NetPostAnalyzer = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
