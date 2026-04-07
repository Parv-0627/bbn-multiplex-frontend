// ═══════════════════════════════════════════════════════════════
//  BBN MULTIPLEX — PhotoNewsmaker.jsx  (MAIN COMPONENT)
//
//  Yeh file sirf UI + State handle karti hai.
//  Templates → bbn-templates.js
//  Config    → bbn-config.js
//  Text      → bbn-text-utils.js
//
//  Kuch badlna ho:
//   • Naya template → bbn-templates.js
//   • Colors/defaults → bbn-config.js
//   • Translate logic → bbn-text-utils.js
//   • UI layout → yeh file
// ═══════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect, useCallback } from "react";

// ── Modular imports ───────────────────────────────────────────
import {
  TEMPLATES, DEFAULT_STATE,
  SWATCHES_BADGE, SWATCHES_STRIP, SWATCHES_TICKER,
  BOXBG, HLCOL, TXTCOLS, LOGOPOS,
} from "./bbn-config.js";

import { drawCard, preloadFonts } from "./bbn-templates.js";
import { translateText, applyTextColor, removeTextColor } from "./bbn-text-utils.js";

// ═══════════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function PhotoNewsmaker() {

  // ── State (all from DEFAULT_STATE) ───────────────────────────
  const [headline,    setHeadline]    = useState(DEFAULT_STATE.headline);
  const [source,      setSource]      = useState(DEFAULT_STATE.source);
  const [badgeText,   setBadgeText]   = useState(DEFAULT_STATE.badgeText);
  const [liveLabel,   setLiveLabel]   = useState(DEFAULT_STATE.liveLabel);
  const [template,    setTemplate]    = useState(DEFAULT_STATE.template);
  const [badgeColor,  setBadgeColor]  = useState(DEFAULT_STATE.badgeColor);
  const [stripColor,  setStripColor]  = useState(DEFAULT_STATE.stripColor);
  const [boxBg,       setBoxBg]       = useState(DEFAULT_STATE.boxBg);
  const [hlColor,     setHlColor]     = useState(DEFAULT_STATE.hlColor);
  const [tickerColor, setTickerColor] = useState(DEFAULT_STATE.tickerColor);
  const [fontSize,    setFontSize]    = useState(DEFAULT_STATE.fontSize);
  const [ovLogo,    setOvLogo]    = useState(DEFAULT_STATE.ovLogo);
  const [ovLive,    setOvLive]    = useState(DEFAULT_STATE.ovLive);
  const [ovBadge,   setOvBadge]   = useState(DEFAULT_STATE.ovBadge);
  const [ovStrip,   setOvStrip]   = useState(DEFAULT_STATE.ovStrip);
  const [ovDivider, setOvDivider] = useState(DEFAULT_STATE.ovDivider);
  const [ovSource,  setOvSource]  = useState(DEFAULT_STATE.ovSource);
  const [photoPos,    setPhotoPos]    = useState(DEFAULT_STATE.photoPos);
  const [brightness,  setBrightness]  = useState(DEFAULT_STATE.brightness);
  const [contrast,    setContrast]    = useState(DEFAULT_STATE.contrast);
  const [saturation,  setSaturation]  = useState(DEFAULT_STATE.saturation);
  const [logoSize,    setLogoSize]    = useState(DEFAULT_STATE.logoSize);
  const [logoPosKey,  setLogoPosKey]  = useState(DEFAULT_STATE.logoPosKey);

  const [photoPreviewSrc, setPhotoPreviewSrc] = useState(null);
  const [logoPreviewSrc,  setLogoPreviewSrc]  = useState(null);
  const [inputText,   setInputText]   = useState("");
  const [translating, setTranslating] = useState(false);
  const [activeSection, setActiveSection] = useState("photo");
  const [toast, setToast] = useState("");

  // ── Refs ──────────────────────────────────────────────────────
  const canvasRef   = useRef(null);
  const photoImgRef = useRef(null);
  const logoImgRef  = useRef(null);
  const hlRef       = useRef(null);

  // ── Preload fonts once ────────────────────────────────────────
  useEffect(() => { preloadFonts(); }, []);

  // ── Redraw canvas ─────────────────────────────────────────────
  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    drawCard(c, photoImgRef.current, logoImgRef.current, {
      template, headline, source, badgeText, liveLabel,
      badgeColor, stripColor, boxBg, hlColor, tickerColor,
      ovLogo, ovLive, ovBadge, ovStrip, ovDivider, ovSource,
      fontSize, logoSize, logoPosKey,
      photoPos, brightness, contrast, saturation,
    });
  }, [
    template, headline, source, badgeText, liveLabel,
    badgeColor, stripColor, boxBg, hlColor, tickerColor,
    ovLogo, ovLive, ovBadge, ovStrip, ovDivider, ovSource,
    fontSize, logoSize, logoPosKey,
    photoPos, brightness, contrast, saturation,
  ]);

  useEffect(() => { redraw(); }, [redraw]);

  // ── Toast helper ──────────────────────────────────────────────
  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  // ── Photo handlers ────────────────────────────────────────────
  function loadPhotoImg(src) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => { photoImgRef.current = img; redraw(); };
    img.onerror = () => { img.crossOrigin = undefined; img.src = src; };
    img.src = src;
  }
  function handlePhotoFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => { setPhotoPreviewSrc(ev.target.result); loadPhotoImg(ev.target.result); };
    r.readAsDataURL(f);
  }
  function handlePhotoUrl(v) {
    if (!v.trim()) return;
    setPhotoPreviewSrc(v.trim());
    loadPhotoImg(v.trim());
  }

  // ── Logo handlers ─────────────────────────────────────────────
  function handleLogoFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      const img = new Image();
      img.onload = () => { logoImgRef.current = img; setLogoPreviewSrc(ev.target.result); redraw(); };
      img.src = ev.target.result;
    };
    r.readAsDataURL(f);
  }
  function resetLogo() { logoImgRef.current = null; setLogoPreviewSrc(null); redraw(); }

  // ── Translate ─────────────────────────────────────────────────
  async function handleTranslate(lang) {
    if (!inputText.trim()) return showToast("⚠ Pehle kuch likho!");
    setTranslating(true);
    try {
      const txt = await translateText(inputText, lang);
      if (lang === "hi") {
        setHeadline(txt);
        if (hlRef.current) hlRef.current.textContent = txt;
        showToast("🇮🇳 Hindi ready!");
      } else {
        showToast("🇬🇧 English ready: " + txt.slice(0, 40) + "...");
      }
    } catch {
      showToast("❌ Internet check karo!");
    }
    setTranslating(false);
  }

  // ── Text color ────────────────────────────────────────────────
  function handleApplyColor(color) {
    const result = applyTextColor(hlRef.current, color);
    if (result === "no_selection") return showToast("⚠ Pehle text select karo!");
    setHeadline(hlRef.current.innerHTML);
    showToast("✅ Rang lag gaya!");
  }
  function handleRemoveColor() {
    const html = removeTextColor(hlRef.current);
    setHeadline(html || hlRef.current?.textContent || headline);
    showToast("✅ Rang hata diya!");
  }

  // ── Download ──────────────────────────────────────────────────
  function downloadPNG() {
    const c = canvasRef.current;
    if (!c) return;
    const a = document.createElement("a");
    a.download = `BBN_Photo_${Date.now()}.png`;
    a.href = c.toDataURL("image/png");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("✅ Download shuru!");
  }

  // ────────────────────────────────────────────────────────────
  //  UI HELPERS (inline components)
  // ────────────────────────────────────────────────────────────
  const S = {
    lbl: { fontSize:10, fontWeight:700, letterSpacing:"1.5px", color:"var(--txt-lo)",
           textTransform:"uppercase", display:"flex", alignItems:"center", gap:5, marginBottom:7 },
    lblLine: { flex:1, height:1, background:"var(--border)" },
    sub: { fontSize:10, color:"var(--txt-lo)", fontWeight:600, marginBottom:4, marginTop:8 },
    swatchRow: { display:"flex", flexWrap:"wrap", gap:4, marginTop:4 },
    sliderRow: { display:"flex", alignItems:"center", gap:7, marginBottom:4 },
    sliderName: { fontSize:10, color:"var(--txt-lo)", minWidth:72, flexShrink:0 },
    sliderVal: { fontSize:10, color:"var(--txt-md)", minWidth:32, textAlign:"right", fontFamily:"monospace" },
    togRow: { display:"flex", alignItems:"center", gap:8, marginBottom:6 },
    togLbl: { flex:1, fontSize:11, color:"var(--txt-md)" },
    segGroup: { display:"flex", gap:4, marginTop:4 },
  };

  function Lbl({ icon, children }) {
    return (
      <div style={S.lbl}>
        {icon && <span>{icon}</span>}
        {children}
        <span style={S.lblLine} />
      </div>
    );
  }
  function Sub({ children, mt = 8 }) {
    return <div style={{ ...S.sub, marginTop: mt }}>{children}</div>;
  }
  function Swatch({ colors, sel, onSel }) {
    return (
      <div style={S.swatchRow}>
        {colors.map(c => (
          <div key={c} onClick={() => onSel(c)} style={{
            width:20, height:20, borderRadius:4, cursor:"pointer", background:c,
            border: sel === c ? "2px solid #fff" : "1.5px solid transparent",
            transform: sel === c ? "scale(1.15)" : "scale(1)",
            transition: "all 0.12s", flexShrink:0,
          }}/>
        ))}
      </div>
    );
  }
  function Slider({ label, value, setter, min, max, unit = "" }) {
    return (
      <div style={S.sliderRow}>
        <span style={S.sliderName}>{label}</span>
        <input type="range" min={min} max={max} value={value}
          onChange={e => setter(Number(e.target.value))}
          style={{ flex:1, accentColor:"var(--red)" }}/>
        <span style={S.sliderVal}>{value}{unit}</span>
      </div>
    );
  }
  function Tog({ on, onClick, label }) {
    return (
      <div style={S.togRow}>
        <span style={S.togLbl}>{label}</span>
        <button className={`toggle-sw ${on ? "on" : ""}`} onClick={onClick}/>
      </div>
    );
  }
  function TabBtn({ id, children }) {
    const active = activeSection === id;
    return (
      <button onClick={() => setActiveSection(id)} style={{
        padding: "5px 10px", borderRadius:5, fontSize:10, fontWeight:700, cursor:"pointer",
        background: active ? "rgba(204,34,0,0.15)" : "var(--bg-card)",
        color: active ? "#fff" : "var(--txt-lo)",
        border: active ? "1px solid var(--red)" : "1px solid var(--border)",
        transition: "all 0.15s", whiteSpace:"nowrap",
      }}>{children}</button>
    );
  }

  // ────────────────────────────────────────────────────────────
  //  RENDER
  // ────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", height:"calc(100vh - 46px)", overflow:"hidden", background:"#000" }}>

      {/* ════ Toast ════ */}
      {toast && (
        <div style={{
          position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
          background:"#1a1a1e", border:"1px solid var(--border)", color:"var(--txt-hi)",
          padding:"8px 18px", borderRadius:8, fontSize:12, fontWeight:700,
          zIndex:999, pointerEvents:"none", boxShadow:"0 4px 20px rgba(0,0,0,0.8)",
        }}>{toast}</div>
      )}

      {/* ════ LEFT: Canvas + Template row ════ */}
      <div style={{
        flex:1, background:"#080808", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", overflow:"hidden", padding:"12px", gap:10,
      }}>

        {/* Template selector */}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", justifyContent:"center", maxWidth:520 }}>
          {TEMPLATES.map(({ id, label, emoji }) => (
            <button key={id} onClick={() => setTemplate(id)} style={{
              padding:"5px 10px", borderRadius:6, fontSize:10, fontWeight:700, cursor:"pointer",
              background: template === id ? "rgba(204,34,0,0.2)" : "var(--bg-card)",
              color: template === id ? "#fff" : "var(--txt-lo)",
              border: template === id ? "1.5px solid var(--red)" : "1px solid var(--border)",
              transition:"all 0.15s", display:"flex", alignItems:"center", gap:4,
            }}>{emoji} {label}</button>
          ))}
        </div>

        {/* Canvas */}
        <canvas ref={canvasRef} width={400} height={500} style={{
          maxWidth:"100%", maxHeight:"calc(100vh - 160px)", aspectRatio:"4/5",
          boxShadow:"0 4px 40px rgba(0,0,0,0.9)", borderRadius:2,
        }}/>

        {/* Download button */}
        <button onClick={downloadPNG} style={{
          height:38, padding:"0 32px",
          background:"linear-gradient(135deg,#CC0000,#880000)",
          color:"#fff", border:"none", borderRadius:7, fontSize:13,
          fontWeight:800, letterSpacing:1, cursor:"pointer",
        }}>⬇️ PNG Download Karo</button>
      </div>

      {/* ════ RIGHT: Controls ════ */}
      <div style={{
        width:300, flexShrink:0, background:"var(--bg-panel)",
        borderLeft:"1px solid var(--border)", overflowY:"auto",
        display:"flex", flexDirection:"column",
      }}>

        {/* Section tabs */}
        <div style={{
          display:"flex", gap:4, padding:"8px 10px", background:"var(--bg-base)",
          borderBottom:"1px solid var(--border)", flexWrap:"wrap",
          position:"sticky", top:0, zIndex:10,
        }}>
          <TabBtn id="photo">📸 Photo</TabBtn>
          <TabBtn id="logo">🔰 Logo</TabBtn>
          <TabBtn id="text">✍ Text</TabBtn>
          <TabBtn id="style">🎨 Style</TabBtn>
          <TabBtn id="overlay">🏷️ Overlay</TabBtn>
        </div>

        {/* ── PHOTO SECTION ── */}
        {activeSection === "photo" && (
          <div style={{ padding:12, display:"flex", flexDirection:"column", gap:0 }}>
            <Lbl icon="📸">Photo Upload</Lbl>

            <label style={{
              display:"flex", flexDirection:"column", alignItems:"center", gap:4,
              border:"2px dashed var(--border-hi)", borderRadius:7, padding:"14px 10px",
              cursor:"pointer", background:"var(--bg-card)", overflow:"hidden", marginBottom:8,
            }}>
              <input type="file" accept="image/*" hidden onChange={handlePhotoFile}/>
              <span style={{ fontSize:26 }}>🖼️</span>
              <span style={{ fontSize:11, fontWeight:700, color:"var(--txt-md)" }}>TAP TO UPLOAD PHOTO</span>
              <span style={{ fontSize:10, color:"var(--txt-lo)" }}>JPG · PNG · WEBP</span>
            </label>

            {photoPreviewSrc && (
              <img src={photoPreviewSrc} alt="" style={{
                width:"100%", height:80, objectFit:"cover",
                borderRadius:5, marginBottom:8, border:"1px solid var(--border)",
              }}/>
            )}

            <Sub mt={4}>Ya Photo URL</Sub>
            <input className="control-input" placeholder="https://example.com/photo.jpg"
              onBlur={e => handlePhotoUrl(e.target.value)} style={{ marginBottom:10 }}/>

            <Sub>Photo Position ↕</Sub>
            <Slider label="Position" value={Math.round(photoPos * 100)}
              setter={v => setPhotoPos(v / 100)} min={0} max={100} unit="%"/>

            <Sub>Photo Effects</Sub>
            <Slider label="Brightness" value={brightness} setter={setBrightness} min={20} max={160}/>
            <Slider label="Contrast"   value={contrast}   setter={setContrast}   min={50} max={200}/>
            <Slider label="Saturation" value={saturation} setter={setSaturation} min={0}  max={200}/>
          </div>
        )}

        {/* ── LOGO SECTION ── */}
        {activeSection === "logo" && (
          <div style={{ padding:12 }}>
            <Lbl icon="🔰">Channel Logo</Lbl>

            <label style={{
              display:"flex", flexDirection:"column", alignItems:"center", gap:4,
              border:"2px dashed var(--border-hi)", borderRadius:7, padding:"14px 10px",
              cursor:"pointer", background:"var(--bg-card)", overflow:"hidden", marginBottom:8,
            }}>
              <input type="file" accept="image/*" hidden onChange={handleLogoFile}/>
              <span style={{ fontSize:26 }}>🔰</span>
              <span style={{ fontSize:11, fontWeight:700, color:"var(--txt-md)" }}>APNA LOGO UPLOAD KARO</span>
              <span style={{ fontSize:10, color:"var(--txt-lo)" }}>PNG transparent best · Square</span>
            </label>

            {logoPreviewSrc && (
              <img src={logoPreviewSrc} alt="" style={{
                width:56, height:56, objectFit:"contain",
                borderRadius:5, marginBottom:8, border:"1px solid var(--border)", background:"#111",
              }}/>
            )}

            <Sub mt={4}>Logo Size</Sub>
            <Slider label="Size" value={logoSize} setter={setLogoSize} min={5} max={18} unit=""/>

            <Sub>Logo Position</Sub>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:5, marginBottom:10 }}>
              {LOGOPOS.map(([k, label]) => (
                <button key={k} onClick={() => setLogoPosKey(k)} style={{
                  padding:"6px 4px", borderRadius:5, fontSize:13, cursor:"pointer",
                  background:"var(--bg-card)",
                  color: logoPosKey === k ? "#fff" : "var(--txt-lo)",
                  border: logoPosKey === k ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                  transition:"all 0.15s",
                }}>{label}</button>
              ))}
            </div>

            <button onClick={resetLogo} style={{
              width:"100%", height:32, background:"transparent",
              border:"1px solid var(--border-hi)", borderRadius:5,
              color:"var(--txt-md)", fontSize:11, fontWeight:700, cursor:"pointer",
            }}>↩ BBN Default Logo Restore</button>
          </div>
        )}

        {/* ── TEXT SECTION ── */}
        {activeSection === "text" && (
          <div style={{ padding:12 }}>
            <Lbl icon="✍">Headline</Lbl>

            <Sub mt={0}>Koi bhi bhasha mein likho</Sub>
            <textarea className="control-input" rows={2} value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Jaise: PM Modi ne kiya bada elan..." style={{ marginBottom:6 }}/>

            <div style={{ display:"flex", gap:5, marginBottom:10 }}>
              <button disabled={translating} onClick={() => handleTranslate("hi")} style={{
                flex:1, padding:"7px 4px", borderRadius:5, fontSize:11, fontWeight:700, cursor:"pointer",
                border:"1px solid #4caf50", background:"rgba(76,175,80,0.06)", color:"#4caf50",
              }}>🇮🇳 {translating ? "..." : "Hindi Banao"}</button>
              <button disabled={translating} onClick={() => handleTranslate("en")} style={{
                flex:1, padding:"7px 4px", borderRadius:5, fontSize:11, fontWeight:700, cursor:"pointer",
                border:"1px solid #4285F4", background:"rgba(66,133,244,0.06)", color:"#4285F4",
              }}>🇬🇧 English</button>
            </div>

            <Sub>Ya Seedha Hindi</Sub>
            <div style={{ display:"flex", gap:5, marginBottom:10 }}>
              <textarea className="control-input" rows={2} style={{ flex:1, minHeight:40, margin:0 }}
                id="hPaste" placeholder="Hindi paste karo..."/>
              <button onClick={() => {
                const t = document.getElementById("hPaste").value.trim();
                if (t) {
                  setHeadline(t);
                  if (hlRef.current) hlRef.current.textContent = t;
                  document.getElementById("hPaste").value = "";
                  showToast("✅ Hindi set ho gaya!");
                }
              }} style={{
                background:"var(--bg-hover)", border:"1px solid var(--accent)",
                borderRadius:6, color:"var(--accent)", fontSize:10, fontWeight:700,
                padding:"8px 8px", cursor:"pointer", whiteSpace:"nowrap",
              }}>⬆ Set<br/>Hindi</button>
            </div>

            <Sub>Headline Preview (Edit kar sakte ho)</Sub>
            <div
              ref={hlRef}
              contentEditable="false"
              suppressContentEditableWarning
              onInput={e => setHeadline(e.currentTarget.innerHTML)}
              style={{
                background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:5,
                padding:"8px 10px", minHeight:44, fontSize:13, fontWeight:700,
                color:"var(--txt-hi)", fontFamily:"'Noto Sans Devanagari', sans-serif",
                lineHeight:1.6, wordBreak:"break-word", marginBottom:10,
              }}
            >{headline}</div>

            <Sub>Text Ka Rang (Select karo → click)</Sub>
            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:6 }}>
              {TXTCOLS.map(([c, fg, label]) => (
                <button key={c} onClick={() => handleApplyColor(c)} style={{
                  padding:"3px 7px", borderRadius:4, fontSize:11, fontWeight:700,
                  cursor:"pointer", background:c, color:fg, border:"1.5px solid transparent",
                }}>{label}</button>
              ))}
              <button onClick={handleRemoveColor} style={{
                padding:"3px 7px", borderRadius:4, fontSize:10, fontWeight:700,
                cursor:"pointer", background:"#2a2a2a", color:"#888", border:"1px solid #444",
              }}>✕ Hato</button>
            </div>
            <div style={{
              fontSize:10, color:"var(--txt-lo)", background:"var(--bg-card)",
              borderRadius:4, padding:"5px 8px", marginBottom:10,
            }}>
              💡 Upar box mein text select karo → fir rang button dabao
            </div>

            <Sub>Source / Channel</Sub>
            <input className="control-input" value={source}
              onChange={e => setSource(e.target.value)} style={{ marginBottom:10 }}/>

            <Sub>Badge Text</Sub>
            <input className="control-input" value={badgeText}
              onChange={e => setBadgeText(e.target.value)} style={{ marginBottom:10 }}/>

            <Sub>LIVE Label</Sub>
            <input className="control-input" value={liveLabel}
              onChange={e => setLiveLabel(e.target.value)}/>
          </div>
        )}

        {/* ── STYLE SECTION ── */}
        {activeSection === "style" && (
          <div style={{ padding:12 }}>
            <Lbl icon="🎨">Style Edit</Lbl>

            <Sub mt={0}>Headline Font Size</Sub>
            <Slider label="Font Size" value={fontSize} setter={setFontSize} min={3} max={9} unit=""/>

            <Sub>Badge Color</Sub>
            <Swatch colors={SWATCHES_BADGE} sel={badgeColor} onSel={setBadgeColor}/>

            <Sub>Top Strip Color</Sub>
            <Swatch colors={SWATCHES_STRIP} sel={stripColor} onSel={setStripColor}/>

            <Sub>Headline Box Background</Sub>
            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:4 }}>
              {BOXBG.map(([c, fg, label]) => (
                <button key={c} onClick={() => setBoxBg(c)} style={{
                  padding:"4px 8px", borderRadius:4, fontSize:10, fontWeight:700, cursor:"pointer",
                  background:c, color:fg,
                  border: boxBg === c ? "2px solid #fff" : "1.5px solid transparent",
                  transition:"all 0.12s",
                }}>{label}</button>
              ))}
            </div>

            <Sub>Headline Text Color</Sub>
            <div style={{ display:"flex", gap:4, marginTop:4, flexWrap:"wrap" }}>
              {HLCOL.map(([c, fg, label]) => (
                <button key={c} onClick={() => setHlColor(c)} style={{
                  padding:"4px 10px", borderRadius:4, fontSize:10, fontWeight:700, cursor:"pointer",
                  background:c, color:fg,
                  border: hlColor === c ? "2px solid var(--accent)" : "1.5px solid transparent",
                  transition:"all 0.12s",
                }}>{label}</button>
              ))}
            </div>

            <Sub>Ticker Bar Color</Sub>
            <Swatch colors={SWATCHES_TICKER} sel={tickerColor} onSel={setTickerColor}/>
          </div>
        )}

        {/* ── OVERLAY SECTION ── */}
        {activeSection === "overlay" && (
          <div style={{ padding:12 }}>
            <Lbl icon="🏷️">Overlays</Lbl>
            <Tog on={ovLogo}    onClick={() => setOvLogo(v => !v)}    label="📍 Logo Badge"/>
            <Tog on={ovLive}    onClick={() => setOvLive(v => !v)}    label="🔴 LIVE Badge"/>
            <Tog on={ovBadge}   onClick={() => setOvBadge(v => !v)}   label="⚡ Breaking Badge"/>
            <Tog on={ovStrip}   onClick={() => setOvStrip(v => !v)}   label="▬ Top Strip"/>
            <Tog on={ovDivider} onClick={() => setOvDivider(v => !v)} label="— Divider Line"/>
            <Tog on={ovSource}  onClick={() => setOvSource(v => !v)}  label="📻 Source Text"/>
          </div>
        )}

      </div>
    </div>
  );
}
