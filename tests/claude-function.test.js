const test = require("node:test");
const assert = require("node:assert/strict");
const { handler } = require("../netlify/functions/claude.js");

test("POST以外は405", async () => {
  const res = await handler({ httpMethod: "GET", headers: {}, body: "" });
  assert.equal(res.statusCode, 405);
});

test("JSONパースエラーは400", async () => {
  process.env.ANTHROPIC_API_KEY = "test";
  const res = await handler({ httpMethod: "POST", headers: { "content-type": "application/json" }, body: "{" });
  assert.equal(res.statusCode, 400);
});

test("Anthropic API失敗時に適切なステータスを返す", async () => {
  process.env.ANTHROPIC_API_KEY = "test";
  const originalFetch = global.fetch;
  global.fetch = async () => ({ ok: false, status: 529, json: async () => ({ error: { message: "overloaded" } }) });
  const res = await handler({
    httpMethod: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: "hi" }] })
  });
  global.fetch = originalFetch;
  assert.equal(res.statusCode, 529);
});
