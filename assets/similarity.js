(function (root) {
  function normalizeText(value) {
    return String(value || "")
      .normalize("NFKC")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/(?:^|\s)RT\s+/gi, " ")
      .replace(/@\w+/g, "")
      .replace(/[、。,.!?！？「」『』"'\[\]（）()【】]/g, "")
      .replace(/\s+/g, "")
      .trim();
  }

  function ngrams(value, n = 3) {
    const text = normalizeText(value);
    if (text.length < n) return text ? [text] : [];
    const out = [];
    for (let i = 0; i <= text.length - n; i += 1) out.push(text.slice(i, i + n));
    return out;
  }

  function jaccard(a, b) {
    const left = new Set(ngrams(a));
    const right = new Set(ngrams(b));
    if (!left.size && !right.size) return 1;
    let intersection = 0;
    left.forEach((item) => { if (right.has(item)) intersection += 1; });
    return intersection / (left.size + right.size - intersection || 1);
  }

  function longestCommonSubstringLength(a, b) {
    const s1 = normalizeText(a);
    const s2 = normalizeText(b);
    const dp = Array(s2.length + 1).fill(0);
    let best = 0;
    for (let i = 1; i <= s1.length; i += 1) {
      for (let j = s2.length; j >= 1; j -= 1) {
        dp[j] = s1[i - 1] === s2[j - 1] ? dp[j - 1] + 1 : 0;
        if (dp[j] > best) best = dp[j];
      }
    }
    return best;
  }

  function maxSimilarity(text, references = []) {
    let max = 0;
    let longest = 0;
    let sameOpening = false;
    references.forEach((ref) => {
      const source = typeof ref === "string" ? ref : ref.text;
      max = Math.max(max, jaccard(text, source));
      longest = Math.max(longest, longestCommonSubstringLength(text, source));
      const a = normalizeText(text).slice(0, 12);
      const b = normalizeText(source).slice(0, 12);
      if (a && a === b) sameOpening = true;
    });
    return { max, longest, sameOpening, regenerate: max >= 0.6 || longest >= 15 || sameOpening, warn: max >= 0.45 };
  }

  const api = { normalizeText, ngrams, jaccard, longestCommonSubstringLength, maxSimilarity };
  root.NetPostSimilarity = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
