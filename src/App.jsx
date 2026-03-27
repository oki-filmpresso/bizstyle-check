import { useState, useRef, useCallback, useEffect } from "react";
import "./index.css";

const QUESTIONS = [
  {
    id: "impression", title: "今日どう見られたい？", subtitle: "相手にどんな印象を残したい？", icon: "✨",
    options: [
      { value: "dekiru", label: "「できる人」に見せたい", icon: "💼" },
      { value: "oshare", label: "「おしゃれ」と思われたい", icon: "👗" },
      { value: "shinrai", label: "「信頼できる」と感じさせたい", icon: "🤝" },
      { value: "yasashii", label: "「優しそう」と思われたい", icon: "☺️" },
      { value: "wakawakashii", label: "「若々しい」と見られたい", icon: "🌟" },
      { value: "sexy", label: "「色気がある」と感じさせたい", icon: "🔥" },
    ],
  },
  {
    id: "who", title: "今日、誰に会う？", subtitle: "一番意識する相手は？", icon: "👀",
    options: [
      { value: "kininaru", label: "気になる異性", icon: "💕" },
      { value: "torihiki", label: "取引先・クライアント", icon: "🏢" },
      { value: "joushi", label: "上司・目上の方", icon: "👑" },
      { value: "tomodachi", label: "友人・仲間", icon: "🍻" },
      { value: "hajimete", label: "初対面の人", icon: "🆕" },
      { value: "sns", label: "SNS・不特定多数", icon: "📱" },
    ],
  },
  {
    id: "mood", title: "今日のキブンは？", subtitle: "どんなモードで行きたい？", icon: "🎭",
    options: [
      { value: "jishin", label: "自信を出していきたい", icon: "💪" },
      { value: "relax", label: "リラックスしたい", icon: "🌿" },
      { value: "seme", label: "攻めのスタイルで", icon: "⚡" },
      { value: "kihin", label: "上品にまとめたい", icon: "🎀" },
      { value: "natural", label: "ナチュラルに", icon: "🍃" },
    ],
  },
  {
    id: "scene", title: "今日の目的は？", subtitle: "メインイベントは何？", icon: "🎯",
    options: [
      { value: "shigoto", label: "仕事・ミーティング", icon: "💻" },
      { value: "date", label: "デート・お出かけ", icon: "🥂" },
      { value: "event", label: "パーティー・イベント", icon: "🎉" },
      { value: "mensetsu", label: "面接・プレゼン", icon: "🎤" },
      { value: "nichijou", label: "普段の1日", icon: "☕" },
      { value: "satsuei", label: "撮影・SNS投稿", icon: "📸" },
    ],
  },
];

