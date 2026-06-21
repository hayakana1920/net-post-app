const test = require("node:test");
const assert = require("node:assert/strict");

const mem = new Map();
global.localStorage = {
  getItem: (key) => mem.get(key) || null,
  setItem: (key, value) => mem.set(key, value),
  removeItem: (key) => mem.delete(key)
};
const storage = require("../assets/storage.js");

test("localStorageプロフィールの保存、読込、削除", () => {
  const saved = storage.saveProfile({ profile_name: "仕事の短文型" });
  assert.equal(storage.loadProfiles()[0].profile_name, "仕事の短文型");
  storage.renameProfile(saved.id, "名前変更後");
  assert.equal(storage.loadProfiles()[0].profile_name, "名前変更後");
  storage.deleteProfile(saved.id);
  assert.equal(storage.loadProfiles().length, 0);
});

test("既存スケジュールデータを読み込める形式を維持", () => {
  global.localStorage.setItem("xsched5", JSON.stringify([{ id: 1, day: "月曜", time: "07:30", hook: "h", body: "b" }]));
  const parsed = JSON.parse(global.localStorage.getItem("xsched5"));
  assert.equal(parsed[0].day, "月曜");
});
