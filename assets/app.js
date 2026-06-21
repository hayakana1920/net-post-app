const GENRES = ["ビジネス・副業","自己啓発","お金・投資","健康・ダイエット","日常・暮らし","子育て・家族","人間関係","食べ物・料理","趣味・旅行","テクノロジー","AI","プロ野球","政治","経済","会社生活","競馬","ゲーム全般","Apex Legends","パワプロ","ポケポケ"];
const DAYS = ["月曜","火曜","水曜","木曜","金曜","土曜","日曜"];
const BEST_TIMES = ["07:30","12:00","20:00","07:30","12:00","20:00","09:00"];
const APP_PROFILE = `平日は大手企業で板挟み。
夜はAPEXで味方に謝り、
週末は競馬で財布に謝る馬息子。
会社員の本音とゲームと競馬をつぶやきます。`;

let genres_selected = [];
let netas = [];
let selectedNeta = null;
let currentPost = null;
let schedule = [];
let usedPosts = [];
try { schedule = JSON.parse(localStorage.getItem("xsched5") || "[]"); } catch(e) {}
try { usedPosts = JSON.parse(localStorage.getItem("usedPosts") || "[]"); } catch(e) {}

function pickProfileTheme(selectedGenres = [], seedText = "") {
  const text = `${selectedGenres.join(" ")} ${seedText}`;
  if (/競馬|馬券|本命|対抗|穴馬|オッズ|パドック|単勝|複勝|三連単|騎手|レース/.test(text)) return "競馬";
  if (/Apex|APEX|ゲーム|パワプロ|ポケポケ|ランク|味方|エイム|サクセス|栄冠|パック|デッキ/.test(text)) return "APEX";
  return "仕事";
}

function profilePrompt(selectedGenres = [], seedText = "") {
  const theme = pickProfileTheme(selectedGenres, seedText);
  return `基本人物設定:
${APP_PROFILE}

今回使う人物設定の軸: ${theme}
ルール:
- 投稿テーマに応じて「仕事」「APEX」「競馬」のどれか1つだけを主軸にする
- 毎回プロフィール全文や全要素を入れない
- 仕事軸なら、大手企業で板挟みになる会社員の本音をにじませる
- APEX軸なら、味方に謝りがちなプレイヤーの実感をにじませる
- 競馬軸なら、週末に財布へ謝る馬息子の実感をにじませる
- 会社員・APEX・競馬を無理に全部混ぜない`;
}

function switchTab(tab) {
  ["neta","reply","analysis","creator","schedule"].forEach(t => {
    document.getElementById("pane-"+t).style.display = tab === t ? "" : "none";
    document.getElementById("tab-"+t).classList.toggle("active", tab === t);
  });
  if (tab === "schedule") renderSchedule();
  if (tab === "analysis") renderProfiles();
  if (tab === "creator") renderCreatorProfiles();
}

const REPLY_TYPES = [
  { id:"agree",   label:"共感・同意" },
  { id:"personal",label:"自分の体験を添える" },
  { id:"question",label:"質問・掘り下げ" },
  { id:"english", label:"英語で絡む🇺🇸" },
];
let replyType = REPLY_TYPES[1];

function renderReplyTypes() {
  const el = document.getElementById("replyTypes"); if(!el) return;
  el.innerHTML = "";
  REPLY_TYPES.forEach(x => {
    const b = document.createElement("button");
    b.className = "chip" + (replyType.id===x.id ? " active" : "");
    b.textContent = x.label;
    b.onclick = () => { replyType=x; renderReplyTypes(); };
    el.appendChild(b);
  });
}

