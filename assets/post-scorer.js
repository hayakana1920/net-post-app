(function (root) {
  function riskScore(text) {
    const s = String(text || "");
    let score = 0;
    const notes = [];
    const add = (points, note) => { score += points; notes.push(note); };
    if (/死ね|消えろ|クズ|バカ|無能/.test(s)) add(35, "罵倒表現");
    if (/全員|みんな|絶対|例外なく/.test(s) && /女|男|老人|若者|外国人|会社員|看護師/.test(s)) add(30, "属性への一括攻撃の可能性");
    if (/診断|治る|必ず儲かる|買うべき|売るべき|違法|合法/.test(s)) add(25, "専門助言の断定");
    if (/患者|顧客|取引先|実名|勤務先/.test(s)) add(20, "秘密情報の可能性");
    if (/炎上|晒す|叩け/.test(s)) add(15, "煽り表現");
    return { score: Math.min(100, score), notes };
  }

  function scorePost(text) {
    const s = String(text || "").trim();
    const len = [...s].length;
    const first = s.split(/\n|。/).find(Boolean) || s;
    let hook = 8;
    if (first.length <= 35) hook += 9;
    if (/結局|正直|これ|職場で|APEX|競馬|馬券|味方/.test(first)) hook += 5;
    if (/やばい|必見|知らないと損/.test(first)) hook -= 5;

    let relatability = 8;
    if (/職場|上司|味方|馬券|財布|会社|家|朝|夜|週末/.test(s)) relatability += 9;
    if (/正直|地味に|しんどい|謝る|迷う|疲れる/.test(s)) relatability += 6;

    let clarity = 8;
    if (len <= 280) clarity += 5;
    if (!/[^\n。]{80,}/.test(s)) clarity += 4;
    if (/こと|もの|感じ/.test(s) && !/職場|APEX|競馬|財布|味方|会議|馬券/.test(s)) clarity -= 4;
    if (/。|\n/.test(s)) clarity += 3;

    let commentability = 5;
    if (/？|\?/.test(s)) commentability += 6;
    if (/自分|うち|私|俺|みんな|あなた/.test(s)) commentability += 4;
    if (/あなたはどうですか/.test(s)) commentability -= 3;

    let originality = 6;
    if (/板挟み|味方に謝|財布に謝|馬息子|レシート|パドック|ジャンプマスター/.test(s)) originality += 8;
    if (/大事|向き合う|自分らしく|心に余白/.test(s)) originality -= 4;

    const risk = riskScore(s);
    const scores = {
      hook: Math.max(0, Math.min(25, hook)),
      relatability: Math.max(0, Math.min(25, relatability)),
      clarity: Math.max(0, Math.min(20, clarity)),
      commentability: Math.max(0, Math.min(15, commentability)),
      originality: Math.max(0, Math.min(15, originality))
    };
    scores.total = scores.hook + scores.relatability + scores.clarity + scores.commentability + scores.originality;
    scores.risk = risk.score;
    return { scores, risk_notes: risk.notes, reason: "冒頭の明快さ、具体的な場面、返信しやすさを決定論的に評価しました。" };
  }

  const api = { scorePost, riskScore };
  root.NetPostScorer = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
