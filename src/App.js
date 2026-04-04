import React, { useState, useRef, useEffect, useCallback } from "react";
import "./App.css";

// ─── Draw Helpers ────────────────────────────────────────────────────────────
function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(" ");
  let line = "", lines = [];
  for (let w of words) {
    const t = line ? line + " " + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
    else line = t;
  }
  if (line) lines.push(line);
  const tot = lines.length * lineH;
  let sY = y - tot / 2;
  for (let l of lines) { ctx.fillText(l, x, sY + lineH / 2); sY += lineH; }
}

function wrapTextLeft(ctx, text, x, y, maxW, lineH) {
  const words = text.split(" ");
  let line = "", lines = [];
  for (let w of words) {
    const t = line ? line + " " + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
    else line = t;
  }
  if (line) lines.push(line);
  for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], x, y + i * lineH);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawLogo(ctx, W, sc) {
  const lx = W - 44 * sc, ly = 10 * sc, lr = 20 * sc;
  ctx.save();
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = "#0a0a0a";
  ctx.beginPath(); ctx.arc(lx + lr, ly + lr, lr, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#D4A520"; ctx.lineWidth = 1.2 * sc; ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.font = `900 ${13 * sc}px Georgia,serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const g = ctx.createLinearGradient(lx + lr, ly, lx + lr, ly + lr * 2);
  g.addColorStop(0, "#F5D77A"); g.addColorStop(0.55, "#D4A520"); g.addColorStop(1, "#8B6508");
  ctx.fillStyle = g;
  ctx.fillText("BBN", lx + lr, ly + lr + 0.5);
  ctx.restore();
}

function drawTicker(ctx, W, H, sc, tickerX, opts) {
  const { headlineText, textSize, tickerHeight, barColor, textBg, textColor, textAlign, showLive } = opts;
  const fs = textSize || 12;
  const bH = (tickerHeight || 36) * sc;
  const bY = H - bH;

  if (textBg === "solid") {
    ctx.fillStyle = barColor; ctx.fillRect(0, bY, W, bH);
  } else if (textBg === "gradient") {
    const g = ctx.createLinearGradient(0, bY, W, bY + bH);
    g.addColorStop(0, barColor); g.addColorStop(1, "rgba(0,0,0,0.9)");
    ctx.fillStyle = g; ctx.fillRect(0, bY, W, bH);
  }

  let pW = 0;
  if (textBg !== "transparent" && showLive) {
    pW = 46 * sc;
    ctx.fillStyle = "#8B0000"; ctx.fillRect(0, bY, pW, bH);
    ctx.save();
    ctx.font = `700 ${9 * sc}px 'Trebuchet MS',sans-serif`;
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("LIVE", pW / 2, bY + bH / 2);
    ctx.restore();
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(pW, bY + 4 * sc, 1 * sc, bH - 8 * sc);
  }

  ctx.save();
  ctx.beginPath(); ctx.rect(pW + 4 * sc, bY, W - pW - 8 * sc, bH); ctx.clip();
  ctx.font = `700 ${fs * sc}px Arial,sans-serif`;
  ctx.fillStyle = textColor; ctx.textBaseline = "middle";
  const hl = headlineText || "Breaking News...";

  if (textAlign === "center") {
    ctx.textAlign = "center"; ctx.fillText(hl, (pW + W) / 2, bY + bH / 2);
  } else if (textAlign === "right") {
    ctx.textAlign = "right"; ctx.fillText(hl, W - 8 * sc, bY + bH / 2);
  } else {
    ctx.textAlign = "left";
    const tW = ctx.measureText(hl).width;
    const bx = pW + 8 * sc;
    const dx = bx + (tickerX % (tW + W));
    ctx.fillText(hl, dx, bY + bH / 2);
    ctx.fillText(hl, dx + tW + 80 * sc, bY + bH / 2);
  }
  ctx.restore();
}

function drawTemplate(ctx, W, H, videoEl, tickerX, state) {
  const sc = W / 400;
  const {
    template, headlineText, newsBodyText, sourceText,
    textSize, tickerHeight, barColor, textBg, textColor, textAlign,
    showLogo, showBar, showStrip, showLive, headlineSize,
  } = state;

  const tickerOpts = { headlineText, textSize, tickerHeight, barColor, textBg, textColor, textAlign, showLive };

  if (template === "classic") {
    if (videoEl) ctx.drawImage(videoEl, 0, 0, W, H);
    if (showStrip) { ctx.fillStyle = "#CC0000"; ctx.fillRect(0, 0, W, 4 * sc); }
    if (showLogo) drawLogo(ctx, W, sc);
    if (showBar) drawTicker(ctx, W, H, sc, tickerX, tickerOpts);

  } else if (template === "news") {
    const tH = (tickerHeight || 36) * sc;
    const vH = Math.floor((H - tH) * 0.52);
    const txH = Math.floor((H - tH) * 0.30);
    if (videoEl) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, vH); ctx.clip();
      ctx.drawImage(videoEl, 0, 0, W, vH); ctx.restore();
    }
    ctx.fillStyle = "#CC0000"; ctx.fillRect(0, vH, W, 3 * sc);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, vH + 3 * sc, W, txH);
    const by = vH + 3 * sc + 10 * sc;
    ctx.fillStyle = "#CC0000";
    const bt = "⚡ Breaking News";
    ctx.font = `700 ${9 * sc}px Arial,sans-serif`;
    const bW = ctx.measureText(bt).width + 16 * sc, bHh = 14 * sc;
    roundRect(ctx, W / 2 - bW / 2, by, bW, bHh, 3 * sc); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(bt, W / 2, by + bHh / 2);
    const bd = newsBodyText || headlineText || "News here";
    const hs = headlineSize || 16;
    ctx.font = `900 ${hs * sc}px Arial,sans-serif`;
    ctx.fillStyle = "#111"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    wrapText(ctx, bd, W / 2, by + bHh + (txH - bHh - 16 * sc) / 2 + 6 * sc, W - 24 * sc, hs * sc * 1.4);
    ctx.font = `700 ${7 * sc}px 'Trebuchet MS',sans-serif`;
    ctx.fillStyle = "#aaa"; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
    ctx.fillText((sourceText || "BBN NEWS").toUpperCase(), W / 2, vH + 3 * sc + txH - 4 * sc);
    if (showBar) drawTicker(ctx, W, H, sc, tickerX, tickerOpts);
    if (showStrip) { ctx.fillStyle = "#CC0000"; ctx.fillRect(0, 0, W, 4 * sc); }
    if (showLogo) drawLogo(ctx, W, sc);

  } else if (template === "breaking") {
    if (videoEl) ctx.drawImage(videoEl, 0, 0, W, H);
    if (showStrip) { ctx.fillStyle = "#CC0000"; ctx.fillRect(0, 0, W, 4 * sc); }
    const tH = (tickerHeight || 36) * sc;
    const oY = H * 0.42, oH = H - oY - tH;
    const g = ctx.createLinearGradient(0, oY, 0, oY + oH);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.3, "rgba(0,0,0,0.82)");
    g.addColorStop(1, "rgba(0,0,0,0.92)");
    ctx.fillStyle = g; ctx.fillRect(0, oY, W, oH);
    const lY = oY + 14 * sc;
    if (showLive) {
      ctx.fillStyle = "#CC0000";
      const lt = "⚡ LIVE  Breaking News";
      ctx.font = `700 ${9 * sc}px Arial,sans-serif`;
      const lW = ctx.measureText(lt).width + 14 * sc;
      roundRect(ctx, 10 * sc, lY, lW, 14 * sc, 3 * sc); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText(lt, 17 * sc, lY + 7 * sc);
    }
    const hs = headlineSize || 16;
    ctx.font = `900 ${Math.min(hs, 20) * sc}px Arial,sans-serif`;
    ctx.fillStyle = "#fff"; ctx.textAlign = "left";
    wrapTextLeft(ctx, headlineText || "Breaking News", 10 * sc, lY + 22 * sc, W - 20 * sc, Math.min(hs, 20) * sc * 1.4);
    if (showBar) drawTicker(ctx, W, H, sc, tickerX, tickerOpts);
    if (showLogo) drawLogo(ctx, W, sc);

  } else if (template === "split") {
    if (videoEl) ctx.drawImage(videoEl, 0, 0, W, H);
    if (showStrip) { ctx.fillStyle = "#CC0000"; ctx.fillRect(0, 0, W, 4 * sc); }
    const tH = (tickerHeight || 36) * sc, bH = 48 * sc, bY = H - tH - bH;
    ctx.fillStyle = "rgba(0,0,0,0.86)"; ctx.fillRect(0, bY, W, bH);
    ctx.fillStyle = "#CC0000"; ctx.fillRect(0, bY, 5 * sc, bH);
    ctx.font = `700 ${7.5 * sc}px 'Trebuchet MS',sans-serif`;
    ctx.fillStyle = "#D4A520"; ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText((sourceText || "BBN NEWS").toUpperCase(), 12 * sc, bY + 5 * sc);
    const hs = headlineSize || 16;
    ctx.font = `900 ${Math.min(hs, 15) * sc}px Arial,sans-serif`;
    ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    wrapTextLeft(ctx, headlineText || "Breaking News", 12 * sc, bY + bH * 0.62, W - 20 * sc, Math.min(hs, 15) * sc * 1.35);
    if (showBar) drawTicker(ctx, W, H, sc, tickerX, tickerOpts);
    if (showLogo) drawLogo(ctx, W, sc);
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState("News Video Editor");
  const [headlineText, setHeadlineText] = useState("मोदी सरकार का बड़ा फैसला...");
  const [newsBodyText, setNewsBodyText] = useState("");
  const [sourceText, setSourceText] = useState("BBN NEWS");
  const [template, setTemplate] = useState("classic");
  const [headlineSize, setHeadlineSize] = useState(16);
  const [textSize, setTextSize] = useState(12);
  const [tickerHeight, setTickerHeight] = useState(36);
  const [tickerSpeed, setTickerSpeed] = useState(2);
  const [textAlign, setTextAlign] = useState("left");
  const [barColor, setBarColor] = useState("#CC0000");
  const [textBg, setTextBg] = useState("solid");
  const [textColor, setTextColor] = useState("#ffffff");
  const [showLogo, setShowLogo] = useState(true);
  const [showBar, setShowBar] = useState(true);
  const [showStrip, setShowStrip] = useState(true);
  const [showLive, setShowLive] = useState(true);
  const [vidMeta, setVidMeta] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [blobUrl, setBlobUrl] = useState(null);

  const canvasRef = useRef(null);
  const videoElRef = useRef(null);
  const animFrameRef = useRef(null);
  const tickerXRef = useRef(0);
  const exportingRef = useRef(false);
  const stateRef = useRef({});

  // Keep stateRef in sync so draw loop always has latest values without re-renders
  useEffect(() => {
    stateRef.current = {
      template, headlineText, newsBodyText, sourceText,
      headlineSize, textSize, tickerHeight, tickerSpeed,
      barColor, textBg, textColor, textAlign,
      showLogo, showBar, showStrip, showLive,
    };
  });

  // ── Preview loop ──────────────────────────────────────────────────────────
  const startPreviewLoop = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    function draw() {
      if (exportingRef.current) { animFrameRef.current = requestAnimationFrame(draw); return; }
      const vid = videoElRef.current;
      if (!vid) { animFrameRef.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      tickerXRef.current -= stateRef.current.tickerSpeed || 2;
      drawTemplate(ctx, canvas.width, canvas.height, vid, tickerXRef.current, stateRef.current);
      animFrameRef.current = requestAnimationFrame(draw);
    }
    draw();
  }, []);

  // ── Load video ────────────────────────────────────────────────────────────
  const handleVideoLoad = (file) => {
    if (!file) return;
    if (videoElRef.current) { videoElRef.current.pause(); videoElRef.current.src = ""; }
    const url = URL.createObjectURL(file);
    const vid = document.createElement("video");
    vid.src = url;
    vid.muted = false;
    vid.volume = 1;
    vid.playsInline = true;
    vid.crossOrigin = "anonymous";
    vid.onloadedmetadata = () => {
      const W = vid.videoWidth, H = vid.videoHeight;
      const canvas = canvasRef.current;
      canvas.width = W; canvas.height = H;
      canvas.style.display = "block";
      videoElRef.current = vid;
      vid.loop = true;
      vid.play().catch(() => { vid.muted = true; vid.play(); });
      tickerXRef.current = 0;
      setVidMeta({
        W, H,
        dur: vid.duration.toFixed(1),
        size: (file.size / 1024 / 1024).toFixed(1),
        name: file.name,
      });
      startPreviewLoop();
    };
    vid.onerror = () => alert("Video load error");
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    const vid = videoElRef.current;
    if (!vid) { alert("Pehle video upload karo!"); return; }
    setExporting(true);
    exportingRef.current = true;
    setProgress(0);
    setBlobUrl(null);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    vid.loop = false;
    vid.currentTime = 0;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const canvasStream = canvas.captureStream(30);
    let finalStream = canvasStream;

    try {
      vid.muted = false; vid.volume = 1;
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") await ac.resume();
      const dest = ac.createMediaStreamDestination();
      const src = ac.createMediaElementSource(vid);
      src.connect(ac.destination);
      src.connect(dest);
      dest.stream.getAudioTracks().forEach(t => finalStream.addTrack(t));
    } catch (e) { console.warn("Audio capture:", e.message); }

    const mt = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
      .find(m => MediaRecorder.isTypeSupported(m)) || "video/webm";

    const recorder = new MediaRecorder(finalStream, { mimeType: mt, videoBitsPerSecond: 6_000_000 });
    const chunks = [];
    recorder.ondataavailable = e => { if (e.data && e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mt });
      setBlobUrl(URL.createObjectURL(blob));
      exportingRef.current = false;
      setExporting(false);
      setProgress(100);
      vid.loop = true; vid.currentTime = 0;
      vid.play().catch(() => {});
      tickerXRef.current = 0;
      startPreviewLoop();
    };

    let recTickerX = 0;
    function recDraw() {
      if (!exportingRef.current) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      recTickerX -= stateRef.current.tickerSpeed || 2;
      drawTemplate(ctx, canvas.width, canvas.height, vid, recTickerX, stateRef.current);
      setProgress(Math.min(99, Math.round((vid.currentTime / vid.duration) * 100)));
      animFrameRef.current = requestAnimationFrame(recDraw);
    }

    recorder.start(100);
    vid.play().then(() => recDraw()).catch(err => {
      alert("Video play failed: " + err.message);
      exportingRef.current = false;
      setExporting(false);
    });
    vid.onended = () => { if (recorder.state !== "inactive") recorder.stop(); };
  };

  const downloadBlob = (ext) => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `BBN_${template}_${Date.now()}.${ext}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bbn-app">
      {/* TOP NAV */}
      <div className="top-nav">
        <div className="nav-logo">▶ BBN</div>
        {["Multiplex Panel", "Photo News Maker", "News Video Editor", "Social Video Editor", "Video Converter"].map(tab => (
          <button key={tab} className={`nav-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}>{tab}
          </button>
        ))}
      </div>

      <div className="editor-body">
        {/* ── PREVIEW ── */}
        <div className="preview-panel">
          <div className="canvas-wrapper">
            <canvas ref={canvasRef} className="preview-canvas" style={{ display: vidMeta ? "block" : "none" }} />
            {!vidMeta && (
              <div className="monitor-empty">
                <div style={{ fontSize: 48, marginBottom: 8 }}>▶</div>
                <p>Koi video load nahi<br />Neeche video upload karo</p>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="timeline-bar">
            <div className="timeline-controls">
              <div className="timeline-track">
                <div className="timeline-progress" style={{ width: `${progress}%` }}></div>
                <span className="timeline-time">{progress}%</span>
              </div>
            </div>
          </div>

          {/* Download buttons after export */}
          {blobUrl && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="export-btn"
                style={{ background: "rgba(232,160,32,0.15)", color: "#e8a020", border: "1px solid rgba(232,160,32,0.4)", flex: 1 }}
                onClick={() => downloadBlob("webm")}>⬇ WEBM Download
              </button>
              <button className="export-btn"
                style={{ background: "rgba(76,175,80,0.15)", color: "#4caf50", border: "1px solid rgba(76,175,80,0.4)", flex: 1 }}
                onClick={() => downloadBlob("mp4")}>🎬 MP4 Download
              </button>
            </div>
          )}
        </div>

        {/* ── CONTROLS ── */}
        <div className="controls-panel">

          {/* Media */}
          <div className="control-section">
            <div className="control-label">📁 Upload Video</div>
            <label className="upload-btn">
              ⇧ Video Select Karo
              <input type="file" accept="video/*" hidden onChange={e => handleVideoLoad(e.target.files[0])} />
            </label>
            {vidMeta && (
              <div className="file-name">
                ✓ {vidMeta.name.substring(0, 24)}{vidMeta.name.length > 24 ? "…" : ""}
                <br />
                <span style={{ fontSize: 10, color: "#888" }}>
                  {vidMeta.W}×{vidMeta.H} · {vidMeta.dur}s · {vidMeta.size}MB
                </span>
              </div>
            )}
          </div>

          {/* Template */}
          <div className="control-section">
            <div className="control-label">🎨 Template</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
              {[
                { id: "classic",  label: "Classic"  },
                { id: "news",     label: "News"     },
                { id: "breaking", label: "Breaking" },
                { id: "split",    label: "Headline" },
              ].map(t => (
                <button key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`tpl-btn ${template === t.id ? "active" : ""}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text */}
          <div className="control-section">
            <div className="control-label">📝 Ticker / Headline</div>
            <textarea className="control-input" rows={2} value={headlineText}
              onChange={e => setHeadlineText(e.target.value)}
              placeholder="मोदी सरकार का बड़ा फैसला..." />
            {template === "news" && (
              <>
                <div className="control-label" style={{ marginTop: 6 }}>News Body</div>
                <textarea className="control-input" rows={2} value={newsBodyText}
                  onChange={e => setNewsBodyText(e.target.value)}
                  placeholder="Jaise: Congress ne diya bada bayan..." />
              </>
            )}
            <div className="control-label" style={{ marginTop: 6 }}>Channel / Source</div>
            <input className="control-input" value={sourceText}
              onChange={e => setSourceText(e.target.value)} />
          </div>

          {/* Layout */}
          <div className="control-section">
            <div className="control-label">⊞ Layout</div>
            {[
              ["Headline Size", headlineSize, setHeadlineSize, 8, 30, "px"],
              ["Ticker Font",   textSize,     setTextSize,     8, 24, "px"],
              ["Ticker Height", tickerHeight, setTickerHeight, 24, 60, "px"],
              ["Scroll Speed",  tickerSpeed,  setTickerSpeed,  1, 8,  "×"],
            ].map(([label, val, setter, min, max, unit]) => (
              <div className="slider-row" key={label}>
                <span className="slider-name">{label}</span>
                <input type="range" min={min} max={max} value={val}
                  onChange={e => setter(Number(e.target.value))} />
                <span className="slider-val">{val}{unit}</span>
              </div>
            ))}
            <div className="font-controls" style={{ marginTop: 6 }}>
              {[["left", "◀ Scroll"], ["center", "Center"], ["right", "Right ▶"]].map(([v, label]) => (
                <button key={v} className={`font-btn ${textAlign === v ? "dark" : ""}`}
                  onClick={() => setTextAlign(v)}>{label}
                </button>
              ))}
            </div>
          </div>

          {/* Colour */}
          <div className="control-section">
            <div className="control-label">◑ Colour</div>
            <div className="control-label" style={{ fontSize: 10, marginBottom: 4 }}>Text Colour</div>
            <div className="font-controls" style={{ flexWrap: "wrap" }}>
              {[["#ffffff","White","#fff","#111"],["#FFFF00","Yellow","#FFFF00","#111"],
                ["#CC0000","Red","#CC0000","#fff"],["#D4A520","Gold","#D4A520","#111"],
                ["#4CAF50","Green","#4CAF50","#fff"],["#111111","Black","#333","#fff"]].map(([val,label,bg,fg]) => (
                <button key={val} onClick={() => setTextColor(val)}
                  style={{ background: bg, color: fg, padding: "2px 8px", borderRadius: 4,
                    border: textColor === val ? "2px solid #fff" : "1px solid #555",
                    fontSize: 11, cursor: "pointer" }}>{label}
                </button>
              ))}
            </div>

            <div className="control-label" style={{ fontSize: 10, marginTop: 8, marginBottom: 4 }}>Ticker BG</div>
            <div className="font-controls">
              {["solid", "transparent", "gradient"].map(v => (
                <button key={v} className={`font-btn ${textBg === v ? "dark" : ""}`}
                  onClick={() => setTextBg(v)}>{v}
                </button>
              ))}
            </div>

            <div className="control-label" style={{ fontSize: 10, marginTop: 8, marginBottom: 4 }}>Bar Colour</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["#CC0000","#1a237e","#1b5e20","#1a1a1a","#D4A520","#4a148c","#e65100","#006064","#880e4f","#263238"].map(c => (
                <div key={c} onClick={() => setBarColor(c)}
                  style={{ width: 22, height: 22, borderRadius: 4, background: c, cursor: "pointer",
                    border: barColor === c ? "2px solid #fff" : "1px solid #444" }} />
              ))}
            </div>
          </div>

          {/* Overlay toggles */}
          <div className="control-section">
            <div className="control-label">⊕ Overlay</div>
            {[
              ["BBN Logo Badge", showLogo,  setShowLogo],
              ["Ticker Bar",     showBar,   setShowBar],
              ["Top Red Strip",  showStrip, setShowStrip],
              ["LIVE Badge",     showLive,  setShowLive],
            ].map(([label, val, setter]) => (
              <div key={label} className="slider-row" style={{ justifyContent: "space-between" }}>
                <span className="slider-name">{label}</span>
                <button onClick={() => setter(!val)}
                  style={{ padding: "2px 14px", borderRadius: 4, cursor: "pointer", fontSize: 11,
                    border: "1px solid #444", background: val ? "#CC0000" : "#222", color: "#fff" }}>
                  {val ? "ON" : "OFF"}
                </button>
              </div>
            ))}
          </div>

          {/* Export button */}
          <button className="export-btn" onClick={handleExport} disabled={exporting || !vidMeta}>
            {exporting ? `● Recording... ${progress}%` : "● Record & Export"}
          </button>

        </div>
      </div>
    </div>
  );
}
