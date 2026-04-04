import React, { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("news");
  const [headline, setHeadline] = useState("BIG NEWS HEADLINE HERE!");
  const [description, setDescription] = useState("Write your news description here");
  const [ticker, setTicker] = useState("TOP UPDATES: ENTER YOUR SCROLLING NEWS HERE");
  const [logo, setLogo] = useState(null);
  const [video, setVideo] = useState(null);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(40);
  const canvasRef = useRef(null);
  const tickerRef = useRef(null);
  const [tickerX, setTickerX] = useState(800);

  // Ticker animation
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerX((prev) => (prev < -2000 ? 800 : prev - 2));
    }, 16);
    return () => clearInterval(interval);
  }, []);

  // Draw canvas preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = 640;
    canvas.height = 360;

    // Background
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, 640, 360);

    // City BG gradient
    const grad = ctx.createLinearGradient(0, 0, 640, 360);
    grad.addColorStop(0, "#0f3460");
    grad.addColorStop(1, "#e94560");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 360);

    // Breaking News red banner
    ctx.fillStyle = "#cc0000";
    ctx.fillRect(0, 30, 280, 50);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px Arial";
    ctx.fillText("BREAKING NEWS", 20, 65);

    // Arrow shape
    ctx.fillStyle = "#cc0000";
    ctx.beginPath();
    ctx.moveTo(280, 30);
    ctx.lineTo(310, 55);
    ctx.lineTo(280, 80);
    ctx.fill();

    // Headline box
    ctx.fillStyle = "rgba(180,0,0,0.85)";
    ctx.fillRect(0, 90, 600, 55);
    ctx.fillStyle = "#FFD700";
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.fillText(headline.substring(0, 30), 15, 130);

    // Description
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px Arial";
    ctx.fillText(description, 15, 165);

    // LIVE badge
    ctx.fillStyle = "#cc0000";
    ctx.fillRect(10, 290, 60, 28);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Arial";
    ctx.fillText("LIVE", 20, 309);

    // News 24
    ctx.fillStyle = "#003399";
    ctx.fillRect(72, 290, 80, 28);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px Arial";
    ctx.fillText("NEWS 24", 78, 309);

    // Logo placeholder
    ctx.fillStyle = "#003399";
    ctx.fillRect(490, 285, 130, 32);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Arial";
    ctx.fillText(logo ? "YOUR LOGO" : "YOUR LOGO", 500, 306);

    // Bottom ticker bar
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(0, 325, 640, 35);
    ctx.fillStyle = "#000000";
    ctx.font = "bold 14px Arial";
    ctx.save();
    ctx.rect(0, 325, 640, 35);
    ctx.clip();
    ctx.fillText(ticker, tickerX, 348);
    ctx.restore();

  }, [headline, description, ticker, logo, fontSize, fontFamily, tickerX]);

  const handleExport = async () => {
    if (!video) { alert("Please upload a video first!"); return; }
    const formData = new FormData();
    formData.append("video", video);
    formData.append("headline", headline);
    formData.append("ticker", ticker);
    try {
      const res = await fetch("https://bbn-multiplex-backend.onrender.com/convert", {
        method: "POST", body: formData,
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "bbn-news-video.mp4"; a.click();
    } catch (err) {
      alert("Export failed: " + err.message);
    }
  };

  return (
    <div className="bbn-app">
      {/* TOP NAV */}
      <div className="top-nav">
        <div className="nav-logo">
          <span className="nav-logo-icon">▶</span> BBN
        </div>
        {["Multiplex Panel","Photo News Maker","News Video Editor","Social Video Editor","Video Converter"].map((tab) => (
          <button
            key={tab}
            className={`nav-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >{tab}</button>
        ))}
      </div>

      {/* MAIN EDITOR */}
      <div className="editor-body">
        {/* LEFT: PREVIEW */}
        <div className="preview-panel">
          <div className="canvas-wrapper">
            <canvas ref={canvasRef} className="preview-canvas" />
          </div>

          {/* TIMELINE */}
          <div className="timeline-bar">
            <div className="timeline-controls">
              <button className="tl-btn">⏮</button>
              <button className="tl-btn play">▶</button>
              <div className="timeline-track">
                <div className="timeline-progress"></div>
                <span className="timeline-time">24</span>
              </div>
            </div>
            <div className="timeline-strip">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="timeline-thumb" style={{background: `hsl(${i*40},60%,40%)`}}></div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: CONTROLS */}
        <div className="controls-panel">
          {/* Upload Video */}
          <div className="control-section">
            <div className="control-label">Upload Video</div>
            <label className="upload-btn">
              ⬆ Upload Video
              <input type="file" accept="video/*" hidden onChange={(e) => setVideo(e.target.files[0])} />
            </label>
            {video && <div className="file-name">✅ {video.name}</div>}
          </div>

          {/* Headline */}
          <div className="control-section">
            <div className="control-label">Add Headline</div>
            <input
              className="control-input"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="BIG NEWS HEADLINE HERE!"
            />
            <div className="font-controls">
              <select className="font-select" onChange={(e) => setFontFamily(e.target.value)}>
                <option>Arial</option>
                <option>Georgia</option>
                <option>Impact</option>
                <option>Verdana</option>
              </select>
              <select className="font-select" onChange={(e) => setFontSize(Number(e.target.value))}>
                {[24,28,32,36,40,48].map(s => <option key={s}>{s}</option>)}
              </select>
              <button className="font-btn">A</button>
              <button className="font-btn dark">A</button>
            </div>
          </div>

          {/* Ticker */}
          <div className="control-section">
            <div className="control-label">Add Ticker</div>
            <input
              className="control-input"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="WRITE YOUR SCROLLING NEWS HERE"
            />
          </div>

          {/* Logo */}
          <div className="control-section">
            <div className="control-label">Add Logo</div>
            <label className="upload-btn">
              ⬆ Upload
              <input type="file" accept="image/*" hidden onChange={(e) => setLogo(URL.createObjectURL(e.target.files[0]))} />
            </label>
          </div>

          {/* Music */}
          <div className="control-section">
            <div className="control-label">Add Music</div>
            <select className="control-input">
              <option>Background Track - 1</option>
              <option>Background Track - 2</option>
              <option>No Music</option>
            </select>
          </div>

          {/* Export */}
          <button className="export-btn" onClick={handleExport}>
            ⬇ Export Video
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
