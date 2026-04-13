// ═══════════════════════════════════════════════════════════════
//  BBN MULTIPLEX — SocialPhotoEditor.js
//  Instagram / Facebook / Twitter jaisi photo editing
//  Replace kiya: SocialVideoEditor.js
// ═══════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect, useCallback } from "react";
import { saveUserData, loadUserData } from "./firebase";

// ── Canvas size presets ───────────────────────────────────────
const FORMATS = [
  { id:"square",    label:"Square",         w:1080, h:1080, icon:"⬛", ratio:"1:1",  platform:"Instagram Post" },
  { id:"portrait",  label:"Portrait",       w:1080, h:1350, icon:"📱", ratio:"4:5",  platform:"Instagram Feed" },
  { id:"story",     label:"Story / Reel",   w:1080, h:1920, icon:"📲", ratio:"9:16", platform:"Instagram Story" },
  { id:"landscape", label:"Landscape",      w:1920, h:1080, icon:"🖥️", ratio:"16:9", platform:"Facebook / YouTube" },
  { id:"twitter",   label:"Twitter/X",      w:1200, h:675,  icon:"🐦", ratio:"16:9", platform:"Twitter / X" },
  { id:"whatsapp",  label:"WhatsApp",        w:1080, h:1080, icon:"💬", ratio:"1:1",  platform:"WhatsApp Status" },
];

// ── Filters (CSS-style) ───────────────────────────────────────
const FILTERS = [
  { id:"none",    label:"Normal",    css:"none" },
  { id:"vivid",   label:"Vivid",     css:"contrast(1.3) saturate(1.6) brightness(1.05)" },
  { id:"warm",    label:"Warm",      css:"sepia(30%) saturate(1.4) brightness(1.05)" },
  { id:"cool",    label:"Cool",      css:"hue-rotate(15deg) saturate(1.2) brightness(1.05)" },
  { id:"bw",      label:"B&W",       css:"grayscale(100%) contrast(1.2)" },
  { id:"fade",    label:"Fade",      css:"contrast(0.85) brightness(1.1) saturate(0.8)" },
  { id:"drama",   label:"Drama",     css:"contrast(1.5) brightness(0.88) saturate(1.2)" },
  { id:"golden",  label:"Golden",    css:"sepia(60%) saturate(1.8) contrast(1.1) brightness(1.05)" },
  { id:"matte",   label:"Matte",     css:"contrast(0.9) brightness(1.08) saturate(0.7)" },
  { id:"neon",    label:"Neon",      css:"hue-rotate(180deg) saturate(2) brightness(0.9)" },
  { id:"cinema",  label:"Cinema",    css:"contrast(1.2) brightness(0.9) sepia(20%) saturate(1.1)" },
  { id:"pastel",  label:"Pastel",    css:"brightness(1.15) saturate(0.75) contrast(0.85)" },
];

// ── Sticker / Emoji overlays ──────────────────────────────────
const STICKERS = ["🔥","⚡","💯","🏆","📣","📢","🎯","💥","🌟","❤️","👏","🚨","📌","🗞️","📰","🎬","📸","💪","✅","🔴"];

// ── Text style presets ────────────────────────────────────────
const TEXT_STYLES = [
  { id:"bold_white",  label:"Bold White", color:"#fff",     bg:"transparent", shadow:true,  font:"900 italic" },
  { id:"red_box",     label:"Red Box",    color:"#fff",     bg:"#CC0000",     shadow:false, font:"800" },
  { id:"gold_box",    label:"Gold Box",   color:"#111",     bg:"#D4A520",     shadow:false, font:"800" },
  { id:"dark_box",    label:"Dark Box",   color:"#fff",     bg:"rgba(0,0,0,0.75)", shadow:false, font:"700" },
  { id:"outline",     label:"Outline",    color:"#fff",     bg:"transparent", shadow:false, font:"900", stroke:true },
  { id:"neon_glow",   label:"Neon Glow",  color:"#00FFFF",  bg:"transparent", shadow:true,  font:"800", glow:true },
  { id:"minimal",     label:"Minimal",    color:"#fff",     bg:"transparent", shadow:false, font:"300" },
  { id:"newspaper",   label:"Newsprint",  color:"#1a1a1a",  bg:"rgba(245,240,230,0.92)", shadow:false, font:"900" },
];

