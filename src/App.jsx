import { useState, useRef, useCallback, useEffect } from "react";
import "./index.css";

const QUESTIONS = [
  {
    id: "scene", title: "今日のシーン", subtitle: "どんな場面に臨みますか？", icon: "🎯",
    options: [
      { value: "client", label: "クライアント商談", icon: "🤝" },
      { value: "conference", label: "カンファレンス登壇", icon: "🎤" },
      { value: "internal", label: "チームMTG・社内", icon: "👥" },
      { value: "media", label: "メディア取材・撮影", icon: "📸" },
      { value: "interview", label: "面接", icon: "📝" },
      { value: "casual", label: "会食・ネットワーキング", icon: "🍷" },
      { value: "date_dinner", label: "異性との会食", icon: "🥂" },
    ],
  },
  {
    id: "impression", title: "与えたい印象", subtitle: "相手にどう映りたいですか？", icon: "✨",
    options: [
      { value: "trust", label: "信頼感・堅実さ", icon: "🏛" },
      { value: "friendly", label: "親しみやすさ", icon: "😊" },
      { value: "innovative", label: "先進的・クリエイティブ", icon: "🚀" },
      { value: "authority", label: "権威・リーダーシップ", icon: "👔" },
      { value: "open", label: "柔軟・オープン", icon: "🌿" },
    ],
  },
  {
    id: "industry", title: "業界・ビジネス領域", subtitle: "あなたのフィールドは？", icon: "🏢",
    options: [
      { value: "finance", label: "金融・コンサル", icon: "📊" },
      { value: "tech", label: "IT・スタートアップ", icon: "💻" },
      { value: "creative", label: "クリエイティブ・デザイン", icon: "🎨" },
      { value: "food", label: "飲食・サービス", icon: "🍽" },
      { value: "medical", label: "医療・ヘルスケア", icon: "🏥" },
      { value: "realestate", label: "不動産・建設", icon: "🏗" },
    ],
  },
  {
    id: "relation", title: "参加者との関係性", subtitle: "今日会う相手は？", icon: "🔗",
    options: [
      { value: "first", label: "初対面の相手", icon: "🆕" },
      { value: "existing", label: "既存の取引先", icon: "📋" },
      { value: "team", label: "社内メンバー", icon: "🏠" },
      { value: "superior", label: "目上の方（投資家・役員）", icon: "👑" },
      { value: "acquaintance", label: "カジュアルな知人", icon: "☕" },
    ],
  },
  {
    id: "preference", title: "スタイルの好み", subtitle: "普段のスタイル傾向は？", icon: "👤",
    options: [
      { value: "formal", label: "フォーマル寄りが好き", icon: "🎩" },
      { value: "casual", label: "カジュアル寄りが好き", icon: "👟" },
      { value: "auto", label: "おまかせ（AIに任せる）", icon: "🤖" },
    ],
  },
];

const LABEL_MAP = {
  scene: { client: "クライアント商談", conference: "カンファレンス登壇", internal: "チームMTG・社内", media: "メディア取材・撮影", interview: "面接", casual: "会食・ネットワーキング", date_dinner: "異性との会食" },
  impression: { trust: "信頼感・堅実さ", friendly: "親しみやすさ", innovative: "先進的・クリエイティブ", authority: "権威・リーダーシップ", open: "柔軟・オープン" },
  industry: { finance: "金融・コンサル", tech: "IT・スタートアップ", creative: "クリエイティブ・デザイン", food: "飲食・サービス", medical: "医療・ヘルスケア", realestate: "不動産・建設" },
  relation: { first: "初対面", existing: "既存取引先", team: "社内", superior: "目上の方", acquaintance: "カジュアル知人" },
  preference: { formal: "フォーマル寄り", casual: "カジュアル寄り", auto: "おまかせ" },
};

/* ── Color analysis ── */
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function getColorName(h, s, l) {
  if (l < 15) return { name: "ブラック", cat: "dark" };
  if (l > 85 && s < 15) return { name: "ホワイト", cat: "light" };
  if (s < 12) {
    if (l < 40) return { name: "チャコール", cat: "dark" };
    if (l < 65) return { name: "グレー", cat: "neutral" };
    return { name: "ライトグレー", cat: "light" };
  }
  if (h < 15 || h >= 345) return { name: l < 40 ? "ダークレッド" : "レッド", cat: "warm" };
  if (h < 40) return { name: l < 45 ? "ブラウン" : "オレンジ", cat: "warm" };
  if (h < 70) return { name: l < 45 ? "カーキ" : "イエロー", cat: "warm" };
  if (h < 160) return { name: l < 40 ? "ダークグリーン" : "グリーン", cat: "cool" };
  if (h < 200) return { name: "ティール", cat: "cool" };
  if (h < 260) return { name: l < 35 ? "ネイビー" : "ブルー", cat: "cool" };
  if (h < 300) return { name: "パープル", cat: "cool" };
  return { name: "ピンク", cat: "warm" };
}

