const test = require("node:test");
const assert = require("node:assert/strict");

global.localStorage = {
  store: new Map(),
  getItem(key) { return this.store.has(key) ? this.store.get(key) : null; },
  setItem(key, value) { this.store.set(key, String(value)); }
};

const sim = require("../assets/similarity.js");
const variety = require("../assets/neta-variety.js");

test("ネタ生成の回数が保存されて毎回進む", () => {
  global.localStorage.store.clear();
  assert.equal(variety.nextRunNumber(), 1);
  assert.equal(variety.nextRunNumber(), 2);
});

test("APEXではAPEXらしい場面候補を出す", () => {
  const context = variety.buildNetaVarietyContext(3, ["Apex Legends"], "", []);
  assert.equal(context.axis, "APEX");
  assert.ok(context.scenes.some((scene) => /ジャンプ|初動|ピン|安置|ランク/.test(scene)));
});

test("競馬では競馬らしい場面候補を出す", () => {
  const context = variety.buildNetaVarietyContext(4, ["競馬"], "", []);
  assert.equal(context.axis, "競馬");
  assert.ok(context.scenes.some((scene) => /パドック|本命|オッズ|直線|馬券/.test(scene)));
});

test("過去ネタと似ている候補は弾く", () => {
  const used = ["APEXでジャンプマスターになると、急に会社の朝礼より緊張します。"];
  const candidates = [
    "APEXでジャンプマスターになると、急に会社の朝礼より緊張します。",
    "初動で武器を拾えない時の焦り、仕事で資料が開かない時と同じ汗が出ます。"
  ];
  const fresh = variety.filterFreshNetas(candidates, used, { similarity: sim, minCount: 10 });
  assert.deepEqual(fresh, ["初動で武器を拾えない時の焦り、仕事で資料が開かない時と同じ汗が出ます。"]);
});

test("フォールバック候補もジャンルに合わせて変わる", () => {
  const horse = variety.fallbackNetaCandidates(["競馬"], "", 1, 3).join("\n");
  const work = variety.fallbackNetaCandidates(["ビジネス・副業"], "", 1, 3).join("\n");
  assert.match(horse, /オッズ|直線|馬券|パドック|財布/);
  assert.match(work, /会議|仕事|メール|大企業|退勤/);
  assert.notEqual(horse, work);
});

test("追加ジャンルにも具体的な場面候補がある", () => {
  const cases = [
    [["AI"], /AI|プロンプト|要約|導入/],
    [["プロ野球"], /9回|投手|守備|順位|インタビュー/],
    [["政治"], /国会|物価|選挙|政策|税金/],
    [["経済"], /為替|株価|物価|賃上げ|金利/],
    [["会社生活"], /出社|上司|会議|通知|退勤/]
  ];

  cases.forEach(([genres, pattern], index) => {
    const context = variety.buildNetaVarietyContext(index + 1, genres, "", []);
    assert.equal(context.axis, "仕事");
    assert.match(context.scenes.join(" "), pattern);
  });
});
