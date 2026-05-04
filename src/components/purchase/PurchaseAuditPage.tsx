"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { trpc } from "@/app/_trpc/client";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

// ─── Utilities ────────────────────────────────────────────────────────────────
function toDateInput(d: Date) {
  return d.toISOString().split("T")[0]!;
}
function fmtDate(val: Date | string | null | undefined) {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return "—"; }
}
function getFinYearStart(date: Date): Date {
  const y = date.getFullYear();
  const m = date.getMonth();
  const startYear = m >= 3 ? y : y - 1;
  return new Date(startYear, 3, 1);
}

// ─── Types ────────────────────────────────────────────────────────────────────
type UnitItem      = { rowid: number; untcd: string; untnm: string; untshnm: string | null };
type BookingItem   = {
  rowid: number; pobkncd: string | null; pocatcomcd: string | null;
  pocatcomnm: string; pobkndt: Date | null; untcd: string | null;
  valdt: Date | null; dlydt: Date | null; supat: string | null; usrnm: string | null;
};
type DetailLine    = {
  rowid?: number;
  ptyledcd: string; brkrledcd: string;
  partyName: string; brokerName: string;
  nof: number; itmcd: string;
  qty: number; wgt: number;
  frgttyp: string; ratetyp: string; frgt: number; rate: number;
};
type AuditListItem = {
  rowid: number; pobknauditcd: string | null; pobkncd: string | null;
  pobknauditdt: Date | null; untcd: string | null; usrnm: string | null;
  sts: string | null; reason: string | null; untnm: string; pocatcomnm: string;
};
type PartyItem = { ledcd: string; lednm: string };

// ─── Print types (mirrors the backend resolveAndShapePORows return shape) ─────
type ResolvedPORow = {
  poHeader:     any;
  partyName:    string;
  partyAddr:    string;
  partyCity:    string;
  brokerName:   string;
  details:      Array<any>;
  categoryName: string;
  conditions:   Array<{ cndprmnm: string; cmnprmval: number }>;
  unit:         any;
  auditHeader:  any;
  pobkncd:      string;
};

