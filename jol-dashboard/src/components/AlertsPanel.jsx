"use client";

import { useEffect, useState } from "react";

const SEV = {
  warn: { accent: "#D97706", bg: "rgba(245,158,11,0.10)",  icon: "⚠" },
  info: { accent: "#3D7FE8", bg: "rgba(61,127,232,0.09)", icon: "ℹ" },
  tip:  { accent: "#0A7A5A", bg: "rgba(16,185,138,0.10)", icon: "✦" },
};

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

export default function AlertsPanel({ isOpen, onClose, alerts }) {
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [dismissingId, setDismisingId] = useState(null);
  const dismiss = (id) => {
    setDismisingId(id);
    setTimeout(() => {
      setDismissedIds((p) => new Set([...p, id]));
      setDismisingId(null);
    }, 300);
  };
  const visible = alerts.filter((a) => !a.dismissed && !dismissedIds.has(a.id));

  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <div
      aria-modal={isOpen ? "true" : undefined}
      style={{
        position: "fixed", inset: 0,
        zIndex: 200, pointerEvents: isOpen ? "auto" : "none",
      }}
    >
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(17,24,39,0.32)",
          backdropFilter: "blur(6px)",
          opacity: isOpen ? 1 : 0,
          transition: `opacity ${isOpen ? "300ms" : "200ms"} var(--ease-out, cubic-bezier(0.23,1,0.32,1))`,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      />

      {/* Drawer */}
      <aside
        aria-label="Smart alerts panel"
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: 340,
          background: "rgba(255,255,255,0.82)",
          border: "1px solid rgba(255,255,255,0.7)",
          borderRight: "none",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          boxShadow: "-12px 0 48px rgba(17,24,39,0.16), inset 1px 0 0 rgba(255,255,255,0.7)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: `transform ${isOpen ? "400ms" : "240ms"} var(--ease-drawer, cubic-bezier(0.32,0.72,0,1))`,
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Top accent line */}
        <div style={{
          height: 2,
          background: "linear-gradient(90deg, transparent, rgba(61,127,232,0.5), transparent)",
        }} />

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-default)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              display: "inline-block", width: 8, height: 8,
              borderRadius: "50%", background: "#E24B4A",
              boxShadow: "0 0 8px rgba(226,75,74,0.5)",
              animation: "glow-pulse 2s ease-in-out infinite",
              '--glow-color': 'rgba(226,75,74,0.5)',
            }} />
            <h2 style={{
              fontSize: 14, fontWeight: 700,
              color: "var(--text-primary)", margin: 0,
              letterSpacing: "-0.01em",
            }}>
              Smart alerts <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                ({visible.length})
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close alerts panel"
            className="pressable"
            style={{
              background: "var(--border-subtle)",
              border: "1px solid var(--border-default)",
              cursor: "pointer", color: "var(--text-secondary)",
              display: "flex", alignItems: "center",
              justifyContent: "center",
              padding: 6, borderRadius: 8,
            }}
          >
            <XIcon />
          </button>
        </div>

        {/* Alert list */}
        <div style={{
          flex: 1, overflowY: "auto",
          padding: 16, display: "flex",
          flexDirection: "column", gap: 10,
        }}>
          {visible.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 8,
              padding: "32px 0", textAlign: "center",
            }}>
              <span style={{ fontSize: 24 }}>✓</span>
              <p style={{ fontSize: 13, color: "#0A7A5A", margin: 0 }}>
                No active alerts – pipeline looks healthy
              </p>
            </div>
          ) : (
            visible.map((a, idx) => {
              const s = SEV[a.severity] || SEV.info;
              const isDismissing = dismissingId === a.id;
              return (
                <div
                  key={a.id}
                  style={{
                    background: s.bg,
                    borderRadius: 12,
                    padding: isDismissing ? '0 14px' : "12px 14px",
                    display: "flex", gap: 10,
                    alignItems: "flex-start",
                    border: `1px solid ${s.accent}28`,
                    borderLeft: `3px solid ${s.accent}`,
                    /* Stagger entrance */
                    opacity: isDismissing ? 0 : 1,
                    transform: isDismissing ? 'translateX(30px)' : 'translateX(0)',
                    maxHeight: isDismissing ? 0 : 200,
                    overflow: 'hidden',
                    transition: 'opacity 250ms ease, transform 250ms ease, max-height 300ms ease, padding 300ms ease',
                    animation: isOpen ? `fade-up 350ms cubic-bezier(0.23,1,0.32,1) ${idx * 60}ms both` : 'none',
                  }}
                >
                  <span style={{
                    fontSize: 14, flexShrink: 0,
                    color: s.accent, marginTop: 1,
                  }}>
                    {s.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 12.5, color: "#374151",
                      margin: 0, lineHeight: 1.55,
                    }}>
                      {a.message}
                    </p>
                    <button
                      type="button"
                      onClick={() => dismiss(a.id)}
                      className="pressable"
                      style={{
                        marginTop: 8, background: "none", border: "none",
                        cursor: "pointer", fontSize: 11,
                        color: "var(--text-muted)", padding: 0,
                        textDecoration: "underline",
                        textUnderlineOffset: 3,
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 20px",
          borderTop: "1px solid var(--border-default)",
          fontSize: 10, color: "var(--text-muted)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          flexShrink: 0,
        }}>
          Rule-based · computed from live pipeline data
        </div>
      </aside>
    </div>
  );
}
