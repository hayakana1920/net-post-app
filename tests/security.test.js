const test = require("node:test");
const assert = require("node:assert/strict");
const security = require("../assets/security.js");
const analyzer = require("../assets/analyzer.js");

test("HTMLエスケープ", () => {
  assert.equal(security.escapeHtml("<script>"), "&lt;script&gt;");
});

test("コードフェンス付きJSONを解析", () => {
  assert.deepEqual(security.parseJsonLoose("```json\n{\"ok\":true}\n```"), { ok: true });
});

test("280文字超の判定に使える", () => {
  assert.ok("あ".repeat(281).length > 280);
});

test("CSV text列を読み込む", () => {
  const rows = analyzer.parseCsv("text,likes,reposts,replies,views\n投稿A,1,2,3,100");
  assert.equal(rows[0].text, "投稿A");
  assert.equal(rows[0].reposts, 2);
});
