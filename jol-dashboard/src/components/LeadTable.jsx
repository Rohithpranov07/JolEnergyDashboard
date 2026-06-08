"use client";

import { Fragment, useMemo, useState } from "react";
import Papa from "papaparse";

// ── Design tokens (Luma Light system) ────────────────────────────────────────
const CARD_BG     = "rgba(255,255,255,0.85)";
const CARD_BORDER = "1px solid rgba(17,24,39,0.07)";
const CARD_SHADOW = "0 1px 2px rgba(17,24,39,0.04), 0 6px 24px rgba(17,24,39,0.06)";
const LABEL_STYLE = {
  fontSize: 10, fontWeight: 700, letterSpacing: "0.11em",
  textTransform: "uppercase", color: "var(--text-muted)",
};

// ── Shared color maps ─────────────────────────────────────────────────────────
const STAGE_COLORS = {
  Lead:               { bar: "#93C5FD", bg: "rgba(61,127,232,0.10)",  text: "#1E5BB8" },
  Contacted:          { bar: "#6EE7B7", bg: "rgba(16,185,138,0.11)",  text: "#0A7A5A" },
  Qualified:          { bar: "#FCD34D", bg: "rgba(245,158,11,0.13)",  text: "#9A6207" },
  Interested:         { bar: "#FCA044", bg: "rgba(180,83,9,0.11)",    text: "#B45309" },
  "LOI Received":     { bar: "#34D399", bg: "rgba(16,185,138,0.16)",  text: "#047857" },
  "Sample Requested": { bar: "#C4B5FD", bg: "rgba(139,127,245,0.14)", text: "#5B4FD1" },
  Discussion:         { bar: "#F9A8D4", bg: "rgba(240,101,106,0.13)", text: "#C2474C" },
};
const INTEREST_COLORS = {
  High:   { bg: "rgba(16,185,138,0.13)",  text: "#047857" },
  Medium: { bg: "rgba(245,158,11,0.13)",  text: "#9A6207" },
  Low:    { bg: "rgba(220,38,38,0.09)",   text: "#C62828" },
};
const DEFAULT_BADGE = { bg: "rgba(17,24,39,0.06)", text: "var(--text-secondary)" };

const PER_PAGE = 10;
const HIDDEN_FIELDS = new Set(["forceStage", "loiReceived"]);

// ── Helpers ───────────────────────────────────────────────────────────────────
const contactColor = (days) =>
  days <= 7 ? "#10B98A" : days <= 14 ? "#F59E0B" : "#EF4444";
const isUrl = (v) => typeof v === "string" && /^https?:\/\//.test(v);
const isEmptyVal = (v) =>
  (Array.isArray(v) && v.length === 0) ||
  (v !== null && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);

