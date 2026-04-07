// ═══════════════════════════════════════════════════════════════
//  BBN MULTIPLEX — TEMPLATE DRAW ENGINE
//  Sirf canvas drawing functions hain yahan.
//  Template style/layout badlna ho to SIRF yeh file badlo.
//
//  TEXT OVERLAP FIX:
//  - Noto Sans Devanagari font load check added
//  - drawHeadline ab proper bounding-box se height return karta hai
//  - Har template mein headline Y-position ab dynamic calculate hoti hai
//  - measureTextHeight helper added for accurate multi-line sizing
// ═══════════════════════════════════════════════════════════════

import { MONTHS, HEADLINE_FONT, CANVAS_W } from "./bbn-config.js";

// ── Font preload (call this once on app start) ────────────────
export async function preloadFonts() {
  if (document.fonts) {
    await document.fonts.load(`900 20px 'Noto Sans Devanagari'`);
    await document.fonts.load(`700 14px 'Noto Sans Devanagari'`);
  }
}

// ═══════════════════════════════════════════════════════════════
//  MAIN DRAW FUNCTION
//  Usage: drawCard(canvasElement, photoImgOrNull, logoImgOrNull, cfg)
// ═══════════════════════════════════════════════════════════════
export function drawCard(canvas, photoImg, logoImg, cfg) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const {
    template, headline, source, badgeText, liveLabel,
    badgeColor, stripColor, boxBg, hlColor, tickerColor,
    ovLogo, ovLive, ovBadge, ovStrip, ovDivider, ovSource,
    fontSize, logoSize, logoPosKey,
    photoPos, brightness, contrast, saturation,
  } = cfg;

  const sc = W / 400;
  // ── Font size: Noto Devanagari ke liye slightly larger base ──
  const fsPx = Math.max(12, (fontSize || 5.5) * sc * 5.4);

  // ────────────────────────────────────────────────────────────
  //  HELPERS
  // ────────────────────────────────────────────────────────────

  function clip(x, y, w, h, fn) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    fn();
    ctx.restore();
  }

  function drawPhoto(x, y, w, h) {
    if (!photoImg) {
      ctx.fillStyle = "#1a1a1e";
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#333";
      ctx.font = `${12 * sc}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("📷 Photo Upload Karo", x + w / 2, y + h / 2);
      return;
    }
    clip(x, y, w, h, () => {
      const iW = photoImg.naturalWidth  || photoImg.width  || 1;
      const iH = photoImg.naturalHeight || photoImg.height || 1;
      const scale = Math.max(w / iW, h / iH);
      const dW = iW * scale, dH = iH * scale;
      const dx = x + (w - dW) / 2;
      const dy = y + (h - dH) * (photoPos || 0.2);
      ctx.filter = `brightness(${brightness / 100}) contrast(${contrast / 100}) saturate(${saturation / 100})`;
      ctx.drawImage(photoImg, dx, dy, dW, dH);
      ctx.filter = "none";
    });
  }

  function drawLogo() {
    if (!ovLogo) return;
    const sz = (logoSize || 10) * sc * 5;
    let lx = W - sz - 10 * sc, ly = 8 * sc;
    if (logoPosKey === "tl") { lx = 10 * sc;       ly = 8 * sc; }
    else if (logoPosKey === "tm") { lx = (W - sz) / 2; ly = 8 * sc; }
    else if (logoPosKey === "tr") { lx = W - sz - 10 * sc; ly = 8 * sc; }
    else if (logoPosKey === "bl") { lx = 10 * sc;       ly = H - sz - 75 * sc; }
    else if (logoPosKey === "bm") { lx = (W - sz) / 2; ly = H - sz - 75 * sc; }
    else if (logoPosKey === "br") { lx = W - sz - 10 * sc; ly = H - sz - 75 * sc; }

    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "#0a0a0a";
    ctx.beginPath();
    ctx.arc(lx + sz / 2, ly + sz / 2, sz / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#D4A520";
    ctx.lineWidth = 1.5 * sc;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(lx + sz / 2, ly + sz / 2, sz / 2 - 1 * sc, 0, Math.PI * 2);
    ctx.clip();
    if (logoImg) {
      ctx.drawImage(logoImg, lx, ly, sz, sz);
    } else {
      ctx.font = `900 ${sz * 0.36}px Georgia,serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const g = ctx.createLinearGradient(lx, ly, lx, ly + sz);
      g.addColorStop(0, "#F5D77A");
      g.addColorStop(0.55, "#D4A520");
      g.addColorStop(1, "#8B6508");
      ctx.fillStyle = g;
      ctx.fillText("BBN", lx + sz / 2, ly + sz / 2 + 0.5);
    }
    ctx.restore();
  }

  function drawStrip() {
    if (!ovStrip) return;
    ctx.fillStyle = stripColor || "#CC0000";
    ctx.fillRect(0, 0, W, 4 * sc);
  }

  // ── HEADLINE DRAW (TEXT OVERLAP FIX) ─────────────────────────
  //  Returns actual rendered height so callers can position next elements correctly.
  //  Uses Noto Sans Devanagari for proper Hindi rendering.
  function drawHeadline(cx, cy, maxW, color, align = "center") {
    ctx.save();
    ctx.font = `900 ${fsPx}px ${HEADLINE_FONT}`;
    ctx.fillStyle = color || hlColor || "#111";
    ctx.textAlign = align;
    ctx.textBaseline = "top"; // Use "top" for reliable multi-line positioning

    const text = headline || "यहाँ खबर आएगी";
    const words = text.split(" ");
    let line = "", lines = [];

    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);

    const lh = fsPx * 1.4; // line-height
    const totalH = lines.length * lh;

    // Draw lines from top, centered vertically around cy
    const startY = cy - totalH / 2;
    for (let i = 0; i < lines.length; i++) {
      const drawX = align === "left" ? cx : cx;
      ctx.fillText(lines[i], drawX, startY + i * lh);
    }

    ctx.restore();
    return totalH; // return actual height used
  }

  // Same as drawHeadline but returns height WITHOUT drawing (for layout pre-calc)
  function measureHeadlineH(maxW) {
    ctx.save();
    ctx.font = `900 ${fsPx}px ${HEADLINE_FONT}`;
    const words = (headline || "यहाँ खबर आएगी").split(" ");
    let line = "", lines = [];
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; }
      else line = test;
    }
    if (line) lines.push(line);
    ctx.restore();
    return lines.length * fsPx * 1.4;
  }

  function drawBadge(cx, by) {
    if (!ovBadge) return 0;
    const txt = badgeText || "⚡ ब्रेकिंग न्यूज़";
    ctx.save();
    ctx.font = `700 ${9 * sc}px Arial, sans-serif`;
    const bW = ctx.measureText(txt).width + 22 * sc, bH = 18 * sc, bx = cx - bW / 2;
    ctx.fillStyle = badgeColor || "#CC0000";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx, by, bW, bH, 3 * sc);
    else ctx.rect(bx, by, bW, bH);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(txt, cx, by + bH / 2);
    ctx.restore();
    return bH;
  }

  function goldOutlineBadge(cx, by) {
    if (!ovBadge) return 0;
    const txt = badgeText || "⚡ ब्रेकिंग न्यूज़";
    ctx.save();
    ctx.font = `700 ${9 * sc}px Arial, sans-serif`;
    const bW = ctx.measureText(txt).width + 22 * sc, bH = 18 * sc, bx = cx - bW / 2;
    ctx.strokeStyle = "#D4A520";
    ctx.lineWidth = 1.2 * sc;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bx, by, bW, bH, 3 * sc);
    else ctx.rect(bx, by, bW, bH);
    ctx.stroke();
    ctx.fillStyle = "#D4A520";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(txt, cx, by + bH / 2);
    ctx.restore();
    return bH;
  }

  function drawSource(cx, y, color) {
    if (!ovSource) return;
    ctx.save();
    ctx.font = `700 ${7 * sc}px 'Trebuchet MS', sans-serif`;
    ctx.fillStyle = color || "#999";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText((source || "BBN NEWS").toUpperCase(), cx, y);
    ctx.restore();
  }

  function drawDivider(cx, y, color) {
    if (!ovDivider) return;
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = color || "#333";
    const dW = 100 * sc, dc = 6 * sc;
    ctx.fillRect(cx - dW / 2, y, dW / 2 - dc, 1 * sc);
    ctx.fillRect(cx + dc, y, dW / 2 - dc, 1 * sc);
    ctx.save();
    ctx.translate(cx, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-3 * sc, -3 * sc, 6 * sc, 6 * sc);
    ctx.restore();
    ctx.restore();
  }

  function drawTickerBar(bY, bH) {
    ctx.fillStyle = tickerColor || "#CC0000";
    ctx.fillRect(0, bY, W, bH);
    let pW = 0;
    if (ovLive) {
      pW = 52 * sc;
      ctx.fillStyle = "#8B0000";
      ctx.fillRect(0, bY, pW, bH);
      ctx.save();
      ctx.font = `700 ${8 * sc}px 'Trebuchet MS', sans-serif`;
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(liveLabel || "LIVE", pW / 2, bY + bH / 2);
      ctx.restore();
    }
    clip(pW + 6 * sc, bY + 2 * sc, W - pW - 12 * sc, bH - 4 * sc, () => {
      ctx.font = `700 ${9 * sc}px Arial, sans-serif`;
      ctx.fillStyle = "#fff";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(headline || "Breaking News...", pW + 10 * sc, bY + bH / 2);
    });
  }

  function goldDivider(cx, y) {
    if (!ovDivider) return;
    ctx.save();
    const dg = ctx.createLinearGradient(cx - 80 * sc, 0, cx + 80 * sc, 0);
    dg.addColorStop(0, "rgba(212,165,32,0)");
    dg.addColorStop(0.5, "#D4A520");
    dg.addColorStop(1, "rgba(212,165,32,0)");
    ctx.fillStyle = dg;
    ctx.fillRect(cx - 80 * sc, y, 160 * sc, 1.5 * sc);
    ctx.restore();
  }

  // ────────────────────────────────────────────────────────────
  //  TEMPLATES  (TEXT OVERLAP FIX: all positions now dynamic)
  // ────────────────────────────────────────────────────────────

  const PAD = 14 * sc;   // standard padding
  const FOOTER_H = 26 * sc; // source + divider zone height

  if (template === "classic") {
    const pH = Math.floor(H * 0.50), hH = H - pH;
    drawPhoto(0, 0, W, pH);
    drawStrip();
    drawLogo();
    ctx.fillStyle = boxBg || "#ffffff";
    ctx.fillRect(0, pH, W, hH);
    ctx.fillStyle = stripColor || "#CC0000";
    ctx.fillRect(0, pH, W, 4 * sc);

    const bH = drawBadge(W / 2, pH + PAD);
    const hlMaxW = W - 28 * sc;
    const hlH = measureHeadlineH(hlMaxW);
    const usable = hH - PAD - bH - PAD - FOOTER_H - PAD;
    const hlY = pH + PAD + bH + PAD + Math.max(0, (usable - hlH) / 2) + hlH / 2;
    drawHeadline(W / 2, hlY, hlMaxW, hlColor || "#111111");
    drawDivider(W / 2, pH + hH - FOOTER_H, "#333");
    drawSource(W / 2, pH + hH - FOOTER_H / 2, "#999");

  } else if (template === "splitdark") {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);
    const pH = Math.floor(H * 0.55), hH = H - pH;
    drawPhoto(0, 0, W, pH);
    const og = ctx.createLinearGradient(0, pH * 0.55, 0, pH);
    og.addColorStop(0, "rgba(10,10,10,0)");
    og.addColorStop(1, "rgba(10,10,10,1)");
    ctx.fillStyle = og;
    ctx.fillRect(0, pH * 0.55, W, pH * 0.45);
    drawStrip();
    drawLogo();
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, pH, W, hH);

    const bH = drawBadge(W / 2, pH + PAD);
    const hlMaxW = W - 28 * sc;
    const hlH = measureHeadlineH(hlMaxW);
    const usable = hH - PAD - bH - PAD - FOOTER_H - PAD;
    const hlY = pH + PAD + bH + PAD + Math.max(0, (usable - hlH) / 2) + hlH / 2;
    drawHeadline(W / 2, hlY, hlMaxW, "#ffffff");
    drawDivider(W / 2, pH + hH - FOOTER_H, "#fff");
    drawSource(W / 2, pH + hH - FOOTER_H / 2, "#555");

  } else if (template === "fullbleed") {
    drawPhoto(0, 0, W, H);
    const g = ctx.createLinearGradient(0, H * 0.40, 0, H);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.3, "rgba(0,0,0,0.82)");
    g.addColorStop(1, "rgba(0,0,0,0.95)");
    ctx.fillStyle = g;
    ctx.fillRect(0, H * 0.40, W, H * 0.60);
    drawStrip();
    drawLogo();

    const hlMaxW = W - 28 * sc;
    const hlH = measureHeadlineH(hlMaxW);
    const bottomZone = H * 0.38;   // bottom 38% is text area
    const bY = H - bottomZone + PAD;
    const bH = drawBadge(W / 2, bY);
    const hlY = bY + bH + PAD + hlH / 2;
    drawHeadline(W / 2, hlY, hlMaxW, "#ffffff");
    drawDivider(W / 2, H - FOOTER_H, "#fff");
    drawSource(W / 2, H - FOOTER_H / 2, "#aaa");

  } else if (template === "gold") {
    ctx.fillStyle = "#080808";
    ctx.fillRect(0, 0, W, H);
    const pH = Math.floor(H * 0.52), hH = H - pH;
    drawPhoto(0, 0, W, pH);
    drawLogo();
    const gb = ctx.createLinearGradient(0, 0, W, 0);
    gb.addColorStop(0, "#8B6508"); gb.addColorStop(0.3, "#D4A520"); gb.addColorStop(0.5, "#F5D77A");
    gb.addColorStop(0.7, "#D4A520"); gb.addColorStop(1, "#8B6508");
    ctx.fillStyle = gb;
    ctx.fillRect(0, pH, W, 5 * sc);
    ctx.fillStyle = "#080808";
    ctx.fillRect(0, pH + 5 * sc, W, hH - 5 * sc);

    const bH = goldOutlineBadge(W / 2, pH + PAD);
    const hlMaxW = W - 28 * sc;
    const hlH = measureHeadlineH(hlMaxW);
    const usable = hH - PAD - bH - PAD - FOOTER_H - PAD;
    const hlY = pH + PAD + bH + PAD + Math.max(0, (usable - hlH) / 2) + hlH / 2;
    drawHeadline(W / 2, hlY, hlMaxW, "#ffffff");
    goldDivider(W / 2, pH + hH - FOOTER_H);
    drawSource(W / 2, pH + hH - FOOTER_H / 2, "#555");

  } else if (template === "ticker") {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    const tkH = 42 * sc, srcH = ovSource ? 26 * sc : 0;
    const pH = H - tkH - srcH;
    drawPhoto(0, 0, W, pH);
    drawStrip();
    drawLogo();

    // Gradient overlay on photo bottom
    const tg = ctx.createLinearGradient(0, pH * 0.45, 0, pH);
    tg.addColorStop(0, "rgba(0,0,0,0)");
    tg.addColorStop(1, "rgba(0,0,0,0.92)");
    ctx.fillStyle = tg;
    ctx.fillRect(0, pH * 0.45, W, pH * 0.55);

    // Headline inside the photo gradient zone — measure first, then place
    const hlMaxW = W - 28 * sc;
    const hlH = measureHeadlineH(hlMaxW);
    const hlY = pH - hlH / 2 - PAD;
    drawHeadline(W / 2, hlY, hlMaxW, "#ffffff");

    drawTickerBar(pH, tkH);
    if (ovSource) {
      ctx.fillStyle = "#111";
      ctx.fillRect(0, pH + tkH, W, srcH);
      drawSource(W / 2, pH + tkH + srcH / 2, "#555");
    }

  } else if (template === "redbreak") {
    const pH = Math.floor(H * 0.50), hH = H - pH;
    drawPhoto(0, 0, W, pH);
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(0, 0, W, 4 * sc);
    drawLogo();
    ctx.fillStyle = badgeColor || "#CC0000";
    ctx.fillRect(0, pH, W, hH);

    let bH = 0;
    if (ovBadge) {
      const txt = badgeText || "⚡ ब्रेकिंग";
      ctx.save();
      ctx.font = `700 ${9 * sc}px Arial, sans-serif`;
      const bW = ctx.measureText(txt).width + 22 * sc;
      bH = 18 * sc;
      const bx = (W - bW) / 2, by = pH + PAD;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, by, bW, bH, 3 * sc);
      else ctx.rect(bx, by, bW, bH);
      ctx.fill();
      ctx.fillStyle = badgeColor || "#CC0000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, W / 2, by + bH / 2);
      ctx.restore();
    }

    const hlMaxW = W - 28 * sc;
    const hlH = measureHeadlineH(hlMaxW);
    const usable = hH - PAD - bH - PAD - FOOTER_H - PAD;
    const hlY = pH + PAD + bH + PAD + Math.max(0, (usable - hlH) / 2) + hlH / 2;
    drawHeadline(W / 2, hlY, hlMaxW, "#ffffff");
    drawDivider(W / 2, pH + hH - FOOTER_H, "#fff");
    drawSource(W / 2, pH + hH - FOOTER_H / 2, "rgba(255,255,255,0.6)");

  } else if (template === "darkdrama") {
    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, W, H);
    const pH = Math.floor(H * 0.40), hH = H - pH;
    drawPhoto(0, 0, W, pH);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, pH);
    ctx.restore();
    const dg = ctx.createLinearGradient(0, 0, 0, pH);
    dg.addColorStop(0, "rgba(13,13,13,0.2)");
    dg.addColorStop(1, "rgba(13,13,13,1)");
    ctx.fillStyle = dg;
    ctx.fillRect(0, 0, W, pH);
    drawStrip();
    drawLogo();
    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, pH, W, hH);

    const bH = goldOutlineBadge(W / 2, pH + PAD);
    const hlMaxW = W - 28 * sc;
    const hlH = measureHeadlineH(hlMaxW);
    const usable = hH - PAD - bH - PAD - FOOTER_H - PAD;
    const hlY = pH + PAD + bH + PAD + Math.max(0, (usable - hlH) / 2) + hlH / 2;
    drawHeadline(W / 2, hlY, hlMaxW, "#ffffff");
    goldDivider(W / 2, pH + hH - FOOTER_H);
    drawSource(W / 2, pH + hH - FOOTER_H / 2, "#555");

  } else if (template === "newspaper") {
    ctx.fillStyle = "#f5f0e8";
    ctx.fillRect(0, 0, W, H);
    const hdrH = 30 * sc;
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, W, hdrH);
    ctx.save();
    ctx.font = `700 ${14 * sc}px Georgia, serif`;
    ctx.fillStyle = "#f5f0e8";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(source || "BBN NEWS", 10 * sc, hdrH / 2);
    ctx.restore();
    ctx.save();
    ctx.font = `400 ${7 * sc}px 'Trebuchet MS', sans-serif`;
    ctx.fillStyle = "#999";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const nd = new Date();
    ctx.fillText(`${nd.getDate()} ${MONTHS[nd.getMonth()]} ${nd.getFullYear()}`, W - 10 * sc, hdrH / 2);
    ctx.restore();
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, hdrH, W, 2 * sc);
    ctx.fillRect(0, hdrH + 4 * sc, W, 1 * sc);

    const pH = Math.floor((H - hdrH) * 0.44);
    drawPhoto(0, hdrH + 6 * sc, W, pH);

    // Newspaper headline: left-aligned, below photo
    let cY = hdrH + 6 * sc + pH + 10 * sc;
    if (ovBadge) {
      ctx.save();
      ctx.font = `900 ${7 * sc}px Arial, sans-serif`;
      ctx.fillStyle = "#CC0000";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText((badgeText || "Breaking").replace(/[^\w\s⚡•·]/g, "").trim().toUpperCase(), 12 * sc, cY);
      ctx.restore();
      cY += 12 * sc;
    }

    // Left-aligned multi-line headline for newspaper
    ctx.save();
    ctx.font = `900 ${fsPx * 0.85}px Georgia, serif`;
    ctx.fillStyle = "#1a1a1a";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const hw = (headline || "यहाँ खबर आएगी").split(" ");
    let line2 = "", lines2 = [];
    for (const word of hw) {
      const test = line2 ? line2 + " " + word : word;
      if (ctx.measureText(test).width > W - 24 * sc && line2) {
        lines2.push(line2); line2 = word;
      } else { line2 = test; }
    }
    if (line2) lines2.push(line2);
    lines2.forEach((l, i) => ctx.fillText(l, 12 * sc, cY + i * fsPx * 0.85 * 1.3));
    ctx.restore();
    cY += lines2.length * fsPx * 0.85 * 1.3;

    if (ovSource) {
      ctx.save();
      ctx.font = `400 ${7 * sc}px 'Trebuchet MS', sans-serif`;
      ctx.fillStyle = "#666";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`${(source || "BBN NEWS").toUpperCase()} — Special Report`, 12 * sc, cY + 8 * sc);
      ctx.restore();
    }
  }
}
