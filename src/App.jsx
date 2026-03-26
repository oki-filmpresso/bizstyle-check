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

/* ── Color analysis utils ── */
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
  const size = 80;
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imgEl, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;

  const buckets = {};
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const [h, s, l] = rgbToHsl(r, g, b);
    const { name, cat } = getColorName(h, s, l);
    if (!buckets[name]) buckets[name] = { count: 0, r: 0, g: 0, b: 0, cat };
    buckets[name].count++;
    buckets[name].r += r; buckets[name].g += g; buckets[name].b += b;
  }

  return Object.entries(buckets)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, d]) => {
      const n = d.count;
      const hex = "#" + [d.r / n, d.g / n, d.b / n].map(v => Math.round(v).toString(16).padStart(2, "0")).join("");
      return { name, hex, cat: d.cat, pct: n };
    });
}

/* ── Rule-based scoring ── */
const FORMALITY = {
  scene: { client: 80, conference: 75, internal: 40, media: 65, interview: 85, casual: 30, date_dinner: 50 },
  impression: { trust: 85, friendly: 40, innovative: 50, authority: 90, open: 35 },
  relation: { first: 80, existing: 55, team: 35, superior: 85, acquaintance: 30 },
};

function scoreColors(colors, answers) {
  const cats = colors.map(c => c.cat);
  const hasDark = cats.includes("dark");
  const hasNeutral = cats.includes("neutral");
  const hasLight = cats.includes("light");
  const warmCount = cats.filter(c => c === "warm").length;
  const coolCount = cats.filter(c => c === "cool").length;

  let harmony = 60;
  const uniqueCats = new Set(cats);
  if (uniqueCats.size <= 3) harmony += 15;
  if (uniqueCats.size <= 2) harmony += 10;
  if (hasDark && hasLight && uniqueCats.size <= 3) harmony += 10;
  if (warmCount > 0 && coolCount > 0 && warmCount + coolCount > 3) harmony -= 10;

  const formalNeed = (FORMALITY.scene[answers.scene] || 50);
  if (formalNeed > 65 && hasDark) harmony += 5;
  if (formalNeed < 45 && warmCount > 0) harmony += 5;

  return Math.min(100, Math.max(30, harmony));
}

function scoreTpo(colors, answers) {
  const fScene = FORMALITY.scene[answers.scene] || 50;
  const fImpression = FORMALITY.impression[answers.impression] || 50;
  const fRelation = FORMALITY.relation[answers.relation] || 50;
  const targetFormality = (fScene * 0.5 + fImpression * 0.3 + fRelation * 0.2);

  const cats = colors.map(c => c.cat);
  const hasDark = cats.includes("dark");
  const hasNeutral = cats.includes("neutral");
  const warmRatio = cats.filter(c => c === "warm").length / Math.max(cats.length, 1);

  let clothingFormality = 50;
  if (hasDark) clothingFormality += 20;
  if (hasNeutral) clothingFormality += 10;
  if (warmRatio > 0.5) clothingFormality -= 10;

  const diff = Math.abs(targetFormality - clothingFormality);
  return Math.min(100, Math.max(30, 100 - diff * 0.8));
}