// ── Mini icons ────────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function ChevronIcon({ open }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 200ms ease" }}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function SortArrow({ dir, accent }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      {dir === "asc"
        ? <path d="M5 1L9 7H1L5 1Z" fill={accent} />
        : <path d="M5 9L1 3H9L5 9Z" fill={accent} />}
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function LeadTable({
  data           = [],
  columns        = [],
  title          = "All Leads",
  label          = "Lead Directory",
  accentColor    = "#3D7FE8",
  exportFilename = "jol-leads",
  citySubField,
  stateSubField,
  searchable     = true,
  expandable     = false,
}) {
  const [search, setSearch]         = useState("");
  const [sortKey, setSortKey]       = useState(null);
  const [sortDir, setSortDir]       = useState("asc");
  const [page, setPage]             = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [renderedExpandedId, setRenderedExpandedId] = useState(null);
  const [isExpanding, setIsExpanding] = useState(false);

  const handleRowClick = (id) => {
    const isCurrentlyOpen = expandedId === id;
    if (isCurrentlyOpen) {
      setIsExpanding(false);
      setExpandedId(null);
      setTimeout(() => {
        setRenderedExpandedId(null);
      }, 280);
    } else {
      setRenderedExpandedId(id);
      setExpandedId(id);
      setTimeout(() => {
        setIsExpanding(true);
      }, 20);
    }
  };

  // ── Filtering ──
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(r => String(r.company || "").toLowerCase().includes(q));
  }, [data, search]);

  // ── Sorting ──
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      let av = a[sortKey]; let bv = b[sortKey];
      if (Array.isArray(av)) av = av.join(", ");
      if (Array.isArray(bv)) bv = bv.join(", ");
      if (typeof av === "number" && typeof bv === "number")
        return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc"
        ? String(av ?? "").localeCompare(String(bv ?? ""))
        : String(bv ?? "").localeCompare(String(av ?? ""));
    });
  }, [filtered, sortKey, sortDir]);

  // Reset to page 1 when query/sort/data changes
  const sig = `${search}|${sortKey ?? ""}|${sortDir}|${data.length}`;
  const [prevSig, setPrevSig] = useState(sig);
  if (sig !== prevSig) { setPrevSig(sig); if (page !== 1) setPage(1); }

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * PER_PAGE;
  const pageRows   = sorted.slice(start, start + PER_PAGE);
  const showFrom   = sorted.length === 0 ? 0 : start + 1;
  const showTo     = Math.min(start + PER_PAGE, sorted.length);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const exportCsv = () => {
    const rows = filtered.map(r => {
      const out = {};
      columns.forEach(c => {
        let v = r[c.key];
        if (Array.isArray(v)) v = v.join(", ");
        out[c.label] = v;
      });
      return out;
    });
    const csv  = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `${exportFilename}-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Cell renderer ──
  const renderCell = (row, col) => {
    if (typeof col.format === "function") return col.format(row[col.key], row);

    const v = row[col.key];

    // Company: optional city/state subline
    if (col.key === "company") {
      const city  = citySubField  ? row[citySubField]  : null;
      const state = stateSubField ? row[stateSubField] : null;
      const sub   = [city, state && state !== city ? state : null].filter(Boolean).join(", ");
      return (
        <div>
          <div style={{ fontWeight: 650, color: "var(--text-primary)", fontSize: 13.5, lineHeight: 1.3 }}>{v || "–"}</div>
          {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
        </div>
      );
    }

    // Stage: colored badge (left border handled at row level)
    if (col.key === "stage") {
      const s = STAGE_COLORS[v] || DEFAULT_BADGE;
      return (
        <span style={{
          fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 999,
          background: s.bg, color: s.text,
          border: `1px solid ${(STAGE_COLORS[v]?.bar ?? "transparent")}55`,
          whiteSpace: "nowrap",
        }}>
          {v || "–"}
        </span>
      );
    }

    // Interest: colored badge
    if (col.key === "interest") {
      if (!v) return <span style={{ color: "var(--text-muted)" }}>–</span>;
      const s = INTEREST_COLORS[v] || DEFAULT_BADGE;
      return (
        <span style={{
          fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 999,
          background: s.bg, color: s.text, whiteSpace: "nowrap",
        }}>
          {v}
        </span>
      );
    }

    // Last contact: colored dot
    if (col.key === "lastContactDaysAgo") {
      const days  = Number(v) || 0;
      const color = contactColor(days);
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
            background: color, boxShadow: `0 0 0 2.5px ${color}30`,
          }} />
          <span className="tnum" style={{ fontSize: 12.5, color: "var(--text-secondary)", fontWeight: 500, whiteSpace: "nowrap" }}>
            {days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days}d ago`}
          </span>
        </div>
      );
    }

    // Arrays: truncate at 2 + overflow count
    if (Array.isArray(v)) {
      if (v.length === 0) return <span style={{ color: "var(--text-muted)" }}>–</span>;
      return (
        <span style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
          {v.slice(0, 2).join(", ")}{v.length > 2 ? ` +${v.length - 2}` : ""}
        </span>
      );
    }

    if (v == null || v === "") return <span style={{ color: "var(--text-muted)" }}>–</span>;
    return <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{String(v)}</span>;
  };

  const colKeySet   = new Set(columns.map(c => c.key));
  const extraFields = (row) =>
    Object.keys(row).filter(k =>
      !colKeySet.has(k) && !HIDDEN_FIELDS.has(k) &&
      row[k] != null && row[k] !== "" && !isEmptyVal(row[k]));

  const rowBg   = (idx, isOpen) =>
    isOpen ? "rgba(61,127,232,0.04)" : idx % 2 === 1 ? "rgba(17,24,39,0.018)" : "transparent";
  const colSpan = columns.length + (expandable ? 1 : 0);

  return (
    <div style={{
      background: CARD_BG, border: CARD_BORDER, borderRadius: 20,
      boxShadow: CARD_SHADOW, backdropFilter: "blur(12px)", overflow: "hidden",
    }}>

      {/* ── Header ── */}
      <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(17,24,39,0.07)" }}>
        <div style={{ ...LABEL_STYLE, marginBottom: 6 }}>{label}</div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{
            fontSize: 16, fontWeight: 700, color: "var(--text-primary)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            {title}
            <span style={{
              fontSize: 11.5, fontWeight: 600, color: accentColor,
              background: `${accentColor}12`, border: `1px solid ${accentColor}28`,
              padding: "2px 10px", borderRadius: 999,
            }}>
              {data.length} leads
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {searchable && (
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <span style={{
                  position: "absolute", left: 10, color: "var(--text-muted)",
                  pointerEvents: "none", display: "flex", alignItems: "center",
                }}>
                  <SearchIcon />
                </span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search company…"
                  style={{
                    paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                    fontSize: 13, fontWeight: 500, color: "var(--text-primary)",
                    background: "rgba(17,24,39,0.04)", border: "1px solid var(--border-default)",
                    borderRadius: 12, outline: "none", width: 200,
                    transition: "border-color 180ms ease",
                  }}
                  onFocus={e => { e.target.style.borderColor = `${accentColor}60`; }}
                  onBlur={e =>  { e.target.style.borderColor = "var(--border-default)"; }}
                />
              </div>
            )}
            <button type="button" onClick={exportCsv}
              className="pressable"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 12, fontSize: 12.5, fontWeight: 600,
                background: `${accentColor}10`, border: `1px solid ${accentColor}28`,
                color: accentColor, cursor: "pointer",
              }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "rgba(17,24,39,0.025)", borderBottom: "1px solid rgba(17,24,39,0.07)" }}>
              {expandable && <th style={{ width: 44, padding: "10px 0" }} />}
              {columns.map(col => (
                <th key={col.key}
                  onClick={() => toggleSort(col.key)}
                  style={{
                    ...LABEL_STYLE,
                    padding: "10px 14px", textAlign: col.align ?? "left",
                    cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
                    color: sortKey === col.key ? accentColor : undefined,
                    width: col.width ? `${col.width}px` : undefined,
                  }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {col.label}
                    {sortKey === col.key && <SortArrow dir={sortDir} accent={accentColor} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={colSpan}
                  style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ opacity: 0.35 }} aria-hidden>
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    No leads match the current filters.
                  </div>
                </td>
              </tr>
            )}
            {pageRows.map((row, idx) => {
              const id         = row.id ?? `row-${start + idx}`;
              const isOpen     = expandable && expandedId === id;
              const isRendered = expandable && renderedExpandedId === id;
              const isFullyOpen = isExpanding && expandedId === id;
              const stagePalette = STAGE_COLORS[row.stage];
              const borderColor  = stagePalette?.bar ?? "transparent";

              return (
                <Fragment key={id}>
                  <tr
                    onClick={expandable ? () => handleRowClick(id) : undefined}
                    className="lead-row"
                    style={{
                      background: rowBg(idx, isOpen),
                      borderLeft: `3px solid ${borderColor}`,
                      borderBottom: "1px solid var(--border-subtle)",
                      cursor: expandable ? "pointer" : "default",
                    }}>
                    {expandable && (
                      <td style={{ width: 44, textAlign: "center", color: "var(--text-muted)", paddingLeft: 4 }}>
                        <ChevronIcon open={isOpen} />
                      </td>
                    )}
                    {columns.map(col => (
                      <td key={col.key}
                        style={{
                          padding: "11px 14px",
                          verticalAlign: "middle",
                          textAlign: col.align ?? "left",
                        }}
                        className={
                          col.key === "monthlyKgEstimate" || col.key === "consumptionMT"
                            ? "tnum" : undefined
                        }>
                        {renderCell(row, col)}
                      </td>
                    ))}
                  </tr>

                  {/* Expanded detail panel */}
                  {expandable && isRendered && (
                    <tr style={{
                      borderLeft: `3px solid ${borderColor}`,
                      background: "rgba(61,127,232,0.025)",
                      borderBottom: isFullyOpen ? "1px solid rgba(17,24,39,0.06)" : "0px solid transparent",
                      transition: "border-bottom 280ms var(--ease-out)",
                    }}>
                      <td colSpan={colSpan} style={{ 
                        padding: isFullyOpen ? "0px 20px 16px 20px" : "0px 20px",
                        transition: "padding 280ms var(--ease-out)",
                      }}>
                        <div className={`collapsible-container ${isFullyOpen ? "open" : ""}`}>
                          <div className="collapsible-content">
                            <div style={{
                              background: "rgba(255,255,255,0.75)",
                              backdropFilter: "blur(8px)",
                              border: "1px solid rgba(17,24,39,0.07)",
                              borderRadius: 14,
                              padding: "14px 18px",
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                              gap: "12px 24px",
                              marginTop: 6,
                            }}>
                              {extraFields(row).map(k => {
                                const val = row[k];
                                return (
                                  <div key={k} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                    <span style={{ ...LABEL_STYLE }}>{k}</span>
                                    <span style={{ fontSize: 12.5, color: "#374151", fontWeight: 500, lineHeight: 1.4 }}>
                                      {isUrl(val) ? (
                                        <a href={val} target="_blank" rel="noopener noreferrer"
                                          style={{ color: accentColor, textDecoration: "underline" }}>
                                          {val}
                                        </a>
                                      ) : Array.isArray(val) ? val.join(", ")
                                        : typeof val === "object" ? JSON.stringify(val)
                                        : String(val)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Footer / Pagination ── */}
      <div style={{
        padding: "12px 20px",
        borderTop: "1px solid rgba(17,24,39,0.07)",
        display: "flex", flexWrap: "wrap", alignItems: "center",
        justifyContent: "space-between", gap: 12,
      }}>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
          Showing{" "}
          <strong style={{ color: "var(--text-secondary)" }}>{showFrom}–{showTo}</strong>
          {" "}of{" "}
          <strong style={{ color: "var(--text-secondary)" }}>{sorted.length}</strong> leads
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" disabled={safePage <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="pressable"
            style={{
              padding: "6px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 600,
              background: "rgba(17,24,39,0.04)", border: "1px solid var(--border-default)",
              color: "var(--text-secondary)", cursor: "pointer", opacity: safePage <= 1 ? 0.4 : 1,
            }}>
            ← Prev
          </button>
          <span style={{ fontSize: 12, color: "var(--text-muted)", minWidth: 80, textAlign: "center" }}>
            Page {safePage} / {totalPages}
          </span>
          <button type="button" disabled={safePage >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="pressable"
            style={{
              padding: "6px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 600,
              background: "rgba(17,24,39,0.04)", border: "1px solid var(--border-default)",
              color: "var(--text-secondary)", cursor: "pointer", opacity: safePage >= totalPages ? 0.4 : 1,
            }}>
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
