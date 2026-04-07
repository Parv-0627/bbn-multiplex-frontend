// ═══════════════════════════════════════════════════════════════
//  BBN MULTIPLEX — SocialVideoEditor.js
//  Instagram Reels / YouTube Shorts ke liye vertical news videos
// ═══════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect, useCallback } from "react";

const FORMATS = [
  { id: "reels",  label: "Instagram Reels", w: 1080, h: 1920, icon: "📱" },
  { id: "shorts", label: "YouTube Shorts",  w: 1080, h: 1920, icon: "▶️" },
  { id: "square", label: "Square Post",     w: 1080, h: 1080, icon: "⬛" },
  { id: "wide",   label: "Landscape",       w: 1920, h: 1080, icon: "🖥️" },
];

const OVERLAYS_LIST = [
  { key: "logo",    label: "BBN Logo" },
  { key: "strip",   label: "Top Strip" },
  { key: "ticker",  label: "Bottom Ticker" },
  { key: "live",    label: "LIVE Badge" },
];

function drawFrame(canvas, videoEl, cfg) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const sc = W / 400;

  // Draw video
  if (videoEl) {
    const vW = videoEl.videoWidth, vH = videoEl.videoHeight;
    const scale = Math.max(W / vW, H / vH);
    const dW = vW * scale, dH = vH * scale;
    ctx.drawImage(videoEl, (W - dW) / 2, (H - dH) / 2, dW, dH);
  } else {
    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#333";
    ctx.font = `${14 * sc}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Upload video karo", W / 2, H / 2);
  }

  // Dark gradient overlay at bottom
  const grad = ctx.createLinearGradient(0, H * 0.45, 0, H);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.4, "rgba(0,0,0,0.75)");
  grad.addColorStop(1, "rgba(0,0,0,0.95)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, H * 0.45, W, H * 0.55);

  // Top strip
  if (cfg.overlays.strip) {
    ctx.fillStyle = cfg.barColor || "#CC0000";
    ctx.fillRect(0, 0, W, 5 * sc);
  }

  // BBN Logo
  if (cfg.overlays.logo) {
    const lr = 22 * sc, lx = W - lr * 2 - 10 * sc, ly = 10 * sc;
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "#0a0a0a";
    ctx.beginPath();
    ctx.arc(lx + lr, ly + lr, lr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#D4A520";
    ctx.lineWidth = 1.5 * sc;
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(lx + lr, ly + lr, lr - 1, 0, Math.PI * 2);
    ctx.clip();
    ctx.font = `900 ${lr * 0.8}px Georgia,serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const g = ctx.createLinearGradient(lx, ly, lx, ly + lr * 2);
    g.addColorStop(0, "#F5D77A");
    g.addColorStop(0.55, "#D4A520");
    g.addColorStop(1, "#8B6508");
    ctx.fillStyle = g;
    ctx.fillText("BBN", lx + lr, ly + lr + 0.5);
    ctx.restore();
  }

  // LIVE badge
  if (cfg.overlays.live) {
    ctx.save();
    ctx.fillStyle = "#CC0000";
    const lt = "● LIVE";
    ctx.font = `700 ${10 * sc}px Arial,sans-serif`;
    const lW = ctx.measureText(lt).width + 16 * sc;
    const lH = 18 * sc;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(10 * sc, cfg.overlays.strip ? 12 * sc : 8 * sc, lW, lH, 3 * sc);
    else ctx.rect(10 * sc, cfg.overlays.strip ? 12 * sc : 8 * sc, lW, lH);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(lt, 18 * sc, (cfg.overlays.strip ? 12 * sc : 8 * sc) + lH / 2);
    ctx.restore();
  }

  // Headline text
  if (cfg.headline) {
    ctx.save();
    ctx.font = `900 ${(cfg.fontSize || 22) * sc}px Arial,sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const words = cfg.headline.split(" ");
    let line = "", lines = [];
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (ctx.measureText(t).width > W - 32 * sc && line) { lines.push(line); line = w; }
      else line = t;
    }
    if (line) lines.push(line);
    const lh = (cfg.fontSize || 22) * sc * 1.35;
    const startY = H - (cfg.overlays.ticker ? 52 * sc : 16 * sc) - lines.length * lh - 8 * sc;
    lines.forEach((l, i) => ctx.fillText(l, W / 2, startY + i * lh));
    ctx.restore();
  }

  // Source
  if (cfg.source) {
    ctx.save();
    ctx.font = `700 ${9 * sc}px Trebuchet MS,sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(cfg.source.toUpperCase(), W / 2,
      H - (cfg.overlays.ticker ? 52 * sc : 10 * sc) - 12 * sc);
    ctx.restore();
  }

  // Bottom ticker
  if (cfg.overlays.ticker) {
    const tkH = 44 * sc, tkY = H - tkH;
    ctx.fillStyle = cfg.barColor || "#CC0000";
    ctx.fillRect(0, tkY, W, tkH);
    let pW = 0;
    if (cfg.overlays.live) {
      pW = 52 * sc;
      ctx.fillStyle = "#8B0000";
      ctx.fillRect(0, tkY, pW, tkH);
      ctx.save();
      ctx.font = `700 ${9 * sc}px Trebuchet MS,sans-serif`;
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("LIVE", pW / 2, tkY + tkH / 2);
      ctx.restore();
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(pW + 6 * sc, tkY + 2 * sc, W - pW - 12 * sc, tkH - 4 * sc);
    ctx.clip();
    ctx.font = `700 ${10 * sc}px Arial,sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(cfg.headline || "Breaking News...", pW + cfg.tickerX + 10 * sc, tkY + tkH / 2);
    ctx.restore();
  }
}

export default function SocialVideoEditor() {
  const [format,    setFormat]    = useState("reels");
  const [headline,  setHeadline]  = useState("Badi Khabar: Yahan likhein...");
  const [source,    setSource]    = useState("BBN NEWS");
  const [fontSize,  setFontSize]  = useState(22);
  const [barColor,  setBarColor]  = useState("#CC0000");
  const [overlays,  setOverlays]  = useState({ logo:true, strip:true, ticker:true, live:true });
  const [vidMeta,   setVidMeta]   = useState(null);
  const [exporting, setExporting] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [blobUrl,   setBlobUrl]   = useState(null);
  const [toast,     setToast]     = useState("");

  const canvasRef    = useRef(null);
  const videoElRef   = useRef(null);
  const animRef      = useRef(null);
  const exportingRef = useRef(false);
  const tickerXRef   = useRef(0);
  const stateRef     = useRef({});

  const fmt = FORMATS.find(f => f.id === format) || FORMATS[0];

  useEffect(() => {
    stateRef.current = { headline, source, fontSize, barColor, overlays };
  });

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2800); }

  const startLoop = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const canvas = canvasRef.current; if (!canvas) return;
    function draw() {
      const vid = videoElRef.current;
      if (!vid || exportingRef.current) { animRef.current = requestAnimationFrame(draw); return; }
      tickerXRef.current -= 1.5;
      const s = stateRef.current;
      drawFrame(canvas, vid, { ...s, tickerX: tickerXRef.current });
      animRef.current = requestAnimationFrame(draw);
    }
    draw();
  }, []);

  function handleVideoLoad(file) {
    if (!file) return;
    if (videoElRef.current) { videoElRef.current.pause(); videoElRef.current.src = ""; }
    const vid = document.createElement("video");
    vid.src = URL.createObjectURL(file);
    vid.muted = true; vid.playsInline = true; vid.crossOrigin = "anonymous";
    vid.onloadedmetadata = () => {
      const canvas = canvasRef.current;
      canvas.width  = fmt.w;
      canvas.height = fmt.h;
      videoElRef.current = vid;
      vid.loop = true;
      vid.play().catch(() => {});
      tickerXRef.current = 0;
      setVidMeta({ name: file.name, dur: vid.duration.toFixed(1), size: (file.size/1024/1024).toFixed(1) });
      startLoop();
      showToast("✅ Video load ho gayi!");
    };
  }

  // Resize canvas on format change
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.width  = fmt.w;
    canvas.height = fmt.h;
    if (videoElRef.current) startLoop();
    else drawFrame(canvas, null, stateRef.current || {});
  // eslint-disable-next-line
  }, [format]);

  const handleExport = async () => {
    const vid = videoElRef.current; if (!vid) return;
    setExporting(true); exportingRef.current = true;
    setProgress(0); setBlobUrl(null);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    vid.loop = false; vid.currentTime = 0;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const stream = canvas.captureStream(30);
    const mt = ["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"]
      .find(m => MediaRecorder.isTypeSupported(m)) || "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType: mt, videoBitsPerSecond: 8_000_000 });
    const chunks = [];
    recorder.ondataavailable = e => { if (e.data?.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mt });
      setBlobUrl(URL.createObjectURL(blob));
      exportingRef.current = false; setExporting(false); setProgress(100);
      vid.loop = true; vid.currentTime = 0; vid.play().catch(() => {});
      tickerXRef.current = 0; startLoop();
      showToast("✅ Video ready! Download karo.");
    };
    let tx = 0;
    function recDraw() {
      if (!exportingRef.current) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      tx -= 1.5;
      drawFrame(canvas, vid, { ...stateRef.current, tickerX: tx });
      setProgress(Math.min(99, Math.round((vid.currentTime / vid.duration) * 100)));
      animRef.current = requestAnimationFrame(recDraw);
    }
    recorder.start(100);
    vid.play().then(() => recDraw()).catch(err => {
      showToast("❌ Error: " + err.message);
      exportingRef.current = false; setExporting(false);
    });
    vid.onended = () => { if (recorder.state !== "inactive") recorder.stop(); };
    showToast("🔴 Recording shuru...");
  };

  function downloadVideo() {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl; a.download = `BBN_Social_${format}_${Date.now()}.webm`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  const toggleOverlay = key => setOverlays(prev => ({ ...prev, [key]: !prev[key] }));

  const isMobile = window.innerWidth <= 768;

  return (
    <div style={{ display:"flex", flexDirection: isMobile?"column":"row",
      height:"calc(100vh - 46px)", overflow:"hidden", background:"#060608" }}>

      {toast && (
        <div style={{ position:"fixed", bottom:20, left:"50%", transform:"translateX(-50%)",
          background:"#1c1c21", border:"1px solid #3a3a48", color:"#f0f0f5",
          padding:"8px 18px", borderRadius:8, fontSize:12, fontWeight:700,
          zIndex:999, pointerEvents:"none" }}>{toast}</div>
      )}

      {/* Canvas preview */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", background:"#060608", padding:12, gap:8, overflow:"hidden" }}>

        {/* Format selector */}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", justifyContent:"center" }}>
          {FORMATS.map(f => (
            <button key={f.id} onClick={() => setFormat(f.id)} style={{
              padding:"5px 10px", borderRadius:6, fontSize:10, fontWeight:700, cursor:"pointer",
              background: format===f.id ? "rgba(204,34,0,0.2)" : "var(--bg-card)",
              color: format===f.id ? "#fff" : "var(--txt-lo)",
              border: format===f.id ? "1.5px solid var(--red)" : "1px solid var(--border)",
              display:"flex", alignItems:"center", gap:4,
            }}>{f.icon} {f.label}</button>
          ))}
        </div>

        <canvas ref={canvasRef} width={fmt.w} height={fmt.h} style={{
          maxWidth:"100%", maxHeight: isMobile ? "220px" : "calc(100vh - 200px)",
          borderRadius:4, boxShadow:"0 4px 32px rgba(0,0,0,0.9)",
          objectFit:"contain",
        }}/>

        {blobUrl && (
          <button onClick={downloadVideo} style={{
            height:38, padding:"0 28px",
            background:"linear-gradient(135deg,#4CAF50,#2e7d32)",
            color:"#fff", border:"none", borderRadius:7,
            fontSize:13, fontWeight:800, cursor:"pointer",
          }}>⬇️ Download WEBM</button>
        )}
      </div>

      {/* Controls */}
      <div style={{ width: isMobile?"100%":"300px", flexShrink:0,
        background:"var(--bg-panel)", borderLeft:"1px solid var(--border)",
        overflowY:"auto", display:"flex", flexDirection:"column" }}>

        <div style={{ padding:"8px 12px", background:"var(--bg-base)",
          borderBottom:"1px solid var(--border)", fontSize:11, fontWeight:700,
          color:"var(--txt-md)", letterSpacing:1 }}>📱 SOCIAL VIDEO EDITOR</div>

        {/* Upload */}
        <div style={{ padding:12, borderBottom:"1px solid var(--border)" }}>
          <div style={{ fontSize:10, fontWeight:700, color:"var(--txt-lo)",
            letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>Upload Video</div>
          <label style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4,
            border:"2px dashed var(--border-hi)", borderRadius:7, padding:"14px 10px",
            cursor:"pointer", background:"var(--bg-card)", marginBottom:6 }}>
            <input type="file" accept="video/*" hidden onChange={e => handleVideoLoad(e.target.files[0])}/>
            <span style={{ fontSize:24 }}>🎬</span>
            <span style={{ fontSize:11, fontWeight:700, color:"var(--txt-md)" }}>
              {vidMeta ? `✅ ${vidMeta.name.substring(0,22)}` : "TAP TO UPLOAD VIDEO"}
            </span>
            {vidMeta && <span style={{ fontSize:10, color:"var(--txt-lo)" }}>
              {vidMeta.dur}s · {vidMeta.size}MB
            </span>}
          </label>
        </div>

        {/* Text */}
        <div style={{ padding:12, borderBottom:"1px solid var(--border)" }}>
          <div style={{ fontSize:10, fontWeight:700, color:"var(--txt-lo)",
            letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>Text</div>
          <textarea value={headline} onChange={e => setHeadline(e.target.value)} rows={2}
            style={{ width:"100%", background:"var(--bg-card)", border:"1px solid var(--border)",
              borderRadius:5, color:"var(--txt-hi)", fontSize:12, padding:"7px 9px",
              outline:"none", resize:"vertical", marginBottom:6, fontFamily:"inherit" }}
            placeholder="Headline yahan likhein..."/>
          <input value={source} onChange={e => setSource(e.target.value)}
            style={{ width:"100%", background:"var(--bg-card)", border:"1px solid var(--border)",
              borderRadius:5, color:"var(--txt-hi)", fontSize:12, padding:"6px 9px", outline:"none" }}
            placeholder="Source / Channel name"/>
          <div style={{ fontSize:10, color:"var(--txt-lo)", marginTop:8, marginBottom:4 }}>Font Size</div>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <input type="range" min={12} max={36} value={fontSize}
              onChange={e => setFontSize(Number(e.target.value))}
              style={{ flex:1, accentColor:"var(--red)" }}/>
            <span style={{ fontSize:10, color:"var(--txt-md)", minWidth:28 }}>{fontSize}px</span>
          </div>
        </div>

        {/* Bar color */}
        <div style={{ padding:12, borderBottom:"1px solid var(--border)" }}>
          <div style={{ fontSize:10, fontWeight:700, color:"var(--txt-lo)",
            letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>Bar Color</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {["#CC0000","#D4A520","#0d47a1","#1b5e20","#111111","#7b1fa2","#e65100"].map(c => (
              <div key={c} onClick={() => setBarColor(c)} style={{
                width:22, height:22, borderRadius:4, cursor:"pointer", background:c,
                border: barColor===c ? "2.5px solid #fff" : "1.5px solid transparent",
                transform: barColor===c ? "scale(1.15)" : "scale(1)", transition:"all 0.12s",
              }}/>
            ))}
          </div>
        </div>

        {/* Overlays */}
        <div style={{ padding:12, borderBottom:"1px solid var(--border)" }}>
          <div style={{ fontSize:10, fontWeight:700, color:"var(--txt-lo)",
            letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>Overlays</div>
          {OVERLAYS_LIST.map(({ key, label }) => (
            <div key={key} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <span style={{ flex:1, fontSize:11, color:"var(--txt-md)" }}>{label}</span>
              <button onClick={() => toggleOverlay(key)}
                className={`toggle-sw ${overlays[key] ? "on" : ""}`}/>
            </div>
          ))}
        </div>

        {/* Export */}
        <div style={{ padding:12 }}>
          {exporting && (
            <div style={{ marginBottom:8 }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                fontSize:10, color:"var(--txt-md)", marginBottom:4 }}>
                <span>Recording...</span><span>{progress}%</span>
              </div>
              <div style={{ height:4, background:"var(--border)", borderRadius:2 }}>
                <div style={{ width:`${progress}%`, height:"100%",
                  background:"var(--red)", borderRadius:2, transition:"width 0.2s" }}/>
              </div>
            </div>
          )}
          <button onClick={handleExport} disabled={exporting || !vidMeta} style={{
            width:"100%", height:42, borderRadius:7, border:"none",
            background: (!exporting && vidMeta) ? "linear-gradient(135deg,#CC0000,#880000)" : "#2a1a1a",
            color: (!exporting && vidMeta) ? "#fff" : "#666",
            fontSize:13, fontWeight:800, letterSpacing:1, cursor: (!exporting && vidMeta) ? "pointer":"not-allowed",
          }}>
            {exporting ? `Recording... ${progress}%` : "🎬 Record & Export"}
          </button>
        </div>
      </div>
    </div>
  );
}