function extractColors(imgEl) {
  const canvas = document.createElement("canvas");
  const size = 300;
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imgEl, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  const buckets = {};
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const [h, s, l] = rgbToHsl(r, g, b);
    const { name, cat } = getColorName(h, s, l);
    if (!buckets[name]) buckets[name] = { count: 0, r: 0, g: 0, b: 0, cat };
    buckets[name].count++; buckets[name].r += r; buckets[name].g += g; buckets[name].b += b;
  }
  return Object.entries(buckets).sort((a, b) => b[1].count - a[1].count).slice(0, 5).map(([name, d]) => {
    const n = d.count;
    const hex = "#" + [d.r / n, d.g / n, d.b / n].map(v => Math.round(v).toString(16).padStart(2, "0")).join("");
    return { name, hex, cat: d.cat, pct: n };
  });
}

/* ── Scoring ── */
const FORMALITY = {
  scene: { client: 80, conference: 75, internal: 40, media: 65, interview: 85, casual: 30, date_dinner: 50 },
  impression: { trust: 85, friendly: 40, innovative: 50, authority: 90, open: 35 },
  relation: { first: 80, existing: 55, team: 35, superior: 85, acquaintance: 30 },
};

function scoreColors(colors, answers) {
  const cats = colors.map(c => c.cat);
  const hasDark = cats.includes("dark"), hasNeutral = cats.includes("neutral");
  const warmCount = cats.filter(c => c === "warm").length, coolCount = cats.filter(c => c === "cool").length;
  let harmony = 40;
  const uniqueCats = new Set(cats);
  if (uniqueCats.size <= 2) harmony += 12; else if (uniqueCats.size <= 3) harmony += 5; else harmony -= 8;
  if (hasDark && cats.includes("light") && uniqueCats.size <= 3) harmony += 8;
  if (warmCount > 0 && coolCount > 0) harmony -= 8;
  if (warmCount >= 3) harmony -= 10;
  if (cats.filter(c => c === "light").length >= 3) harmony -= 8;
  if (!hasDark && !hasNeutral) harmony -= 10;
  const formalNeed = FORMALITY.scene[answers.scene] || 50;
  if (formalNeed > 65 && hasDark) harmony += 5;
  if (formalNeed > 65 && !hasDark) harmony -= 8;
  if (formalNeed < 45 && warmCount > 0) harmony += 3;
  return Math.min(85, Math.max(25, harmony));
}

function scoreTpo(colors, answers) {
  const fScene = FORMALITY.scene[answers.scene] || 50;
  const fImp = FORMALITY.impression[answers.impression] || 50;
  const fRel = FORMALITY.relation[answers.relation] || 50;
  const target = fScene * 0.5 + fImp * 0.3 + fRel * 0.2;
  const cats = colors.map(c => c.cat);
  let clothing = 45;
  if (cats.includes("dark")) clothing += 18;
  if (cats.includes("neutral")) clothing += 8;
  const warmR = cats.filter(c => c === "warm").length / Math.max(cats.length, 1);
  if (warmR > 0.5) clothing -= 12;
  if (warmR > 0.3) clothing -= 5;
  return Math.min(82, Math.max(25, 85 - Math.abs(target - clothing) * 1.2));
}