const LABEL_MAP = {
  impression: { dekiru: "できる人", oshare: "おしゃれ", shinrai: "信頼できる", yasashii: "優しそう", wakawakashii: "若々しい", sexy: "色気がある" },
  who: { kininaru: "気になる異性", torihiki: "取引先", joushi: "上司・目上", tomodachi: "友人", hajimete: "初対面", sns: "SNS" },
  mood: { jishin: "自信モード", relax: "リラックス", seme: "攻めスタイル", kihin: "上品", natural: "ナチュラル" },
  scene: { shigoto: "仕事", date: "デート", event: "イベント", mensetsu: "面接・プレゼン", nichijou: "普段の日", satsuei: "撮影・SNS" },
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
  // Analyze bottom 70% (neck down) - face detection happens in trimBelowFace separately
  const srcY = Math.round(imgEl.naturalHeight * 0.3);
  const srcH = imgEl.naturalHeight - srcY;
  ctx.drawImage(imgEl, 0, srcY, imgEl.naturalWidth, srcH, 0, 0, size, size);
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
  scene: { shigoto: 75, date: 50, event: 55, mensetsu: 85, nichijou: 30, satsuei: 45 },
  impression: { dekiru: 80, oshare: 50, shinrai: 85, yasashii: 40, wakawakashii: 35, sexy: 45 },
  who: { kininaru: 55, torihiki: 80, joushi: 85, tomodachi: 30, hajimete: 70, sns: 40 },
  mood: { jishin: 70, relax: 30, seme: 60, kihin: 80, natural: 35 },
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
  const fWho = FORMALITY.who[answers.who] || 50;
  const fMood = FORMALITY.mood[answers.mood] || 50;
  const target = fScene * 0.35 + fImp * 0.3 + fWho * 0.2 + fMood * 0.15;
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
  const who = LABEL_MAP.who[answers.who] || "";
  const mood = LABEL_MAP.mood[answers.mood] || "";
  const cats = colors.map(c => c.cat);
  const mainColor = colors[0]?.name || "不明";
  const hasDark = cats.includes("dark");
  const warmCount = cats.filter(c => c === "warm").length;

  const goods = [];
  if (tpoScore >= 70) goods.push(`「${impression}」を見せるのにふさわしい色使いです`);
  if (colorScore >= 70) goods.push("全体の色のバランスが取れています");
  if (hasDark) goods.push("ダーク系の色が入っていて引き締まった印象です");
  if (answers.impression === "oshare") goods.push("おしゃれへの意識が色選びに表れています");
  if (answers.scene === "date" && hasDark) goods.push("落ち着いた色味が好印象を与えるでしょう");
  if (answers.scene === "mensetsu" && hasDark) goods.push("面接にふさわしい落ち着いた装いです");
  if (answers.mood === "kihin" && hasDark) goods.push("上品さを感じさせるカラー選びです");
  while (goods.length < 3) goods.push("自分らしいスタイルを大切にしている点が良いです");

  const risks = [];
  if (answers.scene === "mensetsu" && !hasDark) risks.push("カジュアルすぎて「本気度が低い？」と思われるリスクがあります");
  if (answers.scene === "date" && hasDark && warmCount === 0) risks.push("堅すぎて「仕事モードのまま来た？」と距離を感じさせるかも");
  if (answers.scene === "date" && warmCount >= 2) risks.push("カラフルすぎると「派手な人」と思われる可能性があります");
  if (answers.who === "torihiki" && !hasDark) risks.push("「この人に任せて大丈夫？」と信頼感を疑われるリスクがあります");
  if (answers.who === "joushi" && !hasDark) risks.push("目上の方に対してカジュアルすぎると思われるかもしれません");
  if (answers.who === "kininaru" && hasDark && warmCount === 0) risks.push("堅すぎて「近寄りがたい」と感じさせてしまう可能性があります");
  if (answers.who === "hajimete" && colorScore < 65) risks.push("初対面で色の統一感がないと「だらしない」と思われやすくなります");
  if (answers.impression === "sexy" && hasDark && warmCount === 0) risks.push("暗い色だけだと「色気」より「地味」に映るリスクがあります");
  if (warmCount >= 3) risks.push("暖色が多すぎると「落ち着きがない」という印象を与えかねません");
  if (cats.filter(c => c === "light").length >= 3) risks.push("全体が明るすぎると、場面によっては「軽い人」と見られるリスクがあります");
  if (risks.length < 1) risks.push("無難にまとめすぎると「印象に残らない」リスクがあります");
  if (risks.length < 2) risks.push("「もう少し気を遣ってほしかった」と思われる可能性もゼロではありません");

  const colorHarmony = colorScore >= 70 ? `${mainColor}を中心にまとまりのある配色です。` : `${mainColor}がメインですが、色数を絞るとさらに洗練されます。`;
  const colorSuggestion = colorScore >= 70 ? "今の色合わせを活かしつつ、季節感のある差し色を加えてもおしゃれです。" : "ベースカラー・アソートカラー・アクセントカラーの3色ルールを意識してみてください。";
  const overall = Math.min(80, Math.round(tpoScore * 0.45 + colorScore * 0.45 + 40 * 0.1));

  return {
    overall_score: Math.min(100, Math.max(30, overall)), tpo_score: tpoScore, color_score: colorScore,
    tpo_comment: tpoScore >= 70 ? `${who}に会う${scene}のシーンにマッチした装いです。「${impression}」の印象を与えやすいでしょう。` : `${scene}のシーンに対してもう一段工夫すると、「${impression}」がより伝わります。`,
    color_analysis: { main_colors: colors.slice(0, 4), harmony: colorHarmony, suggestion: colorSuggestion },
    strengths: goods.slice(0, 3), risks: risks.slice(0, 3),
  };
}