async function generateReply() {
  const btn = document.getElementById("replyBtn");
  const err = document.getElementById("replyErrorBox");
  const note = document.getElementById("replyLoadingNote");
  const buzzPost = document.getElementById("buzzPost").value.trim();
  if (!buzzPost) { err.textContent = "バズ投稿の本文を貼り付けてください。"; err.style.display="block"; return; }

  btn.disabled=true; btn.textContent="生成中…";
  note.style.display="block"; err.style.display="none";
  document.getElementById("replyList").innerHTML="";

  const isEnglish = replyType.id === "english";
  const typeDesc = {
    agree: "共感・同意のリプライ。「わかります」だけでなく自分の体験を1行添える",
    personal: "自分の体験談を添えたリプライ。50代らしい実感のある言葉で",
    question: "投稿者に興味を持って質問するリプライ。押しつけがましくない自然な疑問",
    english: "Short English reply from a Japanese person in their 50s. Mention Japan naturally. Keep it friendly and genuine."
  }[replyType.id];

  const prompt = isEnglish
    ? `${profilePrompt([], buzzPost)}

You are the person described above and want to reply to this viral post in English.

Viral post: "${buzzPost}"

Write 3 short English replies (1-2 sentences each). Be genuine and friendly. Reflect only one relevant angle from work, APEX, or horse racing when it naturally fits. No hashtags.

Return JSON only:
{"replies": ["reply1", "reply2", "reply3"]}`
    : `${profilePrompt([], buzzPost)}

あなたは上記プロフィールの人物として、以下のバズ投稿に自然にリプライしてください。

バズ投稿: 「${buzzPost}」

リプライの方向性: ${typeDesc}

条件:
- 2〜4行程度の短いリプライ
- 作り込まず、自然な話し言葉で
- 仕事・APEX・競馬のうち、投稿内容に合う要素だけを薄く入れる。全部は入れない
- 相手を否定しない
- ハッシュタグなし
- 3パターン生成

JSON形式のみで返答:
{"replies": ["リプライ1", "リプライ2", "リプライ3"]}`;

  try {
    const res = await fetch("/.netlify/functions/claude", {
      method:"POST", headers:{"Content-Type":"application/json",},
      body: JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:600, messages:[{role:"user",content:prompt}] })
    });
    const data = await res.json();
    if (!data||!data.content) throw new Error("API error");
    const text = data.content.filter(b=>b&&b.type==="text").map(b=>b.text).join("\n");
    const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
    renderReplies(parsed.replies||[], isEnglish);
  } catch(e) {
    err.textContent = "エラー: "+(e.message||String(e));
    err.style.display="block";
  } finally {
    btn.disabled=false; btn.textContent="リプライ案を生成する";
    note.style.display="none";
  }
}

function renderReplies(replies, isEnglish) {
  const list = document.getElementById("replyList"); list.innerHTML="";
  const langLabel = isEnglish ? "🇺🇸 ENGLISH" : "🇯🇵 日本語";
  replies.forEach((r,i) => {
    const card = document.createElement("div"); card.className="reply-card";
    const head = document.createElement("div"); head.className="reply-head";
    head.innerHTML = '<div class="reply-lang">'+langLabel+' — '+String(i+1).padStart(2,"0")+'</div>';
    const body = document.createElement("div"); body.className="reply-body"; body.textContent=r;
    const actions = document.createElement("div"); actions.className="reply-actions";
    const cpBtn = makeBtn("コピー","",()=>copyText(r,cpBtn,"コピー"));
    const xBtn = makeBtn("Xで返信","open-x",()=>{
      doCopy(r).then(()=>window.open("https://twitter.com/intent/tweet?text="+encodeURIComponent(r),"_blank"));
    });
    actions.appendChild(cpBtn); actions.appendChild(xBtn);
    card.appendChild(head); card.appendChild(body); card.appendChild(actions);
    list.appendChild(card);
  });
  list.scrollIntoView({behavior:"smooth",block:"start"});
}

function renderGenres() {
  const g = document.getElementById("genres"); g.innerHTML = "";
  GENRES.forEach(x => {
    const b = document.createElement("button");
    b.className = "chip" + (genres_selected.includes(x) ? " active" : "");
    b.textContent = x;
    b.onclick = () => {
      if (genres_selected.includes(x)) {
        genres_selected = genres_selected.filter(g => g !== x);
      } else {
        genres_selected.push(x);
      }
      renderGenres();
    };
    g.appendChild(b);
  });
}

