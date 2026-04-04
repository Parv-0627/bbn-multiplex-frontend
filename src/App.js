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

  // Ticker animation
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerX((prev) => (prev < -2000 ? 640 : prev - 2));
    }, 16);
    return () => clearInterval(interval);
  }, []);

  // Draw canvas preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    drawFrame(ctx, canvas.width, canvas.height);
  }, [headline, description, ticker, logo, fontSize, fontFamily, tickerX]);

  const drawFrame = (ctx, w, h) => {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#0f3460");
    grad.addColorStop(1, "#e94560");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Breaking News banner
    ctx.fillStyle = "#cc0000";
    ctx.fillRect(0, 30, 260, 48);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px Arial";
    ctx.fillText("BREAKING NEWS", 14, 62);

    // Arrow
    ctx.fillStyle = "#cc0000";
    ctx.beginPath();
    ctx.moveTo(260, 30);
    ctx.lineTo(290, 54);
    ctx.lineTo(260, 78);
    ctx.fill();

    // Headline box
    ctx.fillStyle = "rgba(180,0,0,0.88)";
    ctx.fillRect(0, 88, w - 40, 52);
    ctx.fillStyle = "#FFD700";
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.fillText(headline.substring(0, 28), 14, 128);

    // Description
    ctx.fillStyle = "#ffffff";
    ctx.font = "15px Arial";
    ctx.fillText(description, 14, 158);

    // LIVE badge
    ctx.fillStyle = "#cc0000";
    ctx.fillRect(10, h - 70, 55, 26);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px Arial";
    ctx.fillText("LIVE", 18, h - 51);

    // NEWS 24
    ctx.fillStyle = "#003399";
    ctx.fillRect(67, h - 70, 76, 26);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px Arial";
    ctx.fillText("NEWS 24", 72, h - 51);

    // Logo area
    if (logoImgRef.current) {
      ctx.drawImage(logoImgRef.current, w - 130, h - 75, 120, 32);
    } else {
      ctx.fillStyle = "#003399";
      ctx.fillRect(w - 130, h - 75, 120, 32);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px Arial";
      ctx.fillText("YOUR LOGO", w - 122, h - 55);
    }

    // Ticker bar
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(0, h - 38, w, 38);
    ctx.save();
    ctx.rect(0, h - 38, w, 38);
    ctx.clip();
    ctx.fillStyle = "#000000";
    ctx.font = "bold 13px Arial";
    ctx.fillText(ticker, tickerX, h - 14);
    ctx.restore();
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { logoImgRef.current = img; setLogo(url); };
    img.src = url;
  };

  const handleExport = async () => {
    if (!video) { alert("Please upload a video first!"); return; }
    setExporting(true);
    setProgress(10);

    try {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

      setProgress(20);

      const ffmpeg = new FFmpeg();
      ffmpeg.on("progress", ({ progress: p }) => {
        setProgress(20 + Math.round(p * 70));
      });

      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd";
      await ffmpeg.load({