/* ── Claude API via Vercel API Route ── */
async function generateAIComments(colors, answers, scores) {
  const scene = LABEL_MAP.scene[answers.scene] || "";
  const impression = LABEL_MAP.impression[answers.impression] || "";
  const who = LABEL_MAP.who[answers.who] || "";
  const mood = LABEL_MAP.mood[answers.mood] || "";
  const colorNames = colors.map(c => c.name).join("、");

  const prompt = `あなたは親しみやすく優しいプロのファッションアドバイザーです。相手の良いところを認めつつ、改善点は「こうするともっと素敵ですよ」と前向きに提案するスタイルです。以下の条件で服装を診断してください。毎回ユニークで具体的なコメントを生成し、テンプレ的な表現は避けてください。その人の服の色（${colorNames}）に必ず具体的に言及してください。丁寧語（です・ます）で、友人にアドバイスするような温かい口調でお願いします。

【条件】
今日の目的: ${scene}
見られたい印象: ${impression}
会う相手: ${who}
気分・モード: ${mood}
検出された色: ${colorNames}
総合スコア: ${scores.overall}/100
TPOスコア: ${scores.tpo}/100
色合わせスコア: ${scores.color}/100

以下のJSON形式のみで回答。他テキスト禁止。
{"tpo_comment":"「${impression}」を${who}に見せたい${scene}シーンでの服装適合度について2文。${colorNames}に具体的に言及。温かい口調で","color_harmony":"${colorNames}の調和について1文。色名を使って具体的に。ポジティブに","color_suggestion":"改善提案1文。「〜するともっと素敵です」のような前向きな表現で、具体的な色名やアイテム名を挙げて","strengths":["良い点3つ。各30字以内。色やスタイルに具体的に言及。褒めるトーンで"],"risks":["気をつけたいポイント3つ。各40字以内。「〜に見えてしまうかも」「〜だともったいないです」等の優しい表現で"]}`;

  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    return JSON.parse(data.text.replace(/```json|```/g, "").trim());
  } catch (e) {
    console.error("AI comment generation failed, using fallback:", e);
    return null;
  }
}

/* ── Email via EmailJS ── */
const EMAILJS_SERVICE = "service_bizstyle";
const EMAILJS_TEMPLATE = "template_bizstyle";
const EMAILJS_PUBLIC_KEY = "x3iwxdpi5NrZ1EF1Z";

const CLOUDINARY_CLOUD = "dmnanoeyo";
const CLOUDINARY_PRESET = "esfu8nic";

async function uploadPhoto(dataUrl) {
  const form = new FormData();
  form.append("file", dataUrl);
  form.append("upload_preset", CLOUDINARY_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: "POST", body: form });
  const data = await res.json();
  if (data.secure_url) return data.secure_url;
  throw new Error("Cloudinary upload failed");
}