function parseJsonResponse(text) {
  const cleaned = String(text || "").replace(/```json|```/g, "").trim();
  try { return JSON.parse(cleaned); } catch(e) {}
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
  throw new Error("AIの返答を読み取れませんでした");
}

function applyNetaCandidates(generated, fallback, varietyApi) {
  const fresh = varietyApi ? varietyApi.filterFreshNetas(generated, usedPosts, { minCount: 10 }) : generated;
  netas = varietyApi ? varietyApi.filterFreshNetas([...fresh, ...fallback], usedPosts, { minCount: 10 }) : fresh;
  if (netas.length === 0) netas = fallback.slice(0, 10);
  usedPosts = varietyApi ? varietyApi.compactUsedPosts([...usedPosts, ...netas]) : [...usedPosts, ...netas].slice(-200);
  try { localStorage.setItem("usedPosts", JSON.stringify(usedPosts)); } catch(e) {}
  renderNetas();
}

function fallbackPostFromNeta(neta) {
  const hook = String(neta || "").split(/[。！？]/)[0].trim() || "正直、こういう日もあります。";
  const body = `${neta}\n\nうまく言えないですが、こういう小さな実感のほうが、あとからじわっと残りますね。`;
  return { hook, body };
}

async function generateNeta() {
  const btn = document.getElementById("netaBtn");
  const err = document.getElementById("errorBox");
  const note = document.getElementById("loadingNote");
  const mood = document.getElementById("mood").value.trim();
  const varietyApi = window.NetPostNetaVariety;
  const runNo = varietyApi ? varietyApi.nextRunNumber() : Date.now();
  const variety = varietyApi ? varietyApi.buildNetaVarietyContext(runNo, genres_selected, mood, usedPosts) : null;
  const fallback = varietyApi ? varietyApi.fallbackNetaCandidates(genres_selected, mood, runNo, 10) : [];

  btn.disabled = true; btn.textContent = "考え中…";
  note.style.display = "block"; err.style.display = "none";
  document.getElementById("netaList").innerHTML = "";
  document.getElementById("postArea").style.display = "none";
  selectedNeta = null; currentPost = null;

  const usedList = variety ? variety.usedList : (usedPosts.length > 0 ? "\n- 以下は過去に出した内容なので絶対に使わない:\n" + usedPosts.slice(-30).map((p,i)=>`  ${i+1}. ${p}`).join("\n") : "");
  const prompt = `${profilePrompt(genres_selected, mood)}

あなたは上記プロフィールの人物として、Xにそのまま投稿できる自然なつぶやきを10本書いてください。

条件:
- 今回の主軸: ${variety ? variety.axis : pickProfileTheme(genres_selected, mood)}
- ジャンル: ${variety ? variety.genreLabel : (genres_selected.length > 0 ? genres_selected.join("・").replace("ポケポケ","ポケモンカードゲームポケット（ポケポケ）") : "日常的な内容")}
${mood ? "- 今日の気分・出来事: " + mood : ""}
- 今回使う具体的な場面候補: ${variety ? variety.scenes.join(" / ") : "日常の一場面"}
- 今回使う切り口候補: ${variety ? variety.angles.join(" / ") : "小さな本音"}
- 文の型候補: ${variety ? variety.formats.join(" / ") : "短い体験談"}
- 書き出し候補: ${variety ? variety.openings.join(" / ") : "自然な話し言葉"}
- 10本すべてで、場面・書き出し・オチを変える
- 仕事・APEX・競馬のうち、今回の主軸だけを使う。全部混ぜない
- 友人にLINEするような気軽なノリで書く。ただし内容には具体的な場面を必ず入れる
- 「今日ふと思った」「最近」「今日は少しだけ余裕」など同じ書き出しを連発しない
- ネタ名だけに逃げず、選んだジャンルの具体的な単語を1つ以上入れる
- 8本目・9本目・10本目は必ず「？」で終わる問いかけ
- 作り込まない。普通の人がそのまま投稿している感じ
- 50〜100字程度。短くていい
- ハッシュタグなし
- 「です・ます」調の丁寧語で統一する${usedList}
- 生成シード: ${variety ? variety.seed : runNo}

10本をJSON形式のみで返答。前置き不要:
{"netas": ["投稿文1", "投稿文2", "投稿文3", "投稿文4", "投稿文5", "投稿文6", "投稿文7", "投稿文8", "投稿文9", "投稿文10"]}`;

  try {
    const res = await fetch("/.netlify/functions/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 800, messages: [{ role: "user", content: prompt }] }),

    });
    const data = await res.json();
    if (!data || !data.content) throw new Error("API error: " + JSON.stringify(data).slice(0,100));
    const text = data.content.filter(b => b && b.type==="text").map(b => b.text).join("\n");
    const parsed = parseJsonResponse(text);
    const generated = parsed.netas || [];
    applyNetaCandidates(generated, fallback, varietyApi);
  } catch(e) {
    if (fallback.length > 0) {
      applyNetaCandidates(fallback, fallback, varietyApi);
      err.style.display = "none";
    } else {
      err.textContent = "エラー: " + (e.message || String(e));
      err.style.display = "block";
    }
  } finally {
    btn.disabled = false; btn.textContent = "ネタ候補を出す";
    note.style.display = "none";
  }
}

