import React, { useState, useRef, useEffect, useCallback } from "react";

const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const TEMPLATES=[
  {id:"classic",   label:"Classic",   emoji:"📰", desc:"Photo top, news bottom"},
  {id:"splitdark", label:"Split Dark",emoji:"🌓", desc:"Dark theme overlay"},
  {id:"fullbleed", label:"Full Bleed",emoji:"🖼️", desc:"Full photo background"},
  {id:"gold",      label:"Gold",      emoji:"✨", desc:"Gold accent style"},
  {id:"ticker",    label:"Ticker",    emoji:"📡", desc:"Live ticker bar"},
  {id:"redbreak",  label:"Red Break", emoji:"🔴", desc:"Bold red breaking"},
  {id:"darkdrama", label:"Dark Drama",emoji:"🌙", desc:"Dark dramatic look"},
  {id:"newspaper", label:"Newspaper", emoji:"🗞️", desc:"Classic newspaper"},
];
const STEPS=[
  {id:"template", icon:"🎨", label:"Template"},
  {id:"photo",    icon:"📸", label:"Photo"},
  {id:"text",     icon:"✍",  label:"Text"},
  {id:"logo",     icon:"📰", label:"Logo"},
];
const LANG_OPTIONS=[
  {code:"hi",label:"Hindi 🇮🇳"},
  {code:"en",label:"English 🇬🇧"},
  {code:"ur",label:"Urdu"},
  {code:"bn",label:"Bengali"},
  {code:"mr",label:"Marathi"},
  {code:"ta",label:"Tamil"},
  {code:"te",label:"Telugu"},
];
const PHOTO_FILTERS=[
  {id:"none",label:"Normal"},{id:"grayscale(100%)",label:"B&W"},
  {id:"sepia(80%)",label:"Sepia"},{id:"contrast(1.4) saturate(1.6)",label:"Vivid"},
  {id:"contrast(1.5) brightness(0.85)",label:"Deep"},
  {id:"saturate(0) contrast(1.3) brightness(1.1)",label:"Matte"},
  {id:"hue-rotate(180deg)",label:"Neon"},
  {id:"invert(10%) sepia(20%) saturate(1.4)",label:"Cinematic"},
];
// eslint-disable-next-line no-unused-vars
const WORD_COLORS=[
  {c:"#CC0000",label:"Red",  fg:"#fff"},{c:"#D4A520",label:"Gold", fg:"#000"},
  {c:"#ffffff",label:"White",fg:"#111"},{c:"#4CAF50",label:"Green",fg:"#fff"},
  {c:"#FF6D00",label:"Orange",fg:"#fff"},{c:"#2196F3",label:"Blue", fg:"#fff"},
  {c:"#E91E63",label:"Pink", fg:"#fff"},{c:"#FFFF00",label:"Yellow",fg:"#111"},
];
const SWATCHES_BADGE =["#CC0000","#D4A520","#0d47a1","#1b5e20","#111","#7b1fa2","#e65100","#006064"];
const SWATCHES_STRIP =["#CC0000","#D4A520","#0d47a1","#fff","#111","#1b5e20"];
const SWATCHES_TICKER=["#CC0000","#D4A520","#0d47a1","#1b5e20","#111"];
const SWATCHES_LOGO_BORDER=["#D4A520","#CC0000","#fff","#4CAF50","#2196F3","#ff6d00","#7b1fa2","#000"];
const BOXBG=[["#ffffff","#111","White"],["#0a0a0a","#fff","Black"],["#1a0000","#fff","D.Red"],["#0d0d1a","#fff","D.Blue"],["#0d1a0d","#fff","D.Grn"],["#1a1500","#fff","D.Gold"]];
const HLCOL=[["#111","#fff","Black"],["#fff","#111","White"],["#CC0000","#fff","Red"],["#D4A520","#000","Gold"],["#4CAF50","#fff","Green"]];
const LOGO_POS=[["tl","↖"],["tm","↑"],["tr","↗"],["ml","◀"],["mr","▶"],["bl","↙"],["bm","↓"],["br","↘"]];

