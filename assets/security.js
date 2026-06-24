(function (root) {
  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function stripCodeFence(value) {
    return String(value || "")
      .replace(/^\s*```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
  }

  function parseJsonLoose(value) {
    const raw = stripCodeFence(value);
    try { return JSON.parse(raw); } catch {}
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first >= 0 && last > first) return JSON.parse(raw.slice(first, last + 1));
    throw new Error("JSONの解析に失敗しました");
  }

  function detectPersonalInfo(text) {
    const s = String(text || "");
    const warnings = [];
    if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(s)) warnings.push("メールアドレスらしい文字列");
    if (/\b0\d{1,4}-?\d{1,4}-?\d{3,4}\b/.test(s)) warnings.push("電話番号らしい文字列");
    if (/患者|顧客|取引先|勤務先|会社名|実名/.test(s)) warnings.push("個人や組織を特定し得る語");
    return warnings;
  }

  const api = { escapeHtml, stripCodeFence, parseJsonLoose, detectPersonalInfo };
  root.NetPostSecurity = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
