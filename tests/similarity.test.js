const test = require("node:test");
const assert = require("node:assert/strict");
const sim = require("../assets/similarity.js");

test("同一文章の類似度が1.0", () => {
  assert.equal(sim.jaccard("今日は会議で板挟みでした", "今日は会議で板挟みでした"), 1);
});

test("無関係な文章の類似度が低い", () => {
  assert.ok(sim.jaccard("APEXで味方に謝りました", "週末の競馬で財布に謝りました") < 0.4);
});

test("連続15文字一致を検出", () => {
  const result = sim.maxSimilarity("これは連続して同じ文章が十五文字以上あります", ["連続して同じ文章が十五文字以上ありますね"]);
  assert.ok(result.longest >= 15);
  assert.equal(result.regenerate, true);
});

test("URL・メンション・RTを除去", () => {
  assert.equal(sim.normalizeText("RT @user https://example.com こんにちは。"), "こんにちは");
});