function generateAdvice(colors, answers, tpoScore, colorScore) {
  const scene = LABEL_MAP.scene[answers.scene] || "";
  const impression = LABEL_MAP.impression[answers.impression] || "";
  const cats = colors.map(c => c.cat);
  const mainColor = colors[0]?.name || "不明";
  const hasDark = cats.includes("dark");
  const warmCount = cats.filter(c => c === "warm").length;

  const goods = [];
  if (tpoScore >= 70) goods.push(`${scene}にふさわしい色使いです`);
  if (colorScore >= 70) goods.push("全体の色のバランスが取れています");
  if (hasDark) goods.push("ダーク系の色が入っていて引き締まった印象です");
  if (answers.impression === "innovative") goods.push("個性的なスタイルにチャレンジする姿勢は好印象です");
  if (answers.scene === "date_dinner" && hasDark) goods.push("落ち着いた色味が好印象を与えるでしょう");
  if (answers.scene === "interview" && hasDark) goods.push("面接にふさわしい落ち着いた装いです");
  while (goods.length < 3) goods.push("自分らしいスタイルを大切にしている点が良いです");

  const risks = [];
  if (answers.scene === "interview" && !hasDark) risks.push("カジュアルすぎて「この人、本気度が低いのでは？」と思われるリスクがあります");
  else if (answers.scene === "interview") risks.push("無難すぎて「個性がない」「印象に残らない」と受け取られる可能性があります");
  if (answers.scene === "date_dinner" && hasDark && warmCount === 0) risks.push("堅すぎる印象で「仕事モードのまま来た」と距離を感じさせてしまうかもしれません");
  else if (answers.scene === "date_dinner" && warmCount >= 2) risks.push("カラフルすぎると「派手な人」という先入観を持たれる可能性があります");
  if (answers.scene === "client" && !hasDark) risks.push("「この人に任せて大丈夫か？」と信頼感を疑われるリスクがあります");
  if (answers.scene === "conference" && warmCount === 0 && hasDark) risks.push("暗い色だけだと壇上で地味に沈み、「自信がなさそう」に映るリスクがあります");
  if (answers.impression === "authority" && !hasDark) risks.push("リーダーシップを示したいのに、軽い印象を与えて説得力が弱まる恐れがあります");
  if (answers.impression === "friendly" && hasDark && warmCount === 0) risks.push("親しみやすさを目指しているのに「近寄りがたい」と感じさせてしまう可能性があります");
  if (answers.relation === "first" && colorScore < 65) risks.push("初対面で色の統一感がないと「だらしない」という第一印象を持たれやすくなります");
  if (answers.relation === "superior" && !hasDark) risks.push("目上の方に対してカジュアルすぎると「礼儀を知らない」と判断されるリスクがあります");
  if (warmCount >= 3) risks.push("暖色が多すぎると「落ち着きがない」「子供っぽい」という印象を与えかねません");
  if (cats.filter(c => c === "light").length >= 3) risks.push("全体が明るすぎると、ビジネスの場では「軽い人」と見られるリスクがあります");
  if (risks.length < 1) risks.push("同じ色系統でまとめすぎると「無難すぎて印象に残らない」リスクがあります");
  if (risks.length < 2) risks.push("シーンによっては「もう少し気を遣ってほしかった」と思われる可能性もゼロではありません");

  const colorHarmony = colorScore >= 70 ? `${mainColor}を中心にまとまりのある配色です。` : `${mainColor}がメインですが、色数を絞るとさらに洗練されます。`;
  const colorSuggestion = colorScore >= 70 ? "今の色合わせを活かしつつ、季節感のある差し色を加えてもおしゃれです。" : "ベースカラー・アソートカラー・アクセントカラーの3色ルールを意識してみてください。";
  const overall = Math.min(80, Math.round(tpoScore * 0.45 + colorScore * 0.45 + 40 * 0.1));

  return {
    overall_score: Math.min(100, Math.max(30, overall)), tpo_score: tpoScore, color_score: colorScore,
    tpo_comment: tpoScore >= 70 ? `${scene}にしっかりマッチした装いです。${impression}の印象を与えやすいスタイルでしょう。` : `${scene}に対してもう一段フォーマル感を上げると、${impression}がより伝わります。`,
    color_analysis: { main_colors: colors.slice(0, 4), harmony: colorHarmony, suggestion: colorSuggestion },
    strengths: goods.slice(0, 3), risks: risks.slice(0, 3),
  };
}

/* ── Email via EmailJS ── */
const EMAILJS_SERVICE = "service_bizstyle";
const EMAILJS_TEMPLATE = "template_bizstyle";
const EMAILJS_PUBLIC_KEY = "x3iwxdpi5NrZ1EF1Z";

const IMGBB_API_KEY = "5483675ea285f3e2e2c98bb80bcc15f1";

async function uploadToImgBB(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  const form = new FormData();
  form.append("key", IMGBB_API_KEY);
  form.append("image", base64);
  const res = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body: form });
  const data = await res.json();
  if (data.success) return data.data.url;
  throw new Error("imgBB upload failed");
}