// ─── CustomCombobox ───────────────────────────────────────────────────────────
interface CustomComboboxProps<T> {
  items: T[]; value: T | null; onValueChange: (val: T | null) => void;
  getLabel: (item: T) => string; getKey: (item: T) => string;
  placeholder?: string; disabled?: boolean; hasError?: boolean;
}
function CustomCombobox<T>({
  items, value, onValueChange, getLabel, getKey,
  placeholder = "Select…", disabled = false, hasError = false,
}: CustomComboboxProps<T>) {
  const [open, setOpen]             = useState(false);
  const [query, setQuery]           = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownStyle, setDropdownStyle]       = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const listRef      = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDropdownStyle({ position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 9999 });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => { window.removeEventListener("scroll", updatePosition, true); window.removeEventListener("resize", updatePosition); };
  }, [open, updatePosition]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!containerRef.current?.contains(t) && !listRef.current?.contains(t)) {
        setOpen(false); setQuery(""); setHighlightedIndex(0);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? items.filter(i => getLabel(i).toLowerCase().includes(query.toLowerCase()))
    : items;

  useEffect(() => { setHighlightedIndex(0); }, [query, open]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${highlightedIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  const handleSelect = (item: T) => { onValueChange(item); setOpen(false); setQuery(""); setHighlightedIndex(0); };

  const dropdown = (
    <AnimatePresence>
      {open && (
        <motion.div ref={listRef} style={dropdownStyle}
          initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.12 }}
          className="bg-white border border-[#E8E6E1] rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0
              ? <div className="px-3 py-3 text-[12px] text-[#ccc] text-center">No results found</div>
              : filtered.map((item, idx) => {
                const isSelected    = value ? getKey(value) === getKey(item) : false;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <button key={getKey(item)} data-index={idx} type="button"
                    onMouseDown={e => { e.preventDefault(); handleSelect(item); }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn("w-full text-left px-3 py-2 text-[12px] transition-colors duration-75 flex items-center gap-2",
                      isSelected ? "bg-[#1a1a1a] text-white" : isHighlighted ? "bg-[#F5F4F0] text-[#1a1a1a]" : "text-[#1a1a1a]")}>
                    <span className="w-3 shrink-0">{isSelected && (
                      <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 7l3.5 3.5L12 3" /></svg>
                    )}</span>
                    {getLabel(item)}
                  </button>
                );
              })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input ref={inputRef} type="text" disabled={disabled} placeholder={placeholder}
          value={open ? query : (value ? getLabel(value) : "")}
          onChange={e => { setQuery(e.target.value); if (!open) setOpen(true); if (e.target.value === "") onValueChange(null); }}
          onFocus={() => { setOpen(true); setQuery(""); }}
          onKeyDown={e => {
            if (!open) { if (e.key === "ArrowDown" || e.key === "Enter") { setOpen(true); e.preventDefault(); } return; }
            if (e.key === "ArrowDown")  { e.preventDefault(); setHighlightedIndex(i => Math.min(i + 1, filtered.length - 1)); }
            else if (e.key === "ArrowUp")   { e.preventDefault(); setHighlightedIndex(i => Math.max(i - 1, 0)); }
            else if (e.key === "Enter")     { e.preventDefault(); if (filtered[highlightedIndex]) handleSelect(filtered[highlightedIndex]!); }
            else if (e.key === "Escape")    { setOpen(false); setQuery(""); setHighlightedIndex(0); }
          }}
          className={cn("w-full h-9 px-3 pr-8 text-[13px] rounded-lg border bg-white text-[#1a1a1a] placeholder:text-[#ccc]",
            "transition-all duration-150 outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            hasError ? "border-red-300 bg-red-50/40" : "border-[#E8E6E1] hover:border-[#ccc]")} />
        <button type="button" tabIndex={-1} disabled={disabled}
          onClick={() => { if (disabled) return; setOpen(o => !o); if (!open) inputRef.current?.focus(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#ccc] hover:text-[#999] transition-colors disabled:pointer-events-none">
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
            className={cn("transition-transform duration-150", open && "rotate-180")}><path d="M2 5l5 5 5-5" /></svg>
        </button>
      </div>
      {typeof window !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-[#F5F4F0] border-b border-[#E8E6E1]">
      <div className="w-1.5 h-1.5 rounded-full bg-[#4a90d9]" />
      <span className="text-[11px] font-semibold text-[#2a2a2a] tracking-[0.08em] uppercase">{title}</span>
    </div>
  );
}
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <label className="text-[12px] text-[#666] whitespace-nowrap w-36 shrink-0 text-right">{label}:</label>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
function ReadonlyInput({ value, className }: { value: string | number; className?: string }) {
  return (
    <input readOnly value={value}
      className={cn("w-full h-9 px-3 text-[13px] rounded-lg border border-[#E8E6E1] bg-[#F9F8F6] text-[#1a1a1a] outline-none", className)} />
  );
}
function Toast({ type, msg }: { type: "success" | "error"; msg: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className={cn("fixed top-4 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium shadow-sm border",
        type === "success" ? "bg-white border-green-200 text-green-700" : "bg-white border-red-200 text-red-600")}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", type === "success" ? "bg-green-500" : "bg-red-500")} />
      {msg}
    </motion.div>
  );
}
function StatusBadge({ sts }: { sts: string | null }) {
  if (!sts) return <span className="text-[#ccc] text-[11px]">—</span>;
  const isApproved = sts === "Approved";
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold",
      isApproved ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200")}>
      <span className={cn("w-1 h-1 rounded-full", isApproved ? "bg-green-500" : "bg-red-500")} />
      {sts}
    </span>
  );
}

// ─── Print Builder ─────────────────────────────────────────────────────────────
type PrintPage = {
  pocd:         string;
  poDate:       string;
  partyName:    string;
  partyAddr:    string;
  partyCity:    string;
  brokerName:   string;
  categoryName: string;
  unitName:     string;
  dlyDate:      string;
  validDate:    string;
  frtType:      string;
  pobkncd:      string;
  conditions:   Array<{ cndprmnm: string; cmnprmval: number }>;
  details: Array<{
    itmnm:   string;
    qty:     number;
    wgt:     number;
    rate:    number;
    ratetyp: string;
    frgt:    number;
    nof:     number;
  }>;
};

// ─── Helper: map resolveAndShapePORows result → PrintPage[] ──────────────────
// Works for BOTH getPOsByAuditcd and getPOsForPrint since they both call
// resolveAndShapePORows and return the same shape.
function mapPosToPrintPages(pos: ResolvedPORow[]): PrintPage[] {
  return pos.map((po) => ({
    pocd:         po.poHeader.pocd ?? "",
    poDate:       fmtDate(po.poHeader.podt),
    partyName:    po.partyName,
    partyAddr:    po.partyAddr,
    partyCity:    po.partyCity,
    brokerName:   po.brokerName,
    categoryName: po.categoryName,
    unitName:     po.unit?.untnm ?? po.poHeader.untcd ?? "",
    dlyDate:      fmtDate(po.poHeader.dlydt),
    validDate:    fmtDate(po.poHeader.validdt),
    frtType:      po.poHeader.pofrttyp ?? "",
    pobkncd:      po.pobkncd,
    conditions:   po.conditions,
    details: po.details.map((d) => ({
      itmnm:   d.itmnm   ?? "—",
      qty:     d.poqty   ?? 0,
      wgt:     d.powgt   ?? 0,
      rate:    d.porate  ?? 0,
      ratetyp: d.ratetyp ?? "state",
      frgt:    po.poHeader.frgt ?? 0,
      nof:     0,
    })),
  }));
}

function buildPrintHtml(pages: PrintPage[]): string {
  const pageHtml = pages.map((p, pageIdx) => {
    const totalQty = p.details.reduce((s, d) => s + d.qty, 0);
    const totalWgt = p.details.reduce((s, d) => s + d.wgt, 0);

    const detailRows = p.details.map((d, i) => `
      <tr>
        <td class="sno">${i + 1}</td>
        <td>${d.itmnm}</td>
        <td class="num">${d.nof}</td>
        <td class="num">${d.qty.toLocaleString()} BAG</td>
        <td class="num">${d.wgt.toLocaleString()} KG</td>
        <td class="num">Rs ${d.rate.toFixed(2)}</td>
        <td class="ctr">${d.ratetyp}</td>
        <td class="ctr">${p.frtType}</td>
        <td class="num">Rs ${d.frgt.toFixed(2)}</td>
      </tr>`).join("");

    const condRows = p.conditions.map((c, i) =>
      `<tr><td>${i + 1}</td><td>${c.cndprmnm}</td><td class="num">${c.cmnprmval}</td></tr>`
    ).join("");

    return `
      <div class="page">
        <div class="header">
          <div class="company">MAHESH EDIBLE OIL MILLS PRIVATE LIMITED</div>
          <div class="subtitle">Purchase Order</div>
        </div>
        <div class="meta-grid">
          <div class="meta-row"><span class="meta-lbl">Order No.</span><span class="meta-val">${p.pocd}</span></div>
          <div class="meta-row"><span class="meta-lbl">Order Date</span><span class="meta-val">${p.poDate}</span></div>
          <div class="meta-row"><span class="meta-lbl">Booking No.</span><span class="meta-val">${p.pobkncd}</span></div>
          <div class="meta-row"><span class="meta-lbl">Unit</span><span class="meta-val">${p.unitName}</span></div>
          <div class="meta-row full"><span class="meta-lbl">Order Category</span><span class="meta-val">${p.categoryName}</span></div>
          <div class="meta-row"><span class="meta-lbl">Party Name</span><span class="meta-val">${p.partyName}</span></div>
          <div class="meta-row"><span class="meta-lbl">Address</span><span class="meta-val">${p.partyAddr || "—"}</span></div>
          <div class="meta-row"><span class="meta-lbl">Broker Name</span><span class="meta-val">${p.brokerName}</span></div>
          <div class="meta-row"><span class="meta-lbl">Due Date</span><span class="meta-val">${p.dlyDate}</span></div>
          <div class="meta-row"><span class="meta-lbl">Valid Date</span><span class="meta-val">${p.validDate}</span></div>
          <div class="meta-row"><span class="meta-lbl">Freight Type</span><span class="meta-val">${p.frtType || "—"}</span></div>
        </div>

        <div class="section-title">Order Description</div>
        <table>
          <thead>
            <tr>
              <th class="sno">#</th>
              <th>Item Name</th>
              <th class="num">No. of Veh</th>
              <th class="num">Qty (BAG)</th>
              <th class="num">Wgt (KG)</th>
              <th class="num">Rate</th>
              <th class="ctr">Rate Type</th>
              <th class="ctr">Frt Type</th>
              <th class="num">Freight/Qtl</th>
            </tr>
          </thead>
          <tbody>${detailRows}</tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="total-lbl">Total</td>
              <td class="num total-val">${totalQty.toLocaleString()} BAG</td>
              <td class="num total-val">${totalWgt.toLocaleString()} KG</td>
              <td colspan="4"></td>
            </tr>
          </tfoot>
        </table>

        ${condRows ? `
        <div class="section-title" style="margin-top:12px">Terms &amp; Conditions</div>
        <table class="cond-table">
          <thead><tr><th class="sno">#</th><th>Description</th><th class="num">Value</th></tr></thead>
          <tbody>${condRows}</tbody>
        </table>` : ""}

        <div class="sign-row">
          <div class="sign-box"><div class="sign-line"></div>Proposed By</div>
          <div class="sign-box"><div class="sign-line"></div>Manager Sign.</div>
          <div class="sign-box"><div class="sign-line"></div>Authorized Sign.</div>
        </div>
      </div>
      ${pageIdx < pages.length - 1 ? '<div class="page-break"></div>' : ""}
    `;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <title>Purchase Order</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,sans-serif;font-size:11px;color:#111;background:#fff;padding:20px}
    .page{max-width:780px;margin:0 auto}
    .page-break{page-break-after:always;margin:32px 0}
    .header{text-align:center;border-bottom:2px solid #222;padding-bottom:8px;margin-bottom:12px}
    .company{font-size:15px;font-weight:700;letter-spacing:.3px}
    .subtitle{font-size:12px;color:#555;margin-top:3px}
    .meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 20px;margin-bottom:14px;border:1px solid #ddd;padding:10px;border-radius:4px;background:#fafafa}
    .meta-row{display:flex;gap:8px;align-items:baseline}
    .meta-row.full{grid-column:1/-1}
    .meta-lbl{font-weight:600;color:#555;min-width:100px;font-size:10px;text-transform:uppercase;letter-spacing:.04em}
    .meta-val{color:#111;font-size:11px}
    .section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#333;margin-bottom:6px;border-left:3px solid #4a90d9;padding-left:8px}
    table{width:100%;border-collapse:collapse;margin-bottom:8px}
    th{background:#f0f0f0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:5px 7px;border:1px solid #ddd;text-align:left}
    td{padding:5px 7px;border:1px solid #e5e5e5;font-size:11px;vertical-align:middle}
    .sno{width:28px;text-align:center;color:#999}
    .num{text-align:right}
    .ctr{text-align:center}
    .total-lbl{text-align:right;font-weight:700;font-size:11px}
    .total-val{font-weight:700}
    .cond-table{width:50%}
    .sign-row{display:flex;justify-content:space-between;margin-top:32px;gap:20px}
    .sign-box{text-align:center;flex:1;font-size:10px;color:#555}
    .sign-line{border-top:1px solid #555;margin-bottom:4px;margin-top:28px}
    @media print{body{padding:0}.page-break{margin:0}}
  </style></head><body>${pageHtml}</body></html>`;
}

function printHtml(html: string) {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PurchaseOrderAuditPage() {
  const today   = toDateInput(new Date());
  const minDate = toDateInput(getFinYearStart(new Date()));
  const user    = useAuthStore(s => s.user);

  // ── UI State ──────────────────────────────────────────────────────────────
  const [showForm,     setShowForm]     = useState(true);
  const [toast,        setToast]        = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [currentPage,  setCurrentPage]  = useState(1);
  const PAGE_SIZE = 15;
  const formTopRef = useRef<HTMLDivElement>(null);

  // Print filter state
  const [printMode,       setPrintMode]       = useState<"date" | "record">("date");
  const [printFromDate,   setPrintFromDate]   = useState(today);
  const [printToDate,     setPrintToDate]     = useState(today);
  const [printFromRecord, setPrintFromRecord] = useState<number | "">(1);
  const [printToRecord,   setPrintToRecord]   = useState<number | "">(10);
  const [printParty,      setPrintParty]      = useState<PartyItem | null>(null);
  const [showPrintFilter, setShowPrintFilter] = useState(false);

  // ── Bulk print: single tRPC call, no sequential fetching ─────────────────
  // We use an enabled flag so the query only fires when the user clicks
  // "Print All".  After data arrives we print and reset the flag.
  const [bulkPrintEnabled, setBulkPrintEnabled] = useState(false);

  const recordRangeValid =
    printMode !== "record" ||
    (typeof printFromRecord === "number" && typeof printToRecord === "number" &&
     printFromRecord >= 1 && printToRecord >= printFromRecord);
  const [selectedUnit,    setSelectedUnit]    = useState<UnitItem | null>(null);
  const { data: bulkPOsData, isFetching: isBulkFetching } =
    trpc.purOrderAudit.getPOsForPrint.useQuery(
      {
        untcd:      selectedUnit?.untcd,          // see note below ¹
        ptyledcd:   printParty?.ledcd,
        fromDate:   printMode === "date"   ? printFromDate               : undefined,
        toDate:     printMode === "date"   ? printToDate                 : undefined,
        fromRecord: printMode === "record" ? (printFromRecord as number) : undefined,
        toRecord:   printMode === "record" ? (printToRecord   as number) : undefined,
      },
      {
        enabled:   bulkPrintEnabled,
        staleTime: 0,
      },
    );

  // Fire print as soon as data lands, then reset the trigger
  useEffect(() => {
    if (!bulkPrintEnabled || isBulkFetching || !bulkPOsData) return;

    if (bulkPOsData.length === 0) {
      showToast("error", "No PO records found for the selected filter.");
    } else {
      const pages = mapPosToPrintPages(bulkPOsData as ResolvedPORow[]);
      printHtml(buildPrintHtml(pages));
      setShowPrintFilter(false);
    }
    setBulkPrintEnabled(false);
  }, [bulkPrintEnabled, isBulkFetching, bulkPOsData]);

  // ── Form State ────────────────────────────────────────────────────────────

  const [auditDate,       setAuditDate]       = useState(today);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [orderLines,      setOrderLines]      = useState<DetailLine[]>([]);
  const [rejectRemark,    setRejectRemark]    = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: units = [] } = trpc.purOrderAudit.getUnits.useQuery();

  const { data: bookings = [] } = trpc.purOrderAudit.getBookingsByUnit.useQuery(
    { untcd: selectedUnit?.untcd ?? "" },
    { enabled: !!selectedUnit },
  );

  const { data: allParties = [] } = trpc.purOrderAudit.getParties.useQuery();

  const finYear = user?.finYear;

  const { data: bookingDetail, isLoading: isLoadingDetail } =
    trpc.purOrderAudit.getBookingDetail.useQuery(
      { pobkncd: selectedBooking?.pobkncd ?? "" },
      { enabled: !!selectedBooking?.pobkncd, staleTime: 0 },
    );

  const { data: listData, refetch: refetchList } = trpc.purOrderAudit.getAll.useQuery({
    limit:  PAGE_SIZE,
    offset: (currentPage - 1) * PAGE_SIZE,
    search: searchQuery || undefined,
    untcd:  selectedUnit?.untcd,
  });
  const listItems  = (listData?.items ?? []) as AuditListItem[];
  const totalCount = listData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // ── Sync booking detail into form ─────────────────────────────────────────
  useEffect(() => {
    if (!bookingDetail) { setOrderLines([]); return; }
    setOrderLines(
      bookingDetail.details.map(d => ({
        ptyledcd:   d.ptyledcd   ?? "",
        brkrledcd:  d.brkrledcd  ?? "",
        partyName:  d.partyName,
        brokerName: d.brokerName,
        nof:        d.nof  ?? 0,
        itmcd:      d.itmcd ?? "",
        qty:        d.qty  ?? 0,
        wgt:        d.wgt  ?? 0,
        frgttyp:    d.frgttyp ?? "",
        ratetyp:    "state",
        frgt:       d.frgt ?? 0,
        rate:       d.rate ?? 0,
      }))
    );
  }, [bookingDetail]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const submitMutation = trpc.purOrderAudit.submitAudit.useMutation({
    onSuccess: (d) => {
      showToast("success", `Audit ${d.pobknauditcd} saved successfully`);
      resetForm();
      refetchList();
    },
    onError: e => showToast("error", e.message),
  });
  const isSaving = submitMutation.isPending;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const resetForm = () => {
    setSelectedUnit(null);
    setSelectedBooking(null);
    setAuditDate(today);
    setOrderLines([]);
    setRejectRemark("");
  };

  const handleAction = (action: "Approved" | "Reject") => {
    if (!selectedUnit)    return showToast("error", "Please select a unit.");
    if (!selectedBooking) return showToast("error", "Please select a booking.");
    if (orderLines.length === 0) return showToast("error", "No order lines loaded.");
    if (action === "Reject") { setShowRejectModal(true); return; }
    doSubmit("Approved", "");
  };

  const doSubmit = (sts: "Approved" | "Reject", reason: string) => {
    submitMutation.mutate({
      finyear:      finYear!,
      untcd:        selectedUnit!.untcd,
      pobkncd:      selectedBooking!.pobkncd!,
      pobknauditdt: auditDate,
      usrnm:        user?.username ?? "system",
      sts,
      reason,
      cmpcd:        user?.cmpCode ?? "",
      orderLines: orderLines.map(l => ({
        ptyledcd:  l.ptyledcd,
        brkrledcd: l.brkrledcd,
        nof:       l.nof,
        itmcd:     l.itmcd,
        qty:       l.qty,
        wgt:       l.wgt,
        frgttyp:   l.frgttyp,
        ratetyp:   l.ratetyp,
        frgt:      l.frgt,
        rate:      l.rate,
      })),
    });
  };

  const updateLine = (idx: number, patch: Partial<DetailLine>) =>
    setOrderLines(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));

  // ── Print: single audit row (print icon in the list) ─────────────────────
  // Uses getPOsByAuditcd which also calls resolveAndShapePORows → same shape.
  const [printAuditcd, setPrintAuditcd] = useState<string | null>(null);
  const { data: singlePOsData } = trpc.purOrderAudit.getPOsByAuditcd.useQuery(
    { pobknauditcd: printAuditcd ?? "" },
    { enabled: !!printAuditcd, staleTime: 0 },
  );
  useEffect(() => {
    if (!singlePOsData || !printAuditcd) return;
    if (singlePOsData.length === 0) {
      showToast("error", "No approved PO records found for this audit.");
      setPrintAuditcd(null);
      return;
    }
    const pages = mapPosToPrintPages(singlePOsData as ResolvedPORow[]);
    printHtml(buildPrintHtml(pages));
    setPrintAuditcd(null);
  }, [singlePOsData, printAuditcd]);

  const totalQty = orderLines.reduce((s, l) => s + l.qty, 0);

  return (
    <div className="min-h-screen bg-[#ECEAE4] p-4 font-sans">
      <AnimatePresence>{toast && <Toast type={toast.type} msg={toast.msg} />}</AnimatePresence>

      {/* ── Reject Modal ── */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl border border-[#E8E6E1] shadow-xl w-full max-w-sm mx-4 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E8E6E1] bg-red-50">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M7 2v5M7 10v1" />
                  </svg>
                </div>
                <span className="text-[13px] font-semibold text-red-700">Reject Booking</span>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <p className="text-[12px] text-[#666]">Please provide a reason for rejecting this booking.</p>
                <textarea value={rejectRemark} onChange={e => setRejectRemark(e.target.value)}
                  placeholder="Enter rejection reason…" rows={3}
                  className="w-full px-3 py-2 text-[13px] rounded-lg border border-[#E8E6E1] bg-white outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 resize-none" />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setShowRejectModal(false); setRejectRemark(""); }}
                    className="px-4 py-2 rounded-xl text-[12px] font-medium border border-[#E8E6E1] text-[#555] hover:bg-[#F5F4F0] transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => {
                    if (!rejectRemark.trim()) return showToast("error", "Rejection reason is required.");
                    setShowRejectModal(false);
                    doSubmit("Reject", rejectRemark);
                  }} disabled={isSaving}
                    className="px-4 py-2 rounded-xl text-[12px] font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                    Confirm Reject
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Print Filter Modal ── */}
      <AnimatePresence>
        {showPrintFilter && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl border border-[#E8E6E1] shadow-xl w-full max-w-md mx-4 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6E1] bg-[#F5F4F0]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#4a90d9]" />
                  <span className="text-[12px] font-semibold text-[#2a2a2a] tracking-[0.06em] uppercase">Print Filter</span>
                </div>
                <button onClick={() => setShowPrintFilter(false)} className="text-[#ccc] hover:text-[#666] transition-colors">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12" /></svg>
                </button>
              </div>

              <div className="p-4 flex flex-col gap-4">
                {/* Mode toggle */}
                <div className="flex rounded-lg overflow-hidden border border-[#E8E6E1]">
                  {(["date", "record"] as const).map(m => (
                    <button key={m} onClick={() => setPrintMode(m)}
                      className={cn("flex-1 py-2 text-[12px] font-medium transition-colors",
                        printMode === m ? "bg-[#1a1a1a] text-white" : "bg-white text-[#555] hover:bg-[#F5F4F0]")}>
                      {m === "date" ? "By Date Range" : "By Record Range"}
                    </button>
                  ))}
                </div>

                {/* Party selector */}
                <div>
                  <label className="text-[11px] text-[#666] font-medium mb-1.5 block">
                    Party <span className="text-[#bbb] font-normal">(optional — leave blank for all parties)</span>
                  </label>
                  <CustomCombobox
                    items={allParties as PartyItem[]}
                    value={printParty}
                    onValueChange={setPrintParty}
                    getLabel={p => p.lednm}
                    getKey={p => p.ledcd}
                    placeholder="All parties…"
                  />
                </div>

                {/* Range inputs */}
                {printMode === "date" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-[#666] font-medium mb-1 block">From Date</label>
                      <input type="date" value={printFromDate} onChange={e => setPrintFromDate(e.target.value)}
                        min={minDate} max={today}
                        className="w-full h-9 px-3 text-[13px] rounded-lg border border-[#E8E6E1] bg-white outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all" />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#666] font-medium mb-1 block">To Date</label>
                      <input type="date" value={printToDate} onChange={e => setPrintToDate(e.target.value)}
                        min={minDate} max={today}
                        className="w-full h-9 px-3 text-[13px] rounded-lg border border-[#E8E6E1] bg-white outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-[#666] font-medium mb-1 block">From Record #</label>
                        <input
                          type="number" min={1} value={printFromRecord}
                          onChange={e => setPrintFromRecord(e.target.value === "" ? "" : parseInt(e.target.value) || 1)}
                          placeholder="e.g. 1"
                          className={cn(
                            "w-full h-9 px-3 text-[13px] rounded-lg border bg-white outline-none transition-all",
                            "focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]",
                            !recordRangeValid ? "border-red-300 bg-red-50/40" : "border-[#E8E6E1]",
                          )} />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#666] font-medium mb-1 block">To Record #</label>
                        <input
                          type="number" min={1} value={printToRecord}
                          onChange={e => setPrintToRecord(e.target.value === "" ? "" : parseInt(e.target.value) || 1)}
                          placeholder="e.g. 10"
                          className={cn(
                            "w-full h-9 px-3 text-[13px] rounded-lg border bg-white outline-none transition-all",
                            "focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]",
                            !recordRangeValid ? "border-red-300 bg-red-50/40" : "border-[#E8E6E1]",
                          )} />
                      </div>
                    </div>
                    <p className="text-[11px] text-[#aaa] leading-relaxed">
                      Refers to the latest records in <strong className="text-[#666]">trnpurordnfo</strong>.
                      e.g. <span className="font-mono bg-[#F5F4F0] px-1 rounded">1–10</span> prints the 10 most recent POs
                      {printParty ? ` for ${printParty.lednm}` : " (all parties)"}.
                    </p>
                    {!recordRangeValid && (
                      <p className="text-[11px] text-red-500">"To" must be ≥ "From" and both must be ≥ 1.</p>
                    )}
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-1">
                  <button onClick={() => setShowPrintFilter(false)}
                    className="px-4 py-2 rounded-xl text-[12px] font-medium border border-[#E8E6E1] text-[#555] hover:bg-[#F5F4F0] transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!recordRangeValid) return showToast("error", "Invalid record range.");
                      // Setting this to true fires the getPOsForPrint query.
                      // The useEffect above watches isBulkFetching + bulkPOsData
                      // and calls printHtml once data arrives.
                      setBulkPrintEnabled(true);
                    }}
                    disabled={!recordRangeValid || isBulkFetching}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-medium bg-[#1a1a1a] text-white hover:bg-[#333] transition-colors disabled:opacity-40">
                    {isBulkFetching ? (
                      <>
                        <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" /></svg>
                        Fetching…
                      </>
                    ) : (
                      <>
                        <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                          <rect x="2" y="4" width="10" height="8" rx="1" /><path d="M4 4V2h6v2M4 9h6M4 11h4" />
                        </svg>
                        Print All
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3 max-w-[1400px] mx-auto">
        {/* ── Main Column ── */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">

          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[15px] font-semibold text-[#1a1a1a]">Purchase Order Audit</h1>
              <p className="text-[12px] text-[#999] mt-0.5">Approve or reject purchase order bookings</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowPrintFilter(true)}
                className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-[#555] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-colors">
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <rect x="2" y="4" width="10" height="8" rx="1" /><path d="M4 4V2h6v2M4 9h6M4 11h4" />
                </svg>
                Print
              </button>
              <button onClick={() => setShowForm(p => !p)}
                className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-[#555] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-colors">
                {showForm
                  ? <><svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 7h10" /></svg>Hide Form</>
                  : <><svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 2v10M2 7h10" /></svg>New Audit</>
                }
              </button>
            </div>
          </div>

          <div ref={formTopRef} />

          {/* ── Form (collapsible) ── */}
          <AnimatePresence initial={false}>
            {showForm && (
              <motion.div key="form"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden flex flex-col gap-3">

                {/* General Information */}
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
                  className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden shadow-sm">
                  <SectionHeader title="General Information" />
                  <div className="p-5 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                      <Field label="Unit Name">
                        <CustomCombobox
                          items={units as UnitItem[]}
                          value={selectedUnit}
                          onValueChange={v => { setSelectedUnit(v); setSelectedBooking(null); setOrderLines([]); }}
                          getLabel={u => u.untnm} getKey={u => String(u.rowid)}
                          placeholder="Select unit…" hasError={!selectedUnit} />
                      </Field>
                      <Field label="Order Audit Date">
                        <input type="date" value={auditDate} onChange={e => setAuditDate(e.target.value)}
                          min={minDate} max={today}
                          className="w-full h-9 px-3 text-[13px] rounded-lg border border-[#E8E6E1] bg-white outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all" />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                      <Field label="Booking No.">
                        <CustomCombobox
                          items={bookings as BookingItem[]}
                          value={selectedBooking}
                          onValueChange={v => setSelectedBooking(v)}
                          getLabel={b => `${b.pocatcomnm} · ${b.pobkncd} · ${fmtDate(b.pobkndt)}`}
                          getKey={b => b.pobkncd ?? String(b.rowid)}
                          placeholder={selectedUnit ? "Select booking…" : "Select unit first…"}
                          disabled={!selectedUnit}
                          hasError={selectedUnit !== null && !selectedBooking} />
                      </Field>
                      <Field label="Valid Date">
                        <ReadonlyInput value={selectedBooking ? fmtDate(selectedBooking.valdt) : "—"} />
                      </Field>
                    </div>
                    <div className="border-t border-[#F0EEE9]" />
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                      <Field label="Bargain Rate">
                        <ReadonlyInput value={bookingDetail?.bargainRate ?? "—"} />
                      </Field>
                      <Field label="Total Bargain Qty">
                        <ReadonlyInput value={bookingDetail?.totalBargainWgt ?? "—"} />
                      </Field>
                      <Field label="Booked Qty">
                        <ReadonlyInput value={bookingDetail?.bookedWgt ?? "—"} />
                      </Field>
                      <Field label="Pending Quantity">
                        <ReadonlyInput
                          value={bookingDetail?.pendingWgt ?? "—"}
                          className={cn(bookingDetail && bookingDetail.pendingWgt <= 0 ? "text-red-500 font-medium" : "")} />
                      </Field>
                    </div>
                  </div>
                </motion.div>

                {/* Order Description Table */}
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.04 }}
                  className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden shadow-sm">
                  <SectionHeader title="Order Description" />
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#F0EEE9] bg-[#FAFAF8]">
                    <button type="button" onClick={() => handleAction("Approved")} disabled={isSaving || !selectedBooking}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-40">
                      <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 7l3.5 3.5L12 3" /></svg>
                      Accept
                    </button>
                    <button type="button" onClick={() => handleAction("Reject")} disabled={isSaving || !selectedBooking}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-40">
                      <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12" /></svg>
                      Reject
                    </button>
                    {isSaving && (
                      <span className="flex items-center gap-1.5 text-[12px] text-[#aaa]">
                        <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" /></svg>
                        Saving…
                      </span>
                    )}
                  </div>
                  {isLoadingDetail ? (
                    <div className="py-10 flex items-center justify-center gap-2.5">
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round"><path d="M7 1a6 6 0 1 0 6 6" /></svg>
                      <span className="text-[12px] text-[#aaa]">Loading booking data…</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr className="bg-[#F5F4F0] border-b border-[#E8E6E1]">
                            <th className="w-8 px-2 py-2.5 text-center text-[11px] text-[#aaa] font-medium">#</th>
                            <th className="px-2 py-2.5 text-left text-[11px] text-[#555] font-semibold min-w-[180px]">Party Name</th>
                            <th className="px-2 py-2.5 text-center text-[11px] text-[#555] font-semibold w-20">No. of Form</th>
                            <th className="px-2 py-2.5 text-left text-[11px] text-[#555] font-semibold min-w-[160px]">Broker Name</th>
                            <th className="px-2 py-2.5 text-right text-[11px] text-[#555] font-semibold w-28">Order Wgt</th>
                            <th className="px-2 py-2.5 text-right text-[11px] text-[#555] font-semibold w-28">Order Rate</th>
                            <th className="px-2 py-2.5 text-center text-[11px] text-[#555] font-semibold w-28">Freight Type</th>
                            <th className="px-2 py-2.5 text-right text-[11px] text-[#555] font-semibold w-28">Freight/Qtl</th>
                          </tr>
                        </thead>
                        <tbody>
                          <AnimatePresence>
                            {orderLines.map((line, idx) => (
                              <motion.tr key={idx}
                                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
                                className="border-b border-[#F0EEE9] hover:bg-[#FAFAF8]">
                                <td className="px-2 py-1.5 text-center text-[#bbb]">{idx + 1}</td>
                                <td className="px-2 py-2 text-[#333] font-medium">{line.partyName}</td>
                                <td className="px-2 py-1.5">
                                  <input type="number" value={line.nof}
                                    onChange={e => updateLine(idx, { nof: parseInt(e.target.value) || 0 })}
                                    className="w-full h-8 px-2 text-[12px] text-center rounded-lg border border-[#E8E6E1] bg-white outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all"
                                    placeholder="0" />
                                </td>
                                <td className="px-2 py-2 text-[#555]">{line.brokerName}</td>
                                <td className="px-2 py-2 text-right font-medium text-[#333]">{line.qty.toLocaleString()} BAG</td>
                                <td className="px-2 py-2 text-right text-[#555]">Rs {line.rate.toFixed(2)}</td>
                                <td className="px-2 py-2 text-center text-[#555]">{line.frgttyp}</td>
                                <td className="px-2 py-2 text-right text-[#555]">Rs {line.frgt.toFixed(2)}</td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                          {orderLines.length === 0 && (
                            <tr>
                              <td colSpan={8} className="py-10 text-center text-[12px] text-[#ccc]">
                                {selectedBooking ? "No order lines found" : "Select a booking to load order lines"}
                              </td>
                            </tr>
                          )}
                        </tbody>
                        {orderLines.length > 0 && (
                          <tfoot>
                            <tr className="bg-[#F9F8F6] border-t border-[#E8E6E1]">
                              <td colSpan={4} className="px-3 py-2 text-right text-[11px] font-semibold text-[#555] uppercase tracking-wide">Total</td>
                              <td className="px-2 py-2 text-right font-semibold text-[#1a1a1a] text-[12px]">{totalQty.toLocaleString()} BAG</td>
                              <td colSpan={3} />
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  )}
                </motion.div>

                {/* Footer Actions */}
                <div className="bg-white rounded-2xl border border-[#E8E6E1] px-5 py-3.5 shadow-sm flex items-center justify-end gap-2">
                  <button type="button" onClick={resetForm}
                    className="px-4 py-2 rounded-xl text-[12px] font-medium border border-[#E8E6E1] text-[#555] hover:bg-[#F5F4F0] transition-colors">
                    Clear
                  </button>
                  <button type="button" onClick={() => handleAction("Approved")} disabled={isSaving || !selectedBooking}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[12px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50">
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 7l3.5 3.5L12 3" /></svg>
                    Approve
                  </button>
                  <button type="button" onClick={() => handleAction("Reject")} disabled={isSaving || !selectedBooking}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[12px] font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12" /></svg>
                    Reject
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Data Table ── */}
          <div className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-[#E8E6E1] flex items-center justify-between flex-wrap gap-3">
              <span className="text-[13px] font-medium text-[#1a1a1a]">
                All Audits
                <span className="ml-2 text-[11px] font-normal text-[#aaa]">{totalCount} total</span>
              </span>
              <input type="text" placeholder="Search by audit/booking code…" value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="h-7 px-3 text-[12px] border border-[#E8E6E1] rounded-lg bg-[#FAFAF9] placeholder:text-[#ccc] focus:outline-none focus:border-[#ccc] w-52 transition-all" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-[#F5F4F0] border-b border-[#E8E6E1]">
                    {["Audit Code", "Booking No.", "Unit", "Category", "Audit Date", "Status", "Audited By", "Reason", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {listItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-[12px] text-[#ccc]">
                        {searchQuery ? "No audits match your search" : "No audits yet — create one above"}
                      </td>
                    </tr>
                  ) : listItems.map((item, i) => (
                    <motion.tr key={item.rowid}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="border-b border-[#F5F4F0] last:border-0 hover:bg-[#FAFAF9] transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-[#4a90d9] font-medium whitespace-nowrap">{item.pobknauditcd ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#888]">{item.pobkncd ?? "—"}</td>
                      <td className="px-4 py-3 text-[#555]">{item.untnm}</td>
                      <td className="px-4 py-3 text-[#555] max-w-[140px] truncate">{item.pocatcomnm}</td>
                      <td className="px-4 py-3 text-[#888] whitespace-nowrap">{fmtDate(item.pobknauditdt)}</td>
                      <td className="px-4 py-3"><StatusBadge sts={item.sts} /></td>
                      <td className="px-4 py-3 text-[#aaa]">{item.usrnm ?? "—"}</td>
                      <td className="px-4 py-3 text-[#999] max-w-[160px] truncate" title={item.reason ?? ""}>{item.reason || "—"}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setPrintAuditcd(item.pobknauditcd!)}
                          title="Print POs for this audit"
                          disabled={item.sts !== "Approved"}
                          className="w-7 h-7 rounded-md flex items-center justify-center transition-all border bg-white border-[#E8E6E1] text-[#aaa] hover:border-[#C8C5BE] hover:text-[#555] hover:bg-[#F5F4F0] disabled:opacity-30 disabled:cursor-not-allowed">
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <rect x="2" y="4" width="10" height="8" rx="1" /><path d="M4 4V2h6v2M4 9h6M4 11h4" />
                          </svg>
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-[#E8E6E1] flex items-center justify-between">
                <span className="text-[11px] text-[#aaa]">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E8E6E1] bg-white text-[#aaa] hover:bg-[#F5F4F0] hover:text-[#555] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6.5 1.5L3 5l3.5 3.5" /></svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                      acc.push(p); return acc;
                    }, [])
                    .map((p, idx) => p === "…"
                      ? <span key={`e${idx}`} className="w-7 h-7 flex items-center justify-center text-[11px] text-[#ccc]">…</span>
                      : <button key={p} onClick={() => setCurrentPage(p as number)}
                          className={cn("w-7 h-7 flex items-center justify-center rounded-lg text-[12px] font-medium transition-all",
                            currentPage === p ? "bg-[#1a1a1a] text-white" : "border border-[#E8E6E1] bg-white text-[#555] hover:bg-[#F5F4F0]")}>
                          {p}
                        </button>
                    )}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E8E6E1] bg-white text-[#aaa] hover:bg-[#F5F4F0] hover:text-[#555] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3.5 1.5L7 5l-3.5 3.5" /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ── PO Conditions Sidebar ── */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22 }}
          className="w-56 shrink-0">
          <div className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden shadow-sm sticky top-4">
            <SectionHeader title="PO Conditions" />
            {bookingDetail?.conditions && bookingDetail.conditions.length > 0 ? (
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[#F0EEE9]">
                    <th className="w-6 px-2 py-2 text-center text-[10px] text-[#bbb] font-medium">#</th>
                    <th className="px-2 py-2 text-left text-[10px] text-[#666] font-semibold">Description</th>
                    <th className="px-2 py-2 text-right text-[10px] text-[#666] font-semibold">Val</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingDetail.conditions.map((cond, idx) => (
                    <tr key={cond.rowid} className="border-b border-[#F9F8F6] last:border-0 hover:bg-[#FAFAF8]">
                      <td className="px-2 py-1.5 text-center text-[10px] text-[#ccc]">{idx + 1}</td>
                      <td className="px-2 py-1.5 text-[11px] text-[#444]">{cond.cndprmnm}</td>
                      <td className="px-2 py-1.5 text-right text-[11px] font-semibold text-[#1a1a1a]">{cond.cmnprmval}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-10 px-3 text-center text-[11px] text-[#ccc] leading-relaxed">
                {selectedBooking ? "No conditions found" : "Select a booking\nto view conditions"}
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}