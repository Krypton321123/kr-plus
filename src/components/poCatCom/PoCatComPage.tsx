"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { trpc } from "@/app/_trpc/client";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const FRGHT_OPTIONS  = ["PARTY", "MILL"]                               as const;
const CATTYP_OPTIONS = ["SUPPLIER", "DEPO", "COMPANY"]                 as const;
const RATE_OPTIONS   = ["N/A", "PO RATE", "CAKE RATE", "MANUAL RATE"] as const;

type FrghtTyp  = (typeof FRGHT_OPTIONS)[number];
type CattypOpt = (typeof CATTYP_OPTIONS)[number];
type RateOpt   = (typeof RATE_OPTIONS)[number];
type YesNo     = "YES" | "NO";
type YesNoSm   = "Yes" | "No";
type BillType  = "BILL" | "CHALLAN";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingRow {
  _key:       string;
  cndprmnm:   string;
  cmnprmval:  string;
  cndprmded:  string;
  cndprmrate: RateOpt | "";
}

interface SavedRow {
  rowid:      number;
  pocatcomcd: string;
  cndprmnm:   string;
  cmnprmval:  number;
  cndprmded:  number;
  cndprmrate: string;
}

interface ConditionParam {
  rowid:     number;
  prmcd:     string;
  cndprmnm:  string;
  cndprmtyp: string;
  inpprmnm:  string;
  valtyp:    string;
  clcon:     string;
  prcusd:    string;
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const inputCls = (hasError?: boolean) =>
  cn(
    "w-full h-8 px-2.5 text-[12px] bg-white border rounded-lg text-[#1a1a1a] placeholder:text-[#ccc]",
    "focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all duration-150 hover:border-[#ccc]",
    hasError ? "border-red-300 bg-red-50/40" : "border-[#E8E6E1]",
  );

const selectCls = (hasError?: boolean) =>
  cn(
    "w-full h-8 px-2.5 text-[12px] bg-white border rounded-lg text-[#1a1a1a]",
    "focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all duration-150",
    "appearance-none cursor-pointer",
    hasError ? "border-red-300 bg-red-50/40" : "border-[#E8E6E1] hover:border-[#ccc]",
  );

// ─── Custom Combobox ──────────────────────────────────────────────────────────

interface CustomComboboxProps<T> {
  items:         T[];
  value:         T | null;
  onValueChange: (val: T | null) => void;
  getLabel:      (item: T) => string;
  getKey:        (item: T) => string;
  placeholder?:  string;
  disabled?:     boolean;
  hasError?:     boolean;
}

function CustomCombobox<T>({
  items, value, onValueChange, getLabel, getKey,
  placeholder = "Select…", disabled = false, hasError = false,
}: CustomComboboxProps<T>) {
  const [open, setOpen]                           = useState(false);
  const [query, setQuery]                         = useState("");
  const [highlightedIndex, setHighlightedIndex]   = useState(0);
  const [dropdownStyle, setDropdownStyle]         = useState<React.CSSProperties>({});

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
    ? items.filter((item) => getLabel(item).toLowerCase().includes(query.toLowerCase()))
    : items;

  useEffect(() => { setHighlightedIndex(0); }, [query, open]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.querySelector<HTMLElement>(`[data-index="${highlightedIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  const handleSelect = (item: T) => { onValueChange(item); setOpen(false); setQuery(""); setHighlightedIndex(0); };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) { if (e.key === "ArrowDown" || e.key === "Enter") { setOpen(true); e.preventDefault(); } return; }
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1)); break;
      case "ArrowUp":   e.preventDefault(); setHighlightedIndex((i) => Math.max(i - 1, 0)); break;
      case "Enter":     e.preventDefault(); if (filtered[highlightedIndex]) handleSelect(filtered[highlightedIndex]); break;
      case "Escape":    setOpen(false); setQuery(""); setHighlightedIndex(0); break;
    }
  };

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
                      onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-[12px] transition-colors duration-75 flex items-center gap-2",
                        isSelected ? "bg-[#1a1a1a] text-white" : isHighlighted ? "bg-[#F5F4F0] text-[#1a1a1a]" : "text-[#1a1a1a]",
                      )}>
                      <span className="w-3 shrink-0">
                        {isSelected && <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 7l3.5 3.5L12 3" /></svg>}
                      </span>
                      {getLabel(item)}
                    </button>
                  );
                })
            }
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
          onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true); if (e.target.value === "") onValueChange(null); }}
          onFocus={() => { setOpen(true); setQuery(""); }}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full h-8 px-2.5 pr-7 text-[12px] rounded-lg border bg-white text-[#1a1a1a] placeholder:text-[#ccc]",
            "transition-all duration-150 outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            hasError ? "border-red-300 bg-red-50/40" : "border-[#E8E6E1] hover:border-[#ccc]",
          )}
        />
        <button type="button" tabIndex={-1} disabled={disabled}
          onClick={() => { if (disabled) return; setOpen((o) => !o); if (!open) inputRef.current?.focus(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#ccc] hover:text-[#999] transition-colors disabled:pointer-events-none">
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
            className={cn("transition-transform duration-150", open && "rotate-180")}>
            <path d="M2 5l5 5 5-5" />
          </svg>
        </button>
      </div>
      {typeof window !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
}

// ─── Free-type combobox for condition params ──────────────────────────────────
// Same as CustomCombobox but doesn't clear value on empty — allows free typing

function FreeCombobox({
  items, value, onChange, placeholder, disabled, hasError,
}: {
  items:       ConditionParam[];
  value:       string;
  onChange:    (v: string) => void;
  placeholder?: string;
  disabled?:   boolean;
  hasError?:   boolean;
}) {
  const [open, setOpen]                         = useState(false);
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
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = value.trim()
    ? items.filter((p) => p.cndprmnm.toLowerCase().includes(value.toLowerCase()))
    : items;

  useEffect(() => { setHighlightedIndex(0); }, [value, open]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.querySelector<HTMLElement>(`[data-index="${highlightedIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) { if (e.key === "ArrowDown" || e.key === "Enter") { setOpen(true); e.preventDefault(); } return; }
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1)); break;
      case "ArrowUp":   e.preventDefault(); setHighlightedIndex((i) => Math.max(i - 1, 0)); break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlightedIndex]) { onChange(filtered[highlightedIndex].cndprmnm); setOpen(false); }
        break;
      case "Escape": setOpen(false); break;
    }
  };

  const dropdown = (
    <AnimatePresence>
      {open && filtered.length > 0 && (
        <motion.div ref={listRef} style={dropdownStyle}
          initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.12 }}
          className="bg-white border border-[#E8E6E1] rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-44 overflow-y-auto">
            {filtered.map((p, idx) => (
              <button key={p.rowid} data-index={idx} type="button"
                onMouseDown={(e) => { e.preventDefault(); onChange(p.cndprmnm); setOpen(false); }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={cn(
                  "w-full text-left px-3 py-2 text-[12px] transition-colors duration-75 flex items-center gap-2",
                  value === p.cndprmnm ? "bg-[#1a1a1a] text-white"
                    : idx === highlightedIndex ? "bg-[#F5F4F0] text-[#1a1a1a]"
                    : "text-[#1a1a1a]",
                )}>
                <span className="w-3 shrink-0">
                  {value === p.cndprmnm && <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 7l3.5 3.5L12 3" /></svg>}
                </span>
                {p.cndprmnm}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input ref={inputRef} type="text" disabled={disabled} placeholder={placeholder ?? "Type or select…"}
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full h-8 px-2.5 pr-7 text-[12px] rounded-lg border bg-white text-[#1a1a1a] placeholder:text-[#ccc]",
            "transition-all duration-150 outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            hasError ? "border-red-300 bg-red-50/40" : "border-[#E8E6E1] hover:border-[#ccc]",
          )}
        />
        {items.length > 0 && (
          <button type="button" tabIndex={-1} disabled={disabled}
            onClick={() => { if (disabled) return; setOpen((o) => !o); if (!open) inputRef.current?.focus(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#ccc] hover:text-[#999] transition-colors disabled:pointer-events-none">
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
              className={cn("transition-transform duration-150", open && "rotate-180")}>
              <path d="M2 5l5 5 5-5" />
            </svg>
          </button>
        )}
      </div>
      {typeof window !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-5 py-3 border-b border-[#E8E6E1] bg-[#FAFAF9]">
      <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#888]">{title}</span>
    </div>
  );
}

function FormField({ label, required, children, className }: {
  label: string; required?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#999]">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function InlineSelect({ value, onChange, options, placeholder, hasError }: {
  value: string; onChange: (v: string) => void;
  options: readonly string[]; placeholder: string; hasError?: boolean;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls(hasError)}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#ccc]"
        width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M2 5l5 5 5-5" />
      </svg>
    </div>
  );
}

function YesNoToggle({ value, onChange, hasError, options = ["YES", "NO"] }: {
  value: string; onChange: (v: string) => void; hasError?: boolean; options?: string[];
}) {
  return (
    <div className={cn("flex rounded-lg border overflow-hidden text-[11px] font-medium", hasError ? "border-red-300" : "border-[#E8E6E1]")}>
      {options.map((opt) => (
        <button key={opt} type="button" onClick={() => onChange(opt)}
          className={cn(
            "flex-1 h-8 transition-all duration-150 whitespace-nowrap px-2",
            value === opt
              ? opt === "YES" || opt === "Yes" || opt === "BILL"
                ? "bg-[#1a1a1a] text-white"
                : "bg-[#555] text-white"
              : "bg-white text-[#999] hover:bg-[#F5F4F0]",
          )}>
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PoCatComPanelContent() {
  const today = new Date().toISOString().slice(0, 10);
  const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    .toISOString().slice(0, 10);

  // ── Header form state ──────────────────────────────────────────────────────
  const [selectedUnit, setSelectedUnit]     = useState<{ untcd: string; untnm: string } | null>(null);
  const [selectedCom,  setSelectedCom]      = useState<{ itmcomcd: string; itmcomnm: string } | null>(null);
  const [pocatcomnm,   setPocatcomnm]       = useState("");
  const [frghttyp,     setFrghttyp]         = useState<FrghtTyp | "">("");
  const [fromdt,       setFromdt]           = useState(today);
  const [todt,         setTodt]             = useState(nextYear);
  const [wgtreq,       setWgtreq]           = useState<YesNo>("YES");
  const [shtdis,       setShtdis]           = useState("0.000");
  const [duedys,       setDuedys]           = useState("0");
  const [duedyscng,    setDuedyscng]        = useState<YesNoSm>("Yes");
  const [cattyp,       setCattyp]           = useState<CattypOpt | "">("");
  const [smat,         setSmat]             = useState<YesNoSm>("Yes");
  const [conddesc,     setConddesc]         = useState("");
  const [billdiff_ded, setBilldiff_ded]     = useState<YesNo>("NO");
  const [shortage_ded, setShortage_ded]     = useState<YesNo>("NO");
  const [bill_type,    setBill_type]        = useState<BillType>("BILL");
  const [currentCd,    setCurrentCd]        = useState<string | undefined>(undefined);
  const [errors,       setErrors]           = useState<Record<string, string>>({});

  // ── Detail rows ────────────────────────────────────────────────────────────
  const [removedRowids, setRemovedRowids]   = useState<Set<number>>(new Set());
  const [pendingRows,   setPendingRows]     = useState<PendingRow[]>([]);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: units       = [] } = trpc.poCatCom.getUnits.useQuery();
  const { data: commodities = [] } = trpc.poCatCom.getCommodities.useQuery();

  const { data: conditionParams = [], isFetching: paramsFetching } =
    trpc.poCatCom.getConditionParams.useQuery(
      { untcd: selectedUnit?.untcd ?? "", itmcomcd: selectedCom?.itmcomcd ?? "" },
      { enabled: !!selectedUnit && !!selectedCom, staleTime: 0 },
    );

  const { data: latestHeader, isFetching: headerFetching } =
    trpc.poCatCom.getLatestHeader.useQuery(
      { untcd: selectedUnit?.untcd ?? "", itmcomcd: selectedCom?.itmcomcd ?? "" },
      { enabled: !!selectedUnit && !!selectedCom, staleTime: 0 },
    );

  const { data: savedRows = [], refetch: refetchDetails, isFetching: detailsFetching } =
    trpc.poCatCom.getDetails.useQuery(
      { pocatcomcd: currentCd! },
      { enabled: !!currentCd, staleTime: 0 },
    );

  // ── Populate form when existing record loads ───────────────────────────────
  useEffect(() => {
    if (latestHeader) {
      setPocatcomnm(latestHeader.pocatcomnm ?? "");
      setFrghttyp((latestHeader.frghttyp as FrghtTyp) ?? "");
      setFromdt(latestHeader.fromdt ? new Date(latestHeader.fromdt).toISOString().slice(0, 10) : today);
      setTodt(latestHeader.todt   ? new Date(latestHeader.todt).toISOString().slice(0, 10)   : nextYear);
      setWgtreq((latestHeader.wgtreq as YesNo) ?? "YES");
      setShtdis(String(latestHeader.shtdis ?? "0.000"));
      setDuedys(String(latestHeader.duedys ?? "0"));
      setDuedyscng((latestHeader.duedyscng as YesNoSm) ?? "Yes");
      setCattyp((latestHeader.cattyp as CattypOpt) ?? "");
      setSmat((latestHeader.smat as YesNoSm) ?? "Yes");
      setConddesc(latestHeader.conddesc ?? "");
      setBilldiff_ded((latestHeader.billdiff_ded as YesNo) ?? "NO");
      setShortage_ded((latestHeader.shortage_ded as YesNo) ?? "NO");
      setBill_type((latestHeader.bill_type as BillType) ?? "BILL");
      setCurrentCd(latestHeader.pocatcomcd);
    } else if (!!selectedUnit && !!selectedCom && !headerFetching) {
      resetHeaderFields();
    }
    setRemovedRowids(new Set());
    setPendingRows([]);
    setErrors({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestHeader, headerFetching]);

  const resetHeaderFields = () => {
    setPocatcomnm(""); setFrghttyp(""); setFromdt(today); setTodt(nextYear);
    setWgtreq("YES"); setShtdis("0.000"); setDuedys("0"); setDuedyscng("Yes");
    setCattyp(""); setSmat("Yes"); setConddesc("");
    setBilldiff_ded("NO"); setShortage_ded("NO"); setBill_type("BILL");
    setCurrentCd(undefined);
  };

  // ── Mutation ───────────────────────────────────────────────────────────────
  const saveMutation = trpc.poCatCom.save.useMutation({
    onSuccess: (data) => {
      showToast("success", "PO category saved successfully");
      setCurrentCd(data.pocatcomcd);
      setRemovedRowids(new Set());
      setPendingRows([]);
      refetchDetails();
    },
    onError: (err) => showToast("error", err.message),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleUnitChange = (val: { untcd: string; untnm: string } | null) => {
    setSelectedUnit(val);
    setSelectedCom(null);
    setCurrentCd(undefined);
    setPendingRows([]);
    setRemovedRowids(new Set());
    resetHeaderFields();
  };

  const handleComChange = (val: { itmcomcd: string; itmcomnm: string } | null) => {
    setSelectedCom(val);
    setCurrentCd(undefined);
    setPendingRows([]);
    setRemovedRowids(new Set());
    resetHeaderFields();
  };

  // ── Row helpers ────────────────────────────────────────────────────────────
  const visibleSaved    = (savedRows as SavedRow[]).filter((r) => !removedRowids.has(r.rowid));
  const totalRowCount   = visibleSaved.length + pendingRows.length;

  const appendRow = () => {
    setPendingRows((prev) => [
      ...prev,
      { _key: `new_${Date.now()}`, cndprmnm: "", cmnprmval: "0", cndprmded: "0", cndprmrate: "" },
    ]);
  };

  const removeLastRow = () => {
    if (pendingRows.length > 0) {
      setPendingRows((prev) => prev.slice(0, -1));
    } else if (visibleSaved.length > 0) {
      setRemovedRowids((prev) => new Set([...prev, visibleSaved[visibleSaved.length - 1].rowid]));
    }
  };

  const updatePending = (_key: string, field: keyof Omit<PendingRow, "_key">, value: string) => {
    setPendingRows((prev) => prev.map((r) => r._key === _key ? { ...r, [field]: value } : r));
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedUnit)  e.unit      = "Required";
    if (!selectedCom)   e.com       = "Required";
    if (!pocatcomnm)    e.pocatcomnm = "Required";
    if (!frghttyp)      e.frghttyp  = "Required";
    if (!fromdt)        e.fromdt    = "Required";
    if (!todt)          e.todt      = "Required";
    if (!cattyp)        e.cattyp    = "Required";
    if (new Date(todt) < new Date(fromdt)) e.todt = "Must be after From date";
    const badRow = pendingRows.some((r) => !r.cndprmnm || !r.cndprmrate);
    if (badRow) e.rows = "All rows must have condition name and applicable rate";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) { showToast("error", "Please fix the errors before saving"); return; }
    const allRows = [
      ...visibleSaved.map((r) => ({
        cndprmnm:   r.cndprmnm,
        cmnprmval:  r.cmnprmval,
        cndprmded:  r.cndprmded,
        cndprmrate: r.cndprmrate,
      })),
      ...pendingRows.map((r) => ({
        cndprmnm:   r.cndprmnm,
        cmnprmval:  parseFloat(r.cmnprmval) || 0,
        cndprmded:  parseFloat(r.cndprmded) || 0,
        cndprmrate: r.cndprmrate,
      })),
    ];
    saveMutation.mutate({
      untcd: selectedUnit!.untcd,
      itmcomcd: selectedCom!.itmcomcd,
      pocatcomnm, frghttyp: frghttyp as FrghtTyp,
      fromdt, todt,
      wgtreq, shtdis: parseFloat(shtdis) || 0,
      duedys: parseInt(duedys) || 0, duedyscng,
      prmcd: (conditionParams as ConditionParam[])[0]?.prmcd ?? "", 
      cattyp: cattyp as CattypOpt, smat, conddesc: conddesc ?? "",
      billdiff_ded, shortage_ded, bill_type,
      pocatcomcd: currentCd,
      rows: allRows,
    });
  };

  const handleDiscard = () => {
    setRemovedRowids(new Set());
    setPendingRows([]);
    showToast("success", "Changes discarded");
  };

  const bothSelected = !!selectedUnit && !!selectedCom;
  const isLoading    = headerFetching || detailsFetching;
  const isSaving     = saveMutation.isPending;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className={cn("fixed top-15 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium shadow-sm border",
              toast.type === "success" ? "bg-white border-green-200 text-green-700" : "bg-white border-red-200 text-red-600")}>
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", toast.type === "success" ? "bg-green-500" : "bg-red-500")} />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page title */}
      <div>
        <h2 className="text-[16px] font-medium text-[#1a1a1a]">PO Category Commodity Master</h2>
        <p className="text-[12px] text-[#999] mt-0.5">Define purchase order categories for each unit and commodity combination</p>
      </div>

      {/* ── GENERAL INFORMATION ───────────────────────────────────────────── */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <SectionHeader title="General Information" />
        <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">

          {/* Row 1 */}
          <FormField label="Unit Name" required>
            <CustomCombobox
              items={units} value={selectedUnit} onValueChange={handleUnitChange}
              getLabel={(u) => u.untnm} getKey={(u) => u.untcd}
              placeholder="Select unit…" hasError={!!errors.unit}
            />
            {errors.unit && <p className="text-[11px] text-red-400 mt-0.5">{errors.unit}</p>}
          </FormField>

          <FormField label="Commodity" required>
            <CustomCombobox
              items={commodities} value={selectedCom} onValueChange={handleComChange}
              getLabel={(c) => c.itmcomnm} getKey={(c) => c.itmcomcd}
              placeholder="Select commodity…" disabled={!selectedUnit} hasError={!!errors.com}
            />
            {errors.com && <p className="text-[11px] text-red-400 mt-0.5">{errors.com}</p>}
          </FormField>

          {/* Row 2 */}
          <FormField label="Description" required>
            <input type="text" className={inputCls(!!errors.pocatcomnm)} placeholder="e.g. PACK. M. FIN. (Cart)"
              value={pocatcomnm} onChange={(e) => setPocatcomnm(e.target.value)} />
            {errors.pocatcomnm && <p className="text-[11px] text-red-400 mt-0.5">{errors.pocatcomnm}</p>}
          </FormField>

          <FormField label="Freight Type" required>
            <div className="relative">
              <select className={selectCls(!!errors.frghttyp)} value={frghttyp}
                onChange={(e) => setFrghttyp(e.target.value as FrghtTyp)}>
                <option value="">Select…</option>
                {FRGHT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#ccc]"
                width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M2 5l5 5 5-5" />
              </svg>
            </div>
            {errors.frghttyp && <p className="text-[11px] text-red-400 mt-0.5">{errors.frghttyp}</p>}
          </FormField>

          {/* Row 3 */}
          <FormField label="Valid From" required>
            <input type="date" className={inputCls(!!errors.fromdt)} value={fromdt}
              onChange={(e) => setFromdt(e.target.value)} disabled={!bothSelected} />
            {errors.fromdt && <p className="text-[11px] text-red-400 mt-0.5">{errors.fromdt}</p>}
          </FormField>

          <FormField label="Valid To" required>
            <input type="date" className={inputCls(!!errors.todt)} value={todt}
              onChange={(e) => setTodt(e.target.value)} disabled={!bothSelected} />
            {errors.todt && <p className="text-[11px] text-red-400 mt-0.5">{errors.todt}</p>}
          </FormField>

          {/* Row 4 */}
          <FormField label="Weight Required">
            <YesNoToggle value={wgtreq} onChange={(v) => setWgtreq(v as YesNo)} />
          </FormField>

          <FormField label="Shortage Discount (Kg)">
            <input type="number" step="0.001" className={inputCls()} placeholder="0.000"
              value={shtdis} onChange={(e) => setShtdis(e.target.value)} disabled={!bothSelected} />
          </FormField>

          {/* Row 5 */}
          <FormField label="Due Days">
            <input type="number" className={inputCls()} placeholder="0"
              value={duedys} onChange={(e) => setDuedys(e.target.value)} disabled={!bothSelected} />
          </FormField>

          <FormField label="Due Days Changeable">
            <YesNoToggle value={duedyscng} onChange={(v) => setDuedyscng(v as YesNoSm)} options={["Yes", "No"]} />
          </FormField>

          {/* Row 6 */}
          <FormField label="PO Type" required>
            <div className="relative">
              <select className={selectCls(!!errors.cattyp)} value={cattyp}
                onChange={(e) => setCattyp(e.target.value as CattypOpt)}>
                <option value="">Select…</option>
                {CATTYP_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#ccc]"
                width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M2 5l5 5 5-5" />
              </svg>
            </div>
            {errors.cattyp && <p className="text-[11px] text-red-400 mt-0.5">{errors.cattyp}</p>}
          </FormField>

          <FormField label="Bardana Applicable">
            <YesNoToggle value={smat} onChange={(v) => setSmat(v as YesNoSm)} options={["Yes", "No"]} />
          </FormField>

          {/* Row 7 — 3 new fields */}
          <FormField label="Bill Difference Deduction">
            <YesNoToggle value={billdiff_ded} onChange={(v) => setBilldiff_ded(v as YesNo)} />
          </FormField>

          <FormField label="Shortage Deduction">
            <YesNoToggle value={shortage_ded} onChange={(v) => setShortage_ded(v as YesNo)} />
          </FormField>

          <FormField label="Bill Type">
            <YesNoToggle value={bill_type} onChange={(v) => setBill_type(v as BillType)} options={["BILL", "CHALLAN"]} />
          </FormField>

          {/* Row 8 — T&C full width */}
          <FormField label="Terms & Conditions" className="col-span-2">
            <textarea
              className={cn(inputCls(), "h-24 py-2 resize-none")}
              placeholder="Enter terms and conditions…"
              value={conddesc}
              onChange={(e) => setConddesc(e.target.value)}
              disabled={!bothSelected}
            />
          </FormField>

          {/* Existing code badge */}
          {currentCd && (
            <div className="col-span-2 flex items-center gap-2">
              <span className="text-[11px] text-[#aaa]">Category Code:</span>
              <span className="text-[11px] font-mono bg-[#F5F4F0] px-2 py-0.5 rounded text-[#555]">{currentCd}</span>
              <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                Editing existing record
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── MATERIAL CONSUMED (detail rows) ──────────────────────────────── */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">

        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#888]">
            Material Consumed
            {bothSelected && (
              <span className="ml-2 normal-case text-[#aaa] font-normal tracking-normal">
                — {selectedUnit.untnm} / {selectedCom.itmcomnm}
              </span>
            )}
            {paramsFetching && (
              <span className="ml-2 inline-flex items-center gap-1 normal-case font-normal tracking-normal text-[#bbb]">
                <svg className="animate-spin" width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 1a6 6 0 1 0 6 6" /></svg>
                loading params…
              </span>
            )}
          </span>

          <div className="flex items-center gap-1.5">
            <button onClick={appendRow} disabled={!bothSelected}
              className="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium rounded-lg border transition-all duration-150 text-green-700 border-green-200 bg-green-50 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed">
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7 1v12M1 7h12" /></svg>
              Append
            </button>
            <button onClick={removeLastRow} disabled={!bothSelected || totalRowCount === 0}
              className="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium rounded-lg border transition-all duration-150 text-red-600 border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed">
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 7h12" /></svg>
              Remove
            </button>
            <div className="w-px h-4 bg-[#E8E6E1] mx-1" />
            <button onClick={handleSave} disabled={!bothSelected || isSaving}
              className="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium rounded-lg border transition-all duration-150 text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed">
              {isSaving
                ? <svg className="animate-spin" width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 1a6 6 0 1 0 6 6" /></svg>
                : <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 7l3.5 3.5L12 3" /></svg>
              }
              Accept
            </button>
            <button onClick={handleDiscard} disabled={!bothSelected || isSaving}
              className="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium rounded-lg border transition-all duration-150 text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed">
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 4L4 10M4 4l6 6" /></svg>
              Reject
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-14">
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round"><path d="M7 1a6 6 0 1 0 6 6" /></svg>
              <span className="text-[13px] text-[#aaa]">Loading…</span>
            </div>
          ) : (
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] w-8">#</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] min-w-[200px]">Condition Name</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] min-w-[100px]">Value</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] min-w-[100px]">Deduction</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] min-w-[140px]">Applicable Rate</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {!bothSelected ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-[12px] text-[#ccc]">
                    Select a unit and commodity above to view or manage parameters
                  </td></tr>
                ) : totalRowCount === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-[12px] text-[#ccc]">
                    No conditions defined — click <span className="font-medium text-[#aaa]">Append</span> to add one
                  </td></tr>
                ) : (
                  <>
                    {/* Saved rows */}
                    <AnimatePresence initial={false}>
                      {visibleSaved.map((row, idx) => (
                        <motion.tr key={`saved_${row.rowid}`}
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0, overflow: "hidden" }} transition={{ duration: 0.15 }}
                          className="border-b border-[#F5F4F0] hover:bg-[#FAFAF9] group">
                          <td className="px-4 py-2.5 text-[#ccc] text-[11px] font-mono">{idx + 1}</td>
                          <td className="px-3 py-2.5 font-medium text-[#1a1a1a]">{row.cndprmnm}</td>
                          <td className="px-3 py-2.5 text-[#666]">{row.cmnprmval}</td>
                          <td className="px-3 py-2.5 text-[#666]">{row.cndprmded}</td>
                          <td className="px-3 py-2.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#F5F4F0] text-[#555]">
                              {row.cndprmrate || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2 w-10">
                            <button onClick={() => setRemovedRowids((prev) => new Set([...prev, row.rowid]))}
                              className="w-6 h-6 flex items-center justify-center rounded-md border border-[#E8E6E1] text-[#ccc] hover:border-red-200 hover:text-red-400 hover:bg-red-50 transition-all duration-150 opacity-0 group-hover:opacity-100">
                              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 1l12 12M13 1L1 13" /></svg>
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>

                    {/* Pending rows */}
                    <AnimatePresence initial={false}>
                      {pendingRows.map((row, idx) => (
                        <motion.tr key={row._key}
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0, overflow: "hidden" }} transition={{ duration: 0.15 }}
                          className="border-b border-[#F5F4F0] last:border-0 bg-blue-50/30 group">
                          <td className="px-4 py-2 text-[#ccc] text-[11px] font-mono">{visibleSaved.length + idx + 1}</td>
                          <td className="px-3 py-2 min-w-[200px]">
                            <FreeCombobox
                              items={conditionParams as ConditionParam[]}
                              value={row.cndprmnm}
                              onChange={(v) => updatePending(row._key, "cndprmnm", v)}
                              placeholder={conditionParams.length > 0 ? "Type or select condition…" : "Type condition name…"}
                              hasError={!row.cndprmnm}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" step="0.01" value={row.cmnprmval}
                              onChange={(e) => updatePending(row._key, "cmnprmval", e.target.value)}
                              placeholder="0" className={inputCls()} />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" step="0.01" value={row.cndprmded}
                              onChange={(e) => updatePending(row._key, "cndprmded", e.target.value)}
                              placeholder="0" className={inputCls()} />
                          </td>
                          <td className="px-3 py-2">
                            <InlineSelect
                              value={row.cndprmrate}
                              onChange={(v) => updatePending(row._key, "cndprmrate", v)}
                              options={RATE_OPTIONS}
                              placeholder="Select rate…"
                              hasError={!row.cndprmrate}
                            />
                          </td>
                          <td className="px-3 py-2 w-10">
                            <button onClick={() => setPendingRows((prev) => prev.filter((r) => r._key !== row._key))}
                              className="w-6 h-6 flex items-center justify-center rounded-md border border-[#E8E6E1] text-[#ccc] hover:border-red-200 hover:text-red-400 hover:bg-red-50 transition-all duration-150 opacity-0 group-hover:opacity-100">
                              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 1l12 12M13 1L1 13" /></svg>
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {bothSelected && (
          <div className="px-5 py-3 border-t border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between">
            <span className="text-[11px] text-[#bbb]">
              {totalRowCount} condition{totalRowCount !== 1 ? "s" : ""} defined
            </span>
            <div className="flex items-center gap-2">
              <button onClick={handleDiscard} disabled={isSaving}
                className="h-8 px-4 text-[12px] font-medium text-[#666] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-all duration-150 disabled:opacity-50">
                Discard
              </button>
              <button onClick={handleSave} disabled={isSaving}
                className="h-8 px-4 text-[12px] font-medium text-white rounded-lg disabled:opacity-50 transition-all duration-150 flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#333]">
                {isSaving ? (
                  <><svg className="animate-spin" width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M7 1a6 6 0 1 0 6 6" /></svg>Saving…</>
                ) : (
                  <><svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><path d="M2 7l3.5 3.5L12 3" /></svg>Save</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}