async function sendEmail(userName, answers, result, photoDataUrl) {
  const conditions = Object.entries(answers).map(([k, v]) => `${QUESTIONS.find(q => q.id === k)?.title || k}: ${LABEL_MAP[k]?.[v] || v}`).join("\n");
  const colors = result.color_analysis?.main_colors?.map(c => c.name).join(", ") || "";

  // Upload photo to imgBB and get URL
  let photoUrl = "";
  if (photoDataUrl) {
    try {
      photoUrl = await uploadToImgBB(photoDataUrl);
      console.log("Photo uploaded:", photoUrl);
    } catch (e) { console.error("Photo upload failed:", e); }
  }

  if (!window.emailjs) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
    window.emailjs.init(EMAILJS_PUBLIC_KEY);
  }

  try {
    await window.emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
      to_email: "m.color.018@gmail.com",
      user_name: userName,
      date: new Date().toLocaleString("ja-JP"),
      conditions,
      overall_score: result.overall_score,
      tpo_score: result.tpo_score,
      color_score: result.color_score,
      tpo_comment: result.tpo_comment,
      main_colors: colors,
      strengths: result.strengths?.join(" / ") || "",
      risks: result.risks?.join(" / ") || "",
      color_harmony: result.color_analysis?.harmony || "",
      color_suggestion: result.color_analysis?.suggestion || "",
      photo_url: photoUrl,
    });
    console.log("Email sent successfully");
  } catch (e) { console.error("Email failed:", e); }
}

function compressImage(dataUrl, maxW = 480, quality = 0.4) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const r = Math.min(maxW / img.width, 1);
      const c = document.createElement("canvas");
      c.width = img.width * r; c.height = img.height * r;
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.src = dataUrl;
  });
}

/* ── Theme ── */
const T = {
  bg: "linear-gradient(170deg, #e8f4f8 0%, #f0f9ff 30%, #e0f2fe 60%, #f0fdff 100%)",
  accent: "#0ea5c7", accentLight: "#38bdf8",
  accentGrad: "linear-gradient(135deg, #0ea5c7, #38bdf8)",
  text: "#1e3a4f", textMid: "#3b6b82", textLight: "#7ca3b8", textFaint: "#a8c8d8",
  cardBg: "rgba(255,255,255,0.7)", cardBorder: "rgba(14,165,199,0.12)", cardShadow: "0 2px 16px rgba(14,165,199,0.08)",
  optBg: "rgba(255,255,255,0.5)", optBgActive: "rgba(14,165,199,0.1)", optBorder: "rgba(14,165,199,0.15)", optBorderActive: "#0ea5c7",
  scoreMain: "#0ea5c7", scoreTpo: "#0284c7", scoreColor: "#7c3aed",
  good: "#059669", error: "#dc2626",
};

/* ── Loading ── */
const LOADING_STEPS = [
  { msg: "画像を読み込んでいます", icon: "📤", delay: 0 },
  { msg: "服装のパーツを認識中", icon: "👁", delay: 1500 },
  { msg: "色合いを分析しています", icon: "🎨", delay: 3000 },
  { msg: "TPO適合度を判定中", icon: "🎯", delay: 4500 },
  { msg: "スタイルバランスを評価中", icon: "⚖️", delay: 6000 },
  { msg: "診断結果をまとめています", icon: "✍️", delay: 7200 },
];

function ScoreRing({ score, size = 120, stroke = 8, color, label, delay = 0 }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const [anim, setAnim] = useState(circ);
  useEffect(() => { const t = setTimeout(() => setAnim(circ - (score / 100) * circ), 150 + delay); return () => clearTimeout(t); }, [score, delay, circ]);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(14,165,199,0.1)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={anim} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.28, fontWeight: 700, color: T.text }}>{score}</div>
      </div>
      <span style={{ fontSize: 14, color: T.textMid, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

function ColorSwatch({ color, name }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: color, border: "2px solid rgba(14,165,199,0.15)", flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }} />
      <span style={{ fontSize: 18, color: T.textMid }}>{name}</span>
    </div>
  );
}

