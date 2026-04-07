// ═══════════════════════════════════════════════════════════════
//  BBN MULTIPLEX — MultiplexPanel.js
//  Home dashboard — sab tools ka overview
// ═══════════════════════════════════════════════════════════════
import React from "react";

const TOOLS = [
  {
    id: "Photo News Maker",
    icon: "📰",
    title: "Photo News Maker",
    desc: "Breaking news cards banao — 8 templates, logo, badge, ticker. PNG download karo.",
    color: "#CC0000",
    badge: "POPULAR",
  },
  {
    id: "News Video Editor",
    icon: "🎬",
    title: "News Video Editor",
    desc: "Video pe news ticker, headline aur BBN logo overlay karo. WEBM/MP4 export.",
    color: "#D4A520",
    badge: null,
  },
  {
    id: "Social Video Editor",
    icon: "📱",
    title: "Social Video Editor",
    desc: "Instagram Reels, YouTube Shorts ke liye vertical news videos banao.",
    color: "#4CAF50",
    badge: "NEW",
  },
  {
    id: "Video Converter",
    icon: "🔄",
    title: "Video Converter",
    desc: "WEBM ko MP4 mein convert karo. iPhone aur Android dono pe chalega.",
    color: "#2196F3",
    badge: null,
  },
];

export default function MultiplexPanel({ onNavigate, user }) {
  return (
    <div style={{
      flex: 1, overflowY: "auto", background: "var(--bg-deep)",
      padding: "24px 16px",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24, textAlign: "center" }}>
        <div style={{
          fontSize: 32, fontWeight: 900, letterSpacing: 4,
          background: "linear-gradient(135deg,#F5D77A,#D4A520,#8B6508)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text", marginBottom: 6,
        }}>BBN MULTIPLEX</div>
        <div style={{ fontSize: 12, color: "var(--txt-lo)", letterSpacing: 2 }}>
          NEWS PRODUCTION STUDIO
        </div>
        {user && (
          <div style={{
            marginTop: 10, display: "inline-flex", alignItems: "center", gap: 8,
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 20, padding: "5px 14px",
          }}>
            {user.photoURL && (
              <img src={user.photoURL} alt="" style={{ width: 22, height: 22, borderRadius: "50%" }} />
            )}
            <span style={{ fontSize: 11, color: "var(--txt-md)" }}>
              Welcome, {user.displayName?.split(" ")[0]}!
            </span>
          </div>
        )}
      </div>

      {/* Tool cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 12, maxWidth: 900, margin: "0 auto",
      }}>
        {TOOLS.map(tool => (
          <div key={tool.id} onClick={() => onNavigate(tool.id)}
            style={{
              background: "var(--bg-card)", border: `1px solid var(--border)`,
              borderRadius: 10, padding: "18px 16px", cursor: "pointer",
              transition: "all 0.18s", position: "relative", overflow: "hidden",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = tool.color;
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {/* Left accent bar */}
            <div style={{
              position: "absolute", left: 0, top: 0, bottom: 0,
              width: 3, background: tool.color, borderRadius: "10px 0 0 10px",
            }}/>

            {/* Badge */}
            {tool.badge && (
              <div style={{
                position: "absolute", top: 12, right: 12,
                background: tool.color + "22", border: `1px solid ${tool.color}55`,
                color: tool.color, fontSize: 9, fontWeight: 800,
                padding: "2px 7px", borderRadius: 3, letterSpacing: 1,
              }}>{tool.badge}</div>
            )}

            <div style={{ fontSize: 28, marginBottom: 10 }}>{tool.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--txt-hi)", marginBottom: 6 }}>
              {tool.title}
            </div>
            <div style={{ fontSize: 11, color: "var(--txt-lo)", lineHeight: 1.6 }}>
              {tool.desc}
            </div>
            <div style={{
              marginTop: 14, display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: 11, fontWeight: 700, color: tool.color,
            }}>
              Open → 
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 32, fontSize: 11, color: "var(--txt-lo)" }}>
        BBN Multiplex v2.0 — News Production Studio
      </div>
    </div>
  );
}
