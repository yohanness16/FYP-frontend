"use client";
import { useState, useMemo, ReactNode, useRef, useEffect } from "react";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, MoreVertical, Plus } from "lucide-react";

export interface ColDef<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  render?: (row: T) => ReactNode;
  getValue?: (row: T) => string | number;
}

export interface TableAction<T> {
  label: string;
  icon?: ReactNode;
  onClick: (row: T) => void;
  danger?: boolean;
}

interface Props<T> {
  data: T[];
  columns: ColDef<T>[];
  actions?: TableAction<T>[];
  searchPlaceholder?: string;
  searchKeys?: string[];
  pageSize?: number;
  emptyMessage?: string;
  title?: string;
  onAdd?: () => void;
  addLabel?: string;
  toolbar?: ReactNode;
}

function ActionMenu<T>({ row, actions }: { row: T; actions: TableAction<T>[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} style={{ position:"relative", display:"flex", justifyContent:"flex-end" }}>
      <button className="btn-ghost" onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{ padding:"5px 7px" }}>
        <MoreVertical size={14} />
      </button>
      {open && (
        <div className="act-menu" onClick={e => e.stopPropagation()}>
          {actions.map((a, i) => (
            <button key={i} className={`act-item ${a.danger ? "danger" : ""}`}
              onClick={() => { a.onClick(row); setOpen(false); }}>
              {a.icon}{a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DataTable<T extends Record<string, unknown>>({
  data, columns, actions, searchPlaceholder = "Search…", searchKeys = [],
  pageSize = 10, emptyMessage = "No records found", title, onAdd, addLabel = "Add", toolbar,
}: Props<T>) {
  const [q, setQ] = useState("");
  const [sk, setSk] = useState("");
  const [sd, setSd] = useState<"asc"|"desc">("asc");
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    let r = [...data];
    if (q) {
      const lq = q.toLowerCase();
      r = r.filter(row => {
        if (searchKeys.length) return searchKeys.some(k => String(row[k] ?? "").toLowerCase().includes(lq));
        return Object.values(row).some(v => String(v ?? "").toLowerCase().includes(lq));
      });
    }
    if (sk) {
      r.sort((a, b) => {
        const col = columns.find(c => c.key === sk);
        const av = col?.getValue ? String(col.getValue(a)) : String(a[sk] ?? "");
        const bv = col?.getValue ? String(col.getValue(b)) : String(b[sk] ?? "");
        return sd === "asc" ? av.localeCompare(bv, undefined, { numeric:true }) : bv.localeCompare(av, undefined, { numeric:true });
      });
    }
    return r;
  }, [data, q, sk, sd, columns, searchKeys]);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const slice = rows.slice((page-1)*pageSize, page*pageSize);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {(title || onAdd || toolbar) && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          {title && <h3 className="section-title">{title}</h3>}
          <div style={{ display:"flex", gap:8 }}>
            {toolbar}
            {onAdd && <button className="btn-primary" onClick={onAdd}><Plus size={14} />{addLabel}</button>}
          </div>
        </div>
      )}
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ position:"relative", maxWidth:280, flex:"1 1 180px" }}>
          <Search size={13} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"var(--text3)", pointerEvents:"none" }} />
          <input className="input" style={{ paddingLeft:30, height:36 }}
            placeholder={searchPlaceholder} value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
        </div>
        <span style={{ fontSize:11, color:"var(--text3)", whiteSpace:"nowrap" }}>{rows.length} result{rows.length !== 1 ? "s":""}</span>
      </div>
      <div className="tbl-wrap">
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr className="tbl-head">
                {columns.map(col => (
                  <th key={col.key} className={`tbl-th ${col.sortable ? "sort":""}`}
                    style={{ textAlign:col.align || "left" }}
                    onClick={() => { if (!col.sortable) return; if (sk === col.key) setSd(d => d==="asc"?"desc":"asc"); else { setSk(col.key); setSd("asc"); } setPage(1); }}>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
                      {col.label}
                      {col.sortable && (
                        <span style={{ opacity: sk===col.key ? 1 : 0.3, color: sk===col.key ? "var(--neon)":"var(--text3)" }}>
                          {sk===col.key ? (sd==="asc" ? <ChevronUp size={11}/> : <ChevronDown size={11}/>) : <ChevronsUpDown size={11}/>}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
                {actions && <th className="tbl-th" style={{ width:40 }} />}
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 ? (
                <tr><td colSpan={columns.length + (actions?1:0)} style={{ textAlign:"center", padding:"48px 16px", color:"var(--text3)", fontSize:13 }}>
                  {q ? `No results for "${q}"` : emptyMessage}
                </td></tr>
              ) : slice.map((row, i) => (
                <tr key={i} className="tbl-row">
                  {columns.map(col => (
                    <td key={col.key} className="tbl-td" style={{ textAlign:col.align||"left" }}>
                      {col.render ? col.render(row) : String(row[col.key] ?? "—")}
                    </td>
                  ))}
                  {actions && <td className="tbl-td" style={{ padding:"8px 10px" }}><ActionMenu row={row} actions={actions} /></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderTop:"1px solid var(--border-subtle)" }}>
            <span style={{ fontSize:11, color:"var(--text3)" }}>
              {Math.min((page-1)*pageSize+1, rows.length)}–{Math.min(page*pageSize, rows.length)} of {rows.length}
            </span>
            <div style={{ display:"flex", alignItems:"center", gap:3 }}>
              <button className="btn-ghost" style={{ padding:"4px 7px" }} onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}><ChevronLeft size={13}/></button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                const pg = pages<=5 ? i+1 : page<=3 ? i+1 : page>=pages-2 ? pages-4+i : page-2+i;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    style={{ padding:"4px 9px", borderRadius:5, fontSize:12, border:"none", cursor:"pointer", fontWeight: pg===page?700:400,
                      background: pg===page?"var(--neon)":"transparent", color: pg===page?"#030507":"var(--text2)" }}>
                    {pg}
                  </button>
                );
              })}
              <button className="btn-ghost" style={{ padding:"4px 7px" }} onClick={() => setPage(p => Math.min(pages,p+1))} disabled={page===pages}><ChevronRight size={13}/></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
