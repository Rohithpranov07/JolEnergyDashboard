"use client";

import { Fragment, useMemo, useState } from "react";
import Papa from "papaparse";

const STAGE_COLORS = {
  Lead: { bg: "#E6F1FB", text: "#0C447C" },
  Contacted: { bg: "#EAF3DE", text: "#27500A" },
  Qualified: { bg: "#FEF3C7", text: "#B45309" },
  Interested: { bg: "#FAEEDA", text: "#633806" },
  "LOI Received": { bg: "#E1F5EE", text: "#085041" },
  "Sample Requested": { bg: "#EEEDFE", text: "#3C3489" },
  Discussion: { bg: "#FAECE7", text: "#712B13" },
};
const INTEREST_COLORS = {
  High: { bg: "#EAF3DE", text: "#27500A" },
  Medium: { bg: "#FEF3C7", text: "#B45309" },
  Low: { bg: "#FCEBEB", text: "#791F1F" },
};
const DEFAULT_BADGE = { bg: "#F1EFE8", text: "#444441" };
const PER_PAGE = 10;
const HIDDEN_FIELDS = new Set(["forceStage", "loiReceived"]);

function Badge({ value, map }) {
  if (value == null || value === "") return "—";
  const c = map[value] || DEFAULT_BADGE;
  return (
    <span
      className="inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-medium"
      style={{ background: c.bg, color: c.text }}
    >
      {value}
    </span>
  );
}

const cellWidth = (w) => (typeof w === "number" ? `${w}px` : w);
const isUrl = (v) => typeof v === "string" && /^https?:\/\//.test(v);

export default function LeadTable({
  data = [],
  columns = [],
  // filters / onFilterChange accepted for API parity (parent owns dropdown filters)
  filters,
  onFilterChange,
  searchable = true,
  expandable = false,
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((r) =>
      String(r.company || "").toLowerCase().includes(q),
    );
  }, [data, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (Array.isArray(av)) av = av.join(", ");
      if (Array.isArray(bv)) bv = bv.join(", ");
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      av = String(av ?? "");
      bv = String(bv ?? "");
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  // Reset to page 1 when the filter/sort/data signature changes — done with
  // React's "adjust state during render" pattern (no effect → no cascading
  // renders, satisfies react-hooks/set-state-in-effect).
  const resetSig = `${search}|${sortKey ?? ""}|${sortDir}|${data.length}`;
  const [prevSig, setPrevSig] = useState(resetSig);
  if (resetSig !== prevSig) {
    setPrevSig(resetSig);
    if (page !== 1) setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const pageRows = sorted.slice(start, start + PER_PAGE);
  const showingFrom = sorted.length === 0 ? 0 : start + 1;
  const showingTo = Math.min(start + PER_PAGE, sorted.length);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const exportCsv = () => {
    const rows = filtered.map((r) => {
      const out = {};
      columns.forEach((c) => {
        let v = r[c.key];
        if (Array.isArray(v)) v = v.join(", ");
        out[c.label] = v;
      });
      return out;
    });
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jol-leads-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderCell = (row, col) => {
    if (typeof col.format === "function") return col.format(row[col.key], row);
    if (col.key === "stage") return <Badge value={row.stage} map={STAGE_COLORS} />;
    if (col.key === "interest")
      return <Badge value={row.interest} map={INTEREST_COLORS} />;
    let v = row[col.key];
    if (Array.isArray(v)) v = v.join(", ");
    return v == null || v === "" ? "—" : String(v);
  };

  const colKeys = new Set(columns.map((c) => c.key));
  const isEmptyValue = (v) =>
    (Array.isArray(v) && v.length === 0) ||
    (typeof v === "object" &&
      v !== null &&
      !Array.isArray(v) &&
      Object.keys(v).length === 0);
  const remainingFields = (row) =>
    Object.keys(row).filter(
      (k) =>
        !colKeys.has(k) &&
        !HIDDEN_FIELDS.has(k) &&
        row[k] != null &&
        row[k] !== "" &&
        !isEmptyValue(row[k]),
    );
  const rowId = (row, idx) => row.id ?? `row-${idx}`;
  const colSpan = columns.length + (expandable ? 1 : 0);

  return (
    <div className="overflow-hidden rounded-lg border border-[#E0E0E0] bg-white">
      {/* toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFEFEF] p-3">
        {searchable ? (
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company…"
            className="w-56 rounded-md border border-[#E0E0E0] px-3 py-1.5 text-sm outline-none focus:border-[#185FA5]"
          />
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-md border border-[#185FA5] px-3 py-1.5 text-sm font-medium text-[#185FA5] transition-colors hover:bg-[#185FA5] hover:text-white"
        >
          Export CSV
        </button>
      </div>

      {/* table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#E0E0E0] bg-[#F8FAFC]">
              {expandable && <th className="w-8" />}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: cellWidth(col.width) }}
                  onClick={() => toggleSort(col.key)}
                  className="cursor-pointer select-none px-3 py-2.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#666666] hover:text-[#185FA5]"
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      <span className="text-[10px]">
                        {sortDir === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-3 py-8 text-center text-sm text-gray-400"
                >
                  No leads match the current filters.
                </td>
              </tr>
            )}
            {pageRows.map((row, idx) => {
              const id = rowId(row, start + idx);
              const isOpen = expandedId === id;
              const bg = idx % 2 === 0 ? "#FFFFFF" : "#F0F6FC";
              return (
                <Fragment key={id}>
                  <tr
                    style={{ background: bg }}
                    className={expandable ? "cursor-pointer hover:bg-[#EAF2FB]" : ""}
                    onClick={
                      expandable
                        ? () => setExpandedId(isOpen ? null : id)
                        : undefined
                    }
                  >
                    {expandable && (
                      <td className="px-2 text-center text-gray-400">
                        <span
                          className="inline-block transition-transform"
                          style={{ transform: isOpen ? "rotate(90deg)" : "none" }}
                        >
                          ›
                        </span>
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-3 py-2.5 align-top text-[#333333]"
                      >
                        {renderCell(row, col)}
                      </td>
                    ))}
                  </tr>
                  {expandable && isOpen && (
                    <tr style={{ background: bg }}>
                      <td colSpan={colSpan} className="px-4 pb-4 pt-0">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 rounded-md bg-[#F8FAFC] p-3 text-[13px] sm:grid-cols-3">
                          {remainingFields(row).map((k) => {
                            const val = row[k];
                            return (
                              <div key={k} className="flex flex-col">
                                <span className="text-[11px] uppercase tracking-wide text-gray-400">
                                  {k}
                                </span>
                                <span className="break-words text-[#333333]">
                                  {isUrl(val) ? (
                                    <a
                                      href={val}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#185FA5] underline"
                                    >
                                      {val}
                                    </a>
                                  ) : Array.isArray(val) ? (
                                    val.join(", ")
                                  ) : typeof val === "object" ? (
                                    JSON.stringify(val)
                                  ) : (
                                    String(val)
                                  )}
                                </span>
                              </div>
                            );
                          })}
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

      {/* footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EFEFEF] p-3 text-sm text-[#666666]">
        <span>
          Showing {showingFrom}–{showingTo} of {sorted.length} leads
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-md border border-[#E0E0E0] px-3 py-1 transition-colors hover:bg-gray-50 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs">
            Page {safePage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-md border border-[#E0E0E0] px-3 py-1 transition-colors hover:bg-gray-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
