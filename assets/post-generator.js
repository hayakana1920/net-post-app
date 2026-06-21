(function (root) {
  function fallbackPosts(input, profile, references = []) {
    const base = input.opinion || input.event || "今日の出来事";
    const patterns = ["共感", "断定", "問いかけ", "対比", "失敗談", "共感", "断定", "問いかけ", "対比", "失敗談"];
    return patterns.map((pattern, index) => {
      const text = `${base}\n\n${input.scene ? `${input.scene}で、` : ""}正直これ、同じ立場の人なら一度は引っかかる話だと思います。`;
      const local = root.NetPostScorer.scorePost(text);
      const sim = root.NetPostSimilarity.maxSimilarity(text, references);
      return { text, pattern, scores: local.scores, reason: local.reason, risk_notes: local.risk_notes, similarity: sim.max };
    }).slice(0, 10);
  }

  function buildGenerationPrompt(input, profile) {
    return `${root.NetPostAnalyzer.REQUIRED_SYSTEM}

利用者プロフィール:
平日は大手企業で板挟み。
夜はAPEXで味方に謝り、
週末は競馬で財布に謝る馬息子。
会社員の本音とゲームと競馬をつぶやきます。

重要:
- 投稿テーマに応じて「仕事」「APEX」「競馬」のいずれか一つを選ぶ
- 毎回すべての要素を文章へ入れない
- 参考プロフィールは抽象特徴だけ使う

分析プロフィール:
${JSON.stringify(profile || {}, null, 2)}

入力:
今日あった出来事: ${input.event}
本当に言いたいこと: ${input.opinion}
対象読者: ${input.audience}
テーマ: ${input.theme}
含めたい具体的な場面: ${input.scene}
含めたくないこと: ${input.avoid}
文の強さ: ${input.strength}
投稿型: ${input.pattern}
文字数: ${input.length}

10案を生成し、指定JSONだけで返してください。
{"posts":[{"text":"投稿本文","pattern":"共感","scores":{"hook":0,"relatability":0,"clarity":0,"commentability":0,"originality":0,"total":0,"risk":0},"reason":"理由","risk_notes":[],"similarity":0}]}`;
  }

  async function generatePosts(input, profile, references = []) {
    const prompt = buildGenerationPrompt(input, profile);
    let posts = [];
    try {
      const { text } = await root.NetPostApi.callClaude({ prompt, max_tokens: 2200, task: "generate_posts" });
      posts = (root.NetPostSecurity.parseJsonLoose(text).posts || []);
    } catch {
      posts = fallbackPosts(input, profile, references);
    }

    return posts.map((post) => {
      const local = root.NetPostScorer.scorePost(post.text);
      const sim = root.NetPostSimilarity.maxSimilarity(post.text, references);
      return {
        ...post,
        scores: { ...local.scores, risk: local.scores.risk },
        reason: post.reason || local.reason,
        risk_notes: [...(post.risk_notes || []), ...local.risk_notes],
        similarity: sim.max,
        similarity_detail: sim
      };
    }).filter((post) => post.text.length <= 280 && post.scores.risk < 80 && !post.similarity_detail.regenerate).slice(0, 10);
  }

  const api = { buildGenerationPrompt, generatePosts, fallbackPosts };
  root.NetPostGenerator = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
