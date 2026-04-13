// ═══════════════════════════════════════════════════════════════
//  BBN MULTIPLEX — App.js
//  Main app — Google Login + all tabs
// ═══════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect, useCallback } from "react";
import "./App.css";
import PhotoNewsmaker  from "./PhotoNewsmaker";
import MultiplexPanel  from "./MultiplexPanel";
import SocialPhotoEditor from "./SocialPhotoEditor";
import VideoConverter  from "./VideoConverter";
import { signInWithGoogle, signOutUser, onAuthChange, saveUserData, loadUserData } from "./firebase";

// ── Video editor helpers ──────────────────────────────────────
function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(" "); let line = "", lines = [];
  for (let w of words) {
    const t = line ? line + " " + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  const tot = lines.length * lineH; let sY = y - tot / 2;
  for (let l of lines) { ctx.fillText(l, x, sY + lineH / 2); sY += lineH; }
}
function wrapTextLeft(ctx, text, x, y, maxW, lineH) {
  const words = text.split(" "); let line = "", lines = [];
  for (let w of words) {
    const t = line ? line + " " + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], x, y + i * lineH);
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
}
function drawLogo(ctx, W, sc) {
  const lx=W-44*sc, ly=10*sc, lr=20*sc;
  ctx.save(); ctx.globalAlpha=0.88; ctx.fillStyle="#0a0a0a";
  ctx.beginPath(); ctx.arc(lx+lr,ly+lr,lr,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle="#D4A520"; ctx.lineWidth=1.2*sc; ctx.stroke(); ctx.restore();
  ctx.save(); ctx.font=`900 ${13*sc}px Georgia,serif`;
  ctx.textAlign="center"; ctx.textBaseline="middle";
  const g=ctx.createLinearGradient(lx+lr,ly,lx+lr,ly+lr*2);
  g.addColorStop(0,"#F5D77A"); g.addColorStop(0.55,"#D4A520"); g.addColorStop(1,"#8B6508");
  ctx.fillStyle=g; ctx.fillText("BBN",lx+lr,ly+lr+0.5); ctx.restore();
}

const TABS = ["Multiplex Panel","Photo News Maker","News Video Editor","Social Photo Editor","Video Converter"];

export default function App() {
  const [activeTab,    setActiveTab]    = useState("Multiplex Panel");
  const [user,         setUser]         = useState(null);
  const [authLoading,  setAuthLoading]  = useState(true);
  const [signingIn,    setSigningIn]    = useState(false);
  const [globalLogo,   setGlobalLogo]   = useState(null);   // { url, dataUrl } — shared across all tools
  const [showLogoSetup,setShowLogoSetup]= useState(false);  // first-login logo upload modal
  const [logoSetupDone,setLogoSetupDone]= useState(false);
  const [logoUploading,setLogoUploading]= useState(false);

  // News Video Editor state
  const [headlineText, setHeadlineText] = useState("Headline yahan likhein...");
  const [newsBodyText, setNewsBodyText] = useState("");
  const [sourceText,   setSourceText]   = useState("BBN NEWS");
  const [template,     setTemplate]     = useState("classic");
  const [headlineSize, setHeadlineSize] = useState(16);
  const [textSize,     setTextSize]     = useState(12);
  const [tickerHeight, setTickerHeight] = useState(36);
  const [tickerSpeed,  setTickerSpeed]  = useState(2);
  const [textAlign,    setTextAlign]    = useState("left");
  const [barColor,     setBarColor]     = useState("#CC0000");
  const [textBg,       setTextBg]       = useState("solid");
  const [textColor,    setTextColor]    = useState("#ffffff");
  const [overlay, setOverlay] = useState({ logo:true, bar:true, strip:true, live:true });
  const [vidMeta,    setVidMeta]    = useState(null);
  const [exporting,  setExporting]  = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [blobUrl,    setBlobUrl]    = useState(null);
  const [toast,      setToast]      = useState({ msg:"", type:"", show:false });

  const canvasRef    = useRef(null);
  const videoElRef   = useRef(null);
  const animFrameRef = useRef(null);
  const tickerXRef   = useRef(0);
  const exportingRef = useRef(false);
  const stateRef     = useRef({});

  // ── Auth listener ────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthChange(async u => {
      setUser(u);
      setAuthLoading(false);
      if (u?.uid) {
        // Load user data — check if logo already set
        const data = await loadUserData(u.uid);
        if (data?.globalLogo?.url) {
          setGlobalLogo(data.globalLogo);
          setLogoSetupDone(true);
        } else {
          // First login or no logo set — show setup modal
          setShowLogoSetup(true);
        }
      }
    });
    return () => unsub();
  }, []);

  async function handleSignIn() {
    setSigningIn(true);
    await signInWithGoogle();
    setSigningIn(false);
  }

  // ── Global logo upload (Cloudinary) ──────────────────────────
  const CLD_CLOUD  = "dlzowheen";
  const CLD_PRESET = "BBN Multiplex";
  async function uploadLogoToCloudinary(file) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", CLD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLD_CLOUD}/image/upload`, { method:"POST", body:fd });
    const data = await res.json();
    if (data.secure_url) return data.secure_url;
    throw new Error(data.error?.message || "Upload failed");
  }

  async function handleGlobalLogoFile(e) {
    const f = e.target.files[0]; if (!f) return;
    setLogoUploading(true);
    try {
      // Local preview instantly
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target.result;
        let url = dataUrl;
        try { url = await uploadLogoToCloudinary(f); } catch(err) { console.warn("Cloudinary failed, using local"); }
        const logo = { url, dataUrl };
        setGlobalLogo(logo);
        if (user?.uid) await saveUserData(user.uid, { globalLogo: logo });
        setLogoSetupDone(true);
        setShowLogoSetup(false);
      };
      reader.readAsDataURL(f);
    } catch(err) { console.warn("Logo upload error:", err); }
    setLogoUploading(false);
  }

  async function skipLogoSetup() {
    setLogoSetupDone(true);
    setShowLogoSetup(false);
    if (user?.uid) await saveUserData(user.uid, { globalLogo: null, logoSetupSkipped: true });
  }

  // ── Logo Setup Modal ─────────────────────────────────────────
  function LogoSetupModal() {
    if (!showLogoSetup) return null;
    return (
      <div style={{
        position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:99999,
        display:"flex", alignItems:"center", justifyContent:"center", padding:20
      }}>
        <div style={{
          background:"#16161a", border:"1px solid #2a2a35", borderRadius:14,
          padding:"28px 24px", maxWidth:360, width:"100%", textAlign:"center"
        }}>
          {/* BBN Gold Icon */}
          <div style={{
            width:64, height:64, borderRadius:"50%", background:"#0a0a0a",
            border:"2px solid #D4A520", display:"flex", alignItems:"center",
            justifyContent:"center", margin:"0 auto 16px", fontSize:18,
            fontWeight:900, color:"#D4A520", letterSpacing:1
          }}>BBN</div>

          <div style={{ fontSize:16, fontWeight:800, color:"#f0f0f5", marginBottom:6 }}>
            Apna Channel Logo Upload Karo
          </div>
          <div style={{ fontSize:12, color:"#666", marginBottom:20, lineHeight:1.7 }}>
            Yeh logo <strong style={{color:"#D4A520"}}>har jagah automatically use hoga</strong> —
            Photo News Maker, Video Editor, sab mein.<br/>
            Baad mein bhi change kar sakte ho Settings se.
          </div>

          {/* Upload box */}
          <label style={{
            display:"flex", flexDirection:"column", alignItems:"center", gap:8,
            border:"2px dashed #D4A520", borderRadius:10, padding:"20px 16px",
            cursor:"pointer", background:"rgba(212,165,32,0.04)", marginBottom:12
          }}>
            <input type="file" accept="image/*" hidden onChange={handleGlobalLogoFile}/>
            <span style={{ fontSize:36 }}>{logoUploading ? "⏳" : "📰"}</span>
            <span style={{ fontSize:13, fontWeight:700, color:"#D4A520" }}>
              {logoUploading ? "Upload ho raha hai..." : "TAP TO UPLOAD LOGO"}
            </span>
            <span style={{ fontSize:11, color:"#555" }}>PNG transparent background best hai</span>
            {logoUploading && (
              <div style={{ width:"100%", height:3, background:"#222", borderRadius:2 }}>
                <div style={{ width:"60%", height:"100%", background:"#D4A520", borderRadius:2,
                  animation:"pulse 1s infinite" }}/>
              </div>
            )}
          </label>

          <button onClick={skipLogoSetup} style={{
            width:"100%", height:36, borderRadius:7, fontSize:12, fontWeight:600,
            background:"transparent", border:"1px solid #333", color:"#555", cursor:"pointer"
          }}>
            Abhi Nahi — Baad Mein Upload Karunga
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    stateRef.current = {
      template, headlineText, newsBodyText, sourceText,
      headlineSize, textSize, tickerHeight, tickerSpeed,
      barColor, textBg, textColor, textAlign, overlay,
    };
  });

  const showToast = useCallback((msg, type="") => {
    setToast({ msg, type, show:true });
    setTimeout(() => setToast(t => ({ ...t, show:false })), 3000);
  }, []);

  const drawTicker = useCallback((ctx, W, H, sc, tickerX, s) => {
    const fs = s.textSize || 12;
    const bH = (s.tickerHeight || 36) * sc;
    const bY = H - bH;
    if (s.textBg === "solid") { ctx.fillStyle = s.barColor; ctx.fillRect(0, bY, W, bH); }
    else if (s.textBg === "gradient") {
      const g = ctx.createLinearGradient(0, bY, W, bY+bH);
      g.addColorStop(0, s.barColor); g.addColorStop(1, "rgba(0,0,0,0.9)");
      ctx.fillStyle = g; ctx.fillRect(0, bY, W, bH);
    }
    let pW = 0;
    if (s.textBg !== "transparent" && s.overlay.live) {
      pW = 46*sc; ctx.fillStyle = "#8B0000"; ctx.fillRect(0, bY, pW, bH);
      ctx.save(); ctx.font = `700 ${9*sc}px 'Trebuchet MS',sans-serif`;
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("LIVE", pW/2, bY+bH/2); ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.fillRect(pW, bY+4*sc, 1*sc, bH-8*sc);
    }
    ctx.save(); ctx.beginPath(); ctx.rect(pW+4*sc, bY, W-pW-8*sc, bH); ctx.clip();
    ctx.font = `700 ${fs*sc}px Arial,sans-serif`;
    ctx.fillStyle = s.textColor; ctx.textBaseline = "middle";
    const hl = s.headlineText || "Breaking News...";
    if (s.textAlign === "center") { ctx.textAlign="center"; ctx.fillText(hl,(pW+W)/2,bY+bH/2); }
    else if (s.textAlign === "right") { ctx.textAlign="right"; ctx.fillText(hl,W-8*sc,bY+bH/2); }
    else {
      ctx.textAlign = "left";
      const tW = ctx.measureText(hl).width;
      const dx = (pW+8*sc) + (tickerX % (tW+W));
      ctx.fillText(hl, dx, bY+bH/2); ctx.fillText(hl, dx+tW+80*sc, bY+bH/2);
    }
    ctx.restore();
  }, []);

  const drawTemplate = useCallback((ctx, W, H, videoEl, tickerX, s) => {
    const sc = W/400;
    const hl = s.headlineText || "Breaking News";
    const src = s.sourceText || "BBN NEWS";
    const hs = s.headlineSize || 16;
    if (s.template === "classic") {
      if (videoEl) ctx.drawImage(videoEl, 0, 0, W, H);
      if (s.overlay.strip) { ctx.fillStyle="#CC0000"; ctx.fillRect(0,0,W,4*sc); }
      if (s.overlay.logo) drawLogo(ctx, W, sc);
      if (s.overlay.bar) drawTicker(ctx, W, H, sc, tickerX, s);
    } else if (s.template === "news") {
      const tH=(s.tickerHeight||36)*sc, vH=Math.floor((H-tH)*0.52), txH=Math.floor((H-tH)*0.30);
      if (videoEl) { ctx.save(); ctx.beginPath(); ctx.rect(0,0,W,vH); ctx.clip(); ctx.drawImage(videoEl,0,0,W,vH); ctx.restore(); }
      ctx.fillStyle="#CC0000"; ctx.fillRect(0,vH,W,3*sc);
      ctx.fillStyle="#ffffff"; ctx.fillRect(0,vH+3*sc,W,txH);
      const by=vH+3*sc+10*sc;
      ctx.fillStyle="#CC0000"; const bt="Breaking News"; ctx.font=`700 ${9*sc}px Arial,sans-serif`;
      const bW=ctx.measureText(bt).width+16*sc, bHh=14*sc;
      roundRect(ctx,W/2-bW/2,by,bW,bHh,3*sc); ctx.fill();
      ctx.fillStyle="#fff"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(bt,W/2,by+bHh/2);
      const bd=s.newsBodyText||hl;
      ctx.font=`900 ${hs*sc}px Arial,sans-serif`; ctx.fillStyle="#111"; ctx.textAlign="center"; ctx.textBaseline="middle";
      wrapText(ctx,bd,W/2,by+bHh+(txH-bHh-16*sc)/2+6*sc,W-24*sc,hs*sc*1.4);
      ctx.font=`700 ${7*sc}px 'Trebuchet MS',sans-serif`; ctx.fillStyle="#aaa"; ctx.textAlign="center"; ctx.textBaseline="bottom";
      ctx.fillText(src.toUpperCase(),W/2,vH+3*sc+txH-4*sc);
      if (s.overlay.bar) drawTicker(ctx,W,H,sc,tickerX,s);
      if (s.overlay.strip) { ctx.fillStyle="#CC0000"; ctx.fillRect(0,0,W,4*sc); }
      if (s.overlay.logo) drawLogo(ctx,W,sc);
    } else if (s.template === "breaking") {
      if (videoEl) ctx.drawImage(videoEl,0,0,W,H);
      if (s.overlay.strip) { ctx.fillStyle="#CC0000"; ctx.fillRect(0,0,W,4*sc); }
      const tH=(s.tickerHeight||36)*sc, oY=H*0.42, oH=H-oY-tH;
      const g=ctx.createLinearGradient(0,oY,0,oY+oH);
      g.addColorStop(0,"rgba(0,0,0,0)"); g.addColorStop(0.3,"rgba(0,0,0,0.82)"); g.addColorStop(1,"rgba(0,0,0,0.92)");
      ctx.fillStyle=g; ctx.fillRect(0,oY,W,oH);
      const lY=oY+14*sc;
      if (s.overlay.live) {
        ctx.fillStyle="#CC0000"; const lt="LIVE Breaking News"; ctx.font=`700 ${9*sc}px Arial,sans-serif`;
        const lW=ctx.measureText(lt).width+14*sc; roundRect(ctx,10*sc,lY,lW,14*sc,3*sc); ctx.fill();
        ctx.fillStyle="#fff"; ctx.textAlign="left"; ctx.textBaseline="middle"; ctx.fillText(lt,17*sc,lY+7*sc);
      }
      ctx.font=`900 ${Math.min(hs,20)*sc}px Arial,sans-serif`; ctx.fillStyle="#fff"; ctx.textAlign="left";
      wrapTextLeft(ctx,hl,10*sc,lY+22*sc,W-20*sc,Math.min(hs,20)*sc*1.4);
      if (s.overlay.bar) drawTicker(ctx,W,H,sc,tickerX,s);
      if (s.overlay.logo) drawLogo(ctx,W,sc);
    } else if (s.template === "split") {
      if (videoEl) ctx.drawImage(videoEl,0,0,W,H);
      if (s.overlay.strip) { ctx.fillStyle="#CC0000"; ctx.fillRect(0,0,W,4*sc); }
      const tH=(s.tickerHeight||36)*sc, bH=48*sc, bY=H-tH-bH;
      ctx.fillStyle="rgba(0,0,0,0.86)"; ctx.fillRect(0,bY,W,bH);
      ctx.fillStyle="#CC0000"; ctx.fillRect(0,bY,5*sc,bH);
      ctx.font=`700 ${7.5*sc}px 'Trebuchet MS',sans-serif`; ctx.fillStyle="#D4A520"; ctx.textAlign="left"; ctx.textBaseline="top";
      ctx.fillText(src.toUpperCase(),12*sc,bY+5*sc);
      ctx.font=`900 ${Math.min(hs,15)*sc}px Arial,sans-serif`; ctx.fillStyle="#fff"; ctx.textAlign="left"; ctx.textBaseline="middle";
      wrapTextLeft(ctx,hl,12*sc,bY+bH*0.62,W-20*sc,Math.min(hs,15)*sc*1.35);
      if (s.overlay.bar) drawTicker(ctx,W,H,sc,tickerX,s);
      if (s.overlay.logo) drawLogo(ctx,W,sc);
    }
  }, [drawTicker]);

  const startPreviewLoop = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    function draw() {
      const vid = videoElRef.current;
      if (!vid || exportingRef.current) { animFrameRef.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      tickerXRef.current -= stateRef.current.tickerSpeed || 2;
      drawTemplate(ctx, canvas.width, canvas.height, vid, tickerXRef.current, stateRef.current);
      animFrameRef.current = requestAnimationFrame(draw);
    }
    draw();
  }, [drawTemplate]);

  const handleVideoLoad = (file) => {
    if (!file) return;
    if (videoElRef.current) { videoElRef.current.pause(); videoElRef.current.src = ""; }
    const vid = document.createElement("video");
    vid.src = URL.createObjectURL(file);
    vid.muted = false; vid.volume = 1; vid.playsInline = true; vid.crossOrigin = "anonymous";
    vid.onloadedmetadata = () => {
      const canvas = canvasRef.current;
      canvas.width = vid.videoWidth; canvas.height = vid.videoHeight;
      videoElRef.current = vid;
      vid.loop = true;
      vid.play().catch(() => { vid.muted = true; vid.play(); });
      tickerXRef.current = 0;
      setVidMeta({ W:vid.videoWidth, H:vid.videoHeight, dur:vid.duration.toFixed(1), size:(file.size/1024/1024).toFixed(1), name:file.name });
      startPreviewLoop();
      showToast("Video load ho gayi", "green");
    };
    vid.onerror = () => showToast("Video load error", "red");
  };

  const handleExport = async () => {
    const vid = videoElRef.current; if (!vid) return;
    setExporting(true); exportingRef.current = true;
    setProgress(0); setBlobUrl(null);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    vid.loop = false; vid.currentTime = 0;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const canvasStream = canvas.captureStream(30);
    let finalStream = canvasStream;
    try {
      vid.muted = false; vid.volume = 1;
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") await ac.resume();
      const dest = ac.createMediaStreamDestination();
      const src2 = ac.createMediaElementSource(vid);
      src2.connect(ac.destination); src2.connect(dest);
      dest.stream.getAudioTracks().forEach(t => finalStream.addTrack(t));
    } catch(e) { console.warn("Audio:", e.message); }
    const mt = ["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"]
      .find(m => MediaRecorder.isTypeSupported(m)) || "video/webm";
    const recorder = new MediaRecorder(finalStream, { mimeType:mt, videoBitsPerSecond:6_000_000 });
    const chunks = [];
    recorder.ondataavailable = e => { if (e.data && e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type:mt });
      setBlobUrl(URL.createObjectURL(blob));
      exportingRef.current = false; setExporting(false); setProgress(100);
      vid.loop = true; vid.currentTime = 0; vid.play().catch(()=>{});
      tickerXRef.current = 0; startPreviewLoop();
      showToast("Video ready - Download karo", "green");
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
      showToast("Error: " + err.message, "red");
      exportingRef.current = false; setExporting(false);
    });
    vid.onended = () => { if (recorder.state !== "inactive") recorder.stop(); };
    showToast("Recording shuru...", "red");
  };

  const downloadVideo = async (ext) => {
    if (!blobUrl) return;
    if (ext === "webm") {
      const a = document.createElement("a");
      a.href = blobUrl; a.download = `BBN_${template}_${Date.now()}.webm`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      showToast("WEBM download shuru", "green");
      return;
    }
    showToast("MP4 convert ho raha hai... wait karo", "gold");
    try {
      const blob = await fetch(blobUrl).then(r => r.blob());
      const form = new FormData();
      form.append("video", blob, "video.webm");
      const res = await fetch("https://bbn-multiplex-backend.onrender.com/convert", { method:"POST", body:form });
      if (!res.ok) throw new Error("Server error: " + res.status);
      const mp4Blob = await res.blob();
      const url = URL.createObjectURL(mp4Blob);
      const a = document.createElement("a");
      a.href = url; a.download = `BBN_${template}_${Date.now()}.mp4`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("MP4 ready!", "green");
    } catch(e) { showToast("Convert failed: " + e.message, "red"); }
  };

  const toggleOverlay = (key) => setOverlay(prev => ({ ...prev, [key]: !prev[key] }));

  // ── Loading screen ────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
        background:"#0c0c0e", flexDirection:"column", gap:16 }}>
        <div style={{ fontSize:28, fontWeight:900, letterSpacing:4,
          background:"linear-gradient(135deg,#F5D77A,#D4A520,#8B6508)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>BBN</div>
        <div style={{ fontSize:12, color:"#555", letterSpacing:2 }}>Loading...</div>
      </div>
    );
  }

  // ── Login screen ──────────────────────────────────────────────
  if (!user) {
    return (
      <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
        background:"#0c0c0e", padding:20 }}>
        <div style={{ maxWidth:380, width:"100%", textAlign:"center" }}>
          {/* Logo */}
          <div style={{ marginBottom:32 }}>
            <div style={{ fontSize:48, fontWeight:900, letterSpacing:6,
              background:"linear-gradient(135deg,#F5D77A,#D4A520,#8B6508)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              backgroundClip:"text", marginBottom:8 }}>BBN</div>
            <div style={{ fontSize:13, color:"#D4A520", letterSpacing:3,
              fontWeight:700, marginBottom:4 }}>MULTIPLEX</div>
            <div style={{ fontSize:11, color:"#555", letterSpacing:1.5 }}>
              NEWS PRODUCTION STUDIO
            </div>
          </div>

          {/* Login card */}
          <div style={{ background:"#16161a", border:"1px solid #2a2a35",
            borderRadius:12, padding:"28px 24px" }}>
            <div style={{ fontSize:15, fontWeight:700, color:"#f0f0f5", marginBottom:6 }}>
              Sign in to BBN Multiplex
            </div>
            <div style={{ fontSize:12, color:"#666", marginBottom:24, lineHeight:1.6 }}>
              Google account se login karo — apna data kisi bhi device pe access karo
            </div>

            <button onClick={handleSignIn} disabled={signingIn} style={{
              width:"100%", height:46, borderRadius:8,
              background: signingIn ? "#1a1a1a" : "#fff",
              color: signingIn ? "#555" : "#333",
              border:"none", fontSize:14, fontWeight:700,
              cursor: signingIn ? "not-allowed" : "pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:10,
              transition:"all 0.15s",
            }}>
              {signingIn ? (
                <span style={{ color:"#666" }}>⏳ Signing in...</span>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-4.9l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.2 0-9.6-3-11.4-7.2l-6.6 5.1C9.5 39.5 16.3 44 24 44z"/>
                    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.7 5.8l6.2 5.2C40.8 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
                  </svg>
                  Google se Login Karo
                </>
              )}
            </button>

            <div style={{ marginTop:16, fontSize:11, color:"#444", lineHeight:1.6 }}>
              🔒 Sirf Google account use hoga — koi password nahi
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main App (logged in) ──────────────────────────────────────
  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column",
      overflow:"hidden", background:"#0c0c0e" }}>

      <LogoSetupModal/>

      {/* Top Nav */}
      <div className="top-nav">
        <div className="nav-logo">BBN</div>
        {TABS.map(tab => (
          <button key={tab} className={`nav-tab ${activeTab===tab?"active":""}`}
            onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
        <div style={{ flex:1 }}/>
        {/* User avatar + logout */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          {user.photoURL && (
            <img src={user.photoURL} alt="" style={{ width:26, height:26,
              borderRadius:"50%", border:"1.5px solid var(--border-hi)" }}/>
          )}
          <span style={{ fontSize:11, color:"var(--txt-lo)", display:"none" }}
            className="hide-mobile">{user.displayName?.split(" ")[0]}</span>
          <button onClick={signOutUser} style={{
            height:26, padding:"0 10px", borderRadius:4,
            border:"1px solid var(--border)", background:"transparent",
            color:"var(--txt-lo)", fontSize:10, fontWeight:700, cursor:"pointer",
          }}>Logout</button>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "Multiplex Panel"    && <MultiplexPanel onNavigate={setActiveTab} user={user}/>}
      {activeTab === "Photo News Maker"   && <PhotoNewsmaker user={user} globalLogo={globalLogo}/>}
      {activeTab === "Social Photo Editor" && <SocialPhotoEditor user={user} globalLogo={globalLogo}/>}
      {activeTab === "Video Converter"    && <VideoConverter/>}

      {/* News Video Editor */}
      <div className="editor-body" style={{ display: activeTab==="News Video Editor" ? "grid" : "none" }}>
        <div className="preview-panel">
          <div className="canvas-wrapper">
            <canvas ref={canvasRef} className="preview-canvas" style={{ display: vidMeta?"block":"none" }}/>
            {!vidMeta && (
              <div className="monitor-empty">
                <div style={{ fontSize:44, opacity:0.25 }}>&#9654;</div>
                <p>Koi video load nahi<br/>Right panel mein video upload karo</p>
              </div>
            )}
          </div>
          <div className="timeline-bar">
            <div className="timeline-controls">
              <div className="timeline-track">
                <div className="timeline-progress" style={{ width:`${progress}%` }}/>
              </div>
              <span className="timeline-time">{progress}%</span>
            </div>
          </div>
          {blobUrl && (
            <div className="dl-row">
              <button className="dl-btn webm" onClick={() => downloadVideo("webm")}>&#8595; WEBM</button>
              <button className="dl-btn mp4"  onClick={() => downloadVideo("mp4")}>&#127916; MP4</button>
            </div>
          )}
        </div>

        <div className="controls-panel">
          <div className="control-section">
            <div className="control-label">Upload Video</div>
            <label className="upload-btn">
              &#8679; Video Select Karo
              <input type="file" accept="video/*" hidden onChange={e => handleVideoLoad(e.target.files[0])}/>
            </label>
            {vidMeta && (
              <div className="file-name">
                &#10003; {vidMeta.name.length>22 ? vidMeta.name.substring(0,20)+"..." : vidMeta.name}
                <br/><span style={{color:"#666"}}>{vidMeta.W}x{vidMeta.H} - {vidMeta.dur}s - {vidMeta.size}MB</span>
              </div>
            )}
          </div>
          <div className="control-section">
            <div className="control-label">Template</div>
            <div className="tpl-grid">
              {[["classic","Classic"],["news","News"],["breaking","Breaking"],["split","Headline"]].map(([id,label]) => (
                <button key={id} className={`tpl-btn ${template===id?"active":""}`} onClick={() => setTemplate(id)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="control-section">
            <div className="control-label">Text</div>
            <div className="sub-label">Ticker / Headline</div>
            <textarea className="control-input" rows={2} value={headlineText} onChange={e => setHeadlineText(e.target.value)} placeholder="Headline yahan likhein..."/>
            {template==="news" && <>
              <div className="sub-label">News Body</div>
              <textarea className="control-input" rows={2} value={newsBodyText} onChange={e => setNewsBodyText(e.target.value)} placeholder="News body yahan..."/>
            </>}
            <div className="sub-label">Channel / Source</div>
            <input className="control-input" value={sourceText} onChange={e => setSourceText(e.target.value)}/>
          </div>
          <div className="control-section">
            <div className="control-label">Layout</div>
            {[["Headline Size",headlineSize,setHeadlineSize,8,30,"px"],["Ticker Font",textSize,setTextSize,8,24,"px"],["Ticker Height",tickerHeight,setTickerHeight,24,60,"px"],["Scroll Speed",tickerSpeed,setTickerSpeed,1,8,"x"]].map(([label,val,setter,min,max,unit]) => (
              <div className="slider-row" key={label}>
                <span className="slider-name">{label}</span>
                <input type="range" min={min} max={max} value={val} onChange={e => setter(Number(e.target.value))}/>
                <span className="slider-val">{val}{unit}</span>
              </div>
            ))}
            <div className="sub-label">Alignment</div>
            <div className="seg-group">
              {[["left","Scroll"],["center","Center"],["right","Right"]].map(([v,label]) => (
                <button key={v} className={`seg-btn ${textAlign===v?"active":""}`} onClick={() => setTextAlign(v)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="control-section">
            <div className="control-label">Colour</div>
            <div className="sub-label">Text Colour</div>
            <div className="color-row">
              {[["#ffffff","White","#ddd","#111"],["#FFFF00","Yellow","#FFFF00","#111"],["#CC0000","Red","#CC0000","#fff"],["#D4A520","Gold","#D4A520","#111"],["#4CAF50","Green","#4CAF50","#fff"],["#111111","Black","#333","#fff"]].map(([val,label,bg,fg]) => (
                <button key={val} className={`color-chip ${textColor===val?"selected":""}`} style={{background:bg,color:fg,borderColor:textColor===val?"#fff":"transparent"}} onClick={() => setTextColor(val)}>{label}</button>
              ))}
            </div>
            <div className="sub-label">Ticker BG</div>
            <div className="seg-group">
              {["solid","transparent","gradient"].map(v => (
                <button key={v} className={`seg-btn ${textBg===v?"active":""}`} onClick={() => setTextBg(v)}>{v}</button>
              ))}
            </div>
            <div className="sub-label">Bar Colour</div>
            <div className="swatch-grid">
              {["#CC0000","#1a237e","#1b5e20","#1a1a1a","#D4A520","#4a148c","#e65100","#006064","#880e4f","#263238"].map(c => (
                <div key={c} className={`swatch ${barColor===c?"selected":""}`} style={{background:c,borderColor:barColor===c?"#fff":"transparent"}} onClick={() => setBarColor(c)}/>
              ))}
            </div>
          </div>
          <div className="control-section">
            <div className="control-label">Overlay</div>
            {[["BBN Logo Badge","logo"],["Ticker Bar","bar"],["Top Red Strip","strip"],["LIVE Badge","live"]].map(([label,key]) => (
              <div key={key} className="toggle-row">
                <span className="toggle-lbl">{label}</span>
                <button className={`toggle-sw ${overlay[key]?"on":""}`} onClick={() => toggleOverlay(key)}/>
              </div>
            ))}
          </div>
          <button className="export-btn" onClick={handleExport} disabled={exporting||!vidMeta}>
            {exporting ? `Recording... ${progress}%` : "Record & Export"}
          </button>
        </div>
      </div>

      <div className={`bbn-toast ${toast.show?"show":""} ${toast.type}`}>{toast.msg}</div>
    </div>
  );
}
