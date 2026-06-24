const test = require("node:test");
const assert = require("node:assert/strict");
const scorer = require("../assets/post-scorer.js");

test("高リスク文を検出", () => {
  const result = scorer.riskScore("老人は全員無能です");
  assert.ok(result.score >= 60);
});

test("通常投稿をスコアリングできる", () => {
  const result = scorer.scorePost("正直、職場で板挟みになる日が一番疲れます。\n会議より帰り道のため息が本番です。");
  assert.ok(result.scores.total > 0);
  assert.ok(result.scores.risk < 80);
});
