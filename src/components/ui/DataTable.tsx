"use client";
/**
 * DataTable — NextAdmin-style table with sort, search, pagination, action menu.
 * Uses only CSS variables — works in dark AND light themes automatically.
 */
import { useState, useMemo, useRef, useEffect, ReactNode } from "react";

/* ── Minimal SVG icons ─────────────────────────────────────────────────────── */
const Ico = {
  search:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  sortBoth: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 9l4-4 4 4M16 15l-4 4-4-4"/></svg>,
  sortAsc:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>,
  sortDesc: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  dots:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/></svg>,
  chevL:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  chevR:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  plus:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
};

/* ── Types ───────────────────────────────────────────────────────────────── */
export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
  render?: (row: T) => ReactNode;
}

export interface Action<T> {
  label: string;
  icon?: ReactNode;
  onClick: (row: T) => void;
  danger?: boolean;
  hidden?: (row: T) => boolean;
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  searchPlaceholder?: string;
  pageSize?: number;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  title?: string;
  subtitle?: string;
  onAdd?: () => void;
  addLabel?: string;
  toolbar?: ReactNode;
}

/* ── Row action dropdown ─────────────────────────────────────────────────── */
function ActionMenu<T>({ row, actions }: { row: T; actions: Action<T>[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const items = actions.filter(a => !a.hidden?.(row));
  if (!items.length) return null;

  return (
    <div ref={ref} style={{ position: "relative", display: "flex", justifyContent: "flex-end" }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="btn-ghost"
        style={{ padding: "5px 7px", borderRadius: 6 }}
        title="Actions"
      >
        {Ico.dots}
      </button>
      {open && (
        <div className="act-menu" onClick={e => e.stopPropagation()}>
          {items.map((a, i) => (
            <button key={i} className={`act-item ${a.danger ? "danger" : ""}`}
              onClick={() => { a.onClick(row); setOpen(false); }}>
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main DataTable ──────────────────────────────────────────────────────── */
export function DataTable<T extends Record<string, unknown>>({
  data, columns, actions,
  searchPlaceholder = "Search…",
  pageSize = 10,
  emptyMessage = "No records found",
  emptyIcon,
  title, subtitle,
  onAdd, addLabel = "Add New",
  toolbar,
}: Props<T>) {
  const [q,    setQ]    = useState("");
  const [sk,   setSk]   = useState("");
  const [sd,   setSd]   = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    let r = [...data];
    if (q) {
      const lq = q.toLowerCase();
      r = r.filter(row =>
        Object.values(row).some(v => String(v ?? "").toLowerCase().includes(lq))
      );
    }
    if (sk) {
      r.sort((a, b) => {
        const av = String(a[sk] ?? ""), bv = String(b[sk] ?? "");
        const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
        return sd === "asc" ? cmp : -cmp;
      });
    }
    return r;
  }, [data, q, sk, sd]);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const slice = rows.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (k: string) => {
    if (sk === k) setSd(d => d === "asc" ? "desc" : "asc");
    else { setSk(k); setSd("asc"); }
    setPage(1);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      {(title || onAdd || toolbar) && (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          {title && (
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--c-text)", letterSpacing: "-0.02em" }}>{title}</h2>
              {subtitle && <p style={{ fontSize: 12, color: "var(--c-muted)", marginTop: 2 }}>{subtitle}</p>}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {toolbar}
            {onAdd && (
              <button className="btn-primary" onClick={onAdd}>
                {Ico.plus}{addLabel}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Toolbar: search + count */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ position: "relative", maxWidth: 280, flex: "1 1 200px" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--c-muted)", pointerEvents: "none" }}>
            {Ico.search}
          </span>
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder={searchPlaceholder}
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
          />
        </div>
        <span style={{ fontSize: 12, color: "var(--c-muted)", whiteSpace: "nowrap" }}>
          {rows.length} result{rows.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="tbl-wrap">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr className="tbl-head">
                {columns.map(col => (
                  <th
                    key={col.key}
                    className={`tbl-th ${col.sortable ? "sort" : ""}`}
                    style={{ textAlign: col.align || "left", width: col.width }}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      {col.header}
                      {col.sortable && (
                        <span style={{ opacity: sk === col.key ? 1 : 0.4, color: sk === col.key ? "var(--c-brand)" : "var(--c-muted)" }}>
                          {sk === col.key ? (sd === "asc" ? Ico.sortAsc : Ico.sortDesc) : Ico.sortBoth}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
                {actions && <th className="tbl-th" style={{ width: 44 }} />}
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (actions ? 1 : 0)}
                    style={{ textAlign: "center", padding: "52px 16px", color: "var(--c-muted)" }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      {emptyIcon && <span style={{ opacity: 0.35 }}>{emptyIcon}</span>}
                      <p style={{ fontSize: 13 }}>{q ? `No results for "${q}"` : emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : slice.map((row, ri) => (
                <tr key={ri} className="tbl-row">
                  {columns.map(col => (
                    <td key={col.key} className="tbl-td" style={{ textAlign: col.align || "left" }}>
                      {col.render ? col.render(row) : String(row[col.key] ?? "—")}
                    </td>
                  ))}
                  {actions && (
                    <td className="tbl-td" style={{ padding: "8px 10px" }}>
                      <ActionMenu row={row} actions={actions} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid var(--c-border)" }}>
            <span style={{ fontSize: 12, color: "var(--c-muted)" }}>
              {Math.min((page - 1) * pageSize + 1, rows.length)}–{Math.min(page * pageSize, rows.length)} of {rows.length}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <button className="btn-ghost" style={{ padding: "4px 7px" }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>{Ico.chevL}</button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                const pg = pages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= pages - 2 ? pages - 4 + i : page - 2 + i;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    style={{
                      padding: "4px 10px", borderRadius: 6, fontSize: 12, border: "none", cursor: "pointer",
                      fontWeight: pg === page ? 700 : 400,
                      background: pg === page ? "var(--c-brand)" : "transparent",
                      color: pg === page ? "#fff" : "var(--c-text2)",
                    }}>
                    {pg}
                  </button>
                );
              })}
              <button className="btn-ghost" style={{ padding: "4px 7px" }} onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>{Ico.chevR}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