function renderNetas() {
  const list = document.getElementById("netaList"); list.innerHTML = "";
  netas.forEach((n, i) => {
    const card = document.createElement("div");
    card.className = "neta-card";
    card.innerHTML = `<div class="neta-head">
      <div class="neta-num">${String(i+1).padStart(2,"0")}</div>
      <div class="neta-text">${esc(n)}</div>
      <div class="neta-arrow">→</div>
    </div>`;
    card.onclick = () => selectNeta(n, card);
    list.appendChild(card);
  });
}

async function selectNeta(neta, card) {
  document.querySelectorAll(".neta-card").forEach(c => c.classList.remove("selected"));
  card.classList.add("selected");
  selectedNeta = neta;
  await generatePost(neta);
}

async function regenPost() {
  if (!selectedNeta) return;
  await generatePost(selectedNeta);
}

async function generatePost(neta) {
  const area = document.getElementById("postArea");
  const box = document.getElementById("postBox");
  const regenBtn = document.getElementById("regenBtn");
  area.style.display = "block";
  box.innerHTML = '<div style="padding:20px;text-align:center;color:#AAA;font-size:13px;">投稿文を生成中<span class="spinner">…</span></div>';
  regenBtn.disabled = true;

  const prompt = `${profilePrompt(genres_selected, neta)}

あなたは上記プロフィールの人物として、Xに自然体でつぶやいています。
以下のネタをもとに、実際にXに投稿できる文章を1本書いてください。

ネタ: ${neta}

条件:
- 作り込んだフックや決まり文句は使わない
- 素直な体験談・気づきとして書く（「〜だったんですよね」「正直〜だった」「気づいたら〜」など自然な言葉で）
- 今回使う人物設定の軸だけを自然に反映する。仕事・APEX・競馬を全部入れない
- 全体で100〜180字程度
- 句読点をしっかり入れ、スマホで読みやすい改行を入れる
- 最後に読者への自然な投げかけで締める（「あなたはどうですか？」など）
- ハッシュタグなし

1行目（書き出し）と本文を分けてJSON形式のみで返答。前置き不要:
{"hook": "書き出しの一文", "body": "2行目以降の本文（改行は\\nで）"}`;

  try {
    const res = await fetch("/.netlify/functions/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 600, messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    if (!data || !data.content) throw new Error("API error");
    const text = data.content.filter(b => b && b.type==="text").map(b => b.text).join("\n");
    const parsed = parseJsonResponse(text);
    currentPost = parsed;
    renderPost(parsed);
  } catch(e) {
    currentPost = fallbackPostFromNeta(neta);
    renderPost(currentPost);
  } finally {
    regenBtn.disabled = false;
  }
}

function renderPost(p) {
  const box = document.getElementById("postBox");
  const full = p.hook + "\n\n" + p.body;

  const hook = document.createElement("div"); hook.className = "post-hook"; hook.textContent = p.hook;
  const body = document.createElement("div"); body.className = "post-body"; body.textContent = p.body;
  const chars = document.createElement("div"); chars.className = "post-chars"; chars.textContent = full.length + "字";
  const actions = document.createElement("div"); actions.className = "post-actions";

  const cpBtn = makeBtn("全文コピー", "", () => copyText(full, cpBtn, "全文コピー"));
  const xBtn = makeBtn("Xで投稿", "open-x", () => {
    doCopy(full).then(() => window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(full.slice(0,280)), "_blank"));
  });
  const addBtn = makeBtn("＋スケジュール", "add-sched", () => addToSchedule(p, addBtn));
  const resBtn = makeBtn("📅 投稿予約", "reserve-btn", () => reservePost(full, resBtn));
  actions.appendChild(cpBtn); actions.appendChild(xBtn); actions.appendChild(addBtn); actions.appendChild(resBtn);

  box.innerHTML = "";
  const wrap = document.createElement("div"); wrap.style.cssText = "margin:10px 14px 0;border-left:3px solid #3A3A3A;padding-left:10px;border-radius:2px;";
  wrap.appendChild(hook);
  box.appendChild(wrap);
  box.appendChild(body);
  box.appendChild(chars);
  box.appendChild(actions);
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

const GAS_URL = "https://script.google.com/macros/s/AKfycby6dfkdi2ykVU2u8aMTKmz2mmT-iO0G8KmuPNSZC29GmxXYm4TXRrR1anFcdoOb-Nc/exec";

async function reservePost(text, btn) {
  btn.disabled = true;
  btn.textContent = "送信中…";
  try {
    await fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    btn.textContent = "✓ 予約済";
    btn.classList.add("reserved");
  } catch(e) {
    btn.textContent = "失敗";
    btn.disabled = false;
  }
}

function makeBtn(label, cls, onClick) {
  const b = document.createElement("button");
  b.textContent = label; if(cls) b.className = cls; b.onclick = onClick; return b;
}

function addToSchedule(post, btn) {
  if (schedule.length >= 7) { alert("1週間分（7本）が上限です。"); return; }
  schedule.push({ id: Date.now(), day: DAYS[schedule.length], time: BEST_TIMES[schedule.length], hook: post.hook, body: post.body });
  saveSchedule();
  btn.textContent = "✓ 追加済"; btn.disabled = true;
  document.getElementById("schedCount").textContent = "("+schedule.length+")";
}

function saveSchedule() {
  try { localStorage.setItem("xsched5", JSON.stringify(schedule)); } catch(e) {}
}

function renderSchedule() {
  const box = document.getElementById("schedContent");
  if (schedule.length === 0) {
    box.innerHTML = '<div class="sched-empty">まだ投稿がありません。<br>「ネタ出し」タブで投稿を作り<br>「＋スケジュール」で追加してください。</div>';
    return;
  }
  let html = '<div class="sched-stats">'
    + statBox(schedule.length, "予定本数")
    + statBox(7-schedule.length, "残り枠")
    + '</div><div class="week-grid">';

  schedule.forEach(s => {
    html += `<div class="day-row">
      <div class="day-head">
        <div class="day-label">${s.day}</div>
        <div class="day-time">⏰ ${s.time}</div>
      </div>
      <div class="day-post">
        <div class="day-hook">${esc(s.hook)}</div>
        <div class="day-body">${esc(s.body)}</div>
      </div>
      <div class="day-actions">
        <button onclick="copySchedPost(${s.id}, this)">コピー</button>
        <button onclick="openXSched(${s.id})">Xで投稿</button>
        <button class="remove-btn" onclick="removeSched(${s.id})">削除</button>
      </div>
    </div>`;
  });
  html += '</div><button class="clear-btn" onclick="clearSched()">すべてクリア</button>';
  box.innerHTML = html;
}

function statBox(num, label) {
  return `<div class="stat-box"><div class="stat-num">${num}</div><div class="stat-label">${label}</div></div>`;
}

function copySchedPost(id, btn) {
  const s = schedule.find(x => x.id===id); if(!s) return;
  doCopy(s.hook+"\n\n"+s.body).then(() => { btn.textContent="コピー ✓"; btn.classList.add("copied"); setTimeout(()=>{btn.textContent="コピー";btn.classList.remove("copied");},1500); });
}

function openXSched(id) {
  const s = schedule.find(x => x.id===id); if(!s) return;
  doCopy(s.hook+"\n\n"+s.body).then(() => window.open("https://twitter.com/intent/tweet?text="+encodeURIComponent((s.hook+"\n\n"+s.body).slice(0,280)), "_blank"));
}

function removeSched(id) {
  schedule = schedule.filter(x => x.id!==id);
  schedule.forEach((s,i) => { s.day=DAYS[i]; s.time=BEST_TIMES[i]; });
  saveSchedule();
  document.getElementById("schedCount").textContent = schedule.length > 0 ? "("+schedule.length+")" : "";
  renderSchedule();
}

function clearSched() {
  if(!confirm("スケジュールをすべて削除しますか？")) return;
  schedule = []; saveSchedule();
  document.getElementById("schedCount").textContent = "";
  renderSchedule();
}

function copyText(text, btn, orig) {
  doCopy(text).then(() => { btn.textContent="コピーしました ✓"; btn.classList.add("copied"); setTimeout(()=>{btn.textContent=orig;btn.classList.remove("copied");},1500); });
}

function doCopy(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).catch(()=>Promise.resolve(fallbackCopy(text)));
  return Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value=text; ta.style.cssText="position:fixed;opacity:0";
  document.body.appendChild(ta); ta.focus(); ta.select();
  try{document.execCommand("copy");}catch(e){}
  document.body.removeChild(ta);
}

