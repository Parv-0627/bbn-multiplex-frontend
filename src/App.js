import React, { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("News Video Editor");
  const [headline, setHeadline] = useState("BIG NEWS HEADLINE HERE!");
  const [description, setDescription] = useState("Write your news description here");
  const [ticker, setTicker] = useState("TOP UPDATES: ENTER YOUR SCROLLING NEWS HERE");
  const [logo, setLogo] = useState(null);
  const [video, setVideo] = useState(null);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(40);
  const [tickerX, setTickerX] = useState(640);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef(null);
  const logoImgRef = useRef(null);

  // ✅ Canvas size SIRF EK BAAR — mount pe
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 640;
    canvas.height = 360;
  }, []);

  // Ticker animation
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerX((prev) => (prev < -2000 ? 640 : prev - 2));
    }, 16);
    return () => clearInterval(interval);
  }, []);

  // Draw canvas — canvas.width/height RESET NAHI
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const grad = ctx.createLinearGradient(0, 0, 640, 360);
    grad.addColorStop(0, "#0f3460");
    grad.addColorStop(1, "#e94560");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 360);

    ctx.fillStyle = "#cc0000";
    ctx.fillRect(0, 30, 280, 50);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px Arial";
    ctx.fillText("BREAKING NEWS", 20, 65);

    ctx.fillStyle = "#cc0000";
    ctx.beginPath();
    ctx.moveTo(280, 30);
    ctx.lineTo(310, 55);
    ctx.lineTo(280, 80);
    ctx.fill();

    ctx.fillStyle = "rgba(180,0,0,0.9)";
    ctx.fillRect(0, 90, 620, 58);
    ctx.fillStyle = "#FFD700";
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.fillText(headline.substring(0, 28), 12, 132);

    ctx.fillStyle = "#ffffff";
    ctx.font = "15px Arial";
    ctx.fillText(description, 12, 165);

    ctx.fillStyle = "#cc0000";
    ctx.fillRect(10, 288, 58, 28);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Arial";
    ctx.fillText("LIVE", 18, 307);

    ctx.fillStyle = "#003399";
    ctx.fillRect(70, 288, 82, 28);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px Arial";
    ctx.fillText("NEWS 24", 76, 307);

    if (logoImgRef.current) {
      ctx.drawImage(logoImgRef.current, 490, 282, 130, 36);
    } else {
      ctx.fillStyle = "#003399";
      ctx.fillRect(490, 282, 130, 36);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px Arial";
      ctx.fillText("YOUR LOGO", 500, 305);
    }

    ctx.fillStyle = "#FFD700";
    ctx.fillRect(0, 325, 640, 35);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 325, 640, 35);
    ctx.clip();
    ctx.fillStyle = "#000000";
    ctx.font = "bold 14px Arial";
    ctx.fillText(ticker, tickerX, 348);
    ctx.restore();

  }, [headline, description, ticker, logo, fontSize, fontFamily, tickerX]);

  // Logo load
  useEffect(() => {
    if (!logo) { logoImgRef.current = null; return; }
    const img = new Image();
    img.onload = () => { logoImgRef.current = img; };
    img.src = logo;
  }, [logo]);

  // ✅ FIXED Export
  const handleExport = async () => {
    if (!video) { alert("Please upload a video first!"); return; }
    setExporting(true);
    setProgress(0);

    try {
      const canvas = canvasRef.current;

      // ✅ DOM mein add karo — audio ke liye zaruri
      const videoEl = document.createElement("video");
      videoEl.src = URL.createObjectURL(video);
      videoEl.muted = false;
      videoEl.style.display = "none";
      document.body.appendChild(videoEl);

      await new Promise((res) => { videoEl.onloadedmetadata = res; });

      const duration = videoEl.duration;
      const stream = canvas.captureStream(30);

      // ✅ AudioContext
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaElementSource(videoEl);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      source.connect(audioCtx.destination);

      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) {
        stream.addTrack(audioTrack);
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8,opus",
      });
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "bbn-news-video.webm";
        a.click();
        document.body.removeChild(videoEl); // ✅ Cleanup
        setExporting(false);
        setProgress(100);
      };

      // ✅ drawFrame — canvas reset NAHI
      const drawFrame = () => {
        const ctx = canvas.getContext("2d");

        ctx.drawImage(videoEl, 0, 0, 640, 360);

        ctx.fillStyle = "#cc0000";
        ctx.fillRect(0, 30, 280, 50);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 26px Arial";
        ctx.fillText("BREAKING NEWS", 20, 65);

        ctx.fillStyle = "#cc0000";
        ctx.beginPath();
        ctx.moveTo(280, 30); ctx.lineTo(310, 55); ctx.lineTo(280, 80);
        ctx.fill();

        ctx.fillStyle = "rgba(180,0,0,0.9)";
        ctx.fillRect(0, 90, 620, 58);
        ctx.fillStyle = "#FFD700";
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        ctx.fillText(headline.substring(0, 28), 12, 132);

        ctx.fillStyle = "#ffffff";
        ctx.font = "15px Arial";
        ctx.fillText(description, 12, 165);

        ctx.fillStyle = "#cc0000";
        ctx.fillRect(10, 288, 58, 28);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.fillText("LIVE", 18, 307);

        ctx.fillStyle = "#003399";
        ctx.fillRect(70, 288, 82, 28);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Arial";
        ctx.fillText("NEWS 24", 76, 307);

        if (logoImgRef.current) {
          ctx.drawImage(logoImgRef.current, 490, 282, 130, 36);
        } else {
          ctx.fillStyle = "#003399";
          ctx.fillRect(490, 282, 130, 36);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 13px Arial";
          ctx.fillText("YOUR LOGO", 500, 305);
        }

        ctx.fillStyle = "#FFD700";
        ctx.fillRect(0, 325, 640, 35);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 325, 640, 35);
        ctx.clip();
        ctx.fillStyle = "#000000";
        ctx.font = "bold 14px Arial";
        const tx = 640 - ((videoEl.currentTime / duration) * 2640);
        ctx.fillText(ticker, tx, 348);
        ctx.restore();

        setProgress(Math.round((videoEl.currentTime / duration) * 100));

        if (!videoEl.paused && !videoEl.ended) {
          requestAnimationFrame(drawFrame);
        } else if (videoEl.ended) {
          recorder.stop();
        }
      };

      recorder.start(100); // ✅ 100ms chunks
      videoEl.play();
      requestAnimationFrame(drawFrame);

    } catch (err) {
      alert("Export failed: " + err.message);
      setExporting(false);
    }
  };

  return (
    <div className="bbn-app">
      <div className="top-nav">
        <div className="nav-logo">&#9654; BBN</div>
        {["Multiplex Panel","Photo News Maker","News Video Editor","Social Video Editor","Video Converter"].map((tab) => (
          <button key={tab} className={`nav-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </div>

      <div className="editor-body">
        <div className="preview-panel">
          <div className="canvas-wrapper">
            <canvas ref={canvasRef} className="preview-canvas" />
          </div>
          <div className="timeline-bar">
            <div className="timeline-controls">
              <button className="tl-btn">&#9646;&#9646;</button>
              <button className="tl-btn play">&#9654;</button>
              <div className="timeline-track">
                <div className="timeline-progress" style={{width: `${progress}%`}}></div>
                <span className="timeline-time">{progress}%</span>
              </div>
            </div>
            <div className="timeline-strip">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="timeline-thumb" style={{background: `hsl(${i*40},60%,40%)`}}></div>
              ))}
            </div>
          </div>
        </div>

        <div className="controls-panel">
          <div className="control-section">
            <div className="control-label">Upload Video</div>
            <label className="upload-btn">
              &#8679; Upload Video
              <input type="file" accept="video/*" hidden onChange={(e) => setVideo(e.target.files[0])} />
            </label>
            {video && <div className="file-name">&#10003; {video.name}</div>}
          </div>

          <div className="control-section">
            <div className="control-label">Add Headline</div>
            <input className="control-input" value={headline}
              onChange={(e) => setHeadline(e.target.value)} />
            <div className="font-controls">
              <select className="font-select" onChange={(e) => setFontFamily(e.target.value)}>
                <option>Arial</option><option>Georgia</option>
                <option>Impact</option><option>Verdana</option>
              </select>
              <select className="font-select" onChange={(e) => setFontSize(Number(e.target.value))}>
                {[24,28,32,36,40,48].map(s => <option key={s}>{s}</option>)}
              </select>
              <button className="font-btn">A</button>
              <button className="font-btn dark">A</button>
            </div>
          </div>

          <div className="control-section">
            <div className="control-label">Add Ticker</div>
            <input className="control-input" value={ticker}
              onChange={(e) => setTicker(e.target.value)} />
          </div>

          <div className="control-section">
            <div className="control-label">Add Logo</div>
            <label className="upload-btn">
              &#8679; Upload
              <input type="file" accept="image/*" hidden
                onChange={(e) => setLogo(URL.createObjectURL(e.target.files[0]))} />
            </label>
            {logo && <div className="file-name">&#10003; Logo added</div>}
          </div>

          <div className="control-section">
            <div className="control-label">Add Music</div>
            <select className="control-input">
              <option>Background Track - 1</option>
              <option>Background Track - 2</option>
              <option>No Music</option>
            </select>
          </div>

          <button className="export-btn" onClick={handleExport} disabled={exporting}>
            {exporting ? `Exporting... ${progress}%` : "⬇ Export Video"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
