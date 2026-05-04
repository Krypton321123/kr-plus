"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { trpc } from "@/app/_trpc/client";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Unit       { untcd: string; untnm: string }
interface PoCat      { pocatcomcd: string; pocatcomnm: string; itmcomcd: string }
interface Item       { itrmcd: string; itmnm: string }
interface BrgRecord  {
  rowid:      number;
  purbrgcd:   string;
  untnm:      string; 
  untcd:      string;
  purbrgdt:   Date | string;
  pocatcomcd: string;
  pocatcomnm: string; 
  itmcd:      string;
  itmnm:      string;  
  brgqty:     number;
  brgrate:    number;
  conddays:   number;
  condrate:   number;
  mblbrg:     string;
  apprateid:  number;
  sts:        string;
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const inputCls = (hasError?: boolean) =>
  cn(
    "w-full h-8 px-2.5 text-[12px] bg-white border rounded-lg text-[#1a1a1a] placeholder:text-[#ccc]",
    "focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all duration-150 hover:border-[#ccc]",
    hasError ? "border-red-300 bg-red-50/40" : "border-[#E8E6E1]",
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
  const [open, setOpen]                         = useState(false);
  const [query, setQuery]                       = useState("");
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

// ─── Shared UI ────────────────────────────────────────────────────────────────

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

function YesNoToggle({ value, onChange, options = ["Yes", "No"] }: {
  value: string; onChange: (v: string) => void; options?: string[];
}) {
  return (
    <div className="flex rounded-lg border border-[#E8E6E1] overflow-hidden text-[11px] font-medium">
      {options.map((opt) => (
        <button key={opt} type="button" onClick={() => onChange(opt)}
          className={cn(
            "flex-1 h-8 transition-all duration-150 px-3",
            value === opt ? "bg-[#1a1a1a] text-white" : "bg-white text-[#999] hover:bg-[#F5F4F0]",
          )}>
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PurBrgPanelContent() {
  const today = new Date().toISOString().slice(0, 10);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [selectedUnit,   setSelectedUnit]   = useState<Unit   | null>(null);
  const [selectedPoCat,  setSelectedPoCat]  = useState<PoCat  | null>(null);
  const [selectedItem,   setSelectedItem]   = useState<Item   | null>(null);
  const [purbrgdt,       setPurbrgdt]       = useState(today);
  const [brgqty,         setBrgqty]         = useState("0");
  const [brgrate,        setBrgrate]        = useState("0.000");
  const [conddays,       setConddays]       = useState("0");
  const [condrate,       setCondrate]       = useState("0.000");
  const [mblbrg,         setMblbrg]         = useState<"Yes" | "No">("No");
  const [currentCd,      setCurrentCd]      = useState<string | undefined>(undefined);
  const [errors,         setErrors]         = useState<Record<string, string>>({});

  // ── Table filter state ─────────────────────────────────────────────────────
  const [filterUnit,  setFilterUnit]  = useState<Unit | null>(null);
  const [filterFrom,  setFilterFrom]  = useState("");
  const [filterTo,    setFilterTo]    = useState("");

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: units = [] } = trpc.purBrg.getUnits.useQuery();

  const { data: poCats = [], isFetching: poCatsFetching } =
    trpc.purBrg.getPoCatByUnit.useQuery(
      { untcd: selectedUnit?.untcd ?? "" },
      { enabled: !!selectedUnit, staleTime: 0 }
    );

  const { data: items = [], isFetching: itemsFetching } =
    trpc.purBrg.getItemsByComcd.useQuery(
      { itmcomcd: selectedPoCat?.itmcomcd ?? "" },
      { enabled: !!selectedPoCat, staleTime: 0 }
    );

  // ── Table query — always on, re-fetches when filters change ───────────────
  const { data: tableResults = [], isFetching: tableLoading, refetch: refetchTable } =
    trpc.purBrg.search.useQuery(
      {
        untcd:  filterUnit?.untcd,
        fromdt: filterFrom || undefined,
        todt:   filterTo   || undefined,
      },
      { staleTime: 0 }
    );

  // ── Reset cascades ─────────────────────────────────────────────────────────
  const handleUnitChange = (val: Unit | null) => {
    setSelectedUnit(val);
    setSelectedPoCat(null);
    setSelectedItem(null);
    setCurrentCd(undefined);
    setErrors({});
  };

  const handlePoCatChange = (val: PoCat | null) => {
    setSelectedPoCat(val);
    setSelectedItem(null);
    setErrors({});
  };

  // ── Load from table row ────────────────────────────────────────────────────
  const loadRecord = (rec: BrgRecord) => {
    setCurrentCd(rec.purbrgcd);
    setPurbrgdt(new Date(rec.purbrgdt).toISOString().slice(0, 10));
    setBrgqty(String(rec.brgqty));
    setBrgrate(String(rec.brgrate));
    setConddays(String(rec.conddays));
    setCondrate(String(rec.condrate));
    setMblbrg(rec.mblbrg as "Yes" | "No");
    setErrors({});
    const unit = (units as Unit[]).find((u) => u.untcd === rec.untcd) ?? null;
    setSelectedUnit(unit);
    _pendingPoCatCd.current = rec.pocatcomcd;
    _pendingItemCd.current  = rec.itmcd;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const _pendingPoCatCd = useRef<string | null>(null);
  const _pendingItemCd  = useRef<string | null>(null);

  useEffect(() => {
    if (_pendingPoCatCd.current && poCats.length > 0) {
      const match = (poCats as PoCat[]).find((p) => p.pocatcomcd === _pendingPoCatCd.current);
      if (match) { setSelectedPoCat(match); _pendingPoCatCd.current = null; }
    }
  }, [poCats]);

  useEffect(() => {
    if (_pendingItemCd.current && items.length > 0) {
      const match = (items as Item[]).find((i) => i.itrmcd === _pendingItemCd.current);
      if (match) { setSelectedItem(match); _pendingItemCd.current = null; }
    }
  }, [items]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedUnit)  e.unit     = "Required";
    if (!selectedPoCat) e.pocat    = "Required";
    if (!selectedItem)  e.item     = "Required";
    if (!purbrgdt)      e.purbrgdt = "Required";
    if (parseFloat(brgqty)  <= 0) e.brgqty  = "Must be > 0";
    if (parseFloat(brgrate) <= 0) e.brgrate = "Must be > 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Mutation ───────────────────────────────────────────────────────────────
  const saveMutation = trpc.purBrg.save.useMutation({
    onSuccess: (data) => {
      showToast("success", `Bargain ${currentCd ? "updated" : "saved"} — ${data.purbrgcd}`);
      setCurrentCd(data.purbrgcd);
      refetchTable();
    },
    onError: (err) => showToast("error", err.message),
  });

  const handleSave = () => {
    if (!validate()) { showToast("error", "Please fix the errors before saving"); return; }
    saveMutation.mutate({
      purbrgcd:   currentCd,
      untcd:      selectedUnit!.untcd,
      purbrgdt,
      pocatcomcd: selectedPoCat!.pocatcomcd,
      itmcd:      selectedItem!.itrmcd,
      brgqty:     parseFloat(brgqty)  || 0,
      brgrate:    parseFloat(brgrate) || 0,
      conddays:   parseInt(conddays)  || 0,
      condrate:   parseFloat(condrate)|| 0,
      mblbrg,
      apprateid:  0,
      sts:        "A",
    });
  };

  const handleDiscard = () => {
    setSelectedUnit(null); setSelectedPoCat(null); setSelectedItem(null);
    setPurbrgdt(today); setBrgqty("0"); setBrgrate("0.000");
    setConddays("0"); setCondrate("0.000"); setMblbrg("No");
    setCurrentCd(undefined); setErrors({});
    showToast("success", "Form cleared");
  };

  const isSaving = saveMutation.isPending;
  const isEdit   = !!currentCd;

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

      {/* Page title + toolbar */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[16px] font-medium text-[#1a1a1a]">Purchase Bargain Master</h2>
          <p className="text-[12px] text-[#999] mt-0.5">Create and manage purchase bargain records</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDiscard} disabled={isSaving}
            className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium rounded-lg border transition-all duration-150 text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100 disabled:opacity-50">
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 4L4 10M4 4l6 6" /></svg>
            Clear
          </button>
          <button onClick={handleSave} disabled={isSaving}
            className="flex items-center gap-1.5 h-8 px-4 text-[12px] font-medium text-white rounded-lg disabled:opacity-50 transition-all duration-150 bg-[#1a1a1a] hover:bg-[#333]">
            {isSaving
              ? <><svg className="animate-spin" width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M7 1a6 6 0 1 0 6 6" /></svg>Saving…</>
              : <><svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><path d="M2 7l3.5 3.5L12 3" /></svg>{isEdit ? "Update" : "Save"}</>
            }
          </button>
        </div>
      </div>

      {/* ── FORM CARD ──────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <SectionHeader title="Bargain Details" />
        <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">

          <FormField label="Location Name" required>
            <CustomCombobox
              items={units as Unit[]} value={selectedUnit} onValueChange={handleUnitChange}
              getLabel={(u) => u.untnm} getKey={(u) => u.untcd}
              placeholder="Select location…" hasError={!!errors.unit}
            />
            {errors.unit && <p className="text-[11px] text-red-400 mt-0.5">{errors.unit}</p>}
          </FormField>

          <FormField label="Bargain Date" required>
            <input type="date" className={inputCls(!!errors.purbrgdt)} value={purbrgdt}
              onChange={(e) => setPurbrgdt(e.target.value)} />
            {errors.purbrgdt && <p className="text-[11px] text-red-400 mt-0.5">{errors.purbrgdt}</p>}
          </FormField>

          <FormField label="PO Category" required>
            {poCatsFetching ? (
              <div className="h-8 flex items-center gap-2 px-2.5 border border-[#E8E6E1] rounded-lg">
                <svg className="animate-spin shrink-0" width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round"><path d="M7 1a6 6 0 1 0 6 6" /></svg>
                <span className="text-[12px] text-[#ccc]">Loading categories…</span>
              </div>
            ) : (
              <CustomCombobox
                items={poCats as PoCat[]} value={selectedPoCat} onValueChange={handlePoCatChange}
                getLabel={(p) => p.pocatcomnm} getKey={(p) => p.pocatcomcd}
                placeholder={selectedUnit ? "Select PO category…" : "Select location first…"}
                disabled={!selectedUnit} hasError={!!errors.pocat}
              />
            )}
            {errors.pocat && <p className="text-[11px] text-red-400 mt-0.5">{errors.pocat}</p>}
          </FormField>

          <FormField label="Item Name" required>
            {itemsFetching ? (
              <div className="h-8 flex items-center gap-2 px-2.5 border border-[#E8E6E1] rounded-lg">
                <svg className="animate-spin shrink-0" width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round"><path d="M7 1a6 6 0 1 0 6 6" /></svg>
                <span className="text-[12px] text-[#ccc]">Loading items…</span>
              </div>
            ) : (
              <CustomCombobox
                items={items as Item[]} value={selectedItem} onValueChange={setSelectedItem}
                getLabel={(i) => i.itmnm} getKey={(i) => i.itrmcd}
                placeholder={selectedPoCat ? "Select item…" : "Select PO category first…"}
                disabled={!selectedPoCat} hasError={!!errors.item}
              />
            )}
            {errors.item && <p className="text-[11px] text-red-400 mt-0.5">{errors.item}</p>}
          </FormField>

          <FormField label="Bargain Weight (Kg)" required>
            <div className="relative">
              <input type="number" step="0.001" min="0"
                className={inputCls(!!errors.brgqty)} placeholder="0" value={brgqty}
                onChange={(e) => setBrgqty(e.target.value)} />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#ccc] pointer-events-none">Kg</span>
            </div>
            {errors.brgqty && <p className="text-[11px] text-red-400 mt-0.5">{errors.brgqty}</p>}
          </FormField>

          <FormField label="Bargain Rate (Central)" required>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#aaa] pointer-events-none">Rs</span>
              <input type="number" step="0.001" min="0"
                className={cn(inputCls(!!errors.brgrate), "pl-8 pr-10")} placeholder="0.000" value={brgrate}
                onChange={(e) => setBrgrate(e.target.value)} />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#ccc] pointer-events-none">/-Kg</span>
            </div>
            {errors.brgrate && <p className="text-[11px] text-red-400 mt-0.5">{errors.brgrate}</p>}
          </FormField>

          <FormField label="Conditional Days">
            <div className="relative">
              <input type="number" min="0" className={inputCls()} placeholder="0" value={conddays}
                onChange={(e) => setConddays(e.target.value)} />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#ccc] pointer-events-none">Days</span>
            </div>
          </FormField>

          <FormField label="Conditional Rate">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#aaa] pointer-events-none">Rs</span>
              <input type="number" step="0.001" min="0"
                className={cn(inputCls(), "pl-8 pr-10")} placeholder="0.000" value={condrate}
                onChange={(e) => setCondrate(e.target.value)} />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#ccc] pointer-events-none">/-Kg</span>
            </div>
          </FormField>

          <FormField label="Bargain For Mobile App">
            <YesNoToggle value={mblbrg} onChange={(v) => setMblbrg(v as "Yes" | "No")} />
          </FormField>

          {currentCd && (
            <div className="flex items-center gap-2 self-end pb-1">
              <span className="text-[11px] text-[#aaa]">Bargain Code:</span>
              <span className="text-[11px] font-mono bg-[#F5F4F0] px-2 py-0.5 rounded text-[#555]">{currentCd}</span>
              <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                Editing existing record
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between">
          <div className="flex items-center gap-4 text-[11px] text-[#bbb]">
            {selectedPoCat && (
              <span>Commodity: <span className="text-[#888] font-medium">{selectedPoCat.itmcomcd}</span></span>
            )}
            {selectedPoCat && items.length > 0 && (
              <span>{items.length} item{items.length !== 1 ? "s" : ""} available</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDiscard} disabled={isSaving}
              className="h-8 px-4 text-[12px] font-medium text-[#666] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-all duration-150 disabled:opacity-50">
              {isEdit ? "Cancel" : "Clear"}
            </button>
            <button onClick={handleSave} disabled={isSaving}
              className={cn(
                "h-8 px-4 text-[12px] font-medium text-white rounded-lg disabled:opacity-50 transition-all duration-150 flex items-center gap-1.5",
                isEdit ? "bg-blue-600 hover:bg-blue-700" : "bg-[#1a1a1a] hover:bg-[#333]",
              )}>
              {isSaving
                ? <><svg className="animate-spin" width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M7 1a6 6 0 1 0 6 6" /></svg>Saving…</>
                : <><svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><path d="M2 7l3.5 3.5L12 3" /></svg>{isEdit ? "Update Bargain" : "Save Bargain"}</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* ── BARGAIN TABLE ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        {/* Table header with inline filters */}
        <div className="px-5 py-3.5 border-b border-[#E8E6E1] flex items-center justify-between gap-4">
          <span className="text-[13px] font-medium text-[#1a1a1a] shrink-0">
            All Bargains
            <span className="ml-2 text-[11px] font-normal text-[#aaa]">
              {tableLoading ? "…" : `${(tableResults as BrgRecord[]).length} records`}
            </span>
          </span>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <div className="w-44">
              <CustomCombobox
                items={units as Unit[]}
                value={filterUnit}
                onValueChange={setFilterUnit}
                getLabel={(u) => u.untnm}
                getKey={(u) => u.untcd}
                placeholder="All units…"
              />
            </div>
            <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)}
              className="h-8 px-2.5 text-[12px] border border-[#E8E6E1] rounded-lg bg-[#FAFAF9] text-[#1a1a1a] focus:outline-none focus:border-[#ccc] transition-all duration-150" />
            <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)}
              className="h-8 px-2.5 text-[12px] border border-[#E8E6E1] rounded-lg bg-[#FAFAF9] text-[#1a1a1a] focus:outline-none focus:border-[#ccc] transition-all duration-150" />
            {(filterUnit || filterFrom || filterTo) && (
              <button
                onClick={() => { setFilterUnit(null); setFilterFrom(""); setFilterTo(""); }}
                className="h-8 px-2.5 text-[11px] font-medium text-[#999] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] hover:text-[#555] transition-all duration-150 shrink-0">
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
                {["Bargain Code", "Unit", "Date", "PO Category", "Item", "Qty", "Rate", "Cond. Days", "Cond. Rate", "Mobile", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr>
                  <td colSpan={12} className="px-4 py-10">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round"><path d="M7 1a6 6 0 1 0 6 6" /></svg>
                      <span className="text-[12px] text-[#aaa]">Loading…</span>
                    </div>
                  </td>
                </tr>
              ) : (tableResults as BrgRecord[]).length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-[12px] text-[#ccc]">
                    No bargain records found
                  </td>
                </tr>
              ) : (
                (tableResults as BrgRecord[]).map((r, i) => {
                  const isRowEditing = currentCd === r.purbrgcd;
                  return (
                    <motion.tr key={r.rowid}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className={cn(
                        "border-b border-[#F5F4F0] last:border-0 transition-colors duration-100",
                        isRowEditing ? "bg-blue-50/60" : "hover:bg-[#FAFAF9]",
                      )}>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-[#555]">{r.purbrgcd}</td>
                      <td className="px-4 py-2.5 text-[#1a1a1a]">{r.untnm}</td>
                      <td className="px-4 py-2.5 text-[#666] whitespace-nowrap">{new Date(r.purbrgdt).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-2.5 text-[#666]">{r.pocatcomnm}</td>
                      <td className="px-4 py-2.5 text-[#666]">{r.itmnm}</td>
                      <td className="px-4 py-2.5 text-[#666]">{r.brgqty}</td>
                      <td className="px-4 py-2.5 text-[#666]">{r.brgrate}</td>
                      <td className="px-4 py-2.5 text-[#666]">{r.conddays}</td>
                      <td className="px-4 py-2.5 text-[#666]">{r.condrate}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn(
                          "inline-flex px-2 py-0.5 rounded text-[10px] font-medium",
                          r.mblbrg === "Yes" ? "bg-blue-50 text-blue-600" : "bg-[#F5F4F0] text-[#999]",
                        )}>{r.mblbrg}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                          r.sts === "A" ? "bg-green-50 text-green-700" : "bg-[#F5F4F0] text-[#888]",
                        )}>
                          <span className={cn("w-1 h-1 rounded-full", r.sts === "A" ? "bg-green-500" : "bg-[#ccc]")} />
                          {r.sts === "A" ? "Active" : r.sts}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => loadRecord(r)}
                          className={cn(
                            "w-7 h-7 rounded-md flex items-center justify-center transition-all duration-150 border",
                            isRowEditing
                              ? "bg-blue-100 border-blue-200 text-blue-600"
                              : "bg-white border-[#E8E6E1] text-[#aaa] hover:border-[#C8C5BE] hover:text-[#555] hover:bg-[#F5F4F0]",
                          )}>
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M2 10.5L4.5 11 11 4.5a1.77 1.77 0 0 0-2.5-2.5L2 8.5v2z" />
                          </svg>
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}