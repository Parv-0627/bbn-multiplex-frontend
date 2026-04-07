// ═══════════════════════════════════════════════════════════════
//  BBN MULTIPLEX — VideoConverter.js
//  WEBM → MP4 converter via BBN backend
// ═══════════════════════════════════════════════════════════════
import React, { useState, useRef } from "react";

const BACKEND = "https://bbn-multiplex-backend.onrender.com/convert";

export default function VideoConverter() {
  const [file,      setFile]      = useState(null);
  const [status,    setStatus]    = useState("idle"); // idle | uploading | converting | done | error
  const [progress,  setProgress]  = useState(0);
  const [mp4Url,    setMp4Url]    = useState(null);
  const [errorMsg,  setErrorMsg]  = useState("");
  const [toast,     setToast]     = useState("");
  const inputRef = useRef(null);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  function handleFile(f) {
    if (!f) return;
    setFile(f); setStatus("idle"); setMp4Url(null); setErrorMsg("");
  }

  async function handleConvert() {
    if (!file) return;
    setStatus("uploading"); setProgress(0); setMp4Url(null); setErrorMsg("");

    try {
      showToast("⏳ Upload ho raha hai...");
      const form = new FormData();
      form.append("video", file, file.name);

      // XHR for upload progress
      const mp4Blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", BACKEND);
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) {
            setProgress(Math.round(e.loaded / e.total * 50));
          }
        };
        xhr.onload = () => {
          if (xhr.status === 200) {
            setStatus("converting"); setProgress(75);
            showToast("🔄 Convert ho raha hai...");
            resolve(xhr.response);
          } else {
            reject(new Error(`Server error: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.responseType = "blob";
        xhr.send(form);
      });

      const url = URL.createObjectURL(mp4Blob);
      setMp4Url(url); setStatus("done"); setProgress(100);
      showToast("✅ MP4 ready! Download karo.");
    } catch(e) {
      setStatus("error"); setErrorMsg(e.message);
      showToast("❌ " + e.message);
    }
  }

  function handleDownload() {
    if (!mp4Url) return;
    const a = document.createElement("a");
    a.href = mp4Url;
    a.download = (file?.name?.replace(/\.[^.]+$/, "") || "BBN_video") + ".mp4";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  const statusColors = { idle:"var(--txt-lo)", uploading:"#D4A520", converting:"#2196F3", done:"#4CAF50", error:"#CC0000" };
  const statusLabels = { idle:"Ready", uploading:`Uploading... ${progress}%`, converting:"Converting to MP4...", done:"Done! ✅", error:"Error ❌" };

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", background:"var(--bg-deep)", padding:"24px 16px", overflowY:"auto" }}>

      {toast && (
        <div style={{ position:"fixed", bottom:20, left:"50%", transform:"translateX(-50%)",
          background:"#1c1c21", border:"1px solid #3a3a48", color:"#f0f0f5",
          padding:"8px 18px", borderRadius:8, fontSize:12, fontWeight:700,
          zIndex:999, pointerEvents:"none" }}>{toast}</div>
      )}

      <div style={{ width:"100%", maxWidth:500 }}>

        {/* Title */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:28, marginBottom:8 }}>🔄</div>
          <div style={{ fontSize:18, fontWeight:700, color:"var(--txt-hi)", marginBottom:6 }}>
            Video Converter
          </div>
          <div style={{ fontSize:12, color:"var(--txt-lo)", lineHeight:1.6 }}>
            WEBM ko MP4 mein convert karo<br/>iPhone, Android, WhatsApp — sab pe chalega
          </div>
        </div>

        {/* Upload zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          style={{
            border: file ? "2px solid #4CAF50" : "2px dashed var(--border-hi)",
            borderRadius:10, padding:"28px 16px", textAlign:"center", cursor:"pointer",
            background: file ? "rgba(76,175,80,0.05)" : "var(--bg-card)",
            marginBottom:16, transition:"all 0.2s",
          }}
        >
          <input ref={inputRef} type="file" accept="video/*,.webm" hidden
            onChange={e => handleFile(e.target.files[0])}/>
          {file ? (
            <>
              <div style={{ fontSize:28, marginBottom:8 }}>🎬</div>
              <div style={{ fontSize:13, fontWeight:700, color:"#4CAF50", marginBottom:4 }}>
                ✅ {file.name.length > 30 ? file.name.substring(0,28)+"..." : file.name}
              </div>
              <div style={{ fontSize:11, color:"var(--txt-lo)" }}>
                {(file.size/1024/1024).toFixed(1)} MB · Click to change
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize:36, marginBottom:10, opacity:0.4 }}>📁</div>
              <div style={{ fontSize:13, fontWeight:700, color:"var(--txt-md)", marginBottom:4 }}>
                WEBM file yahan drag karo
              </div>
              <div style={{ fontSize:11, color:"var(--txt-lo)" }}>ya click karke select karo</div>
            </>
          )}
        </div>

        {/* Status bar */}
        {status !== "idle" && (
          <div style={{ marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between",
              fontSize:11, marginBottom:5 }}>
              <span style={{ color: statusColors[status], fontWeight:700 }}>
                {statusLabels[status]}
              </span>
              <span style={{ color:"var(--txt-lo)" }}>{progress}%</span>
            </div>
            <div style={{ height:5, background:"var(--border)", borderRadius:3 }}>
              <div style={{
                width:`${progress}%`, height:"100%", borderRadius:3, transition:"width 0.3s",
                background: status==="done" ? "#4CAF50" : status==="error" ? "#CC0000" : "linear-gradient(90deg,#CC0000,#D4A520)",
              }}/>
            </div>
            {status === "error" && (
              <div style={{ marginTop:8, fontSize:11, color:"#CC0000",
                background:"rgba(204,0,0,0.08)", borderRadius:5, padding:"6px 10px" }}>
                ❌ {errorMsg}<br/>
                <span style={{ color:"var(--txt-lo)" }}>
                  Backend server start hone mein 30-60 seconds lagte hain (free tier). Thoda wait karo aur dobara try karo.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Convert button */}
        {status !== "done" && (
          <button onClick={handleConvert}
            disabled={!file || status==="uploading" || status==="converting"}
            style={{
              width:"100%", height:46, borderRadius:8, border:"none",
              background: (file && status!=="uploading" && status!=="converting")
                ? "linear-gradient(135deg,#CC0000,#880000)" : "#2a1a1a",
              color: (file && status!=="uploading" && status!=="converting") ? "#fff" : "#555",
              fontSize:14, fontWeight:800, letterSpacing:1, cursor:"pointer",
              transition:"all 0.15s", marginBottom:10,
            }}>
            {status==="uploading" ? `⏳ Uploading... ${progress}%`
             : status==="converting" ? "🔄 Converting..."
             : "🔄 WEBM → MP4 Convert Karo"}
          </button>
        )}

        {/* Download button */}
        {status === "done" && mp4Url && (
          <div style={{ textAlign:"center" }}>
            <button onClick={handleDownload} style={{
              width:"100%", height:46, borderRadius:8, border:"none",
              background:"linear-gradient(135deg,#4CAF50,#2e7d32)",
              color:"#fff", fontSize:14, fontWeight:800, letterSpacing:1,
              cursor:"pointer", marginBottom:10,
            }}>⬇️ MP4 Download Karo</button>
            <button onClick={() => { setFile(null); setStatus("idle"); setProgress(0); setMp4Url(null); }}
              style={{ background:"transparent", border:"1px solid var(--border-hi)",
                color:"var(--txt-md)", borderRadius:7, padding:"8px 20px",
                fontSize:12, cursor:"pointer" }}>
              🔄 Naya Convert Karo
            </button>
          </div>
        )}

        {/* Info box */}
        <div style={{ marginTop:20, background:"var(--bg-card)", borderRadius:8,
          padding:"12px 14px", border:"1px solid var(--border)" }}>
          <div style={{ fontSize:10, fontWeight:700, color:"var(--txt-lo)",
            letterSpacing:1.5, marginBottom:8 }}>ℹ️ INFO</div>
          <div style={{ fontSize:11, color:"var(--txt-lo)", lineHeight:1.7 }}>
            • Sirf WEBM files accept hoti hain<br/>
            • MP4 output — iPhone, Android, WhatsApp sab pe chalega<br/>
            • Server free tier hai — pehli baar 30-60 sec lag sakte hain<br/>
            • File size limit: ~100MB
          </div>
        </div>
      </div>
    </div>
  );
}
