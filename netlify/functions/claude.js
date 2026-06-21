const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

const ALLOWED_MODELS = new Set(["claude-sonnet-4-5"]);
const DEFAULT_MODEL = "claude-sonnet-4-5";
const MAX_BODY_BYTES = 120_000;
const MAX_TOKENS_LIMIT = 2500;

function json(statusCode, body) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return json(405, { error: "POST only" });
  }
  if (!/^application\/json\b/i.test(event.headers["content-type"] || event.headers["Content-Type"] || "")) {
    return json(415, { error: "Content-Type must be application/json" });
  }
  if (Buffer.byteLength(event.body || "", "utf8") > MAX_BODY_BYTES) {
    return json(413, { error: "Request body is too large" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return json(500, { error: "ANTHROPIC_API_KEY is not configured" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  if (!messages.length || messages.some((m) => !["user", "assistant"].includes(m.role) || typeof m.content !== "string")) {
    return json(400, { error: "messages must be an array of role/content objects" });
  }

  const model = ALLOWED_MODELS.has(payload.model) ? payload.model : DEFAULT_MODEL;
  const max_tokens = Math.max(1, Math.min(Number(payload.max_tokens || 1000), MAX_TOKENS_LIMIT));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({ model, max_tokens, messages })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return json(res.status, { error: data.error?.message || "Anthropic API error" });
    }
    return json(200, data);
  } catch (error) {
    return json(error.name === "AbortError" ? 504 : 502, { error: error.name === "AbortError" ? "Anthropic API timeout" : "Anthropic API request failed" });
  } finally {
    clearTimeout(timeout);
  }
};