// ── HTML → segments with color, bold, italic, font, size ──────────────────────
function parseSegs(html){
  if(!html) return [{t:"Write your headline here",c:null,b:false,i:false,f:null,sz:null}];
  if(typeof document !== "undefined"){
    const div = document.createElement("div");
    div.innerHTML = html;
    const segs = [];
    function walk(node, ctx){
      if(node.nodeType === 3){
        const txt = node.textContent;
        if(txt) segs.push({t:txt, c:ctx.c, b:ctx.b, i:ctx.i, f:ctx.f, sz:ctx.sz});
        return;
      }
      if(node.nodeType !== 1) return;
      const tag = node.tagName.toLowerCase();
      const style = node.getAttribute("style")||"";
      const next = {...ctx};
      if(tag==="b"||tag==="strong") next.b=true;
      if(tag==="i"||tag==="em")     next.i=true;
      if(tag==="u")                  next.u=true;
      const cm = style.match(/color\s*:\s*([^;]+)/i);
      if(cm) next.c = cm[1].trim();
      const fm = style.match(/font-family\s*:\s*([^;]+)/i);
      if(fm) next.f = fm[1].trim().replace(/['"]/g,"");
      const fsm = node.getAttribute("size");
      if(fsm) next.sz = parseInt(fsm);
      for(const child of node.childNodes) walk(child, next);
    }
    walk(div, {c:null,b:false,i:false,u:false,f:null,sz:null});
    const merged=[];
    for(const s of segs){
      const last=merged[merged.length-1];
      if(last&&last.c===s.c&&last.b===s.b&&last.i===s.i&&last.f===s.f&&last.sz===s.sz)
        last.t+=s.t;
      else merged.push({...s});
    }
    const result=merged.filter(s=>s.t);
    return result.length ? result : [{t:div.textContent||"Write your headline here",c:null,b:false,i:false,f:null,sz:null}];
  }
  const plain=html.replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").replace(/&lt;/g,"<").replace(/&gt;/g,">");
  return [{t:plain||"Write your headline here",c:null,b:false,i:false,f:null,sz:null}];
}

// eslint-disable-next-line no-unused-vars
const FONT_SIZE_MAP={1:10,2:13,3:16,4:18,5:24,6:32,7:48};

// ══════════════════════════════════════════════════════════════
// TEXT OVERLAP FIX — wrapSegs + drawColorHL completely rewritten
// Key changes:
//   1. textBaseline = "top" (was "middle") → reliable multi-line Y
//   2. measureTextH() → pre-calculate height BEFORE drawing
//   3. All templates now call measureTextH() to get real height
//      and position headline dynamically (no more hardcoded offsets)
// ══════════════════════════════════════════════════════════════

// ── COMPLETELY REWRITTEN WRAP + DRAW (no token splitting, no space tokens) ──
// Approach: wrap words into string lines, draw each line centered with fillText
// This avoids all token-width accumulation errors that cause overlap/cutoff

function buildLines(ctx, text, fontStr, maxW) {
  ctx.font = fontStr;
  const words = (text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const word of words) {
    const test = cur ? cur + " " + word : word;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

// Returns total pixel height
function measureTextH(ctx, segs, maxW, fsPx) {
  const text = segs.map(s => s.t).join("") || "Text";
  const style  = segs[0]?.i ? "italic" : "normal";
  const weight = "900";
  const family = segs[0]?.f ? `'${segs[0].f}',Arial,sans-serif` : "Arial,sans-serif";
  const fontStr = `${style} ${weight} ${fsPx}px ${family}`;
  const lines = buildLines(ctx, text, fontStr, maxW);
  return lines.length * fsPx * 1.45;
}

// Draw headline — cx=center X, topY=top Y, maxW=max line width
function drawColorHL(ctx, segs, cx, topY, maxW, fsPx, defColor) {
  if (!segs || !segs.length) return 0;
  const text = segs.map(s => s.t).join("") || "Text";
  const style  = segs[0]?.i ? "italic" : "normal";
  const weight = "900";
  const family = segs[0]?.f ? `'${segs[0].f}',Arial,sans-serif` : "Arial,sans-serif";
  const color  = segs[0]?.c || defColor || "#111";
  const fontStr = `${style} ${weight} ${fsPx}px ${family}`;

  ctx.save();
  ctx.font = fontStr;
  ctx.fillStyle = color;
  ctx.textAlign = "center";   // center align — no manual x calculation
  ctx.textBaseline = "top";

  const lines = buildLines(ctx, text, fontStr, maxW);
  const lh = fsPx * 1.45;

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], cx, topY + i * lh);
  }

  ctx.restore();
  return lines.length * lh;
}

// ── CANVAS ENGINE ─────────────────────────────────────────────
function drawCard(canvas,photoImg,logoImg,cfg){
  const ctx=canvas.getContext("2d");
  const W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);
  const {template,headSegs,source,badgeText,liveLabel,badgeColor,stripColor,boxBg,hlColor,tickerColor,
    ovLogo,ovLive,ovBadge,ovStrip,ovDivider,ovSource,fontSize,logoSize,logoPosKey,
    logoBorderColor,logoBorderWidth,logoShape,photoPos,photoH,brightness,contrast,
    saturation,blur,vignette,warmth,photoFilter}=cfg;
  const sc=W/400;
  const fsPx=Math.max(10,(fontSize||5.5)*sc*5.2);
  const pH_r=(photoH||50)/100;
  const PAD=14*sc;
  const FOOTER=24*sc;

  function CR(x,y,w,h,fn){ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();fn();ctx.restore();}

  function dPhoto(x,y,w,h){
    if(!photoImg){ctx.fillStyle="#1a1a1e";ctx.fillRect(x,y,w,h);ctx.fillStyle="#333";ctx.font=`${10*sc}px Arial`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("Upload Photo",x+w/2,y+h/2);return;}
    CR(x,y,w,h,()=>{
      const iW=photoImg.naturalWidth||1,iH=photoImg.naturalHeight||1;
      const scale=Math.max(w/iW,h/iH);
      const dW=iW*scale,dH=iH*scale;
      const dx=x+(w-dW)/2,dy=y+(h-dH)*(photoPos||0.2);
      let f=`brightness(${(brightness||100)/100}) contrast(${(contrast||100)/100}) saturate(${(saturation||100)/100})`;
      if(blur>0)f+=` blur(${blur}px)`;
      if(photoFilter&&photoFilter!=="none")f+=` ${photoFilter}`;
      ctx.filter=f;ctx.drawImage(photoImg,dx,dy,dW,dH);ctx.filter="none";
      if(warmth>0){ctx.save();ctx.globalAlpha=warmth/400;ctx.fillStyle="#ff8c00";ctx.fillRect(x,y,w,h);ctx.restore();}
      else if(warmth<0){ctx.save();ctx.globalAlpha=Math.abs(warmth)/400;ctx.fillStyle="#0060ff";ctx.fillRect(x,y,w,h);ctx.restore();}
      if(vignette>0){const vg=ctx.createRadialGradient(x+w/2,y+h/2,h*0.2,x+w/2,y+h/2,h*0.85);vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,`rgba(0,0,0,${vignette/100})`);ctx.fillStyle=vg;ctx.fillRect(x,y,w,h);}
    });
  }

  function dLogo(){
    if(!ovLogo)return;
    const sz=(logoSize||10)*sc*5;
    let lx=W-sz-10*sc,ly=8*sc;
    if(logoPosKey==="tl"){lx=10*sc;ly=8*sc;}else if(logoPosKey==="tm"){lx=(W-sz)/2;ly=8*sc;}
    else if(logoPosKey==="tr"){lx=W-sz-10*sc;ly=8*sc;}else if(logoPosKey==="ml"){lx=10*sc;ly=(H-sz)/2;}
    else if(logoPosKey==="mr"){lx=W-sz-10*sc;ly=(H-sz)/2;}else if(logoPosKey==="bl"){lx=10*sc;ly=H-sz-70*sc;}
    else if(logoPosKey==="bm"){lx=(W-sz)/2;ly=H-sz-70*sc;}else if(logoPosKey==="br"){lx=W-sz-10*sc;ly=H-sz-70*sc;}
    const cx2=lx+sz/2,cy2=ly+sz/2;
    const isCircle=logoShape==="circle",isSquare=logoShape==="square";
    ctx.save();ctx.shadowColor="rgba(0,0,0,0.6)";ctx.shadowBlur=10*sc;ctx.globalAlpha=0.92;ctx.fillStyle="#0a0a0a";ctx.beginPath();
    if(isSquare){if(ctx.roundRect)ctx.roundRect(lx,ly,sz,sz,6*sc);else ctx.rect(lx,ly,sz,sz);}
    else if(!isCircle){ctx.save();ctx.translate(cx2,cy2);ctx.rotate(Math.PI/4);ctx.rect(-sz*0.4,-sz*0.4,sz*0.8,sz*0.8);ctx.restore();}
    else{ctx.arc(cx2,cy2,sz/2,0,Math.PI*2);}
    ctx.fill();ctx.restore();
    ctx.save();ctx.strokeStyle=logoBorderColor||"#D4A520";ctx.lineWidth=(logoBorderWidth||1.5)*sc;ctx.beginPath();
    if(isSquare){if(ctx.roundRect)ctx.roundRect(lx,ly,sz,sz,6*sc);else ctx.rect(lx,ly,sz,sz);}
    else if(!isCircle){ctx.save();ctx.translate(cx2,cy2);ctx.rotate(Math.PI/4);ctx.rect(-sz*0.4,-sz*0.4,sz*0.8,sz*0.8);ctx.restore();}
    else{ctx.arc(cx2,cy2,sz/2,0,Math.PI*2);}
    ctx.stroke();ctx.restore();
    ctx.save();ctx.beginPath();
    if(isSquare){if(ctx.roundRect)ctx.roundRect(lx,ly,sz,sz,6*sc);else ctx.rect(lx,ly,sz,sz);}
    else if(!isCircle){ctx.save();ctx.translate(cx2,cy2);ctx.rotate(Math.PI/4);ctx.rect(-sz*0.4,-sz*0.4,sz*0.8,sz*0.8);ctx.restore();}
    else{ctx.arc(cx2,cy2,sz/2-1*sc,0,Math.PI*2);}
    ctx.clip();
    if(logoImg){ctx.drawImage(logoImg,lx,ly,sz,sz);}
    else{ctx.font=`900 ${sz*0.36}px Georgia,serif`;ctx.textAlign="center";ctx.textBaseline="middle";const g=ctx.createLinearGradient(lx,ly,lx,ly+sz);g.addColorStop(0,"#F5D77A");g.addColorStop(0.55,"#D4A520");g.addColorStop(1,"#8B6508");ctx.fillStyle=g;ctx.fillText("BBN",cx2,cy2+0.5);}
    ctx.restore();
  }

  function dStrip(){if(!ovStrip)return;ctx.fillStyle=stripColor||"#CC0000";ctx.fillRect(0,0,W,4*sc);}

  function dBadge(cx,by,whiteBg=false){
    if(!ovBadge)return 0;
    const txt=badgeText||"⚡ Breaking News";
    ctx.save();ctx.font=`700 ${9*sc}px Arial,sans-serif`;
    const bW=ctx.measureText(txt).width+22*sc,bH=18*sc,bx=cx-bW/2;
    if(whiteBg){ctx.fillStyle="#fff";ctx.beginPath();if(ctx.roundRect)ctx.roundRect(bx,by,bW,bH,3*sc);else ctx.rect(bx,by,bW,bH);ctx.fill();ctx.fillStyle=badgeColor||"#CC0000";}
    else{ctx.fillStyle=badgeColor||"#CC0000";ctx.beginPath();if(ctx.roundRect)ctx.roundRect(bx,by,bW,bH,3*sc);else ctx.rect(bx,by,bW,bH);ctx.fill();ctx.fillStyle="#fff";}
    ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(txt,cx,by+bH/2);ctx.restore();return bH;
  }

  function dOutlineBadge(cx,by,color="#D4A520"){
    if(!ovBadge)return 0;
    const txt=badgeText||"⚡ Breaking News";
    ctx.save();ctx.font=`700 ${9*sc}px Arial,sans-serif`;
    const bW=ctx.measureText(txt).width+22*sc,bH=18*sc,bx=cx-bW/2;
    ctx.strokeStyle=color;ctx.lineWidth=1.2*sc;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(bx,by,bW,bH,3*sc);else ctx.rect(bx,by,bW,bH);ctx.stroke();
    ctx.fillStyle=color;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(txt,cx,by+bH/2);ctx.restore();return bH;
  }

  const segs = headSegs || [{t:"News headline here",c:null,b:true,i:false,f:null,sz:null}];
  const maxW = W - 32*sc;

  // Pre-measure headline height for dynamic positioning
  function getHL_H() { return measureTextH(ctx, segs, maxW, fsPx); }

  // Draw headline: cx=center X, zoneTop=top of text zone, zoneH=available height, defColor
  function dHL(cx, zoneTop, zoneH, defColor) {
    const hlH = getHL_H();
    // Vertically center headline in zone, leaving FOOTER at bottom
    const topY = zoneTop + Math.max(PAD, (zoneH - FOOTER - hlH) / 2);
    drawColorHL(ctx, segs, cx, topY, maxW, fsPx, defColor || hlColor || "#111");
  }

  function dSrc(cx,y,color){
    if(!ovSource)return;
    ctx.save();ctx.font=`700 ${7*sc}px Trebuchet MS,sans-serif`;ctx.fillStyle=color||"#999";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText((source||"BBN NEWS").toUpperCase(),cx,y);ctx.restore();
  }

  function dDiv(cx,y,color){
    if(!ovDivider)return;
    ctx.save();ctx.globalAlpha=0.3;ctx.fillStyle=color||"#333";
    const dW=90*sc,dc=6*sc;
    ctx.fillRect(cx-dW/2,y,dW/2-dc,1*sc);ctx.fillRect(cx+dc,y,dW/2-dc,1*sc);
    ctx.save();ctx.translate(cx,y);ctx.rotate(Math.PI/4);ctx.fillRect(-3*sc,-3*sc,6*sc,6*sc);ctx.restore();ctx.restore();
  }

  function dGoldDiv(cx,y){
    if(!ovDivider)return;
    const dg=ctx.createLinearGradient(cx-80*sc,0,cx+80*sc,0);
    dg.addColorStop(0,"rgba(212,165,32,0)");dg.addColorStop(0.5,"#D4A520");dg.addColorStop(1,"rgba(212,165,32,0)");
    ctx.fillStyle=dg;ctx.fillRect(cx-80*sc,y,160*sc,1.5*sc);
  }

  function dTicker(bY,bH){
    ctx.fillStyle=tickerColor||"#CC0000";ctx.fillRect(0,bY,W,bH);
    let pW=0;
    if(ovLive){pW=52*sc;ctx.fillStyle="#8B0000";ctx.fillRect(0,bY,pW,bH);
      ctx.save();ctx.font=`700 ${8*sc}px Trebuchet MS,sans-serif`;ctx.fillStyle="#fff";ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.fillText(liveLabel||"LIVE",pW/2,bY+bH/2);ctx.restore();}
    CR(pW+6*sc,bY+2*sc,W-pW-12*sc,bH-4*sc,()=>{
      const plain=(headSegs||[]).map(s=>s.t).join("");
      ctx.font=`700 ${9*sc}px Arial,sans-serif`;ctx.fillStyle="#fff";ctx.textAlign="left";ctx.textBaseline="middle";
      ctx.fillText(plain,pW+10*sc,bY+bH/2);
    });
  }

  // ── TEMPLATES (all use dynamic dHL now) ───────────────────────
  if(template==="classic"){
    const pH=Math.floor(H*pH_r),hH=H-pH;
    dPhoto(0,0,W,pH);dStrip();dLogo();
    ctx.fillStyle=boxBg||"#fff";ctx.fillRect(0,pH,W,hH);
    ctx.fillStyle=stripColor||"#CC0000";ctx.fillRect(0,pH,W,4*sc);
    const bH=dBadge(W/2,pH+PAD);
    // text zone starts after badge
    dHL(W/2, pH+PAD+bH+PAD, hH-PAD-bH-PAD*2-FOOTER, hlColor||"#111");
    dDiv(W/2,pH+hH-FOOTER,"#333");dSrc(W/2,pH+hH-FOOTER/2,"#999");

  }else if(template==="splitdark"){
    ctx.fillStyle="#0a0a0a";ctx.fillRect(0,0,W,H);
    const pH=Math.floor(H*pH_r),hH=H-pH;
    dPhoto(0,0,W,pH);
    const og=ctx.createLinearGradient(0,pH*0.55,0,pH);
    og.addColorStop(0,"rgba(10,10,10,0)");og.addColorStop(1,"rgba(10,10,10,1)");
    ctx.fillStyle=og;ctx.fillRect(0,pH*0.55,W,pH*0.45);
    dStrip();dLogo();
    ctx.fillStyle="#0a0a0a";ctx.fillRect(0,pH,W,hH);
    const bH=dBadge(W/2,pH+PAD);
    dHL(W/2, pH+PAD+bH+PAD, hH-PAD-bH-PAD*2-FOOTER, "#fff");
    dDiv(W/2,pH+hH-FOOTER,"#fff");dSrc(W/2,pH+hH-FOOTER/2,"#555");

  }else if(template==="fullbleed"){
    dPhoto(0,0,W,H);
    const g=ctx.createLinearGradient(0,H*0.38,0,H);
    g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(0.3,"rgba(0,0,0,0.82)");g.addColorStop(1,"rgba(0,0,0,0.95)");
    ctx.fillStyle=g;ctx.fillRect(0,H*0.38,W,H*0.62);
    dStrip();dLogo();
    const textZoneTop = H*0.58;
    const bH=dBadge(W/2,textZoneTop);
    dHL(W/2, textZoneTop+bH+PAD, H-textZoneTop-bH-PAD*2-FOOTER, "#fff");
    dDiv(W/2,H-FOOTER,"#fff");dSrc(W/2,H-FOOTER/2,"#aaa");

  }else if(template==="gold"){
    ctx.fillStyle="#080808";ctx.fillRect(0,0,W,H);
    const pH=Math.floor(H*pH_r),hH=H-pH;
    dPhoto(0,0,W,pH);dLogo();
    const gb=ctx.createLinearGradient(0,0,W,0);
    gb.addColorStop(0,"#8B6508");gb.addColorStop(0.3,"#D4A520");gb.addColorStop(0.5,"#F5D77A");gb.addColorStop(0.7,"#D4A520");gb.addColorStop(1,"#8B6508");
    ctx.fillStyle=gb;ctx.fillRect(0,pH,W,5*sc);
    ctx.fillStyle="#080808";ctx.fillRect(0,pH+5*sc,W,hH-5*sc);
    const bH=dOutlineBadge(W/2,pH+PAD,"#D4A520");
    dHL(W/2, pH+PAD+bH+PAD, hH-PAD-bH-PAD*2-FOOTER, "#fff");
    dGoldDiv(W/2,pH+hH-FOOTER);dSrc(W/2,pH+hH-FOOTER/2,"#555");

  }else if(template==="ticker"){
    ctx.fillStyle="#000";ctx.fillRect(0,0,W,H);
    const tkH=42*sc,srcH=26*sc,pH=H-tkH-srcH;
    dPhoto(0,0,W,pH);dStrip();dLogo();
    const tg=ctx.createLinearGradient(0,pH*0.5,0,pH);
    tg.addColorStop(0,"rgba(0,0,0,0)");tg.addColorStop(1,"rgba(0,0,0,0.95)");
    ctx.fillStyle=tg;ctx.fillRect(0,pH*0.5,W,pH*0.5);
    // headline inside gradient zone — measure and place from bottom up
    const hlH = getHL_H();
    const hlTop = pH - hlH - PAD;
    drawColorHL(ctx, segs, W/2, hlTop, maxW, fsPx, "#fff");
    dTicker(pH,tkH);
    if(ovSource){ctx.fillStyle="#111";ctx.fillRect(0,pH+tkH,W,srcH);dSrc(W/2,pH+tkH+srcH/2,"#555");}

  }else if(template==="redbreak"){
    const pH=Math.floor(H*pH_r),hH=H-pH;
    dPhoto(0,0,W,pH);
    ctx.fillStyle="rgba(255,255,255,0.15)";ctx.fillRect(0,0,W,4*sc);
    dLogo();
    ctx.fillStyle=badgeColor||"#CC0000";ctx.fillRect(0,pH,W,hH);
    const bH=dBadge(W/2,pH+PAD,true);
    dHL(W/2, pH+PAD+bH+PAD, hH-PAD-bH-PAD*2-FOOTER, "#fff");
    dDiv(W/2,pH+hH-FOOTER,"#fff");dSrc(W/2,pH+hH-FOOTER/2,"rgba(255,255,255,0.6)");

  }else if(template==="darkdrama"){
    ctx.fillStyle="#0d0d0d";ctx.fillRect(0,0,W,H);
    const pH=Math.floor(H*pH_r),hH=H-pH;
    dPhoto(0,0,W,pH);
    ctx.save();ctx.globalAlpha=0.5;ctx.fillStyle="#000";ctx.fillRect(0,0,W,pH);ctx.restore();
    const dg2=ctx.createLinearGradient(0,0,0,pH);
    dg2.addColorStop(0,"rgba(13,13,13,0.2)");dg2.addColorStop(1,"rgba(13,13,13,1)");
    ctx.fillStyle=dg2;ctx.fillRect(0,0,W,pH);
    dStrip();dLogo();ctx.fillStyle="#0d0d0d";ctx.fillRect(0,pH,W,hH);
    const bH=dOutlineBadge(W/2,pH+PAD,"#D4A520");
    dHL(W/2, pH+PAD+bH+PAD, hH-PAD-bH-PAD*2-FOOTER, "#fff");
    dGoldDiv(W/2,pH+hH-FOOTER);dSrc(W/2,pH+hH-FOOTER/2,"#555");

  }else if(template==="newspaper"){
    ctx.fillStyle="#f5f0e8";ctx.fillRect(0,0,W,H);
    const hdrH=30*sc;
    ctx.fillStyle="#1a1a1a";ctx.fillRect(0,0,W,hdrH);
    ctx.save();ctx.font=`700 ${14*sc}px Georgia,serif`;ctx.fillStyle="#f5f0e8";ctx.textAlign="left";ctx.textBaseline="middle";ctx.fillText(source||"BBN NEWS",10*sc,hdrH/2);ctx.restore();
    ctx.save();ctx.font=`400 ${7*sc}px Trebuchet MS,sans-serif`;ctx.fillStyle="#999";ctx.textAlign="right";ctx.textBaseline="middle";
    const nd=new Date();ctx.fillText(`${nd.getDate()} ${MONTHS[nd.getMonth()]} ${nd.getFullYear()}`,W-10*sc,hdrH/2);ctx.restore();
    ctx.fillStyle="#1a1a1a";ctx.fillRect(0,hdrH,W,2*sc);ctx.fillRect(0,hdrH+4*sc,W,1*sc);
    const pH2=Math.floor((H-hdrH)*pH_r*0.9);
    dPhoto(0,hdrH+6*sc,W,pH2);
    let cY=hdrH+6*sc+pH2+10*sc;
    if(ovBadge){ctx.save();ctx.font=`900 ${7*sc}px Arial,sans-serif`;ctx.fillStyle="#CC0000";ctx.textAlign="left";ctx.textBaseline="top";
      ctx.fillText((badgeText||"Breaking").replace(/[^\w\s⚡•·]/g,"").trim().toUpperCase(),12*sc,cY);ctx.restore();cY+=12*sc;}
    // newspaper: left-aligned headline
    ctx.save();ctx.font=`900 ${fsPx*0.85}px Georgia,serif`;ctx.fillStyle="#1a1a1a";ctx.textAlign="left";ctx.textBaseline="top";
    const plain=(headSegs||[]).map(s=>s.t).join("");
    const hw=plain.split(" ");let ln="",lns=[];
    for(let w of hw){const t=ln?ln+" "+w:w;if(ctx.measureText(t).width>W-24*sc&&ln){lns.push(ln);ln=w;}else ln=t;}
    if(ln)lns.push(ln);
    lns.forEach((l,i)=>ctx.fillText(l,12*sc,cY+i*fsPx*0.85*1.3));ctx.restore();
    cY+=lns.length*fsPx*0.85*1.3;
    if(ovSource){ctx.save();ctx.font=`400 ${7*sc}px Trebuchet MS,sans-serif`;ctx.fillStyle="#666";ctx.textAlign="left";ctx.textBaseline="top";
      ctx.fillText(`${(source||"BBN NEWS").toUpperCase()} — Special Report`,12*sc,cY+8*sc);ctx.restore();}
  }
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT (unchanged from original)
// ══════════════════════════════════════════════════════════════
export default function PhotoNewsmaker(){
  const [step,      setStep]      = useState("template");
  const [template,  setTemplate]  = useState("classic");
  const [headHTML,  setHeadHTML]  = useState("Write your headline here");
  const [canvasFont,  setCanvasFont]  = useState("Arial");
  const [canvasColor, setCanvasColor] = useState("#111111");
  const [canvasBold,  setCanvasBold]  = useState(true);
  const [canvasItalic,setCanvasItalic]= useState(false);
  const [source,    setSource]    = useState("BBN NEWS");
  const [badgeText, setBadgeText] = useState("⚡ Breaking News");
  const [liveLabel, setLiveLabel] = useState("LIVE");
  const [badgeColor,setBadgeColor]= useState("#CC0000");
  const [stripColor,setStripColor]= useState("#CC0000");
  const [boxBg,     setBoxBg]     = useState("#ffffff");
  const [hlColor,   setHlColor]   = useState("#111111");
  const [tickerColor,setTickerColor]=useState("#CC0000");
  const [fontSize,  setFontSize]  = useState(5.5);
  const [ovLogo,    setOvLogo]    = useState(true);
  const [ovLive,    setOvLive]    = useState(true);
  const [ovBadge,   setOvBadge]   = useState(true);
  const [ovStrip,   setOvStrip]   = useState(true);
  const [ovDivider, setOvDivider] = useState(true);
  const [ovSource,  setOvSource]  = useState(true);
  const [photoPos,  setPhotoPos]  = useState(0.2);
  const [photoH,    setPhotoH]    = useState(50);
  const [brightness,setBrightness]= useState(100);
  const [contrast,  setContrast]  = useState(100);
  const [saturation,setSaturation]= useState(100);
  const [blur,      setBlur]      = useState(0);
  const [vignette,  setVignette]  = useState(0);
  const [warmth,    setWarmth]    = useState(0);
  const [photoFilter,setPhotoFilter]=useState("none");
  const [photoPrev, setPhotoPrev] = useState(null);
  const [logoSize,  setLogoSize]  = useState(10);
  const [logoPosKey,setLogoPosKey]= useState("tr");
  const [logoBorderColor,setLogoBorderColor]=useState("#D4A520");
  const [logoBorderWidth,setLogoBorderWidth]=useState(1.5);
  const [logoShape, setLogoShape] = useState("circle");
  const [logoPrev,  setLogoPrev]  = useState(null);
  const [selColor,  setSelColor]  = useState("#CC0000");
  // eslint-disable-next-line no-unused-vars
  const [isBold,    setIsBold]    = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [isItalic,  setIsItalic]  = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [rawInput,  setRawInput]  = useState("");
  const [showTranslate,setShowTranslate]=useState(false);
  const [translating,setTranslating]=useState(false);

  const canvasRef  = useRef(null);
  const photoRef   = useRef(null);
  const logoRef    = useRef(null);
  const hlBoxRef   = useRef(null);

  // eslint-disable-next-line no-unused-vars
  const headSegs = parseSegs(headHTML);

  // eslint-disable-next-line no-unused-vars
  function getPlainText(){
    const b = hlBoxRef.current;
    if(b) return (b.innerText || b.textContent || "").trim() || "Write your headline here";
    return headHTML.replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").trim() || "Write your headline here";
  }

  const redraw = useCallback(()=>{
    const c=canvasRef.current;if(!c)return;
    const plain = hlBoxRef.current
      ? (hlBoxRef.current.innerText||hlBoxRef.current.textContent||"").trim()
      : headHTML.replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").trim();
    const simpleSegs = [{
      t: plain || "Write your headline here",
      c: canvasColor,
      b: canvasBold,
      i: canvasItalic,
      f: canvasFont !== "Arial" ? canvasFont : null,
      sz: null
    }];
    drawCard(c,photoRef.current,logoRef.current,{
      template, headSegs:simpleSegs, source, badgeText, liveLabel,
      badgeColor, stripColor, boxBg, hlColor, tickerColor,
      ovLogo, ovLive, ovBadge, ovStrip, ovDivider, ovSource,
      fontSize, logoSize, logoPosKey, logoBorderColor, logoBorderWidth, logoShape,
      photoPos, photoH, brightness, contrast, saturation, blur, vignette, warmth, photoFilter
    });
  // eslint-disable-next-line
  },[template,headHTML,source,badgeText,liveLabel,badgeColor,stripColor,boxBg,hlColor,
     tickerColor,ovLogo,ovLive,ovBadge,ovStrip,ovDivider,ovSource,fontSize,logoSize,
     logoPosKey,logoBorderColor,logoBorderWidth,logoShape,photoPos,photoH,
     brightness,contrast,saturation,blur,vignette,warmth,photoFilter,
     canvasFont,canvasColor,canvasBold,canvasItalic]);

  useEffect(()=>{redraw();},[redraw]);

  function loadPhotoSrc(src){
    const img=new Image();img.crossOrigin="anonymous";
    img.onload=()=>{photoRef.current=img;redraw();};
    img.onerror=()=>{const i=new Image();i.onload=()=>{photoRef.current=i;redraw();};i.src=src;};
    img.src=src;
  }
  function handlePhotoFile(e){
    const f=e.target.files[0];if(!f)return;
    const r=new FileReader();r.onload=ev=>{setPhotoPrev(ev.target.result);loadPhotoSrc(ev.target.result);};r.readAsDataURL(f);
  }
  function handleLogoFile(e){
    const f=e.target.files[0];if(!f)return;
    const r=new FileReader();r.onload=ev=>{
      const img=new Image();img.onload=()=>{logoRef.current=img;setLogoPrev(ev.target.result);redraw();};img.src=ev.target.result;
    };r.readAsDataURL(f);
  }

  const lastSetHTML = useRef("");
  useEffect(()=>{
    const b = hlBoxRef.current;
    if(!b) return;
    if(headHTML !== lastSetHTML.current){
      b.innerHTML = headHTML;
      lastSetHTML.current = headHTML;
    }
  },[headHTML]);

  async function doTranslate(lang){
    const b = hlBoxRef.current;
    const textToTranslate = b ? (b.innerText||b.textContent||"").trim() : "";
    if(!textToTranslate) return;
    setTranslating(true);
    try{
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(textToTranslate)}`;
      const d = await (await fetch(url)).json();
      const txt = d[0].map(x=>x[0]).join('');
      if(hlBoxRef.current){hlBoxRef.current.innerText = txt;}
      setHeadHTML(txt);
      setShowTranslate(false);
    }catch(e){
      alert("Translate failed. Check internet connection.");
    }
    setTranslating(false);
  }

  function execCmd(cmd, value=null){
    const b = hlBoxRef.current; if(!b) return;
    b.focus();
    try { document.execCommand(cmd, false, value); } catch(e) {}
    const html = b.innerHTML;
    lastSetHTML.current = html;
    setHeadHTML(html);
  }

  function resetColors(){
    const b = hlBoxRef.current; if(!b) return;
    const plain = b.innerText || b.textContent || "";
    b.innerHTML = plain;
    lastSetHTML.current = plain;
    setHeadHTML(plain);
  }

  function resetLogo(){logoRef.current=null;setLogoPrev(null);redraw();}
  function doneText(){setStep("logo");}

  function downloadPNG(){
    const c=canvasRef.current;if(!c)return;
    const a=document.createElement("a");a.download=`BBN_${template}_${Date.now()}.png`;
    a.href=c.toDataURL("image/png");document.body.appendChild(a);a.click();document.body.removeChild(a);
  }

  const V={
    hdr:{fontSize:10,fontWeight:700,letterSpacing:"1.5px",color:"#D4A520",textTransform:"uppercase",marginBottom:8,display:"flex",alignItems:"center",gap:6},
    sub:{fontSize:10,color:"var(--txt-lo)",fontWeight:600,marginBottom:4,marginTop:8},
    row:{display:"flex",alignItems:"center",gap:7,marginBottom:5},
    snm:{fontSize:10,color:"var(--txt-lo)",minWidth:70,flexShrink:0},
    svl:{fontSize:10,color:"var(--txt-md)",minWidth:36,textAlign:"right",fontFamily:"monospace"},
    swRow:{display:"flex",flexWrap:"wrap",gap:4,marginTop:4},
    togRow:{display:"flex",alignItems:"center",gap:8,marginBottom:6},
    togLbl:{flex:1,fontSize:11,color:"var(--txt-md)"},
    nextBtn:{width:"100%",height:38,background:"linear-gradient(135deg,#CC0000,#880000)",color:"#fff",border:"none",borderRadius:7,fontSize:12,fontWeight:800,letterSpacing:1,cursor:"pointer",marginTop:10},
    card:{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:6,padding:10,marginBottom:8},
  };

  function Sl({label,value,setter,min,max,unit="",step=1}){
    return<div style={V.row}>
      <span style={V.snm}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e=>setter(Number(e.target.value))} style={{flex:1,accentColor:"var(--red)"}}/>
      <span style={V.svl}>{value}{unit}</span>
    </div>;
  }
  function Tog({on,fn,lbl}){
    return<div style={V.togRow}><span style={V.togLbl}>{lbl}</span><button className={`toggle-sw ${on?"on":""}`} onClick={fn}/></div>;
  }
  function Sw({colors,sel,fn,size=20}){
    return<div style={V.swRow}>{colors.map(c=>(
      <div key={c} onClick={()=>fn(c)} style={{width:size,height:size,borderRadius:4,cursor:"pointer",background:c,flexShrink:0,
        border:sel===c?"2.5px solid #fff":"1.5px solid rgba(255,255,255,0.15)",
        transform:sel===c?"scale(1.2)":"scale(1)",transition:"all 0.12s"}}/>
    ))}</div>;
  }
  function SecHdr({icon,label}){
    return<div style={V.hdr}><span style={{fontSize:16}}>{icon}</span>{label}<span style={{flex:1,height:1,background:"rgba(212,165,32,0.3)"}}/></div>;
  }

  const activeTpl=TEMPLATES.find(t=>t.id===template)||TEMPLATES[0];

  function renderStepContent(){
    if(step==="template") return(
      <div>
        <SecHdr icon="🎨" label="Select Template"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
          {TEMPLATES.map(t=>(
            <button key={t.id} onClick={()=>setTemplate(t.id)} style={{
              padding:"10px 6px",borderRadius:7,cursor:"pointer",textAlign:"center",
              background:template===t.id?"rgba(204,34,0,0.18)":"var(--bg-card)",
              border:template===t.id?"2px solid var(--red)":"1px solid var(--border)",
              transition:"all 0.15s",display:"flex",flexDirection:"column",alignItems:"center",gap:4
            }}>
              <span style={{fontSize:22}}>{t.emoji}</span>
              <span style={{fontSize:11,fontWeight:700,color:template===t.id?"#fff":"var(--txt-md)"}}>{t.label}</span>
              <span style={{fontSize:10,color:"var(--txt-lo)"}}>{t.desc}</span>
            </button>
          ))}
        </div>
        <SecHdr icon="✏️" label="Edit Template"/>
        <div style={V.card}>
          <div style={{...V.sub,marginTop:0}}>Photo / News Split</div>
          <Sl label="Photo Height" value={photoH} setter={setPhotoH} min={25} max={75} unit="%"/>
          <div style={{...V.sub}}>Headline Size</div>
          <Sl label="Font Size" value={fontSize} setter={setFontSize} min={3} max={9} step={0.5}/>
          <div style={{...V.sub}}>Badge Color</div>
          <Sw colors={SWATCHES_BADGE} sel={badgeColor} fn={setBadgeColor}/>
          <div style={{...V.sub}}>Strip Color</div>
          <Sw colors={SWATCHES_STRIP} sel={stripColor} fn={setStripColor}/>
          <div style={{...V.sub}}>Ticker Bar</div>
          <Sw colors={SWATCHES_TICKER} sel={tickerColor} fn={setTickerColor}/>
          <div style={{...V.sub}}>News Box Background</div>
          <div style={{...V.swRow}}>
            {BOXBG.map(([c,fg,label])=>(
              <button key={c} onClick={()=>setBoxBg(c)} style={{
                padding:"3px 7px",borderRadius:4,fontSize:10,fontWeight:700,cursor:"pointer",
                background:c,color:fg,border:boxBg===c?"2.5px solid #fff":"1.5px solid rgba(255,255,255,0.15)",transition:"all 0.12s"
              }}>{label}</button>
            ))}
          </div>
          <div style={{...V.sub}}>Headline Default Color</div>
          <div style={{...V.swRow}}>
            {HLCOL.map(([c,fg,label])=>(
              <button key={c} onClick={()=>setHlColor(c)} style={{
                padding:"3px 8px",borderRadius:4,fontSize:10,fontWeight:700,cursor:"pointer",
                background:c,color:fg,border:hlColor===c?"2.5px solid var(--accent)":"1.5px solid rgba(255,255,255,0.15)",transition:"all 0.12s"
              }}>{label}</button>
            ))}
          </div>
        </div>
        <SecHdr icon="🏷️" label="Layers On/Off"/>
        <div style={V.card}>
          <Tog on={ovLogo}    fn={()=>setOvLogo(v=>!v)}    lbl="Logo Badge"/>
          <Tog on={ovLive}    fn={()=>setOvLive(v=>!v)}    lbl="LIVE Badge"/>
          <Tog on={ovBadge}   fn={()=>setOvBadge(v=>!v)}   lbl="Breaking Badge"/>
          <Tog on={ovStrip}   fn={()=>setOvStrip(v=>!v)}   lbl="Top Strip"/>
          <Tog on={ovDivider} fn={()=>setOvDivider(v=>!v)} lbl="Divider Line"/>
          <Tog on={ovSource}  fn={()=>setOvSource(v=>!v)}  lbl="Source Text"/>
        </div>
        <button style={V.nextBtn} onClick={()=>setStep("photo")}>Next: Add Photo →</button>
      </div>
    );

    if(step==="photo") return(
      <div>
        <SecHdr icon="📸" label="Upload Photo"/>
        <label style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,border:"2px dashed var(--border-hi)",borderRadius:8,padding:"16px 10px",cursor:"pointer",background:"var(--bg-card)",position:"relative",overflow:"hidden",marginBottom:8}}>
          <input type="file" accept="image/*" hidden onChange={handlePhotoFile}/>
          <span style={{fontSize:30}}>🖼️</span>
          <span style={{fontSize:12,fontWeight:700,color:"var(--txt-md)"}}>TAP TO UPLOAD PHOTO</span>
          <span style={{fontSize:10,color:"var(--txt-lo)"}}>JPG · PNG · WEBP · Any size</span>
        </label>
        {photoPrev&&<img src={photoPrev} alt="" style={{width:"100%",height:80,objectFit:"cover",borderRadius:6,marginBottom:10,border:"1px solid var(--border)"}}/>}
        <div style={{...V.sub,marginTop:0}}>Or enter photo URL</div>
        <input className="control-input" placeholder="https://example.com/photo.jpg" style={{marginBottom:10}}
          onBlur={e=>{if(e.target.value.trim()){setPhotoPrev(e.target.value.trim());loadPhotoSrc(e.target.value.trim());}}}/>
        <SecHdr icon="🔍" label="Photo Position"/>
        <div style={V.card}>
          <Sl label="Vertical pos" value={Math.round(photoPos*100)} setter={v=>setPhotoPos(v/100)} min={0} max={100} unit="%"/>
        </div>
        <SecHdr icon="✨" label="Photo Effects"/>
        <div style={V.card}>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:6}}>
            <button onClick={()=>{setBrightness(100);setContrast(100);setSaturation(100);setBlur(0);setVignette(0);setWarmth(0);setPhotoFilter("none");}}
              style={{fontSize:10,color:"var(--txt-lo)",background:"transparent",border:"1px solid var(--border)",borderRadius:4,padding:"2px 8px",cursor:"pointer"}}>Reset All</button>
          </div>
          <Sl label="Brightness" value={brightness} setter={setBrightness} min={20} max={160}/>
          <Sl label="Contrast"   value={contrast}   setter={setContrast}   min={50} max={200}/>
          <Sl label="Saturation" value={saturation} setter={setSaturation} min={0}  max={200}/>
          <Sl label="Blur"       value={blur}        setter={setBlur}       min={0}  max={10} step={0.5} unit="px"/>
          <Sl label="Vignette"   value={vignette}    setter={setVignette}   min={0}  max={90} unit="%"/>
          <Sl label="Warmth"     value={warmth}      setter={setWarmth}     min={-80} max={80}/>
        </div>
        <SecHdr icon="🎞️" label="Preset Filters"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,marginBottom:12}}>
          {PHOTO_FILTERS.map(({id,label})=>(
            <button key={id} onClick={()=>setPhotoFilter(id)} style={{
              padding:"6px 2px",borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer",textAlign:"center",
              background:photoFilter===id?"rgba(232,160,32,0.2)":"var(--bg-card)",
              color:photoFilter===id?"var(--accent)":"var(--txt-lo)",
              border:photoFilter===id?"1.5px solid var(--accent)":"1px solid var(--border)",transition:"all 0.12s"
            }}>{label}</button>
          ))}
        </div>
        <button style={V.nextBtn} onClick={()=>setStep("text")}>Next: Add News Text →</button>
      </div>
    );

    if(step==="text") return(
      <div>
        <SecHdr icon="✍" label="News Headline"/>
        <div style={V.card}>
          <div style={{...V.sub,marginTop:0,fontSize:11,color:"var(--txt-md)"}}>Type or paste your headline</div>
          <div ref={hlBoxRef}
            contentEditable="true"
            suppressContentEditableWarning
            onInput={e=>{
              const html = e.currentTarget.innerHTML;
              lastSetHTML.current = html;
              setHeadHTML(html);
            }}
            style={{
              background:"var(--bg-deep)",border:"2px solid var(--accent)",borderRadius:6,
              padding:"10px 12px",minHeight:70,fontSize:16,fontWeight:700,
              color:"var(--txt-hi)",fontFamily:"Arial,sans-serif",
              lineHeight:1.8,wordBreak:"break-word",cursor:"text",
              userSelect:"text",WebkitUserSelect:"text",marginBottom:8,
              outline:"none"
            }}/>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>{
              const b = hlBoxRef.current;
              if(b){const html = b.innerHTML;lastSetHTML.current = html;setHeadHTML(html+"_");setTimeout(()=>setHeadHTML(html),10);}
            }} style={{
              flex:1,height:34,borderRadius:5,fontSize:12,fontWeight:700,cursor:"pointer",
              background:"rgba(76,175,80,0.12)",color:"#4caf50",border:"1px solid #4caf50"
            }}>✅ Save to Canvas</button>
            <button onClick={()=>setShowTranslate(!showTranslate)} style={{
              flex:1,height:34,borderRadius:5,fontSize:12,fontWeight:700,cursor:"pointer",
              background:showTranslate?"rgba(66,133,244,0.2)":"rgba(66,133,244,0.08)",
              color:"#4285F4",border:"1px solid #4285F4"
            }}>🌐 Translate</button>
          </div>
          {showTranslate&&(
            <div style={{marginTop:8,background:"var(--bg-deep)",borderRadius:5,padding:8,border:"1px solid var(--border)"}}>
              <div style={{fontSize:10,color:"var(--txt-md)",marginBottom:6}}>Type text above → select language → translate:</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                {LANG_OPTIONS.map(({code,label})=>(
                  <button key={code} disabled={translating} onClick={()=>doTranslate(code)} style={{
                    padding:"5px 10px",borderRadius:5,fontSize:11,fontWeight:700,cursor:"pointer",
                    background:"var(--bg-card)",color:"var(--txt-md)",border:"1px solid var(--border)",opacity:translating?0.5:1
                  }}>{translating?"⏳":label}</button>
                ))}
              </div>
              <button onClick={()=>setShowTranslate(false)} style={{fontSize:10,color:"var(--txt-lo)",background:"transparent",border:"none",cursor:"pointer",textDecoration:"underline"}}>Close</button>
            </div>
          )}
        </div>
        <SecHdr icon="🎨" label="Text Formatting"/>
        <div style={V.card}>
          <div style={{fontSize:10,color:"var(--txt-lo)",marginBottom:8,lineHeight:1.5,background:"var(--bg-deep)",borderRadius:4,padding:"5px 8px"}}>
            💡 Select text in box above → apply format below
          </div>
          <div style={{...V.sub,marginTop:0}}>Font Family</div>
          <select value={canvasFont} onChange={e=>{
            if(!e.target.value) return;
            setCanvasFont(e.target.value);
            execCmd("fontName", e.target.value);
          }} style={{
            width:"100%",background:"var(--bg-deep)",border:"1px solid var(--border)",
            borderRadius:5,color:"var(--txt-hi)",fontSize:12,padding:"6px 8px",
            outline:"none",marginBottom:8,cursor:"pointer"
          }}>
            <option value="">-- Select Font --</option>
            <optgroup label="Recommended">
              <option value="Arial">Arial</option>
              <option value="Arial Black">Arial Black</option>
              <option value="Arial Narrow">Arial Narrow</option>
              <option value="Calibri">Calibri</option>
              <option value="Georgia">Georgia</option>
              <option value="Impact">Impact</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Trebuchet MS">Trebuchet MS</option>
              <option value="Verdana">Verdana</option>
            </optgroup>
            <optgroup label="Hindi / Devanagari">
              <option value="Noto Sans Devanagari">Noto Sans Devanagari</option>
              <option value="Mangal">Mangal</option>
              <option value="Aparajita">Aparajita</option>
              <option value="Utsaah">Utsaah</option>
              <option value="Kokila">Kokila</option>
              <option value="Raavi">Raavi</option>
            </optgroup>
            <optgroup label="All Fonts">
              <option value="Agency FB">Agency FB</option>
              <option value="Bahnschrift">Bahnschrift</option>
              <option value="Cambria">Cambria</option>
              <option value="Century Gothic">Century Gothic</option>
              <option value="Comic Sans MS">Comic Sans MS</option>
              <option value="Courier New">Courier New</option>
              <option value="Franklin Gothic Medium">Franklin Gothic Medium</option>
              <option value="Garamond">Garamond</option>
              <option value="Gill Sans MT">Gill Sans MT</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Noto Sans">Noto Sans</option>
              <option value="Segoe UI">Segoe UI</option>
              <option value="Tahoma">Tahoma</option>
              <option value="Verdana">Verdana</option>
            </optgroup>
          </select>
          <div style={V.sub}>Font Size (select text first)</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
            {[{sz:1,label:"XS"},{sz:2,label:"S"},{sz:3,label:"M"},{sz:4,label:"L"},{sz:5,label:"XL"},{sz:6,label:"2X"},{sz:7,label:"3X"}].map(({sz,label})=>(
              <button key={sz} onClick={()=>execCmd("fontSize",sz)} style={{
                flex:1,height:30,borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer",
                background:"var(--bg-deep)",color:"var(--txt-md)",border:"1px solid var(--border)",transition:"all 0.12s"
              }}>{label}</button>
            ))}
          </div>
          <div style={V.sub}>Style</div>
          <div style={{display:"flex",gap:6,marginBottom:8}}>
            <button onClick={()=>{execCmd("bold");setCanvasBold(v=>!v);}} style={{
              flex:1,height:36,borderRadius:5,fontSize:14,fontWeight:900,cursor:"pointer",
              background:canvasBold?"rgba(212,165,32,0.2)":"var(--bg-deep)",
              color:canvasBold?"#D4A520":"var(--txt-hi)",
              border:canvasBold?"1.5px solid #D4A520":"1px solid var(--border)"}}>B</button>
            <button onClick={()=>{execCmd("italic");setCanvasItalic(v=>!v);}} style={{
              flex:1,height:36,borderRadius:5,fontSize:14,fontWeight:700,fontStyle:"italic",cursor:"pointer",
              background:canvasItalic?"rgba(212,165,32,0.2)":"var(--bg-deep)",
              color:canvasItalic?"#D4A520":"var(--txt-hi)",
              border:canvasItalic?"1.5px solid #D4A520":"1px solid var(--border)"}}>I</button>
            <button onClick={()=>execCmd("underline")} style={{
              flex:1,height:36,borderRadius:5,fontSize:13,fontWeight:700,textDecoration:"underline",cursor:"pointer",
              background:"var(--bg-deep)",color:"var(--txt-hi)",border:"1px solid var(--border)"}}>U</button>
            <button onClick={resetColors} style={{
              flex:1,height:36,borderRadius:5,fontSize:11,cursor:"pointer",
              background:"rgba(204,0,0,0.1)",color:"#CC0000",border:"1px solid rgba(204,0,0,0.3)"}}>✕ Clear</button>
          </div>
          <div style={V.sub}>Text Color → Canvas</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:6}}>
            {[
              {c:"#CC0000",label:"Red",fg:"#fff"},{c:"#D4A520",label:"Gold",fg:"#000"},
              {c:"#ffffff",label:"White",fg:"#111",bdr:"1px solid #555"},{c:"#000000",label:"Black",fg:"#fff"},
              {c:"#4CAF50",label:"Green",fg:"#fff"},{c:"#2196F3",label:"Blue",fg:"#fff"},
              {c:"#FF6D00",label:"Orange",fg:"#fff"},{c:"#E91E63",label:"Pink",fg:"#fff"},
              {c:"#FFFF00",label:"Yellow",fg:"#111"},{c:"#9C27B0",label:"Purple",fg:"#fff"},
              {c:"#00BCD4",label:"Cyan",fg:"#111"},
            ].map(({c,label,fg,bdr})=>(
              <button key={c} onClick={()=>{setSelColor(c);setCanvasColor(c);execCmd("foreColor",c);}} style={{
                padding:"4px 8px",borderRadius:4,fontSize:10,fontWeight:700,cursor:"pointer",
                background:c,color:fg,
                border:canvasColor===c?"2.5px solid #fff":(bdr||"1.5px solid transparent"),
                transform:canvasColor===c?"scale(1.08)":"scale(1)",transition:"all 0.12s"
              }}>{label}</button>
            ))}
            <label title="Custom Color" style={{display:"flex",alignItems:"center",gap:3,cursor:"pointer"}}>
              <input type="color" value={selColor} onChange={e=>{
                const c=e.target.value;setSelColor(c);setCanvasColor(c);execCmd("foreColor",c);
              }} style={{width:28,height:28,borderRadius:4,border:"1px solid var(--border)",cursor:"pointer",padding:0}}/>
              <span style={{fontSize:10,color:"var(--txt-lo)"}}>Custom</span>
            </label>
          </div>
          <div style={{display:"flex",gap:4}}>
            <button onClick={()=>execCmd("undo")} style={{flex:1,height:28,borderRadius:4,fontSize:11,cursor:"pointer",background:"var(--bg-deep)",color:"var(--txt-md)",border:"1px solid var(--border)"}}>↩ Undo</button>
            <button onClick={()=>execCmd("redo")} style={{flex:1,height:28,borderRadius:4,fontSize:11,cursor:"pointer",background:"var(--bg-deep)",color:"var(--txt-md)",border:"1px solid var(--border)"}}>↪ Redo</button>
          </div>
        </div>
        <SecHdr icon="⚙️" label="Other Fields"/>
        <div style={V.card}>
          <div style={V.sub}>Source / Channel</div>
          <input className="control-input" value={source} onChange={e=>setSource(e.target.value)} style={{marginBottom:8}}/>
          <div style={V.sub}>Badge Text</div>
          <input className="control-input" value={badgeText} onChange={e=>setBadgeText(e.target.value)} style={{marginBottom:8}}/>
          <div style={V.sub}>LIVE Label</div>
          <input className="control-input" value={liveLabel} onChange={e=>setLiveLabel(e.target.value)}/>
        </div>
        <button style={V.nextBtn} onClick={doneText}>Next: Add Your Logo →</button>
      </div>
    );

    if(step==="logo") return(
      <div>
        <SecHdr icon="📰" label="Your Channel Logo"/>
        <label style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,border:"2px dashed var(--border-hi)",borderRadius:8,padding:"16px 10px",cursor:"pointer",background:"var(--bg-card)",position:"relative",overflow:"hidden",marginBottom:8}}>
          <input type="file" accept="image/*" hidden onChange={handleLogoFile}/>
          <span style={{fontSize:30}}>📰</span>
          <span style={{fontSize:12,fontWeight:700,color:"var(--txt-md)"}}>UPLOAD YOUR CHANNEL LOGO</span>
          <span style={{fontSize:10,color:"var(--txt-lo)"}}>PNG with transparent background recommended</span>
        </label>
        {logoPrev&&(
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <img src={logoPrev} alt="" style={{width:54,height:54,objectFit:"contain",borderRadius:logoShape==="circle"?"50%":logoShape==="square"?"6px":"4px",border:"1px solid var(--border)",background:"#111"}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:"var(--green)",marginBottom:4}}>✅ Logo uploaded!</div>
              <button onClick={resetLogo} style={{height:26,borderRadius:4,background:"transparent",border:"1px solid var(--border-hi)",color:"var(--txt-md)",fontSize:10,fontWeight:700,cursor:"pointer",padding:"0 10px"}}>↩ Remove Logo</button>
            </div>
          </div>
        )}
        <SecHdr icon="🔵" label="Logo Shape"/>
        <div style={{display:"flex",gap:6,marginBottom:10}}>
          {[["circle","⬤ Circle"],["square","■ Square"],["diamond","◆ Diamond"]].map(([v,l])=>(
            <button key={v} onClick={()=>setLogoShape(v)} style={{
              flex:1,padding:"7px 4px",borderRadius:5,fontSize:11,fontWeight:700,cursor:"pointer",
              background:logoShape===v?"rgba(204,34,0,0.15)":"var(--bg-card)",
              color:logoShape===v?"#fff":"var(--txt-lo)",
              border:logoShape===v?"1.5px solid var(--red)":"1px solid var(--border)",transition:"all 0.12s"
            }}>{l}</button>
          ))}
        </div>
        <SecHdr icon="🔍" label="Logo Size & Border"/>
        <div style={V.card}>
          <Sl label="Size" value={logoSize} setter={setLogoSize} min={5} max={20}/>
          <Sl label="Border Width" value={logoBorderWidth} setter={setLogoBorderWidth} min={0} max={5} step={0.5}/>
          <div style={V.sub}>Border Color</div>
          <Sw colors={SWATCHES_LOGO_BORDER} sel={logoBorderColor} fn={setLogoBorderColor}/>
        </div>
        <SecHdr icon="🔍" label="Logo Position"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:12}}>
          {LOGO_POS.map(([k,label])=>(
            <button key={k} onClick={()=>setLogoPosKey(k)} style={{
              padding:"10px 4px",borderRadius:5,fontSize:16,cursor:"pointer",textAlign:"center",
              background:logoPosKey===k?"rgba(212,165,32,0.15)":"var(--bg-card)",
              color:logoPosKey===k?"var(--accent)":"var(--txt-lo)",
              border:logoPosKey===k?"1.5px solid var(--accent)":"1px solid var(--border)",transition:"all 0.12s"
            }}>{label}</button>
          ))}
        </div>
        <button style={{...V.nextBtn,background:"linear-gradient(135deg,#1b5e20,#0d3d10)"}} onClick={downloadPNG}>
          ⬇️ Save & Download PNG
        </button>
        <button style={{...V.nextBtn,background:"transparent",border:"1px solid var(--border-hi)",color:"var(--txt-md)",marginTop:6}} onClick={()=>setStep("template")}>
          ← Back to Start
        </button>
      </div>
    );
  }

  // ── Mobile detect ──
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  // ══════════════════════════════════════════════════════════
  // MOBILE LAYOUT — Canvas top, bottom sheet controls
  // ══════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 46px)",overflow:"hidden",background:"#060608"}}>

        {/* ── TOP: Canvas area ── */}
        <div style={{flex:"0 0 auto",display:"flex",flexDirection:"column",background:"#060608"}}>

          {/* Template ribbon — horizontal scroll */}
          <div style={{display:"flex",gap:5,padding:"6px 10px",overflowX:"auto",background:"var(--bg-base)",borderBottom:"1px solid var(--border)",WebkitOverflowScrolling:"touch"}}>
            {TEMPLATES.map(t=>(
              <button key={t.id} onClick={()=>{setTemplate(t.id);setStep("template");}} style={{
                padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0,
                background:template===t.id?"rgba(204,34,0,0.2)":"var(--bg-card)",
                color:template===t.id?"#fff":"var(--txt-lo)",
                border:template===t.id?"1.5px solid var(--red)":"1px solid var(--border)",
                display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap"
              }}>{t.emoji} {t.label}</button>
            ))}
          </div>

          {/* Canvas — compact height on mobile */}
          <div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:"8px",background:"#060608"}}>
            <canvas ref={canvasRef} width={400} height={500}
              style={{height:"200px",width:"160px",borderRadius:4,boxShadow:"0 4px 24px rgba(0,0,0,0.9)"}}/>
          </div>

          {/* Download button */}
          <button onClick={downloadPNG} style={{
            margin:"0 10px 8px",height:42,
            background:"linear-gradient(135deg,#CC0000,#880000)",
            color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:800,
            letterSpacing:1,cursor:"pointer"
          }}>⬇️ Download PNG</button>
        </div>

        {/* ── BOTTOM: Step tabs + content ── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",background:"var(--bg-panel)",borderTop:"2px solid var(--border)",overflow:"hidden"}}>

          {/* Step tabs — icon + label */}
          <div style={{display:"flex",background:"var(--bg-base)",borderBottom:"1px solid var(--border)",flexShrink:0}}>
            {STEPS.map((s,i)=>{
              const done=STEPS.findIndex(x=>x.id===step)>i;
              const active=step===s.id;
              return(
                <button key={s.id} onClick={()=>setStep(s.id)} style={{
                  flex:1,display:"flex",flexDirection:"column",alignItems:"center",
                  gap:2,padding:"8px 2px",cursor:"pointer",border:"none",
                  background:active?"rgba(204,34,0,0.12)":"transparent",
                  borderBottom:active?"2px solid var(--red)":"2px solid transparent",
                  transition:"all 0.15s"
                }}>
                  <span style={{fontSize:18}}>{done?"✅":s.icon}</span>
                  <span style={{fontSize:9,fontWeight:700,color:active?"#fff":done?"#4caf50":"var(--txt-lo)",letterSpacing:0.5}}>{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Step content — scrollable */}
          <div style={{flex:1,overflowY:"auto",padding:"10px 12px",WebkitOverflowScrolling:"touch"}}>
            {renderStepContent()}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // DESKTOP LAYOUT — unchanged
  // ══════════════════════════════════════════════════════════
  return(
    <div style={{display:"flex",height:"calc(100vh - 46px)",overflow:"hidden",background:"#060608"}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{display:"flex",background:"var(--bg-base)",borderBottom:"1px solid var(--border)",padding:"6px 10px",gap:4,flexShrink:0}}>
          {STEPS.map((s,i)=>{
            const done=STEPS.findIndex(x=>x.id===step)>i;
            const active=step===s.id;
            return(
              <button key={s.id} onClick={()=>setStep(s.id)} style={{
                display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer",
                background:active?"rgba(204,34,0,0.15)":done?"rgba(76,175,80,0.08)":"var(--bg-card)",
                color:active?"#fff":done?"#4caf50":"var(--txt-lo)",
                border:active?"1.5px solid var(--red)":done?"1px solid #4caf50":"1px solid var(--border)",
                transition:"all 0.15s"
              }}>
                <span>{done?"✅":s.icon}</span>
                <span style={{display:"flex",alignItems:"center",gap:3}}>
                  <span style={{color:active?"#ff6666":done?"#4caf50":"var(--txt-lo)",fontSize:9}}>{i+1}.</span>
                  {s.label}
                </span>
              </button>
            );
          })}
          <div style={{flex:1}}/>
          <button onClick={downloadPNG} style={{
            padding:"5px 14px",borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer",
            background:"linear-gradient(135deg,#CC0000,#880000)",color:"#fff",border:"none"
          }}>⬇️ Download</button>
        </div>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",padding:"10px 10px 4px",background:"#060608"}}>
          <canvas ref={canvasRef} width={400} height={500}
            style={{maxWidth:"100%",maxHeight:"100%",aspectRatio:"4/5",boxShadow:"0 8px 48px rgba(0,0,0,0.95)",borderRadius:3}}/>
        </div>
        <div style={{background:"var(--bg-base)",borderTop:"1px solid var(--border)",padding:"5px 8px",display:"flex",gap:4,overflowX:"auto",flexShrink:0}}>
          {TEMPLATES.map(t=>(
            <button key={t.id} onClick={()=>{setTemplate(t.id);setStep("template");}} style={{
              padding:"4px 9px",borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer",
              background:template===t.id?"rgba(204,34,0,0.2)":"var(--bg-card)",
              color:template===t.id?"#fff":"var(--txt-lo)",
              border:template===t.id?"1.5px solid var(--red)":"1px solid var(--border)",
              transition:"all 0.15s",flexShrink:0,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:3
            }}>{t.emoji} {t.label}</button>
          ))}
        </div>
      </div>
      <div style={{
        width:300,flexShrink:0,background:"var(--bg-panel)",
        borderLeft:"1px solid var(--border)",display:"flex",flexDirection:"column",overflow:"hidden"
      }}>
        <div style={{padding:"10px 12px 8px",background:"var(--bg-base)",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          <div style={{fontSize:9,color:"var(--txt-lo)",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:2}}>
            {activeTpl.emoji} {activeTpl.label} Template
          </div>
          <div style={{fontSize:13,fontWeight:700,color:"var(--txt-hi)"}}>
            {STEPS.find(s=>s.id===step)?.icon} {STEPS.find(s=>s.id===step)?.label}
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:12}}>
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}
