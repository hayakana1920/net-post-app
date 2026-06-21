(function (root) {
  async function callClaude({ prompt, max_tokens = 1000, task = "generic" }) {
    const response = await fetch("/.netlify/functions/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, max_tokens, messages: [{ role: "user", content: prompt }] })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "AI呼び出しに失敗しました");
    const text = (data.content || []).filter((b) => b && b.type === "text").map((b) => b.text).join("\n");
    return { data, text };
  }

  const api = { callClaude };
  root.NetPostApi = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