function LoadingScreen({ photo }) {
  const [idx, setIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(0);
  const prev = useRef(0);
  useEffect(() => { const ts = LOADING_STEPS.map((s, i) => i > 0 ? setTimeout(() => setIdx(i), s.delay) : null); return () => ts.forEach(t => t && clearTimeout(t)); }, []);
  useEffect(() => { const st = Date.now(); const iv = setInterval(() => { const s = (Date.now() - st) / 1000; const tgt = 95 * (1 - Math.exp(-s / 3.5)); const n = Math.max(prev.current + 0.08, tgt); prev.current = n; setProgress(n); }, 60); return () => clearInterval(iv); }, []);
  useEffect(() => { const iv = setInterval(() => setElapsed(e => e + 1), 1000); return () => clearInterval(iv); }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "24px 0" }}>
      {photo && (
        <div style={{ width: 280, height: 280, borderRadius: 20, overflow: "hidden", border: "2px solid rgba(14,165,199,0.25)", position: "relative", boxShadow: "0 4px 20px rgba(14,165,199,0.12)" }}>
          <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", left: 0, right: 0, height: 6, background: "linear-gradient(90deg, transparent, #38bdf8, transparent)", top: `${(elapsed * 14) % 100}%`, transition: "top 0.6s linear", opacity: 0.9 }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(14,165,199,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 48, height: 48, border: "3px solid rgba(14,165,199,0.15)", borderTopColor: T.accent, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          </div>
        </div>
      )}
      <div style={{ textAlign: "center", minHeight: 60 }}>
        <div style={{ fontSize: 32, marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite" }}>{LOADING_STEPS[idx].icon}</div>
        <p key={idx} style={{ fontSize: 18, color: T.accent, fontWeight: 600, margin: 0, animation: "fadeMsg 0.4s ease" }}>{LOADING_STEPS[idx].msg}</p>
      </div>
      <div style={{ width: "100%", maxWidth: 320 }}>
        <div style={{ height: 7, borderRadius: 4, background: "rgba(14,165,199,0.1)", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg, #0ea5c7, #38bdf8, #67e8f9, #38bdf8, #0ea5c7)", backgroundSize: "300% 100%", animation: "shimmer 2s linear infinite", width: `${progress}%`, transition: "width 0.3s ease-out" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontSize: 12, color: T.textFaint }}>{elapsed}秒経過</span>
          {progress < 90 ? <span style={{ fontSize: 12, color: T.textFaint }}>{Math.round(progress)}%</span> : <span style={{ fontSize: 12, color: T.accentLight }}>最終処理中</span>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
        {LOADING_STEPS.map((_, i) => <div key={i} style={{ width: i === idx ? 20 : 7, height: 7, borderRadius: 4, background: i <= idx ? T.accent : "rgba(14,165,199,0.12)", transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)" }} />)}
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        @keyframes shimmer { 0%{background-position:-300% 0} 100%{background-position:300% 0} }
        @keyframes fadeMsg { 0%{opacity:0;transform:translateY(6px)} 100%{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

/* ── App ── */
export default function App() {
  const [step, setStep] = useState("welcome");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [photo, setPhoto] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [fadeIn, setFadeIn] = useState(true);
  const [userName, setUserName] = useState("");
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const imgRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);

  const triggerFade = useCallback((cb) => { setFadeIn(false); setTimeout(() => { cb(); setFadeIn(true); }, 180); }, []);

  const selectAnswer = (qId, val) => {
    setAnswers(a => ({ ...a, [qId]: val }));
    if (qIndex < QUESTIONS.length - 1) triggerFade(() => setQIndex(qIndex + 1));
    else triggerFade(() => setStep("camera"));
  };

  const startCamera = async () => {
    try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); setStream(s); setCameraActive(true); setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = s; }, 60); }
    catch { setError("カメラにアクセスできませんでした"); }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const c = document.createElement("canvas"); c.width = videoRef.current.videoWidth; c.height = videoRef.current.videoHeight;
    c.getContext("2d").drawImage(videoRef.current, 0, 0);
    setPhoto(c.toDataURL("image/jpeg", 0.7));
    if (stream) stream.getTracks().forEach(t => t.stop()); setCameraActive(false);
  };

  const handleFile = (e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => setPhoto(ev.target.result); r.readAsDataURL(f); };

  const analyzeNow = () => {
    if (!imgRef.current) return;
    try {
      const colors = extractColors(imgRef.current);
      const tpo = scoreTpo(colors, answers);
      const color = scoreColors(colors, answers);
      const res = generateAdvice(colors, answers, tpo, color);
      setResult(res);
      // Go to loading animation first
      triggerFade(() => setStep("loading"));
      setTimeout(() => triggerFade(() => setStep("name")), 8000);
    } catch (e) { setError("画像の分析に失敗しました。別の写真をお試しください。"); }
  };

  const submitName = async () => {
    if (!userName.trim()) return;
    triggerFade(() => setStep("result"));
    // Send email in background after showing result
    try {
      const compressed = await compressImage(photo, 800, 0.8);
      await sendEmail(userName, answers, result, compressed);
    } catch (e) {
      console.error("Email failed:", e);
    }
  };

  const resetApp = () => triggerFade(() => { setStep("welcome"); setQIndex(0); setAnswers({}); setPhoto(null); setResult(null); setError(null); setUserName(""); });

  const font = "'Playfair Display', 'Noto Serif JP', serif";
  const sans = "'DM Sans', 'Noto Sans JP', sans-serif";
  const W = { minHeight: "100vh", background: T.bg, fontFamily: sans, color: T.text, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", overflow: "hidden" };
  const Fade = { opacity: fadeIn ? 1 : 0, transform: fadeIn ? "translateY(0)" : "translateY(10px)", transition: "all 0.22s ease" };
  const C = { background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 16, padding: "28px 24px", backdropFilter: "blur(20px)", width: "100%", maxWidth: 480, boxShadow: T.cardShadow };
  const B = (p) => ({ padding: "16px 32px", borderRadius: 12, border: p ? "none" : `1px solid ${T.optBorder}`, background: p ? T.accentGrad : "rgba(255,255,255,0.7)", color: p ? "#fff" : T.text, fontFamily: sans, fontSize: 18, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", boxShadow: p ? "0 2px 12px rgba(14,165,199,0.25)" : "none" });
  const O = (s) => ({ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderRadius: 12, border: s ? `2px solid ${T.optBorderActive}` : `1px solid ${T.optBorder}`, background: s ? T.optBgActive : T.optBg, color: T.text, cursor: "pointer", transition: "all 0.2s", fontFamily: sans, fontSize: 18, fontWeight: 500, width: "100%", textAlign: "left" });
  const H = { fontFamily: font, fontWeight: 600, letterSpacing: 0.5, margin: 0, color: T.text };

  return (
    <div style={W}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&family=Noto+Serif+JP:wght@400;600&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />
      <div style={{ position: "fixed", top: "-25%", right: "-15%", width: 500, height: 500, background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 520, padding: "40px 20px", ...Fade }}>

        {/* WELCOME */}
        {step === "welcome" && (
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
            <div>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👔</div>
              <h1 style={{ ...H, fontSize: 36, background: T.accentGrad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI BizStyle Check</h1>
              <p style={{ color: T.textLight, fontSize: 18, marginTop: 8, lineHeight: 1.7 }}>事業主のための<br />即席ファッション診断</p>
            </div>
            <div style={{ ...C, textAlign: "left" }}>
              <p style={{ fontSize: 18, color: T.textMid, lineHeight: 2.0, margin: 0 }}>
                <span style={{ color: T.accent, fontWeight: 700 }}>①</span> 今の服装を撮影<br />
                <span style={{ color: T.textFaint, fontSize: 15 }}>　　白い背景で全身を</span><br />
                <span style={{ color: T.accent, fontWeight: 700 }}>②</span> 5つの質問に回答<br />
                <span style={{ color: T.textFaint, fontSize: 15 }}>　　シーンや目的など</span><br />
                <span style={{ color: T.accent, fontWeight: 700 }}>③</span> AIが診断してスコア表示
              </p>
            </div>
            <button style={B(true)} onClick={() => triggerFade(() => setStep("questions"))}>診断をはじめる →</button>
          </div>
        )}

        {/* QUESTIONS */}
        {step === "questions" && (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
              {QUESTIONS.map((_, i) => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= qIndex ? T.accent : "rgba(14,165,199,0.12)", transition: "background 0.3s" }} />)}
            </div>
            <div style={{ fontSize: 13, color: T.textFaint, fontWeight: 600, letterSpacing: 2, marginBottom: 8 }}>QUESTION {qIndex + 1} / {QUESTIONS.length}</div>
            <div style={{ fontSize: 32, marginBottom: 4 }}>{QUESTIONS[qIndex].icon}</div>
            <h2 style={{ ...H, fontSize: 26, marginBottom: 6 }}>{QUESTIONS[qIndex].title}</h2>
            <p style={{ color: T.textLight, fontSize: 18, marginBottom: 24, marginTop: 0 }}>{QUESTIONS[qIndex].subtitle}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {QUESTIONS[qIndex].options.map(o => (
                <button key={o.value} style={O(answers[QUESTIONS[qIndex].id] === o.value)} onClick={() => selectAnswer(QUESTIONS[qIndex].id, o.value)}>
                  <span style={{ fontSize: 20 }}>{o.icon}</span><span>{o.label}</span>
                </button>
              ))}
            </div>
            {qIndex > 0 && <button style={{ ...B(false), marginTop: 20, fontSize: 14 }} onClick={() => triggerFade(() => setQIndex(qIndex - 1))}>← 戻る</button>}
          </div>
        )}

        {/* CAMERA */}
        {step === "camera" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <h2 style={{ ...H, fontSize: 26, textAlign: "center" }}>服装を撮影</h2>
            <p style={{ color: T.textMid, fontSize: 18, textAlign: "center", marginTop: -12, lineHeight: 1.7 }}>背景がなるべく<strong style={{ color: T.accent, fontSize: 22 }}>白い背景</strong>で<br />全身が映るように撮影してください</p>
            <div style={{ ...C, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              {photo ? (
                <div style={{ position: "relative", width: "100%", borderRadius: 12, overflow: "hidden" }}>
                  <img ref={imgRef} src={photo} alt="" crossOrigin="anonymous" style={{ width: "100%", borderRadius: 12, display: "block" }} />
                  <button onClick={() => setPhoto(null)} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>撮り直す</button>
                </div>
              ) : cameraActive ? (
                <div style={{ width: "100%", borderRadius: 12, overflow: "hidden", position: "relative" }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: "100%", borderRadius: 12, display: "block" }} />
                  <button onClick={capturePhoto} style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", width: 64, height: 64, borderRadius: "50%", border: "4px solid #fff", background: "rgba(14,165,199,0.8)", cursor: "pointer", boxShadow: "0 4px 20px rgba(14,165,199,0.3)" }} />
                </div>
              ) : (
                <div style={{ width: "100%", aspectRatio: "3/4", borderRadius: 12, border: `2px dashed ${T.optBorder}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "rgba(14,165,199,0.03)", padding: 20 }}>
                  <div style={{ fontSize: 48, opacity: 0.4 }}>📷</div>
                  <p style={{ fontSize: 18, color: T.textMid, textAlign: "center", lineHeight: 1.7, margin: 0 }}>背景がなるべく<strong style={{ color: T.accent, fontSize: 21 }}>白い背景</strong>で撮影、<br />または撮影済みの画像を貼付してください</p>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button style={B(true)} onClick={startCamera}>カメラ起動</button>
                    <button style={B(false)} onClick={() => fileRef.current?.click()}>画像を貼付</button>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
                </div>
              )}
            </div>
            {error && <p style={{ color: T.error, fontSize: 16, textAlign: "center" }}>{error}</p>}
            <div style={{ display: "flex", gap: 12 }}>
              <button style={B(false)} onClick={() => triggerFade(() => { setStep("questions"); setQIndex(QUESTIONS.length - 1); })}>← 戻る</button>
              {photo && <button style={B(true)} onClick={analyzeNow}>⚡ 診断する →</button>}
            </div>
          </div>
        )}

        {/* NAME INPUT */}
        {step === "name" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 4 }}>✨</div>
            <h2 style={{ ...H, fontSize: 24, textAlign: "center" }}>診断結果の準備ができました</h2>
            <p style={{ color: T.textLight, fontSize: 17, textAlign: "center", marginTop: -8, lineHeight: 1.6 }}>結果を表示するために<br />お名前をご入力ください</p>
            <div style={{ ...C, display: "flex", flexDirection: "column", gap: 16 }}>
              <input
                type="text"
                placeholder="お名前（ニックネーム可）"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitName()}
                style={{
                  width: "100%", padding: "16px 18px", borderRadius: 12, fontSize: 17,
                  border: `2px solid ${userName.trim() ? T.accent : T.optBorder}`,
                  background: "rgba(255,255,255,0.8)", color: T.text, fontFamily: sans,
                  outline: "none", transition: "border-color 0.2s", boxSizing: "border-box",
                }}
              />
              <button
                style={{ ...B(!!userName.trim()), width: "100%", opacity: userName.trim() ? 1 : 0.5, pointerEvents: userName.trim() ? "auto" : "none" }}
                onClick={submitName}
              >
                結果を見る →
              </button>
            </div>
            <p style={{ fontSize: 12, color: T.textFaint, textAlign: "center" }}>診断結果の送付のみに使用します</p>
          </div>
        )}

        {/* LOADING */}
        {step === "loading" && <LoadingScreen photo={photo} />}

        {/* RESULT */}
        {step === "result" && result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: T.textFaint, fontWeight: 600, letterSpacing: 3, marginBottom: 8 }}>DIAGNOSIS RESULT</div>
              <h2 style={{ ...H, fontSize: 26, background: T.accentGrad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{userName}さんの診断結果</h2>
            </div>

            <div style={{ ...C, display: "flex", justifyContent: "space-around", padding: "32px 16px" }}>
              <ScoreRing score={result.overall_score} size={110} color={T.scoreMain} label="総合スコア" delay={0} />
              <ScoreRing score={result.tpo_score} size={90} color={T.scoreTpo} label="TPO適合度" delay={150} />
              <ScoreRing score={result.color_score} size={90} color={T.scoreColor} label="色合わせ" delay={300} />
            </div>

            {photo && <div style={{ ...C, padding: 12 }}><img src={photo} alt="" style={{ width: "100%", borderRadius: 10, display: "block" }} /></div>}

            <div style={C}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 24 }}>🎯</span><h3 style={{ ...H, fontSize: 20 }}>TPO適合度</h3>
              </div>
              <p style={{ fontSize: 18, color: T.textMid, lineHeight: 2.0, margin: 0 }}>{result.tpo_comment}</p>
            </div>

            <div style={C}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 24 }}>🎨</span><h3 style={{ ...H, fontSize: 20 }}>色合わせ分析</h3>
              </div>
              {result.color_analysis?.main_colors && (
                <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                  {result.color_analysis.main_colors.map((c, i) => <ColorSwatch key={i} color={c.hex} name={c.name} />)}
                </div>
              )}
              <p style={{ fontSize: 18, color: T.textMid, lineHeight: 1.8, margin: "0 0 8px" }}>{result.color_analysis?.harmony}</p>
              <p style={{ fontSize: 18, color: T.accent, lineHeight: 1.8, margin: 0, fontWeight: 500 }}>💡 {result.color_analysis?.suggestion}</p>
            </div>

            <div style={C}>
              <h3 style={{ ...H, fontSize: 18, color: T.good, marginBottom: 14 }}>✅ 良い点</h3>
              {result.strengths?.map((s, i) => <p key={i} style={{ fontSize: 18, color: T.textMid, lineHeight: 1.8, margin: "0 0 8px" }}>• {s}</p>)}
            </div>

            {result.risks?.length > 0 && (
              <div style={{ ...C, border: "1px solid rgba(220,38,38,0.15)", background: "rgba(220,38,38,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 24 }}>⚠️</span><h3 style={{ ...H, fontSize: 18, color: T.error }}>こんな印象を与えるリスクも…</h3>
                </div>
                {result.risks.map((r, i) => <p key={i} style={{ fontSize: 18, color: T.textMid, lineHeight: 1.8, margin: "0 0 10px", paddingLeft: 10, borderLeft: "3px solid rgba(220,38,38,0.25)" }}>{r}</p>)}
              </div>
            )}

            <div style={{ ...C, padding: "16px 20px" }}>
              <div style={{ fontSize: 12, color: T.textFaint, fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>診断条件</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.entries(answers).map(([k, v]) => <span key={k} style={{ fontSize: 15, color: T.textMid, background: "rgba(14,165,199,0.06)", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(14,165,199,0.1)" }}>{LABEL_MAP[k]?.[v] || v}</span>)}
              </div>
            </div>

            {/* LINE CTA */}
            <div style={{ ...C, border: "1px solid rgba(6,199,85,0.2)", background: "linear-gradient(135deg, rgba(6,199,85,0.04), rgba(14,165,199,0.04))", padding: "28px 24px 24px" }}>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 28 }}>👗</span>
                <h3 style={{ ...H, fontSize: 18, marginTop: 8, color: T.text }}>プロにスタイリングしてもらう</h3>
                <p style={{ fontSize: 17, color: T.textLight, marginTop: 6, lineHeight: 1.6 }}>診断結果をもとに、あなた専属のスタイリストがご提案します</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a href="https://lin.ee/DGsEb2X" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderRadius: 12, background: "#06C755", color: "#fff", textDecoration: "none", fontFamily: sans, fontSize: 16, fontWeight: 600, boxShadow: "0 2px 12px rgba(6,199,85,0.25)" }}>
                  <span style={{ fontSize: 22 }}>🏠</span>
                  <div><div>クローゼットの服でスタイリング</div><div style={{ fontSize: 12, fontWeight: 400, opacity: 0.85, marginTop: 2 }}>今ある服を活かしてプロがコーディネート</div></div>
                </a>
                <a href="https://lin.ee/DGsEb2X" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderRadius: 12, background: "#06C755", color: "#fff", textDecoration: "none", fontFamily: sans, fontSize: 16, fontWeight: 600, boxShadow: "0 2px 12px rgba(6,199,85,0.25)" }}>
                  <span style={{ fontSize: 22 }}>🛍️</span>
                  <div><div>お買い物同行でスタイリング</div><div style={{ fontSize: 12, fontWeight: 400, opacity: 0.85, marginTop: 2 }}>一緒にお店を回って最適な一着を選びます</div></div>
                </a>
              </div>
              <p style={{ fontSize: 11, color: T.textFaint, textAlign: "center", marginTop: 12 }}>LINE公式アカウントに繋がります</p>
            </div>

            <button style={{ ...B(true), width: "100%" }} onClick={resetApp}>もう一度診断する</button>
          </div>
        )}
      </div>
    </div>
  );
}