function esc(s) { return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

async function readCsvFile(file) {
  if (!file) return [];
  const text = await file.text();
  return NetPostAnalyzer.parseCsv(text);
}

async function collectAnalysisPosts() {
  const textLines = document.getElementById("analysisText").value.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const csvRows = await readCsvFile(document.getElementById("analysisCsv").files[0]);
  return NetPostAnalyzer.prepareReferencePosts([...textLines, ...csvRows]);
}

function renderAnalysisProfile(profile) {
  const box = document.getElementById("analysisResult");
  box.innerHTML = `<div class="card">
    <div class="card-label">分析結果</div>
    <div class="analysis-summary">
      <strong>${esc(profile.profile_name)}</strong><br>
      ${esc(profile.summary || "")}<br>
      推奨文字数: ${esc(String(profile.length?.recommended_min || ""))}〜${esc(String(profile.length?.recommended_max || ""))}字
    </div>
    <ul class="metric-list">
      <li>主な話題: ${esc((profile.core_topics || []).join(" / "))}</li>
      <li>読者: ${esc((profile.audience || []).join(" / "))}</li>
      <li>避けること: ${esc((profile.avoid || []).join(" / "))}</li>
    </ul>
    <button class="gen-btn" style="margin-top:12px;" onclick="saveCurrentAnalysisProfile()">この分析プロフィールを保存</button>
  </div>`;
  window.currentAnalysisProfile = profile;
}

async function runAnalysis() {
  const btn = document.getElementById("analysisBtn");
  const err = document.getElementById("analysisError");
  const loading = document.getElementById("analysisLoading");
  btn.disabled = true; loading.style.display = "block"; err.style.display = "none";
  try {
    const profileName = document.getElementById("analysisProfileName").value.trim() || "分析プロフィール";
    const posts = await collectAnalysisPosts();
    let profile;
    try {
      profile = await NetPostAnalyzer.analyzeWithAi(profileName, posts);
    } catch {
      profile = NetPostAnalyzer.localProfile(profileName, posts);
    }
    profile.reference_posts = posts.map((p) => ({ text: p.text }));
    renderAnalysisProfile(profile);
  } catch (e) {
    err.textContent = e.message || String(e);
    err.style.display = "block";
  } finally {
    btn.disabled = false; loading.style.display = "none";
  }
}

function saveCurrentAnalysisProfile() {
  if (!window.currentAnalysisProfile) return;
  NetPostStorage.saveProfile(window.currentAnalysisProfile);
  renderProfiles();
  renderCreatorProfiles();
}

function renderProfiles() {
  const list = document.getElementById("profileList");
  if (!list) return;
  const profiles = NetPostStorage.loadProfiles();
  if (!profiles.length) {
    list.innerHTML = '<div class="safe-note">保存済みプロフィールはまだありません。</div>';
    return;
  }
  list.innerHTML = "";
  profiles.forEach((profile) => {
    const row = document.createElement("div");
    row.className = "profile-row";
    row.innerHTML = `<strong>${esc(profile.profile_name)}</strong>`;
    const load = makeBtn("読込", "mini-btn", () => renderAnalysisProfile(profile));
    const rename = makeBtn("名前変更", "mini-btn", () => {
      const name = prompt("新しい名前", profile.profile_name);
      if (name) { NetPostStorage.renameProfile(profile.id, name); renderProfiles(); renderCreatorProfiles(); }
    });
    const del = makeBtn("削除", "mini-btn", () => {
      if (confirm("削除しますか？")) { NetPostStorage.deleteProfile(profile.id); renderProfiles(); renderCreatorProfiles(); }
    });
    row.appendChild(load); row.appendChild(rename); row.appendChild(del);
    list.appendChild(row);
  });
}

function renderCreatorProfiles() {
  const select = document.getElementById("creatorProfile");
  if (!select) return;
  const profiles = NetPostStorage.loadProfiles();
  select.innerHTML = '<option value="">保存プロフィールなし（基本設定のみ）</option>';
  profiles.forEach((profile) => {
    const option = document.createElement("option");
    option.value = profile.id;
    option.textContent = profile.profile_name;
    select.appendChild(option);
  });
}

function creatorInput() {
  return {
    event: document.getElementById("creatorEvent").value.trim(),
    opinion: document.getElementById("creatorOpinion").value.trim(),
    audience: document.getElementById("creatorAudience").value.trim(),
    theme: document.getElementById("creatorTheme").value.trim(),
    scene: document.getElementById("creatorScene").value.trim(),
    avoid: document.getElementById("creatorAvoid").value.trim(),
    strength: document.getElementById("creatorStrength").value,
    pattern: document.getElementById("creatorPattern").value,
    length: document.getElementById("creatorLength").value
  };
}

async function generateOriginalPosts() {
  const err = document.getElementById("creatorError");
  const loading = document.getElementById("creatorLoading");
  const btn = document.getElementById("creatorBtn");
  const profiles = NetPostStorage.loadProfiles();
  const profile = profiles.find((p) => p.id === document.getElementById("creatorProfile").value) || null;
  const refs = profile?.reference_posts || [];
  btn.disabled = true; loading.style.display = "block"; err.style.display = "none";
  try {
    const posts = await NetPostGenerator.generatePosts(creatorInput(), profile, refs);
    renderGeneratedPosts(posts, refs);
  } catch (e) {
    err.textContent = e.message || String(e);
    err.style.display = "block";
  } finally {
    btn.disabled = false; loading.style.display = "none";
  }
}

function renderGeneratedPosts(posts, refs = []) {
  const list = document.getElementById("generatedPosts");
  list.innerHTML = "";
  posts.forEach((post, index) => {
    const card = document.createElement("div");
    card.className = "generated-card" + (post.scores.risk >= 60 ? " high-risk collapsed" : "");
    const warnings = [
      post.similarity >= 0.45 ? `類似度注意: ${post.similarity.toFixed(2)}` : "",
      ...(post.risk_notes || [])
    ].filter(Boolean);
    card.innerHTML = `<div class="generated-head">
      <strong>${String(index + 1).padStart(2, "0")} ${esc(post.pattern || "")}</strong>
      <span class="score-line">総合 ${post.scores.total} / リスク ${post.scores.risk} / 類似 ${Number(post.similarity || 0).toFixed(2)}</span>
    </div>
    ${warnings.length ? `<div class="risk-note">${esc(warnings.join(" / "))}</div>` : ""}
    <div class="generated-body">
      <textarea class="generated-text">${esc(post.text)}</textarea>
      <div class="post-chars char-count">${post.text.length}字</div>
      <div class="score-line" style="padding:0 14px 10px;">${esc(post.reason || "")}</div>
      <div class="action-grid"></div>
    </div>`;
    const textArea = card.querySelector("textarea");
    const count = card.querySelector(".char-count");
    const updateCount = () => {
      count.textContent = `${textArea.value.length}字`;
      count.classList.toggle("warn", textArea.value.length > 140 && textArea.value.length <= 280);
      count.classList.toggle("bad", textArea.value.length > 280);
      const pii = NetPostSecurity.detectPersonalInfo(textArea.value);
      if (pii.length) count.textContent += ` / 注意: ${pii.join("、")}`;
    };
    textArea.addEventListener("input", updateCount);
    const actions = card.querySelector(".action-grid");
    actions.appendChild(makeBtn("コピー", "", () => copyText(textArea.value, actions.children[0], "コピー")));
    actions.appendChild(makeBtn("Xで開く", "", () => window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(textArea.value.slice(0,280)), "_blank")));
    actions.appendChild(makeBtn("スケジュール", "", () => addToSchedule({ hook: textArea.value.split("\n")[0], body: textArea.value.split("\n").slice(1).join("\n") }, actions.children[2])));
    actions.appendChild(makeBtn("再採点", "", () => {
      const scored = NetPostScorer.scorePost(textArea.value);
      const sim = NetPostSimilarity.maxSimilarity(textArea.value, refs);
      card.querySelector(".score-line").textContent = `総合 ${scored.scores.total} / リスク ${scored.scores.risk} / 類似 ${sim.max.toFixed(2)}`;
    }));
    actions.appendChild(makeBtn("やわらかく", "", () => { textArea.value = textArea.value.replace(/おかしい/g, "気になります").replace(/きつい/g, "少ししんどい"); updateCount(); }));
    actions.appendChild(makeBtn("強く", "", () => { textArea.value = textArea.value.replace(/気になります/g, "正直おかしいと思います").replace(/少し/g, "かなり"); updateCount(); }));
    actions.appendChild(makeBtn("具体例を足す", "", () => { textArea.value += "\nたとえば、今日の会議みたいな場面です。"; updateCount(); }));
    actions.appendChild(makeBtn("20字短く", "", () => { textArea.value = textArea.value.slice(0, Math.max(0, textArea.value.length - 20)); updateCount(); }));
    actions.appendChild(makeBtn("投稿実績保存", "", () => {
      const likes = Number(prompt("いいね数", "0") || 0);
      const reposts = Number(prompt("リポスト数", "0") || 0);
      const replies = Number(prompt("返信数", "0") || 0);
      const views = Number(prompt("表示回数", "0") || 0);
      NetPostStorage.addPerformanceLog({ text: textArea.value, likes, reposts, replies, views, posted: true });
    }));
    if (post.scores.risk >= 60) card.querySelector(".generated-head").onclick = () => card.classList.toggle("collapsed");
    updateCount();
    list.appendChild(card);
  });
}

renderGenres();
renderProfiles();
renderCreatorProfiles();
document.getElementById("schedCount").textContent = schedule.length > 0 ? "("+schedule.length+")" : "";