function generateAdvice(colors, answers, tpoScore, colorScore) {
  const scene = LABEL_MAP.scene[answers.scene] || "";
  const impression = LABEL_MAP.impression[answers.impression] || "";
  const cats = colors.map(c => c.cat);
  const mainColor = colors[0]?.name || "不明";
  const hasDark = cats.includes("dark");
  const warmCount = cats.filter(c => c === "warm").length;

  const tips = [];
  const goods = [];

  if (tpoScore >= 70) {
    goods.push(`${scene}にふさわしい色使いです`);
  } else {
    tips.push(`${scene}には、もう少しフォーマル感のある色合わせを意識すると良いでしょう`);
  }

  if (colorScore >= 70) {
    goods.push("全体の色のバランスが取れています");
  } else {
    tips.push("色数を3色以内にまとめると統一感が出ます");
  }

  if (hasDark) {
    goods.push("ダーク系の色が入っていて引き締まった印象です");
  } else if (["client", "interview", "conference"].includes(answers.scene)) {
    tips.push("ネイビーやチャコールなど暗めの色を加えると信頼感がアップします");
  }

  if (warmCount >= 3) {
    tips.push("暖色が多めです。ネイビーやグレーを差し色に入れるとバランスが良くなります");
  }

  if (answers.impression === "friendly" && !cats.includes("warm")) {
    tips.push("親しみやすさを出すなら、ベージュや柔らかいブラウンを取り入れてみてください");
  }

  if (answers.impression === "innovative") {
    goods.push("個性的なスタイルにチャレンジする姿勢は好印象です");
  }

  if (answers.scene === "date_dinner") {
    if (!cats.includes("dark")) tips.push("ダークトーンを1点入れると、大人の余裕が演出できます");
    else goods.push("落ち着いた色味が好印象を与えるでしょう");
  }

  if (answers.scene === "interview") {
    if (!hasDark) tips.push("面接ではネイビーかダークグレーのジャケットが安心感を与えます");
    else goods.push("面接にふさわしい落ち着いた装いです");
  }

  while (goods.length < 3) goods.push("自分らしいスタイルを大切にしている点が良いです");
  while (tips.length < 3) tips.push("小物やアクセサリーで印象に変化をつけるのもおすすめです");

  const colorHarmony = colorScore >= 70
    ? `${mainColor}を中心にまとまりのある配色です。`
    : `${mainColor}がメインですが、色数を絞るとさらに洗練されます。`;

  const colorSuggestion = colorScore >= 70
    ? "今の色合わせを活かしつつ、季節感のある差し色を加えてもおしゃれです。"
    : "ベースカラー・アソートカラー・アクセントカラーの3色ルールを意識してみてください。";

  const overall = Math.round((tpoScore * 0.4 + colorScore * 0.4 + 60 * 0.2));
  const advice = overall >= 75
    ? `${scene}に合った好印象なスタイルです。${impression}という目標に向けて、この調子でいきましょう。`
    : `${scene}での${impression}を意識して、色のトーンや組み合わせを少し調整するとさらに効果的です。`;

  return {
    overall_score: Math.min(100, Math.max(30, overall)),
    tpo_score: tpoScore,
    color_score: colorScore,
    tpo_comment: tpoScore >= 70
      ? `${scene}にしっかりマッチした装いです。${impression}の印象を与えやすいスタイルでしょう。`
      : `${scene}に対してもう一段フォーマル感を上げると、${impression}がより伝わります。`,
    color_analysis: {
      main_colors: colors.slice(0, 4),
      harmony: colorHarmony,
      suggestion: colorSuggestion,
    },
    strengths: goods.slice(0, 3),
    improvements: tips.slice(0, 3),
    advice,
  };
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
  good: "#059669", improve: "#d97706", error: "#dc2626",
};

