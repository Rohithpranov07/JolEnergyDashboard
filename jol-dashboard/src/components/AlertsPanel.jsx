"use client";

import { useEffect, useState } from "react";

const SEV_STYLE = {
  warn: { border: "#B45309", bg: "#FEF3C7", icon: "⚠️" },
  info: { border: "#185FA5", bg: "#D6E8F7", icon: "ℹ️" },
  tip:  { border: "#0A7864", bg: "#E0F4EF", icon: "💡" },
};

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * Props:
 *   isOpen  – bool
 *   onClose – fn
 *   alerts  – array of { id, message, severity, dismissed }
 *
 * Positioned absolutely within a position:relative parent (Dashboard root div).
 * No position:fixed — uses normal-flow wrapper with min-height.
 */
export default function AlertsPanel({ isOpen, onClose, alerts }) {
  // Internal dismiss state (panel-local, resets when unmounted).
  const [dismissedIds, setDismissedIds] = useState(new Set());

  const dismiss = (id) =>
    setDismissedIds((prev) => new Set([...prev, id]));

  const visible = alerts.filter(
    (a) => !a.dismissed && !dismissedIds.has(a.id),
  );

  // Escape key closes panel.
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [isOpen, onClose]);

  // Body scroll lock while open.
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    /*
     * Outer wrapper: position:absolute covers the full positioned parent
     * (Dashboard root div which is position:relative min-h-screen).
     * pointer-events:none when closed so clicks fall through.
     */
    <div
      aria-modal={isOpen ? "true" : undefined}
      style={{
        position: "absolute",
        inset: 0,
        minHeight: "100%",
        zIndex: 200,
        pointerEvents: isOpen ? "auto" : "none",
      }}
    >
      {/* Backdrop — click to close */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(13,33,55,0.45)",
          opacity: isOpen ? 1 : 0,
          transition: "opacity 250ms ease-out",
          pointerEvents: isOpen ? "auto" : "none",
        }}
      />

      {/* Drawer — slides in from right */}
      <aside
        aria-label="Smart alerts panel"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 320,
          minHeight: "100%",
          background: "#FFFFFF",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 250ms ease-out",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #E0E0E0",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                display: "inline-block",
                width: 10, height: 10,
                borderRadius: "50%",
                background: "#A32D2D",
              }}
            />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0D2137", margin: 0 }}>
              Smart alerts ({visible.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close alerts panel"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#666", display: "flex", alignItems: "center",
              justifyContent: "center", padding: 4, borderRadius: 4,
            }}
          >
            <XIcon />
          </button>
        </div>

        {/* Alert list */}
        <div
          style={{
            flex: 1, overflowY: "auto",
            padding: 16, display: "flex", flexDirection: "column", gap: 10,
          }}
        >
          {visible.length === 0 ? (
            <p style={{ fontSize: 14, color: "#0A7864", marginTop: 8 }}>
              No active alerts — pipeline looks healthy ✓
            </p>
          ) : (
            visible.map((a) => {
              const s = SEV_STYLE[a.severity] || SEV_STYLE.info;
              return (
                <div
                  key={a.id}
                  style={{
                    borderLeft: `4px solid ${s.border}`,
                    background: s.bg,
                    borderRadius: 6,
                    padding: "10px 12px",
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13, color: "#0D2137",
                      margin: 0, lineHeight: 1.5,
                    }}>
                      {a.message}
                    </p>
                    <button
                      type="button"
                      onClick={() => dismiss(a.id)}
                      style={{
                        marginTop: 6, background: "none", border: "none",
                        cursor: "pointer", fontSize: 11, color: "#888780",
                        padding: 0, textDecoration: "underline",
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
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #E0E0E0",
            fontSize: 11, color: "#888780", flexShrink: 0,
          }}
        >
          Rule-based · computed from live pipeline data
        </div>
      </aside>
    </div>
  );
}
