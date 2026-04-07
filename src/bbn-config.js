// ═══════════════════════════════════════════════════════════════
//  BBN MULTIPLEX — CONFIG FILE
//  Yahan sirf templates, colors aur default settings hain.
//  Kuch badlna ho to SIRF yeh file badlo.
// ═══════════════════════════════════════════════════════════════

// ── TEMPLATES ────────────────────────────────────────────────
export const TEMPLATES = [
  { id: "classic",   label: "Classic",    emoji: "📰" },
  { id: "splitdark", label: "Split Dark", emoji: "🌓" },
  { id: "fullbleed", label: "Full Bleed", emoji: "🖼️" },
  { id: "gold",      label: "Gold",       emoji: "✨" },
  { id: "ticker",    label: "Ticker",     emoji: "📡" },
  { id: "redbreak",  label: "Red Break",  emoji: "🔴" },
  { id: "darkdrama", label: "Dark Drama", emoji: "🌙" },
  { id: "newspaper", label: "Newspaper",  emoji: "🗞️" },
];

// ── DEFAULT STATE ─────────────────────────────────────────────
export const DEFAULT_STATE = {
  headline:    "यहाँ खबर आएगी",
  source:      "BBN NEWS",
  badgeText:   "⚡ ब्रेकिंग न्यूज़",
  liveLabel:   "LIVE",
  template:    "classic",
  badgeColor:  "#CC0000",
  stripColor:  "#CC0000",
  boxBg:       "#ffffff",
  hlColor:     "#111111",
  tickerColor: "#CC0000",
  fontSize:    5.5,
  ovLogo:      true,
  ovLive:      true,
  ovBadge:     true,
  ovStrip:     true,
  ovDivider:   true,
  ovSource:    true,
  photoPos:    0.2,
  brightness:  100,
  contrast:    100,
  saturation:  100,
  logoSize:    10,
  logoPosKey:  "tr",
};

// ── CANVAS SIZE ───────────────────────────────────────────────
export const CANVAS_W = 400;
export const CANVAS_H = 500;

// ── COLOR PALETTES ────────────────────────────────────────────
export const SWATCHES_BADGE  = ["#CC0000","#D4A520","#0d47a1","#1b5e20","#111111","#7b1fa2","#e65100","#006064"];
export const SWATCHES_STRIP  = ["#CC0000","#D4A520","#0d47a1","#ffffff","#111111","#1b5e20"];
export const SWATCHES_TICKER = ["#CC0000","#D4A520","#0d47a1","#1b5e20","#111111"];

export const BOXBG = [
  ["#ffffff","#111","White"],
  ["#0a0a0a","#fff","Black"],
  ["#1a0000","#fff","D.Red"],
  ["#0d0d1a","#fff","D.Blue"],
  ["#0d1a0d","#fff","D.Grn"],
  ["#1a1500","#fff","D.Gold"],
];

export const HLCOL = [
  ["#111111","#fff","Black"],
  ["#ffffff","#111","White"],
  ["#CC0000","#fff","Red"],
  ["#D4A520","#000","Gold"],
];

export const TXTCOLS = [
  ["#CC0000","#fff","🔴"],
  ["#D4A520","#000","🟡"],
  ["#ffffff","#111","⬜"],
  ["#4CAF50","#fff","🟢"],
  ["#FF6D00","#fff","🟠"],
  ["#2196F3","#fff","🔵"],
  ["#E91E63","#fff","🩷"],
];

export const LOGOPOS = [
  ["tl","↖"],["tm","↑"],["tr","↗"],
  ["bl","↙"],["bm","↓"],["br","↘"],
];

// ── FONT (Canvas mein use hone wala) ─────────────────────────
//  Hindi ke liye Noto Sans Devanagari best hai.
//  Canvas draw karne se pehle yeh font load karein.
export const HEADLINE_FONT   = "'Noto Sans Devanagari', Arial, sans-serif";
export const UI_FONT         = "'Noto Sans Devanagari', 'Barlow Condensed', sans-serif";
export const MONO_FONT       = "'JetBrains Mono', monospace";

// ── MONTHS (Newspaper template ke liye) ──────────────────────
export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