// ── Cloudinary ────────────────────────────────────────────────
const CLD_CLOUD  = "dlzowheen";
const CLD_PRESET = "BBN Multiplex";
async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLD_CLOUD}/image/upload`, { method:"POST", body:fd });
  const d = await res.json();
  if(d.secure_url) return d.secure_url;
  throw new Error(d.error?.message||"Upload failed");
}

// ── Main Canvas Draw ──────────────────────────────────────────
function drawCanvas(canvas, photoImg, logoImg, cfg) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const sc = W / 1080;

  // ── Background ──
  if (!photoImg) {
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#1a1a2e"); bg.addColorStop(1, "#060608");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.font = `300 ${14*sc}px Arial`; ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("📸 Photo Upload Karo", W/2, H/2);
    ctx.restore();
    return;
  }

  // ── Draw Photo with adjustments ──
  ctx.save();
  let filter = "";
  const fil = FILTERS.find(f => f.id === cfg.filter);
  if (fil && fil.css !== "none") filter = fil.css;
  filter = `brightness(${(cfg.brightness||100)/100}) contrast(${(cfg.contrast||100)/100}) saturate(${(cfg.saturation||100)/100}) ${filter}`;
  if(cfg.blur > 0) filter += ` blur(${cfg.blur*sc}px)`;
  ctx.filter = filter.trim();
  const iW = photoImg.naturalWidth||1, iH = photoImg.naturalHeight||1;
  const scale = Math.max(W/iW, H/iH);
  const dW = iW*scale, dH = iH*scale;
  ctx.translate(W/2, H/2);
  ctx.rotate(((cfg.rotation||0)*Math.PI)/180);
  ctx.scale(cfg.flipH?-1:1, cfg.flipV?-1:1);
  ctx.drawImage(photoImg, -dW/2+(cfg.panX||0)*sc, -dH/2+(cfg.panY||0)*sc, dW, dH);
  ctx.restore();

  // ── Warmth / Cool tint ──
  if((cfg.warmth||0) !== 0){
    ctx.save(); ctx.globalAlpha = Math.abs(cfg.warmth)/300;
    ctx.fillStyle = cfg.warmth > 0 ? "#ff7700" : "#0066ff";
    ctx.fillRect(0,0,W,H); ctx.restore();
  }
  // ── Vignette ──
  if((cfg.vignette||0) > 0){
    const vg = ctx.createRadialGradient(W/2,H/2,H*0.25,W/2,H/2,H*0.85);
    vg.addColorStop(0,"rgba(0,0,0,0)");
    vg.addColorStop(1,`rgba(0,0,0,${cfg.vignette/100})`);
    ctx.fillStyle = vg; ctx.fillRect(0,0,W,H);
  }
  // ── Fade edges ──
  if(cfg.fadeEdges){
    const fe = ctx.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,H*0.75);
    fe.addColorStop(0,"rgba(0,0,0,0)"); fe.addColorStop(1,"rgba(0,0,0,0.7)");
    ctx.fillStyle = fe; ctx.fillRect(0,0,W,H);
  }
  // ── Grain overlay ──
  if(cfg.grain > 0){
    ctx.save(); ctx.globalAlpha = cfg.grain / 200;
    for(let i=0;i<H*W/800;i++){
      const x=Math.random()*W, y=Math.random()*H, r=Math.random()*1.5;
      ctx.fillStyle = Math.random()>0.5?"#fff":"#000";
      ctx.fillRect(x,y,r,r);
    }
    ctx.restore();
  }

  // ── Gradient overlay ──
  if(cfg.gradStyle && cfg.gradStyle !== "none"){
    let grad;
    if(cfg.gradStyle === "bottom"){
      grad = ctx.createLinearGradient(0, H*0.4, 0, H);
      grad.addColorStop(0,"rgba(0,0,0,0)"); grad.addColorStop(1,"rgba(0,0,0,0.85)");
    } else if(cfg.gradStyle === "top"){
      grad = ctx.createLinearGradient(0,0,0,H*0.5);
      grad.addColorStop(0,"rgba(0,0,0,0.8)"); grad.addColorStop(1,"rgba(0,0,0,0)");
    } else if(cfg.gradStyle === "full"){
      grad = ctx.createLinearGradient(0,0,0,H);
      grad.addColorStop(0,"rgba(0,0,0,0.5)"); grad.addColorStop(0.5,"rgba(0,0,0,0.1)"); grad.addColorStop(1,"rgba(0,0,0,0.75)");
    } else if(cfg.gradStyle === "left"){
      grad = ctx.createLinearGradient(0,0,W*0.6,0);
      grad.addColorStop(0,"rgba(0,0,0,0.85)"); grad.addColorStop(1,"rgba(0,0,0,0)");
    } else if(cfg.gradStyle === "color"){
      grad = ctx.createLinearGradient(0,H*0.5,0,H);
      grad.addColorStop(0,"rgba(0,0,0,0)"); grad.addColorStop(1,cfg.gradColor||"rgba(204,0,0,0.85)");
    }
    if(grad){ ctx.fillStyle=grad; ctx.fillRect(0,0,W,H); }
  }

  // ── Frame / Border ──
  if(cfg.frame && cfg.frame !== "none"){
    const bw = (cfg.frameWidth||8)*sc;
    if(cfg.frame === "solid"){
      ctx.strokeStyle = cfg.frameColor||"#fff"; ctx.lineWidth = bw*2;
      ctx.strokeRect(bw,bw,W-bw*2,H-bw*2);
    } else if(cfg.frame === "double"){
      ctx.strokeStyle = cfg.frameColor||"#D4A520"; ctx.lineWidth = bw;
      ctx.strokeRect(bw,bw,W-bw*2,H-bw*2);
      ctx.strokeRect(bw*2.2,bw*2.2,W-bw*4.4,H-bw*4.4);
    } else if(cfg.frame === "rounded"){
      ctx.strokeStyle = cfg.frameColor||"#fff"; ctx.lineWidth = bw;
      const r = 24*sc;
      ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(bw,bw,W-bw*2,H-bw*2,r); else ctx.rect(bw,bw,W-bw*2,H-bw*2);
      ctx.stroke();
    } else if(cfg.frame === "glow"){
      ctx.save(); ctx.shadowColor = cfg.frameColor||"#D4A520"; ctx.shadowBlur = 30*sc;
      ctx.strokeStyle = cfg.frameColor||"#D4A520"; ctx.lineWidth = bw;
      ctx.strokeRect(bw,bw,W-bw*2,H-bw*2); ctx.restore();
    }
  }

  // ── Text Layers ──
  if(cfg.textLayers && cfg.textLayers.length > 0){
    cfg.textLayers.forEach(layer => {
      if(!layer.text) return;
      const style = TEXT_STYLES.find(s=>s.id===layer.style) || TEXT_STYLES[0];
      const fsPx = (layer.size||36)*sc;
      const x = (layer.x||540)*sc;
      const y = (layer.y||540)*sc;
      ctx.save();
      ctx.font = `${style.font} ${fsPx}px ${layer.fontFamily||"Arial"},sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      // Measure text
      const tw = ctx.measureText(layer.text).width;
      const th = fsPx*1.3;
      const pad = 14*sc;
      // Background box
      if(style.bg && style.bg !== "transparent"){
        ctx.fillStyle = style.bg;
        if(ctx.roundRect) ctx.roundRect(x-tw/2-pad, y-th/2, tw+pad*2, th, 4*sc);
        else ctx.rect(x-tw/2-pad, y-th/2, tw+pad*2, th);
        ctx.fill();
      }
      // Glow
      if(style.glow){
        ctx.shadowColor = layer.color||style.color;
        ctx.shadowBlur = 20*sc;
      }
      // Stroke
      if(style.stroke){
        ctx.strokeStyle = "#000"; ctx.lineWidth = 3*sc;
        ctx.strokeText(layer.text, x, y);
      }
      // Shadow
      if(style.shadow){ ctx.shadowColor="rgba(0,0,0,0.8)"; ctx.shadowBlur=8*sc; ctx.shadowOffsetX=2*sc; ctx.shadowOffsetY=2*sc; }
      ctx.fillStyle = layer.color||style.color;
      ctx.fillText(layer.text, x, y);
      ctx.restore();
    });
  }

  // ── Stickers ──
  if(cfg.stickers && cfg.stickers.length > 0){
    cfg.stickers.forEach(s => {
      ctx.save();
      ctx.font = `${(s.size||60)*sc}px serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(s.emoji, s.x*sc, s.y*sc);
      ctx.restore();
    });
  }

  // ── Logo ──
  if(cfg.showLogo){
    const sz = 54*sc;
    const lx = W - sz - 16*sc, ly = 16*sc;
    ctx.save(); ctx.shadowColor="rgba(0,0,0,0.6)"; ctx.shadowBlur=10*sc;
    ctx.globalAlpha=0.92; ctx.fillStyle="#0a0a0a";
    ctx.beginPath(); ctx.arc(lx+sz/2, ly+sz/2, sz/2, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle="#D4A520"; ctx.lineWidth=1.5*sc; ctx.stroke(); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.arc(lx+sz/2, ly+sz/2, sz/2-1, 0, Math.PI*2); ctx.clip();
    if(logoImg){ ctx.drawImage(logoImg, lx, ly, sz, sz); }
    else {
      ctx.font=`900 ${sz*0.36}px Georgia,serif`; ctx.textAlign="center"; ctx.textBaseline="middle";
      const g=ctx.createLinearGradient(lx,ly,lx,ly+sz);
      g.addColorStop(0,"#F5D77A"); g.addColorStop(0.55,"#D4A520"); g.addColorStop(1,"#8B6508");
      ctx.fillStyle=g; ctx.fillText("BBN",lx+sz/2,ly+sz/2+0.5);
    }
    ctx.restore();
  }

  // ── Hashtag strip at bottom ──
  if(cfg.showHashtags && cfg.hashtags){
    const stripH = 36*sc;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.65)"; ctx.fillRect(0,H-stripH,W,stripH);
    ctx.font=`500 ${10*sc}px Arial,sans-serif`; ctx.fillStyle="rgba(255,255,255,0.6)";
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(cfg.hashtags, W/2, H-stripH/2);
    ctx.restore();
  }

  // ── Watermark ──
  if(cfg.watermark){
    ctx.save(); ctx.globalAlpha=0.35;
    ctx.font=`600 ${10*sc}px Trebuchet MS,sans-serif`; ctx.fillStyle="#fff";
    ctx.textAlign="right"; ctx.textBaseline="bottom";
    ctx.fillText((cfg.watermarkText||"BBN NEWS").toUpperCase(), W-12*sc, H-12*sc);
    ctx.restore();
  }
}

// ── localStorage ──────────────────────────────────────────────
const LS_KEY = "bbn_spe_v1";
function lsSave(d){ try{localStorage.setItem(LS_KEY,JSON.stringify(d));}catch{} }
function lsLoad(){ try{const d=localStorage.getItem(LS_KEY);return d?JSON.parse(d):null;}catch{return null;} }

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function SocialPhotoEditor({ user=null, globalLogo=null }) {
  const [format,      setFormat]      = useState("square");
  const [filter,      setFilter]      = useState("none");
  const [brightness,  setBrightness]  = useState(100);
  const [contrast,    setContrast]    = useState(100);
  const [saturation,  setSaturation]  = useState(100);
  const [blur,        setBlur]        = useState(0);
  const [warmth,      setWarmth]      = useState(0);
  const [vignette,    setVignette]    = useState(0);
  const [grain,       setGrain]       = useState(0);
  const [rotation,    setRotation]    = useState(0);
  const [flipH,       setFlipH]       = useState(false);
  const [flipV,       setFlipV]       = useState(false);
  const [panX,        setPanX]        = useState(0);
  const [panY,        setPanY]        = useState(0);
  const [fadeEdges,   setFadeEdges]   = useState(false);
  const [gradStyle,   setGradStyle]   = useState("none");
  const [gradColor,   setGradColor]   = useState("#CC0000");
  const [frame,       setFrame]       = useState("none");
  const [frameColor,  setFrameColor]  = useState("#ffffff");
  const [frameWidth,  setFrameWidth]  = useState(8);
  const [showLogo,    setShowLogo]    = useState(true);
  const [watermark,   setWatermark]   = useState(false);
  const [watermarkText,setWatermarkText]=useState("BBN NEWS");
  const [showHashtags,setShowHashtags]= useState(false);
  const [hashtags,    setHashtags]    = useState("#BBNNews #BreakingNews #India");
  const [textLayers,  setTextLayers]  = useState([
    { id:1, text:"", x:540, y:900, size:48, style:"bold_white", color:"#ffffff", fontFamily:"Arial" }
  ]);
  const [stickers,    setStickers]    = useState([]);
  const [activeTab,   setActiveTab]   = useState("photo");
  const [photoPrev,   setPhotoPrev]   = useState(null);
  const [photoUploading,setPhotoUploading]=useState(false);
  const [downloading, setDownloading] = useState(false);
  const [toast,       setToast]       = useState("");
  const [showPreview, setShowPreview] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [cropMode,    setCropMode]    = useState(false);

  const canvasRef = useRef(null);
  const photoRef  = useRef(null);
  const logoRef   = useRef(null);

  const fmt = FORMATS.find(f=>f.id===format)||FORMATS[0];

  function showToast(msg){ setToast(msg); setTimeout(()=>setToast(""),2500); }

  // ── Build config ──
  const cfg = { filter,brightness,contrast,saturation,blur,warmth,vignette,grain,rotation,flipH,flipV,panX,panY,fadeEdges,gradStyle,gradColor,frame,frameColor,frameWidth,showLogo,watermark,watermarkText,showHashtags,hashtags,textLayers,stickers };

  // ── Redraw whenever anything changes ──
  const redraw = useCallback(()=>{
    const c=canvasRef.current; if(!c)return;
    c.width=fmt.w; c.height=fmt.h;
    drawCanvas(c, photoRef.current, logoRef.current, cfg);
  // eslint-disable-next-line
  },[format,filter,brightness,contrast,saturation,blur,warmth,vignette,grain,rotation,flipH,flipV,panX,panY,fadeEdges,gradStyle,gradColor,frame,frameColor,frameWidth,showLogo,watermark,watermarkText,showHashtags,hashtags,textLayers,stickers]);

  useEffect(()=>{ redraw(); },[redraw]);

  // ── Load globalLogo ──
  useEffect(()=>{
    if(!globalLogo?.url) return;
    const img=new Image(); img.crossOrigin="anonymous";
    img.onload=()=>{ logoRef.current=img; redraw(); };
    img.src=globalLogo.url;
  // eslint-disable-next-line
  },[globalLogo]);

  // ── Restore saved state ──
  useEffect(()=>{
    async function load(){
      let d=null;
      if(user?.uid){ const fd=await loadUserData(user.uid); d=fd?.socialPhoto||null; }
      if(!d) d=lsLoad();
      if(!d) return;
      if(d.format) setFormat(d.format);
      if(d.filter) setFilter(d.filter);
      if(d.brightness) setBrightness(d.brightness);
      if(d.contrast)   setContrast(d.contrast);
      if(d.saturation) setSaturation(d.saturation);
      if(d.blur!=null) setBlur(d.blur);
      if(d.warmth!=null) setWarmth(d.warmth);
      if(d.vignette!=null) setVignette(d.vignette);
      if(d.grain!=null) setGrain(d.grain);
      if(d.gradStyle) setGradStyle(d.gradStyle);
      if(d.gradColor) setGradColor(d.gradColor);
      if(d.frame) setFrame(d.frame);
      if(d.frameColor) setFrameColor(d.frameColor);
      if(d.watermarkText) setWatermarkText(d.watermarkText);
      if(d.hashtags) setHashtags(d.hashtags);
      if(d.textLayers) setTextLayers(d.textLayers);
      if(d.photoCloudUrl){ setPhotoPrev(d.photoCloudUrl); loadPhoto(d.photoCloudUrl); }
    }
    load();
  // eslint-disable-next-line
  },[user]);

  // ── Auto-save ──
  useEffect(()=>{
    const d={format,filter,brightness,contrast,saturation,blur,warmth,vignette,grain,gradStyle,gradColor,frame,frameColor,watermarkText,hashtags,textLayers};
    lsSave(d);
    if(user?.uid) saveUserData(user.uid,{socialPhoto:d});
  // eslint-disable-next-line
  },[format,filter,brightness,contrast,saturation,blur,warmth,vignette,grain,gradStyle,gradColor,frame,frameColor,watermarkText,hashtags,textLayers]);

  function loadPhoto(src){
    const img=new Image(); img.crossOrigin="anonymous";
    img.onload=()=>{ photoRef.current=img; redraw(); };
    img.onerror=()=>{ const i=new Image(); i.onload=()=>{photoRef.current=i;redraw();};i.src=src; };
    img.src=src;
  }

  async function handlePhotoFile(e){
    const f=e.target.files[0]; if(!f)return;
    const r=new FileReader();
    r.onload=ev=>{ setPhotoPrev(ev.target.result); loadPhoto(ev.target.result); };
    r.readAsDataURL(f);
    setPhotoUploading(true);
    try{ const url=await uploadToCloudinary(f); loadPhoto(url); setPhotoPrev(url); }
    catch(err){ console.warn("Cloudinary fail:",err.message); }
    setPhotoUploading(false);
  }

  function downloadPNG(){
    const c=canvasRef.current; if(!c)return;
    setDownloading(true);
    setTimeout(()=>{
      const a=document.createElement("a");
      a.download=`BBN_Social_${format}_${Date.now()}.png`;
      a.href=c.toDataURL("image/png");
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setDownloading(false);
      showToast("✅ PNG download ho gayi!");
    },100);
  }

  function resetAll(){
    setBrightness(100);setContrast(100);setSaturation(100);setBlur(0);
    setWarmth(0);setVignette(0);setGrain(0);setRotation(0);
    setFlipH(false);setFlipV(false);setPanX(0);setPanY(0);
    setFilter("none");setGradStyle("none");setFrame("none");
    setFadeEdges(false);
    showToast("↺ Reset ho gaya!");
  }

  // Text layer helpers
  function updateTextLayer(id,key,val){
    setTextLayers(prev=>prev.map(l=>l.id===id?{...l,[key]:val}:l));
  }
  function addTextLayer(){
    const id=Date.now();
    setTextLayers(prev=>[...prev,{id,text:"",x:540,y:300+prev.length*100,size:42,style:"bold_white",color:"#ffffff",fontFamily:"Arial"}]);
  }
  function removeTextLayer(id){
    setTextLayers(prev=>prev.filter(l=>l.id!==id));
  }

  // Sticker helpers
  function addSticker(emoji){
    setStickers(prev=>[...prev,{id:Date.now(),emoji,x:540,y:540,size:60}]);
  }
  function removeSticker(id){ setStickers(prev=>prev.filter(s=>s.id!==id)); }

  const isMobile = typeof window!=="undefined" && window.innerWidth<=768;

  // Smooth range slider
  const SlRow=({label,val,set,min,max,step=1,unit=""})=>(
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
      <span style={{fontSize:10,color:"var(--txt-lo)",minWidth:68,flexShrink:0,fontWeight:600}}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={e=>set(Number(e.target.value))}
        style={{flex:1,accentColor:"#CC0000",cursor:"pointer"}}/>
      <span style={{fontSize:10,color:"var(--txt-md)",minWidth:36,textAlign:"right",fontFamily:"monospace"}}>{val}{unit}</span>
    </div>
  );

  const SectionHdr=({icon,label})=>(
    <div style={{fontSize:10,fontWeight:700,letterSpacing:"1.5px",color:"#D4A520",textTransform:"uppercase",marginBottom:8,marginTop:4,display:"flex",alignItems:"center",gap:6}}>
      <span style={{fontSize:14}}>{icon}</span>{label}
      <span style={{flex:1,height:1,background:"rgba(212,165,32,0.25)"}}/>
    </div>
  );

  const TogRow=({label,val,set})=>(
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
      <span style={{flex:1,fontSize:11,color:"var(--txt-md)"}}>{label}</span>
      <button className={`toggle-sw ${val?"on":""}`} onClick={()=>set(v=>!v)}/>
    </div>
  );

  // ── Tab content ──
  function renderTab(){
    switch(activeTab){

      case "photo": return (
        <div>
          <SectionHdr icon="📸" label="Upload Photo"/>
          <label style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,border:"2px dashed var(--border-hi)",borderRadius:8,padding:"16px 10px",cursor:"pointer",background:"var(--bg-card)",marginBottom:8}}>
            <input type="file" accept="image/*" hidden onChange={handlePhotoFile}/>
            <span style={{fontSize:32}}>{photoUploading?"⏳":"🖼️"}</span>
            <span style={{fontSize:12,fontWeight:700,color:"var(--txt-md)"}}>
              {photoUploading?"Uploading...":photoPrev?"📷 Change Photo":"TAP TO UPLOAD"}
            </span>
            <span style={{fontSize:10,color:"var(--txt-lo)"}}>JPG · PNG · WEBP · Any size</span>
          </label>
          {photoPrev && <img src={photoPrev} alt="" style={{width:"100%",height:72,objectFit:"cover",borderRadius:6,marginBottom:10,border:"1px solid var(--border)"}}/>}

          <SectionHdr icon="📐" label="Format / Size"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:10}}>
            {FORMATS.map(f=>(
              <button key={f.id} onClick={()=>setFormat(f.id)} style={{
                padding:"7px 5px",borderRadius:6,fontSize:10,fontWeight:700,cursor:"pointer",
                textAlign:"center",display:"flex",flexDirection:"column",gap:2,alignItems:"center",
                background:format===f.id?"rgba(204,34,0,0.18)":"var(--bg-card)",
                color:format===f.id?"#fff":"var(--txt-lo)",
                border:format===f.id?"1.5px solid var(--red)":"1px solid var(--border)"
              }}>
                <span style={{fontSize:18}}>{f.icon}</span>
                <span style={{fontWeight:800}}>{f.label}</span>
                <span style={{fontSize:9,opacity:0.7}}>{f.ratio} • {f.platform}</span>
              </button>
            ))}
          </div>

          <SectionHdr icon="🔄" label="Transform"/>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:10,marginBottom:8}}>
            <SlRow label="Rotation" val={rotation} set={setRotation} min={-180} max={180} unit="°"/>
            <SlRow label="Pan Horizontal" val={panX} set={setPanX} min={-200} max={200}/>
            <SlRow label="Pan Vertical" val={panY} set={setPanY} min={-200} max={200}/>
            <div style={{display:"flex",gap:6,marginTop:4}}>
              <button onClick={()=>setFlipH(v=>!v)} style={{
                flex:1,height:32,borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer",
                background:flipH?"rgba(212,165,32,0.15)":"var(--bg-deep)",
                color:flipH?"#D4A520":"var(--txt-md)",border:flipH?"1px solid #D4A520":"1px solid var(--border)"
              }}>↔ Flip H</button>
              <button onClick={()=>setFlipV(v=>!v)} style={{
                flex:1,height:32,borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer",
                background:flipV?"rgba(212,165,32,0.15)":"var(--bg-deep)",
                color:flipV?"#D4A520":"var(--txt-md)",border:flipV?"1px solid #D4A520":"1px solid var(--border)"
              }}>↕ Flip V</button>
              <button onClick={resetAll} style={{
                flex:1,height:32,borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer",
                background:"rgba(204,0,0,0.1)",color:"#CC0000",border:"1px solid rgba(204,0,0,0.3)"
              }}>↺ Reset</button>
            </div>
          </div>
        </div>
      );

      case "adjust": return (
        <div>
          <SectionHdr icon="🎨" label="Filters"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4,marginBottom:10}}>
            {FILTERS.map(f=>(
              <button key={f.id} onClick={()=>setFilter(f.id)} style={{
                padding:"7px 4px",borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer",textAlign:"center",
                background:filter===f.id?"rgba(204,34,0,0.2)":"var(--bg-card)",
                color:filter===f.id?"#fff":"var(--txt-lo)",
                border:filter===f.id?"1.5px solid var(--red)":"1px solid var(--border)"
              }}>{f.label}</button>
            ))}
          </div>

          <SectionHdr icon="⚙️" label="Adjustments"/>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:10,marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:6}}>
              <button onClick={resetAll} style={{fontSize:10,color:"var(--txt-lo)",background:"transparent",border:"1px solid var(--border)",borderRadius:4,padding:"2px 8px",cursor:"pointer"}}>Reset All</button>
            </div>
            <SlRow label="Brightness" val={brightness} set={setBrightness} min={20} max={200}/>
            <SlRow label="Contrast"   val={contrast}   set={setContrast}   min={50} max={200}/>
            <SlRow label="Saturation" val={saturation} set={setSaturation} min={0}  max={200}/>
            <SlRow label="Blur"       val={blur}       set={setBlur}       min={0}  max={15} step={0.5} unit="px"/>
            <SlRow label="Warmth"     val={warmth}     set={setWarmth}     min={-100} max={100}/>
            <SlRow label="Vignette"   val={vignette}   set={setVignette}   min={0}  max={90} unit="%"/>
            <SlRow label="Grain"      val={grain}      set={setGrain}      min={0}  max={80}/>
          </div>

          <SectionHdr icon="🌈" label="Gradient Overlay"/>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:10,marginBottom:8}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4,marginBottom:8}}>
              {[["none","None"],["bottom","Bottom"],["top","Top"],["full","Full"],["left","Left"],["color","Color"]].map(([v,l])=>(
                <button key={v} onClick={()=>setGradStyle(v)} style={{
                  padding:"5px 2px",borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer",
                  background:gradStyle===v?"rgba(204,34,0,0.2)":"var(--bg-deep)",
                  color:gradStyle===v?"#fff":"var(--txt-lo)",
                  border:gradStyle===v?"1.5px solid var(--red)":"1px solid var(--border)"
                }}>{l}</button>
              ))}
            </div>
            {gradStyle==="color"&&(
              <div>
                <div style={{fontSize:10,color:"var(--txt-lo)",marginBottom:4}}>Gradient Color</div>
                <input type="color" value={gradColor} onChange={e=>setGradColor(e.target.value)} style={{width:"100%",height:32,borderRadius:5,border:"1px solid var(--border)",cursor:"pointer"}}/>
              </div>
            )}
          </div>

          <SectionHdr icon="✨" label="Effects"/>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:10}}>
            <TogRow label="Fade Edges" val={fadeEdges} set={setFadeEdges}/>
          </div>
        </div>
      );

      case "text": return (
        <div>
          <SectionHdr icon="✍️" label="Text Layers"/>
          <div style={{fontSize:10,color:"var(--txt-lo)",marginBottom:8,lineHeight:1.5,background:"rgba(212,165,32,0.06)",borderRadius:4,padding:"5px 8px",border:"1px solid rgba(212,165,32,0.15)"}}>
            💡 Multiple text layers add kar sakte ho. X/Y position canvas pe (0-1080).
          </div>

          {textLayers.map((layer,idx)=>(
            <div key={layer.id} style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:7,padding:10,marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:10,fontWeight:700,color:"#D4A520"}}>Text Layer {idx+1}</span>
                <button onClick={()=>removeTextLayer(layer.id)} style={{background:"rgba(204,0,0,0.12)",color:"#CC0000",border:"1px solid rgba(204,0,0,0.3)",borderRadius:4,padding:"2px 8px",fontSize:10,cursor:"pointer"}}>✕ Remove</button>
              </div>
              <textarea value={layer.text} onChange={e=>updateTextLayer(layer.id,"text",e.target.value)}
                placeholder="Text yahan likhein..." rows={2}
                style={{width:"100%",background:"var(--bg-deep)",border:"1.5px solid var(--accent)",borderRadius:5,color:"var(--txt-hi)",fontSize:12,padding:"7px 9px",outline:"none",resize:"none",marginBottom:6,boxSizing:"border-box"}}/>
              <div style={{fontSize:10,color:"var(--txt-lo)",marginBottom:4}}>Style</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:3,marginBottom:6}}>
                {TEXT_STYLES.map(s=>(
                  <button key={s.id} onClick={()=>updateTextLayer(layer.id,"style",s.id)} style={{
                    padding:"4px 6px",borderRadius:4,fontSize:9,fontWeight:700,cursor:"pointer",
                    background:layer.style===s.id?"rgba(204,34,0,0.2)":"var(--bg-deep)",
                    color:layer.style===s.id?"#fff":"var(--txt-lo)",
                    border:layer.style===s.id?"1px solid var(--red)":"1px solid var(--border)"
                  }}>{s.label}</button>
                ))}
              </div>
              <div style={{display:"flex",gap:6,marginBottom:6}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:"var(--txt-lo)",marginBottom:2}}>Size</div>
                  <input type="range" min={16} max={120} value={layer.size} onChange={e=>updateTextLayer(layer.id,"size",Number(e.target.value))} style={{width:"100%",accentColor:"#CC0000"}}/>
                  <div style={{fontSize:9,color:"var(--txt-md)",textAlign:"right"}}>{layer.size}px</div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:4}}>
                <div>
                  <div style={{fontSize:10,color:"var(--txt-lo)",marginBottom:2}}>X Position</div>
                  <input type="range" min={0} max={1080} value={layer.x} onChange={e=>updateTextLayer(layer.id,"x",Number(e.target.value))} style={{width:"100%",accentColor:"#CC0000"}}/>
                </div>
                <div>
                  <div style={{fontSize:10,color:"var(--txt-lo)",marginBottom:2}}>Y Position</div>
                  <input type="range" min={0} max={1080} value={layer.y} onChange={e=>updateTextLayer(layer.id,"y",Number(e.target.value))} style={{width:"100%",accentColor:"#CC0000"}}/>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:10,color:"var(--txt-lo)"}}>Text Color</span>
                <input type="color" value={layer.color||"#ffffff"} onChange={e=>updateTextLayer(layer.id,"color",e.target.value)} style={{width:32,height:26,borderRadius:4,border:"1px solid var(--border)",cursor:"pointer",padding:0}}/>
                <select value={layer.fontFamily||"Arial"} onChange={e=>updateTextLayer(layer.id,"fontFamily",e.target.value)} style={{flex:1,background:"var(--bg-deep)",border:"1px solid var(--border)",borderRadius:4,color:"var(--txt-hi)",fontSize:10,padding:"4px 6px",outline:"none"}}>
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Impact">Impact</option>
                  <option value="Trebuchet MS">Trebuchet</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier</option>
                  <option value="Noto Sans Devanagari">Devanagari</option>
                </select>
              </div>
            </div>
          ))}
          <button onClick={addTextLayer} style={{
            width:"100%",height:36,borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",
            background:"rgba(212,165,32,0.1)",color:"#D4A520",border:"1.5px solid rgba(212,165,32,0.4)",marginBottom:10
          }}>+ Add Text Layer</button>
        </div>
      );

      case "sticker": return (
        <div>
          <SectionHdr icon="🎭" label="Stickers & Emoji"/>
          <div style={{fontSize:10,color:"var(--txt-lo)",marginBottom:8}}>Tap karo sticker add karne ke liye:</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:12}}>
            {STICKERS.map(em=>(
              <button key={em} onClick={()=>addSticker(em)} style={{
                height:44,borderRadius:7,fontSize:22,cursor:"pointer",
                background:"var(--bg-card)",border:"1px solid var(--border)",
                transition:"all 0.1s"
              }}>{em}</button>
            ))}
          </div>
          {stickers.length > 0 && (
            <>
              <SectionHdr icon="📍" label="Placed Stickers"/>
              {stickers.map((s,i)=>(
                <div key={s.id} style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:8,marginBottom:6,display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:26}}>{s.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:4}}>
                      <div>
                        <div style={{fontSize:9,color:"var(--txt-lo)",marginBottom:1}}>X</div>
                        <input type="range" min={0} max={1080} value={s.x}
                          onChange={e=>setStickers(prev=>prev.map(st=>st.id===s.id?{...st,x:Number(e.target.value)}:st))}
                          style={{width:"100%",accentColor:"#CC0000"}}/>
                      </div>
                      <div>
                        <div style={{fontSize:9,color:"var(--txt-lo)",marginBottom:1}}>Y</div>
                        <input type="range" min={0} max={1080} value={s.y}
                          onChange={e=>setStickers(prev=>prev.map(st=>st.id===s.id?{...st,y:Number(e.target.value)}:st))}
                          style={{width:"100%",accentColor:"#CC0000"}}/>
                      </div>
                    </div>
                    <div>
                      <div style={{fontSize:9,color:"var(--txt-lo)",marginBottom:1}}>Size</div>
                      <input type="range" min={20} max={150} value={s.size}
                        onChange={e=>setStickers(prev=>prev.map(st=>st.id===s.id?{...st,size:Number(e.target.value)}:st))}
                        style={{width:"100%",accentColor:"#CC0000"}}/>
                    </div>
                  </div>
                  <button onClick={()=>removeSticker(s.id)} style={{background:"rgba(204,0,0,0.12)",color:"#CC0000",border:"none",borderRadius:4,padding:"4px 8px",fontSize:11,cursor:"pointer"}}>✕</button>
                </div>
              ))}
            </>
          )}
        </div>
      );

      case "overlay": return (
        <div>
          <SectionHdr icon="🖼️" label="Frame & Border"/>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:10,marginBottom:8}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4,marginBottom:8}}>
              {[["none","None"],["solid","Solid"],["double","Double"],["rounded","Rounded"],["glow","Glow"]].map(([v,l])=>(
                <button key={v} onClick={()=>setFrame(v)} style={{
                  padding:"6px 4px",borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer",
                  background:frame===v?"rgba(204,34,0,0.2)":"var(--bg-deep)",
                  color:frame===v?"#fff":"var(--txt-lo)",
                  border:frame===v?"1.5px solid var(--red)":"1px solid var(--border)"
                }}>{l}</button>
              ))}
            </div>
            {frame!=="none"&&<>
              <div style={{fontSize:10,color:"var(--txt-lo)",marginBottom:4}}>Frame Color</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                {["#ffffff","#000000","#D4A520","#CC0000","#4CAF50","#2196F3","#9C27B0"].map(c=>(
                  <div key={c} onClick={()=>setFrameColor(c)} style={{width:22,height:22,borderRadius:4,cursor:"pointer",background:c,border:frameColor===c?"2.5px solid var(--accent)":"1.5px solid rgba(255,255,255,0.15)",transition:"all 0.1s"}}/>
                ))}
                <input type="color" value={frameColor} onChange={e=>setFrameColor(e.target.value)} style={{width:22,height:22,borderRadius:4,border:"1px solid var(--border)",cursor:"pointer",padding:0}}/>
              </div>
              <SlRow label="Border Width" val={frameWidth} set={setFrameWidth} min={2} max={30} unit="px"/>
            </>}
          </div>

          <SectionHdr icon="🏷️" label="Logo & Branding"/>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:10,marginBottom:8}}>
            <TogRow label="Show Logo (top right)" val={showLogo} set={setShowLogo}/>
            <TogRow label="Watermark" val={watermark} set={setWatermark}/>
            {watermark&&<input value={watermarkText} onChange={e=>setWatermarkText(e.target.value)} placeholder="Watermark text" style={{width:"100%",background:"var(--bg-deep)",border:"1px solid var(--border)",borderRadius:5,color:"var(--txt-hi)",fontSize:11,padding:"5px 8px",outline:"none",marginTop:4,boxSizing:"border-box"}}/>}
          </div>

          <SectionHdr icon="#️⃣" label="Hashtags Strip"/>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:10}}>
            <TogRow label="Show Hashtags Bar" val={showHashtags} set={setShowHashtags}/>
            {showHashtags&&<textarea value={hashtags} onChange={e=>setHashtags(e.target.value)} rows={2} style={{width:"100%",background:"var(--bg-deep)",border:"1px solid var(--border)",borderRadius:5,color:"var(--txt-hi)",fontSize:11,padding:"5px 8px",outline:"none",resize:"none",marginTop:4,boxSizing:"border-box"}}/>}
          </div>
        </div>
      );

      default: return null;
    }
  }

  const TABS=[
    {id:"photo",   icon:"📸",label:"Photo"},
    {id:"adjust",  icon:"🎨",label:"Adjust"},
    {id:"text",    icon:"✍️",label:"Text"},
    {id:"sticker", icon:"🎭",label:"Sticker"},
    {id:"overlay", icon:"🖼️",label:"Overlay"},
  ];

  // ── MAIN RENDER ──
  return (
    <div style={{display:"flex",flexDirection:isMobile?"column":"row",height:"calc(100vh - 46px)",overflow:"hidden",background:"#060608"}}>

      {/* Toast */}
      {toast&&<div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",background:"#1c1c21",border:"1px solid #3a3a48",color:"#f0f0f5",padding:"8px 18px",borderRadius:8,fontSize:12,fontWeight:700,zIndex:999,pointerEvents:"none"}}>{toast}</div>}

      {/* Preview Modal */}
      {showPreview&&(
        <div onClick={()=>setShowPreview(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:9999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
          <div style={{fontSize:11,color:"#888",letterSpacing:1}}>TAP TO CLOSE</div>
          <canvas ref={el=>{
            if(!el)return;
            const src=canvasRef.current;if(!src)return;
            el.width=src.width;el.height=src.height;
            el.getContext("2d").drawImage(src,0,0);
          }} style={{maxWidth:"88vw",maxHeight:"72vh",borderRadius:6,boxShadow:"0 8px 48px rgba(0,0,0,0.9)"}}/>
          <div style={{display:"flex",gap:10}}>
            <button onClick={e=>{e.stopPropagation();downloadPNG();setShowPreview(false);}} style={{height:44,padding:"0 28px",background:"linear-gradient(135deg,#CC0000,#880000)",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:800,cursor:"pointer"}}>⬇️ Download PNG</button>
            <button onClick={()=>setShowPreview(false)} style={{height:44,padding:"0 20px",background:"transparent",color:"#888",border:"1px solid #444",borderRadius:8,fontSize:13,cursor:"pointer"}}>Close</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          MOBILE LAYOUT — canvas top, controls bottom
          ══════════════════════════════════════════════ */}
      {isMobile ? (
        <>
          {/* Top: Canvas area — fixed compact height */}
          <div style={{display:"flex",flexDirection:"column",background:"#060608",flexShrink:0}}>
            {/* Format ribbon */}
            <div style={{display:"flex",background:"var(--bg-base)",borderBottom:"1px solid var(--border)",padding:"4px 8px",gap:4,overflowX:"auto",flexShrink:0,WebkitOverflowScrolling:"touch"}}>
              {FORMATS.map(f=>(
                <button key={f.id} onClick={()=>setFormat(f.id)} style={{
                  padding:"3px 8px",borderRadius:4,fontSize:9,fontWeight:700,cursor:"pointer",flexShrink:0,
                  whiteSpace:"nowrap",
                  background:format===f.id?"rgba(204,34,0,0.2)":"var(--bg-card)",
                  color:format===f.id?"#fff":"var(--txt-lo)",
                  border:format===f.id?"1.5px solid var(--red)":"1px solid var(--border)"
                }}>{f.icon} {f.label} <span style={{opacity:0.6}}>{f.ratio}</span></button>
              ))}
            </div>
            {/* Canvas */}
            <div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:"6px 8px",background:"#060608"}}>
              <canvas ref={canvasRef} width={fmt.w} height={fmt.h}
                style={{height:"190px",maxWidth:"100%",objectFit:"contain",borderRadius:4,boxShadow:"0 4px 24px rgba(0,0,0,0.9)"}}/>
            </div>
            {/* Download button */}
            <div style={{display:"flex",gap:6,margin:"0 10px 6px",}}>
              <button onClick={()=>setShowPreview(true)} style={{flex:1,height:36,borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",background:"rgba(212,165,32,0.1)",border:"1px solid #D4A520",color:"#D4A520"}}>👁 Preview</button>
              <button onClick={downloadPNG} disabled={downloading} style={{flex:2,height:36,borderRadius:6,fontSize:12,fontWeight:800,cursor:"pointer",background:"linear-gradient(135deg,#CC0000,#880000)",border:"none",color:"#fff"}}>
                {downloading?"⏳ Saving...":"⬇️ Download PNG"}
              </button>
            </div>
          </div>

          {/* Bottom: Tabs + Scrollable controls */}
          <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--bg-panel)",borderTop:"2px solid var(--border)",overflow:"hidden"}}>
            {/* Tab bar */}
            <div style={{display:"flex",background:"var(--bg-base)",borderBottom:"1px solid var(--border)",flexShrink:0}}>
              {TABS.map(t=>(
                <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
                  flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,
                  padding:"7px 2px",cursor:"pointer",border:"none",
                  background:activeTab===t.id?"rgba(204,34,0,0.12)":"transparent",
                  borderBottom:activeTab===t.id?"2px solid var(--red)":"2px solid transparent",
                  transition:"all 0.15s"
                }}>
                  <span style={{fontSize:16}}>{t.icon}</span>
                  <span style={{fontSize:8,fontWeight:700,color:activeTab===t.id?"#fff":"var(--txt-lo)",letterSpacing:0.5}}>{t.label}</span>
                </button>
              ))}
            </div>
            {/* Scrollable content */}
            <div style={{flex:1,overflowY:"auto",padding:"10px 12px",WebkitOverflowScrolling:"touch"}}>
              {renderTab()}
            </div>
          </div>
        </>
      ) : (
        /* ══════════════════════════════════════════════
           DESKTOP LAYOUT — canvas left, controls right
           ══════════════════════════════════════════════ */
        <>
          {/* LEFT: Canvas */}
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            {/* Format ribbon */}
            <div style={{display:"flex",background:"var(--bg-base)",borderBottom:"1px solid var(--border)",padding:"5px 8px",gap:4,overflowX:"auto",flexShrink:0,WebkitOverflowScrolling:"touch"}}>
              {FORMATS.map(f=>(
                <button key={f.id} onClick={()=>setFormat(f.id)} style={{
                  padding:"4px 10px",borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer",flexShrink:0,
                  display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap",
                  background:format===f.id?"rgba(204,34,0,0.2)":"var(--bg-card)",
                  color:format===f.id?"#fff":"var(--txt-lo)",
                  border:format===f.id?"1.5px solid var(--red)":"1px solid var(--border)"
                }}>{f.icon} {f.label} <span style={{fontSize:9,opacity:0.6}}>{f.ratio}</span></button>
              ))}
            </div>
            {/* Canvas */}
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",padding:"8px",background:"#060608"}}>
              <canvas ref={canvasRef} width={fmt.w} height={fmt.h} style={{
                maxWidth:"100%",maxHeight:"100%",
                objectFit:"contain",borderRadius:3,
                boxShadow:"0 8px 48px rgba(0,0,0,0.95)"
              }}/>
            </div>
            {/* Action row */}
            <div style={{background:"var(--bg-base)",borderTop:"1px solid var(--border)",padding:"6px 10px",display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
              <span style={{fontSize:10,color:"var(--txt-lo)",flex:1}}>{fmt.w}×{fmt.h} • {fmt.platform}</span>
              <button onClick={()=>setShowPreview(true)} style={{height:32,padding:"0 14px",borderRadius:5,fontSize:11,fontWeight:700,cursor:"pointer",background:"rgba(212,165,32,0.1)",border:"1px solid #D4A520",color:"#D4A520"}}>👁 Preview</button>
              <button onClick={downloadPNG} disabled={downloading} style={{height:32,padding:"0 16px",borderRadius:5,fontSize:11,fontWeight:800,cursor:"pointer",background:"linear-gradient(135deg,#CC0000,#880000)",border:"none",color:"#fff"}}>
                {downloading?"⏳":"⬇️"} PNG
              </button>
            </div>
          </div>

          {/* RIGHT: Controls */}
          <div style={{width:"300px",flexShrink:0,background:"var(--bg-panel)",borderLeft:"1px solid var(--border)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{display:"flex",background:"var(--bg-base)",borderBottom:"1px solid var(--border)",flexShrink:0}}>
              {TABS.map(t=>(
                <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
                  flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,
                  padding:"7px 2px",cursor:"pointer",border:"none",
                  background:activeTab===t.id?"rgba(204,34,0,0.12)":"transparent",
                  borderBottom:activeTab===t.id?"2px solid var(--red)":"2px solid transparent",
                  transition:"all 0.15s"
                }}>
                  <span style={{fontSize:16}}>{t.icon}</span>
                  <span style={{fontSize:8,fontWeight:700,color:activeTab===t.id?"#fff":"var(--txt-lo)",letterSpacing:0.5}}>{t.label}</span>
                </button>
              ))}
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"10px 12px",WebkitOverflowScrolling:"touch"}}>
              {renderTab()}
            </div>
          </div>
        </>
      )}
}
