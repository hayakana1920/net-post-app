(function (root) {
  const RUN_KEY = "netPostApp.netaRunCount.v1";
  const MAX_USED_POSTS = 200;

  const GENRE_HINTS = {
    "ビジネス・副業": {
      axis: "仕事",
      scenes: ["朝イチの連絡", "会議前の空気", "部署間の板挟み", "急な方針変更", "評価面談", "退勤直前の依頼"],
      angles: ["きれいごとでは済まない本音", "現場でしかわからない違和感", "小さな諦めと回復", "大人の我慢を少し笑う"]
    },
    "自己啓発": {
      axis: "仕事",
      scenes: ["続かなかった習慣", "朝の準備", "帰宅後の反省", "休日のやり直し", "メモを見返した瞬間", "小さな先延ばし"],
      angles: ["立派なことより続くこと", "自分を責めすぎない工夫", "意識高く見せない改善", "昨日より少しマシで十分"]
    },
    "お金・投資": {
      axis: "仕事",
      scenes: ["株価を見た昼休み", "ニュースを見た朝", "家計簿を開いた夜", "買うか迷った銘柄", "含み損を見た瞬間", "決算発表のあと"],
      angles: ["数字よりメンタルが揺れる話", "焦って動く怖さ", "生活防衛の現実", "欲と不安のちょうど真ん中"]
    },
    "健康・ダイエット": {
      axis: "仕事",
      scenes: ["階段で息が切れた朝", "夜食を我慢した瞬間", "健康診断の結果", "寝る前のスマホ", "昼食を選ぶとき", "久しぶりの散歩"],
      angles: ["正論より現実のゆるさ", "続ける難しさを笑う", "体力の残高を感じる", "無理しない改善"]
    },
    "日常・暮らし": {
      axis: "仕事",
      scenes: ["洗濯物をたたむ夜", "コンビニの会計", "朝のゴミ出し", "帰宅して靴を脱いだ瞬間", "冷蔵庫を開けたとき", "天気予報を見た朝"],
      angles: ["生活の小さな違和感", "地味だけど救われたこと", "大人になるほど刺さる話", "何でもない日の本音"]
    },
    "子育て・家族": {
      axis: "仕事",
      scenes: ["家族に言われた一言", "夕飯の会話", "朝の準備", "休日の買い物", "家の中の小さな事件", "何気ないLINE"],
      angles: ["正論より一言の破壊力", "家族だからこその照れ", "大人が教えられる瞬間", "小さく笑える反省"]
    },
    "人間関係": {
      axis: "仕事",
      scenes: ["返信に迷うLINE", "職場の雑談", "距離感を測る場面", "言い方ひとつの差", "黙って飲み込んだ瞬間", "久々の連絡"],
      angles: ["優しさと我慢の境目", "正しさより伝え方", "大人の距離感", "気づかい疲れ"]
    },
    "食べ物・料理": {
      axis: "仕事",
      scenes: ["夜のカップ麺", "久しぶりの自炊", "スーパーの惣菜", "弁当を開けた昼", "冷蔵庫の残り物", "外食を迷った瞬間"],
      angles: ["料理の理想と現実", "疲れた日のうまさ", "節約と満足の折り合い", "食べ物で機嫌を戻す"]
    },
    "趣味・旅行": {
      axis: "仕事",
      scenes: ["予定を立てる夜", "駅で迷った瞬間", "写真を見返したとき", "近場に出かけた日", "荷物を減らした旅行", "帰り道"],
      angles: ["遠出より気分転換", "予定通りにいかない面白さ", "大人の休日の短さ", "また行きたくなる余韻"]
    },
    "テクノロジー": {
      axis: "仕事",
      scenes: ["AIを試した夜", "アップデート後の画面", "パスワード入力", "スマホ通知", "新サービスの記事", "仕事の自動化"],
      angles: ["便利さと置いていかれる不安", "結局人間が迷う話", "小さな効率化のありがたさ", "使いこなせない本音"]
    },
    "競馬": {
      axis: "競馬",
      scenes: ["パドックを見た瞬間", "本命を決める直前", "オッズが動いた昼", "直線で叫んだ瞬間", "外れ馬券を見たあと", "レース後の反省"],
      angles: ["当たらないのに楽しい理由", "予想と願望の混同", "財布への謝罪", "最後の直線だけ人格が変わる"]
    },
    "ゲーム全般": {
      axis: "APEX",
      scenes: ["久しぶりに起動した夜", "チュートリアルを忘れた瞬間", "協力プレイ", "負けたあとの一戦", "操作ミス", "勝てそうで勝てない試合"],
      angles: ["下手でも続ける理由", "昔との反射神経の差", "負け方に人柄が出る", "大人のゲーム時間の短さ"]
    },
    "Apex Legends": {
      axis: "APEX",
      scenes: ["ジャンプマスターになった瞬間", "初動ファイト", "ピンを刺し忘れた場面", "味方に蘇生されたあと", "安置移動", "ランクで溶けた夜"],
      angles: ["味方に謝るリアル", "エイムより判断が足りない話", "勝ちたいのに焦る話", "一瞬の判断ミス"]
    },
    "パワプロ": {
      axis: "APEX",
      scenes: ["サクセスで事故った育成", "栄冠ナインの采配", "9回裏のピンチ", "ドラフト前の能力確認", "練習指示を迷った場面", "転生選手を引いた日"],
      angles: ["采配ミスを監督のせいにできない", "数字より情が入る", "育成が思い通りにいかない面白さ", "ゲームなのに胃が痛い"]
    },
    "ポケポケ": {
      axis: "APEX",
      scenes: ["パックを開ける瞬間", "デッキを組み直した夜", "あと1枚が来ない試合", "相手の初手を見た瞬間", "レア演出", "連敗後の一戦"],
      angles: ["運のせいにしたい本音", "デッキ構築の沼", "引きが弱い日の笑い", "勝ち筋を見落とす話"]
    }
  };

  const FALLBACK_BY_AXIS = {
    "仕事": [
      ["朝イチのメールを見た瞬間、今日のHPが少し減りました。大企業の板挟みって、始業前から静かに始まるんですよね。"],
      ["会議でみんな正しいことを言っているのに、なぜか現場だけ苦しくなる日があります。正論にも座る場所がある気がします。"],
      ["退勤直前の『ちょっとだけ』ほど、ちょっとで終わらないものはないですね。今日も大人の顔で受け取りました。"],
      ["仕事って、能力よりも一度飲み込む力を試される日があります。飲み込みすぎると胃が先に退職しそうです。"],
      ["上と下の意見をつなぐ仕事、橋というより平均台ですね。落ちないだけで拍手してほしい日があります。"]
    ],
    "APEX": [
      ["APEXでジャンプマスターになると、急に会社の朝礼より緊張します。降りる場所ひとつで謝罪の準備が始まります。"],
      ["味方が強いと、自分のミスだけがやけに明るく見えますね。勝ったのに小声で謝っている夜があります。"],
      ["初動で武器を拾えない時の焦り、仕事で資料が開かない時と同じ汗が出ます。冷静さってどこで拾えますか。"],
      ["ランクで溶けたあと、もう一戦だけと言いながら反省より先に準備完了を押してしまいます。成長より習慣が速いです。"],
      ["ピンを刺したつもりで刺せてない時、味方への申し訳なさが一気に来ます。エイムより報連相から鍛えたいです。"]
    ],
    "競馬": [
      ["パドックを見て本命を変えた瞬間、だいたい財布が不安そうな顔をします。直感と願望は本当に似ていますね。"],
      ["オッズが下がると安心するのに、下がりすぎると急に疑い始めます。競馬、感情のジェットコースターが細かいです。"],
      ["最後の直線だけ、自分の声量が少し別人になります。届かない差し馬に、週末の希望を全部乗せがちです。"],
      ["外れたあとに『買い方は悪くなかった』と言い聞かせる時間があります。財布はたぶん納得していません。"],
      ["本命を決めたはずなのに、締切前に穴馬が急に魅力的に見えます。競馬場には理性を揺らす風が吹いてますね。"]
    ]
  };

  function safeStorageGet(key, fallback) {
    try {
      if (!root.localStorage) return fallback;
      const value = root.localStorage.getItem(key);
      return value == null ? fallback : value;
    } catch (e) {
      return fallback;
    }
  }

  function safeStorageSet(key, value) {
    try {
      if (root.localStorage) root.localStorage.setItem(key, value);
    } catch (e) {}
  }

  function nextRunNumber() {
    const current = Number(safeStorageGet(RUN_KEY, "0")) || 0;
    const next = current + 1;
    safeStorageSet(RUN_KEY, String(next));
    return next;
  }

  function normalizeGenre(genre) {
    return genre === "ポケポケ" ? "ポケモンカードゲームポケット（ポケポケ）" : genre;
  }

  function pickItems(items, runNo, count) {
    if (!items.length) return [];
    const out = [];
    for (let i = 0; i < count; i += 1) out.push(items[(runNo + i) % items.length]);
    return out;
  }

  function selectedHints(selectedGenres = [], mood = "", runNo = 1) {
    const genres = selectedGenres.length ? selectedGenres : ["ビジネス・副業", "Apex Legends", "競馬"];
    const hints = genres.map((genre) => GENRE_HINTS[genre]).filter(Boolean);
    const fallback = GENRE_HINTS["日常・暮らし"];
    const chosen = hints.length ? hints : [fallback];
    const primary = chosen[runNo % chosen.length];
    const allScenes = chosen.flatMap((hint) => hint.scenes);
    const allAngles = chosen.flatMap((hint) => hint.angles);
    const axes = [...new Set(chosen.map((hint) => hint.axis))];
    const axis = axes[runNo % axes.length] || primary.axis;
    return {
      axis,
      scenes: pickItems(allScenes, runNo, 5),
      angles: pickItems(allAngles, runNo * 2, 5),
      genreLabel: selectedGenres.length ? selectedGenres.map(normalizeGenre).join("・") : "仕事・APEX・競馬から1つを選ぶ日常ネタ",
      mood: mood || ""
    };
  }

  function firstToken(text) {
    return String(text || "").trim().replace(/\s+/g, "").slice(0, 12);
  }

  function compactUsedPosts(posts = []) {
    return posts.filter(Boolean).slice(-MAX_USED_POSTS);
  }

  function buildUsedList(posts = [], limit = 30) {
    const recent = compactUsedPosts(posts).slice(-limit);
    if (!recent.length) return "";
    const items = recent.map((p, i) => `  ${i + 1}. ${p}`).join("\n");
    const openings = [...new Set(recent.map(firstToken).filter(Boolean))].slice(-12).join(" / ");
    return `\n- 直近で使ったネタなので、同じ話題・同じ書き出し・同じオチは避ける:\n${items}\n- 今回避ける書き出し: ${openings}`;
  }

  function buildNetaVarietyContext(runNo, selectedGenres = [], mood = "", usedPosts = []) {
    const hint = selectedHints(selectedGenres, mood, runNo);
    const formats = [
      "小さな失敗談",
      "あるあるの一言",
      "少し鋭い本音",
      "自分へのツッコミ",
      "短い気づき",
      "軽い反省",
      "読者に刺さる問いかけ"
    ];
    const openings = [
      "今日ふと思ったんですが",
      "こういう時だけ",
      "正直なところ",
      "地味にきついのが",
      "大人になると",
      "わりと本気で",
      "これ毎回思うんですが",
      "昔より感じるのは"
    ];
    return {
      axis: hint.axis,
      genreLabel: hint.genreLabel,
      scenes: hint.scenes,
      angles: hint.angles,
      formats: pickItems(formats, runNo, 5),
      openings: pickItems(openings, runNo * 3, 6),
      seed: `${new Date().toISOString().slice(0, 10)}-${runNo}`,
      usedList: buildUsedList(usedPosts)
    };
  }

  function fallbackNetaCandidates(selectedGenres = [], mood = "", runNo = 1, count = 10) {
    const hint = selectedHints(selectedGenres, mood, runNo);
    const pool = FALLBACK_BY_AXIS[hint.axis] || FALLBACK_BY_AXIS["仕事"];
    const out = [];
    for (let i = 0; i < count; i += 1) {
      const base = pool[(runNo + i) % pool.length][0];
      const scene = hint.scenes[i % hint.scenes.length];
      const angle = hint.angles[i % hint.angles.length];
      if (i < pool.length) {
        out.push(base);
      } else {
        out.push(`${scene}の話です。${angle}って、言葉にすると大げさですが、実際は毎日の中でじわっと効いてきますね。`);
      }
    }
    return out;
  }

  function filterFreshNetas(candidates = [], usedPosts = [], options = {}) {
    const similarity = options.similarity || root.NetPostSimilarity;
    const minCount = options.minCount || 10;
    const seen = new Set();
    const fresh = [];
    candidates.filter(Boolean).forEach((text) => {
      const normalized = similarity && similarity.normalizeText ? similarity.normalizeText(text) : String(text).replace(/\s+/g, "");
      const opening = firstToken(text);
      if (!normalized || seen.has(normalized) || seen.has(opening)) return;
      const result = similarity && similarity.maxSimilarity ? similarity.maxSimilarity(text, usedPosts) : { regenerate: false };
      if (result.regenerate) return;
      seen.add(normalized);
      seen.add(opening);
      fresh.push(String(text).trim());
    });
    return fresh.slice(0, minCount);
  }

  const api = {
    RUN_KEY,
    MAX_USED_POSTS,
    nextRunNumber,
    buildNetaVarietyContext,
    compactUsedPosts,
    filterFreshNetas,
    fallbackNetaCandidates
  };

  root.NetPostNetaVariety = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