async function sendEmail(userName, answers, result, emailPhotoUrl) {
  const conditions = Object.entries(answers).map(([k, v]) => `${QUESTIONS.find(q => q.id === k)?.title || k}: ${LABEL_MAP[k]?.[v] || v}`).join("\n");
  const colors = result.color_analysis?.main_colors?.map(c => c.name).join(", ") || "";

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
      photo_url: emailPhotoUrl,
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

// Trim image: detect face and crop below it, or fallback to bottom 70%
async function trimBelowFace(dataUrl, maxW = 800, quality = 0.8) {
  return new Promise(async (resolve) => {
    const img = new Image();
    img.onload = async () => {
      let cropY = Math.round(img.height * 0.3); // default: top 30% cut

      // Try FaceDetector API (Chrome)
      try {
        if (window.FaceDetector) {
          const detector = new FaceDetector();
          const faces = await detector.detect(img);
          if (faces.length > 0) {
            // Find the lowest face bottom edge
            const maxFaceBottom = Math.max(...faces.map(f => f.boundingBox.y + f.boundingBox.height));
            cropY = Math.round(maxFaceBottom + 20); // 20px buffer below chin
          }
        }
      } catch (e) { /* FaceDetector not supported, use fallback */ }

      // Crop from cropY to bottom
      const srcH = img.height - cropY;
      if (srcH < 50) { cropY = Math.round(img.height * 0.3); } // safety
      const finalH = img.height - cropY;
      const r = Math.min(maxW / img.width, 1);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * r);
      c.height = Math.round(finalH * r);
      c.getContext("2d").drawImage(img, 0, cropY, img.width, finalH, 0, 0, c.width, c.height);
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: size, flexShrink: 0 }}>
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(14,165,199,0.1)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={anim} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
        </svg>
        <div style={{ position: "absolute", top: 0, left: 0, width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.28, fontWeight: 700, color: T.text, pointerEvents: "none" }}>{score}</div>
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
  const [facingMode, setFacingMode] = useState("environment");

  const triggerFade = useCallback((cb) => { setFadeIn(false); setTimeout(() => { cb(); setFadeIn(true); }, 180); }, []);

  const selectAnswer = (qId, val) => {
    setAnswers(a => ({ ...a, [qId]: val }));
    if (qIndex < QUESTIONS.length - 1) triggerFade(() => setQIndex(qIndex + 1));
    else triggerFade(() => setStep("camera"));
  };

  const startCamera = async (mode) => {
    const facing = mode || facingMode;
    if (stream) stream.getTracks().forEach(t => t.stop());
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } });
      setStream(s); setCameraActive(true); setFacingMode(facing);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = s; }, 60);
    } catch { setError("カメラにアクセスできませんでした"); }
  };

  const switchCamera = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    startCamera(next);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const c = document.createElement("canvas"); c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (facingMode === "user") {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0);
    setPhoto(c.toDataURL("image/jpeg", 0.7));
    if (stream) stream.getTracks().forEach(t => t.stop()); setCameraActive(false);
  };

  const handleFile = (e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => setPhoto(ev.target.result); r.readAsDataURL(f); };

  const analyzeNow = async () => {
    if (!imgRef.current) return;
    try {
      // Instant: color extraction + rule-based scores
      const colors = extractColors(imgRef.current);
      const tpo = scoreTpo(colors, answers);
      const color = scoreColors(colors, answers);
      const ruleResult = generateAdvice(colors, answers, tpo, color);
      setResult(ruleResult);

      // Show loading animation
      triggerFade(() => setStep("loading"));

      // During 8s loading: fetch AI comments in background
      const aiPromise = generateAIComments(colors, answers, {
        overall: ruleResult.overall_score, tpo, color
      });

      // Wait for both: minimum 8s display + AI response
      const [aiComments] = await Promise.all([
        aiPromise,
        new Promise(r => setTimeout(r, 8000)),
      ]);

      // Merge AI comments into result (AI overrides rule-based text, scores stay)
      if (aiComments) {
        setResult(prev => ({
          ...prev,
          tpo_comment: aiComments.tpo_comment || prev.tpo_comment,
          color_analysis: {
            ...prev.color_analysis,
            harmony: aiComments.color_harmony || prev.color_analysis.harmony,
            suggestion: aiComments.color_suggestion || prev.color_analysis.suggestion,
          },
          strengths: aiComments.strengths?.length >= 2 ? aiComments.strengths : prev.strengths,
          risks: aiComments.risks?.length >= 2 ? aiComments.risks : prev.risks,
        }));
      }

      triggerFade(() => setStep("name"));
    } catch (e) { setError("画像の分析に失敗しました。別の写真をお試しください。"); }
  };

  const submitName = async () => {
    if (!userName.trim()) return;
    triggerFade(() => setStep("result"));
    try {
      // 1. Upload full image to Cloudinary (no trim, high quality)
      const fullImage = await compressImage(photo, 800, 0.8);
      uploadPhoto(fullImage).then(url => console.log("Full photo saved:", url)).catch(e => console.error("Cloudinary upload failed:", e));

      // 2. Trim below face for email (privacy protected)
      const trimmed = await trimBelowFace(photo, 640, 0.7);
      const trimmedUrl = await uploadPhoto(trimmed);
      console.log("Trimmed photo uploaded:", trimmedUrl);

      // 3. Send email with trimmed photo URL
      await sendEmail(userName, answers, result, trimmedUrl);
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
            <p style={{ color: T.good, fontSize: 14, textAlign: "center", marginTop: -4, lineHeight: 1.5 }}>🔒 首から下だけをトリミングしてスキャンします</p>
            <div style={{ ...C, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              {photo ? (
                <div style={{ position: "relative", width: "100%", borderRadius: 12, overflow: "hidden" }}>
                  <img ref={imgRef} src={photo} alt="" crossOrigin="anonymous" style={{ width: "100%", borderRadius: 12, display: "block" }} />
                  <button onClick={() => setPhoto(null)} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>撮り直す</button>
                </div>
              ) : cameraActive ? (
                <div style={{ width: "100%", borderRadius: 12, overflow: "hidden", position: "relative" }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: "100%", borderRadius: 12, display: "block", transform: facingMode === "user" ? "scaleX(-1)" : "none" }} />
                  <button onClick={capturePhoto} style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", width: 64, height: 64, borderRadius: "50%", border: "4px solid #fff", background: "rgba(14,165,199,0.8)", cursor: "pointer", boxShadow: "0 4px 20px rgba(14,165,199,0.3)" }} />
                  <button onClick={switchCamera} style={{ position: "absolute", bottom: 20, right: 16, width: 44, height: 44, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>🔄</button>
                </div>
              ) : (
                <div style={{ width: "100%", aspectRatio: "3/4", borderRadius: 12, border: `2px dashed ${T.optBorder}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "rgba(14,165,199,0.03)", padding: 20 }}>
                  <div style={{ fontSize: 48, opacity: 0.4 }}>📷</div>
                  <p style={{ fontSize: 18, color: T.textMid, textAlign: "center", lineHeight: 1.7, margin: 0 }}>背景がなるべく<strong style={{ color: T.accent, fontSize: 21 }}>白い背景</strong>で撮影、<br />または撮影済みの画像を貼付してください</p>
                  <p style={{ fontSize: 13, color: T.good, textAlign: "center", margin: 0 }}>🔒 首から下のみをスキャンします</p>
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

            <div style={{ ...C, display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 16, padding: "32px 16px", flexWrap: "wrap" }}>
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