function ScoreRing({ score, size = 120, stroke = 8, color, label, delay = 0 }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const [anim, setAnim] = useState(circ);
  useEffect(() => {
    const t = setTimeout(() => setAnim(circ - (score / 100) * circ), 150 + delay);
    return () => clearTimeout(t);
  }, [score, delay, circ]);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(14,165,199,0.1)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={anim} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fill={T.text} fontSize={size * 0.28} fontWeight="700" style={{ transform: "rotate(90deg)", transformOrigin: "center" }}>{score}</text>
      </svg>
      <span style={{ fontSize: 13, color: T.textMid, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

function ColorSwatch({ color, name }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: color, border: "2px solid rgba(14,165,199,0.15)", flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }} />
      <span style={{ fontSize: 13, color: T.textMid }}>{name}</span>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState("welcome");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [photo, setPhoto] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [fadeIn, setFadeIn] = useState(true);
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const imgRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const triggerFade = useCallback((cb) => {
    setFadeIn(false);
    setTimeout(() => { cb(); setFadeIn(true); }, 180);
  }, []);

  const selectAnswer = (qId, val) => {
    setAnswers(a => ({ ...a, [qId]: val }));
    if (qIndex < QUESTIONS.length - 1) triggerFade(() => setQIndex(qIndex + 1));
    else triggerFade(() => setStep("camera"));
  };

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(s); setCameraActive(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = s; }, 60);
    } catch { setError("カメラにアクセスできませんでした"); }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const c = document.createElement("canvas");
    c.width = videoRef.current.videoWidth; c.height = videoRef.current.videoHeight;
    c.getContext("2d").drawImage(videoRef.current, 0, 0);
    setPhoto(c.toDataURL("image/jpeg", 0.7));
    if (stream) stream.getTracks().forEach(t => t.stop());
    setCameraActive(false);
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => setPhoto(ev.target.result);
    r.readAsDataURL(f);
  };

  const analyzeNow = () => {
    if (!imgRef.current) return;
    try {
      const colors = extractColors(imgRef.current);
      const tpo = scoreTpo(colors, answers);
      const color = scoreColors(colors, answers);
      const res = generateAdvice(colors, answers, tpo, color);
      setResult(res);
      setHistory(h => [...h, {
        id: Date.now(),
        date: new Date().toLocaleString("ja-JP"),
        answers: { ...answers },
        result: res,
      }]);
      triggerFade(() => setStep("result"));
    } catch (e) {
      setError("画像の分析に失敗しました。別の写真をお試しください。");
    }
  };

  const resetApp = () => triggerFade(() => {
    setStep("welcome"); setQIndex(0); setAnswers({}); setPhoto(null);
    setResult(null); setError(null);
  });

  const exportCSV = () => {
    if (history.length === 0) return;
    const header = "日時,シーン,与えたい印象,業界,関係性,スタイル好み,総合スコア,TPOスコア,色合わせスコア,メイン色,良い点,改善点,アドバイス";
    const rows = history.map(h => {
      const a = h.answers;
      const r = h.result;
      const esc = (s) => `"${String(s || "").replace(/"/g, '""')}"`;
      return [
        esc(h.date),
        esc(LABEL_MAP.scene[a.scene] || a.scene),
        esc(LABEL_MAP.impression[a.impression] || a.impression),
        esc(LABEL_MAP.industry[a.industry] || a.industry),
        esc(LABEL_MAP.relation[a.relation] || a.relation),
        esc(LABEL_MAP.preference[a.preference] || a.preference),
        r.overall_score,
        r.tpo_score,
        r.color_score,
        esc(r.color_analysis?.main_colors?.map(c => c.name).join("/")),
        esc(r.strengths?.join(" / ")),
        esc(r.improvements?.join(" / ")),
        esc(r.advice),
      ].join(",");
    });
    const bom = "\uFEFF";
    const csv = bom + header + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bizstyle_history_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const font = "'Playfair Display', 'Noto Serif JP', serif";
  const sans = "'DM Sans', 'Noto Sans JP', sans-serif";
  const W = { minHeight: "100vh", background: T.bg, fontFamily: sans, color: T.text, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", overflow: "hidden" };
  const Fade = { opacity: fadeIn ? 1 : 0, transform: fadeIn ? "translateY(0)" : "translateY(10px)", transition: "all 0.22s ease" };
  const C = { background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 16, padding: "28px 24px", backdropFilter: "blur(20px)", width: "100%", maxWidth: 480, boxShadow: T.cardShadow };
  const B = (p) => ({ padding: "14px 32px", borderRadius: 12, border: p ? "none" : `1px solid ${T.optBorder}`, background: p ? T.accentGrad : "rgba(255,255,255,0.7)", color: p ? "#fff" : T.text, fontFamily: sans, fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", boxShadow: p ? "0 2px 12px rgba(14,165,199,0.25)" : "none" });
  const O = (s) => ({ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 12, border: s ? `2px solid ${T.optBorderActive}` : `1px solid ${T.optBorder}`, background: s ? T.optBgActive : T.optBg, color: T.text, cursor: "pointer", transition: "all 0.2s", fontFamily: sans, fontSize: 14, fontWeight: 500, width: "100%", textAlign: "left" });
  const H = { fontFamily: font, fontWeight: 600, letterSpacing: 0.5, margin: 0, color: T.text };

  return (
    <div style={W}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&family=Noto+Serif+JP:wght@400;600&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />
      <div style={{ position: "fixed", top: "-25%", right: "-15%", width: 500, height: 500, background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 520, padding: "40px 20px", ...Fade }}>

        {step === "welcome" && (
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
            <div>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👔</div>
              <h1 style={{ ...H, fontSize: 32, background: T.accentGrad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI BizStyle Check</h1>
              <p style={{ color: T.textLight, fontSize: 14, marginTop: 8, lineHeight: 1.7 }}>事業主のための<br />即席ファッション診断</p>
            </div>
            <div style={{ ...C, textAlign: "left" }}>
              <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.8, margin: 0 }}>
                <span style={{ color: T.accent, fontWeight: 700 }}>①</span> 5つの質問に回答<br />
                <span style={{ color: T.accent, fontWeight: 700 }}>②</span> 今の服装を撮影<br />
                <span style={{ color: T.accent, fontWeight: 700 }}>③</span> <strong>1秒で</strong>診断結果を表示
              </p>
            </div>
            <button style={B(true)} onClick={() => triggerFade(() => setStep("questions"))}>診断をはじめる →</button>
            {history.length > 0 && (
              <button style={{ ...B(false), fontSize: 13, display: "flex", alignItems: "center", gap: 8, margin: "0 auto" }} onClick={() => setShowHistory(true)}>
                📋 診断履歴（{history.length}件）
              </button>
            )}
          </div>
        )}

        {step === "questions" && (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
              {QUESTIONS.map((_, i) => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= qIndex ? T.accent : "rgba(14,165,199,0.12)", transition: "background 0.3s" }} />)}
            </div>
            <div style={{ fontSize: 12, color: T.textFaint, fontWeight: 600, letterSpacing: 2, marginBottom: 8 }}>QUESTION {qIndex + 1} / {QUESTIONS.length}</div>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{QUESTIONS[qIndex].icon}</div>
            <h2 style={{ ...H, fontSize: 22, marginBottom: 6 }}>{QUESTIONS[qIndex].title}</h2>
            <p style={{ color: T.textLight, fontSize: 13, marginBottom: 24, marginTop: 0 }}>{QUESTIONS[qIndex].subtitle}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {QUESTIONS[qIndex].options.map(o => (
                <button key={o.value} style={O(answers[QUESTIONS[qIndex].id] === o.value)} onClick={() => selectAnswer(QUESTIONS[qIndex].id, o.value)}>
                  <span style={{ fontSize: 20 }}>{o.icon}</span><span>{o.label}</span>
                </button>
              ))}
            </div>
            {qIndex > 0 && <button style={{ ...B(false), marginTop: 20, fontSize: 13 }} onClick={() => triggerFade(() => setQIndex(qIndex - 1))}>← 戻る</button>}
          </div>
        )}

        {step === "camera" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <h2 style={{ ...H, fontSize: 22, textAlign: "center" }}>服装を撮影</h2>
            <p style={{ color: T.textLight, fontSize: 13, textAlign: "center", marginTop: -12 }}>全身が映るように撮影すると正確な診断ができます</p>
            <div style={{ ...C, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              {photo ? (
                <div style={{ position: "relative", width: "100%", borderRadius: 12, overflow: "hidden" }}>
                  <img ref={imgRef} src={photo} alt="" crossOrigin="anonymous" style={{ width: "100%", borderRadius: 12, display: "block" }} />
                  <button onClick={() => setPhoto(null)} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>撮り直す</button>
                </div>
              ) : cameraActive ? (
                <div style={{ width: "100%", borderRadius: 12, overflow: "hidden", position: "relative" }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: "100%", borderRadius: 12, display: "block" }} />
                  <button onClick={capturePhoto} style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", width: 64, height: 64, borderRadius: "50%", border: "4px solid #fff", background: "rgba(14,165,199,0.8)", cursor: "pointer", boxShadow: "0 4px 20px rgba(14,165,199,0.3)" }} />
                </div>
              ) : (
                <div style={{ width: "100%", aspectRatio: "3/4", borderRadius: 12, border: `2px dashed ${T.optBorder}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "rgba(14,165,199,0.03)" }}>
                  <div style={{ fontSize: 48, opacity: 0.4 }}>📷</div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button style={B(true)} onClick={startCamera}>カメラ起動</button>
                    <button style={B(false)} onClick={() => fileRef.current?.click()}>ファイル選択</button>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
                </div>
              )}
            </div>
            {error && <p style={{ color: T.error, fontSize: 13, textAlign: "center" }}>{error}</p>}
            <div style={{ display: "flex", gap: 12 }}>
              <button style={B(false)} onClick={() => triggerFade(() => { setStep("questions"); setQIndex(QUESTIONS.length - 1); })}>← 戻る</button>
              {photo && <button style={B(true)} onClick={analyzeNow}>⚡ 即時診断 →</button>}
            </div>
          </div>
        )}

        {step === "result" && result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: T.textFaint, fontWeight: 600, letterSpacing: 3, marginBottom: 8 }}>DIAGNOSIS RESULT</div>
              <h2 style={{ ...H, fontSize: 24, background: T.accentGrad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ファッション診断結果</h2>
            </div>

            <div style={{ ...C, display: "flex", justifyContent: "space-around", padding: "32px 16px" }}>
              <ScoreRing score={result.overall_score} size={110} color={T.scoreMain} label="総合スコア" delay={0} />
              <ScoreRing score={result.tpo_score} size={90} color={T.scoreTpo} label="TPO適合度" delay={150} />
              <ScoreRing score={result.color_score} size={90} color={T.scoreColor} label="色合わせ" delay={300} />
            </div>

            {photo && <div style={{ ...C, padding: 12 }}><img src={photo} alt="" style={{ width: "100%", borderRadius: 10, display: "block" }} /></div>}

            <div style={C}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 22 }}>🎯</span><h3 style={{ ...H, fontSize: 16 }}>TPO適合度</h3>
              </div>
              <p style={{ fontSize: 14, color: T.textMid, lineHeight: 1.8, margin: 0 }}>{result.tpo_comment}</p>
            </div>

            <div style={C}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 22 }}>🎨</span><h3 style={{ ...H, fontSize: 16 }}>色合わせ分析</h3>
              </div>
              {result.color_analysis?.main_colors && (
                <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                  {result.color_analysis.main_colors.map((c, i) => <ColorSwatch key={i} color={c.hex} name={c.name} />)}
                </div>
              )}
              <p style={{ fontSize: 14, color: T.textMid, lineHeight: 1.8, margin: "0 0 8px" }}>{result.color_analysis?.harmony}</p>
              <p style={{ fontSize: 14, color: T.accent, lineHeight: 1.8, margin: 0, fontWeight: 500 }}>💡 {result.color_analysis?.suggestion}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={C}>
                <h3 style={{ ...H, fontSize: 14, color: T.good, marginBottom: 12 }}>✅ 良い点</h3>
                {result.strengths?.map((s, i) => <p key={i} style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7, margin: "0 0 6px" }}>• {s}</p>)}
              </div>
              <div style={C}>
                <h3 style={{ ...H, fontSize: 14, color: T.improve, marginBottom: 12 }}>🔧 改善点</h3>
                {result.improvements?.map((s, i) => <p key={i} style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7, margin: "0 0 6px" }}>• {s}</p>)}
              </div>
            </div>

            <div style={{ ...C, border: "1px solid rgba(14,165,199,0.2)", background: "rgba(14,165,199,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 22 }}>💼</span><h3 style={{ ...H, fontSize: 16, color: T.accent }}>総合アドバイス</h3>
              </div>
              <p style={{ fontSize: 14, color: T.textMid, lineHeight: 1.9, margin: 0 }}>{result.advice}</p>
            </div>

            <div style={{ ...C, padding: "16px 20px" }}>
              <div style={{ fontSize: 12, color: T.textFaint, fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>診断条件</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.entries(answers).map(([k, v]) => <span key={k} style={{ fontSize: 12, color: T.textMid, background: "rgba(14,165,199,0.06)", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(14,165,199,0.1)" }}>{LABEL_MAP[k]?.[v] || v}</span>)}
              </div>
            </div>

            <button style={{ ...B(true), width: "100%" }} onClick={resetApp}>もう一度診断する</button>
            {history.length > 0 && (
              <button style={{ ...B(false), width: "100%", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setShowHistory(true)}>
                📋 診断履歴（{history.length}件）
              </button>
            )}
          </div>
        )}
      </div>

      {/* History Modal */}
      {showHistory && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(30,58,79,0.4)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowHistory(false)}>
          <div style={{ background: "#f0f9ff", borderRadius: 20, maxWidth: 520, width: "100%", maxHeight: "80vh", overflow: "auto", padding: "28px 24px", boxShadow: "0 8px 40px rgba(14,165,199,0.15)", border: `1px solid ${T.cardBorder}` }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600, color: T.text, margin: 0 }}>📋 診断履歴</h3>
              <button onClick={() => setShowHistory(false)} style={{ background: "none", border: "none", fontSize: 20, color: T.textLight, cursor: "pointer" }}>✕</button>
            </div>

            {history.length === 0 ? (
              <p style={{ color: T.textLight, fontSize: 14, textAlign: "center", padding: 20 }}>まだ診断履歴がありません</p>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                  {history.map((h, i) => (
                    <div key={h.id} style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: "16px 18px", boxShadow: T.cardShadow }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontSize: 12, color: T.textFaint }}>#{i + 1} ・ {h.date}</span>
                        <span style={{ fontSize: 20, fontWeight: 700, color: T.accent }}>{h.result.overall_score}<span style={{ fontSize: 12, fontWeight: 500 }}>点</span></span>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                        <span style={{ fontSize: 11, background: "rgba(14,165,199,0.08)", color: T.textMid, padding: "2px 8px", borderRadius: 4 }}>{LABEL_MAP.scene[h.answers.scene]}</span>
                        <span style={{ fontSize: 11, background: "rgba(14,165,199,0.08)", color: T.textMid, padding: "2px 8px", borderRadius: 4 }}>{LABEL_MAP.impression[h.answers.impression]}</span>
                        <span style={{ fontSize: 11, background: "rgba(14,165,199,0.08)", color: T.textMid, padding: "2px 8px", borderRadius: 4 }}>{LABEL_MAP.industry[h.answers.industry]}</span>
                      </div>
                      <div style={{ display: "flex", gap: 16, fontSize: 12, color: T.textLight }}>
                        <span>TPO: <strong style={{ color: T.scoreTpo }}>{h.result.tpo_score}</strong></span>
                        <span>色合わせ: <strong style={{ color: T.scoreColor }}>{h.result.color_score}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button style={{ ...B(true), flex: 1, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={exportCSV}>
                    📥 CSVダウンロード
                  </button>
                  <button style={{ ...B(false), fontSize: 13, color: T.error, borderColor: "rgba(220,38,38,0.2)" }} onClick={() => { setHistory([]); setShowHistory(false); }}>
                    🗑
                  </button>
                </div>
                <p style={{ fontSize: 11, color: T.textFaint, textAlign: "center", marginTop: 12 }}>CSVをGoogleスプレッドシートにインポートできます</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
