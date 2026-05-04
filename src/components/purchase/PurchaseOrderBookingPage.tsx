"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { trpc } from "@/app/_trpc/client";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

// ─── Utility ──────────────────────────────────────────────────────────────────
function toDateInput(d: Date) {
  return d.toISOString().split("T")[0]!;
}
function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return toDateInput(d);
}
function fmtDate(val: Date | string | null | undefined) {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
type LedgerItem = {
  rowid: number;
  ledcd: string;
  lednm: string | null;
  ledtyp: string | null;
};

type CategoryItem = {
  rowid: number;
  pocatcomcd: string;
  pocatcomnm: string;
  frghttyp: string;
  duedys: number;
  cattyp: string;
  untcd: string;
  prmcd: string;
  itmcomcd: string;
  fromdt: Date;
  todt: Date;
  wgtreq: string;
  shtdis: number;
  billdiff_ded: string;
  shortage_ded: string;
  bill_type: string;
  conddesc: string;
};

type UnitItem = {
  rowid: number;
  untcd: string;
  untnm: string;
  untshnm: string | null;
};

interface OrderLine {
  id: string;
  party: LedgerItem | null;
  broker: LedgerItem | null;
  orderWgt: string;
  orderRate: string;
  freightType: string;
  freightQtl: string;
}

// ─── CustomCombobox ───────────────────────────────────────────────────────────
interface CustomComboboxProps<T> {
  items: T[];
  value: T | null;
  onValueChange: (val: T | null) => void;
  getLabel: (item: T) => string;
  getKey: (item: T) => string;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
}

function CustomCombobox<T>({
  items, value, onValueChange, getLabel, getKey,
  placeholder = "Select…", disabled = false, hasError = false,
}: CustomComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

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
                const isSelected = value ? getKey(value) === getKey(item) : false;
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
            if (e.key === "ArrowDown") { e.preventDefault(); setHighlightedIndex(i => Math.min(i + 1, filtered.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setHighlightedIndex(i => Math.max(i - 1, 0)); }
            else if (e.key === "Enter") { e.preventDefault(); if (filtered[highlightedIndex]) handleSelect(filtered[highlightedIndex]!); }
            else if (e.key === "Escape") { setOpen(false); setQuery(""); setHighlightedIndex(0); }
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

// ─── Shared UI pieces ─────────────────────────────────────────────────────────
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

// ─── Toast ────────────────────────────────────────────────────────────────────
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PurchaseOrderBookingPage() {
  const today = toDateInput(new Date());
  const user = useAuthStore(s => s.user);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(true);
  const [editingPobkncd, setEditingPobkncd] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;
  const formTopRef = useRef<HTMLDivElement>(null);

  // ── Form state ────────────────────────────────────────────────────────────
  const [selectedUnit, setSelectedUnit] = useState<UnitItem | null>(null);
  const [deliveryDate, setDeliveryDate] = useState(today);
  const [validDate, setValidDate] = useState(today);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [remark, setRemark] = useState("");
  const [bargainInfo, setBargainInfo] = useState<{
    bargainRate: number | null; totalBargainWgt: number; bookedWgt: number; pendingWgt: number;
  } | null>(null);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: units = [] } = trpc.purOrderBooking.getUnits.useQuery();
  const { data: categories = [] } = trpc.purOrderBooking.getCategories.useQuery();
  const { data: parties = [] } = trpc.purOrderBooking.getLedgers.useQuery({ ledtyp: "25" });
  const { data: brokers = [] } = trpc.purOrderBooking.getLedgers.useQuery({ ledtyp: "30" });

  const { data: categoryConditions = [] } = trpc.purOrderBooking.getCategoryConditions.useQuery(
    { pocatcomcd: selectedCategory?.pocatcomcd ?? "" },
    { enabled: !!selectedCategory },
  );

  const bargainQuery = trpc.purOrderBooking.getBargainInfo.useQuery(
    {
      pocatcomcd: selectedCategory?.pocatcomcd ?? "",
      excludePobkncd: editingPobkncd ?? undefined,
    },
    { enabled: !!selectedCategory },
  );

  const { data: listData, refetch: refetchList } = trpc.purOrderBooking.getAll.useQuery({
    limit: PAGE_SIZE,
    offset: (currentPage - 1) * PAGE_SIZE,
    search: searchQuery || undefined,
  });
  const listItems = listData?.items ?? [];
  const totalCount = listData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Load booking for editing
  const { data: editData, isLoading: isLoadingEdit } = trpc.purOrderBooking.getById.useQuery(
    { pobkncd: editingPobkncd! },
    { enabled: !!editingPobkncd, staleTime: 0 },
  );

  // ── Sync bargain info ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedCategory) { setBargainInfo(null); return; }
    if (bargainQuery.data !== undefined) setBargainInfo(bargainQuery.data);
    if (selectedCategory.duedys) setValidDate(addDays(deliveryDate, selectedCategory.duedys));
    setOrderLines(prev => prev.map(l => ({
      ...l,
      orderRate: String(bargainQuery.data?.bargainRate ?? l.orderRate),
      freightType: selectedCategory.frghttyp,
    })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory?.pocatcomcd, bargainQuery.data]);

  useEffect(() => {
    if (selectedCategory?.duedys) setValidDate(addDays(deliveryDate, selectedCategory.duedys));
  }, [deliveryDate, selectedCategory?.duedys]);

  // ── Load edit data into form ──────────────────────────────────────────────
  useEffect(() => {
    if (!editData || !editingPobkncd) return;
    const { header, details } = editData;

    const unit = units.find(u => u.untcd === header.untcd) ?? null;
    const cat = categories.find(c => c.pocatcomcd === header.pocatcomcd) ?? null;

    setSelectedUnit(unit as UnitItem | null);
    setSelectedCategory(cat as CategoryItem | null);
    setDeliveryDate(header.dlydt ? toDateInput(new Date(header.dlydt)) : today);
    setValidDate(header.valdt ? toDateInput(new Date(header.valdt)) : today);
    setRemark(header.remark ?? "");

    setOrderLines(details.map(d => {
      const party = (parties as LedgerItem[]).find(p => p.ledcd === d.ptyledcd) ?? null;
      const broker = (brokers as LedgerItem[]).find(b => b.ledcd === d.brkrledcd) ?? null;
      return {
        id: crypto.randomUUID(),
        party,
        broker,
        orderWgt: String(d.qty ?? ""),
        orderRate: String(d.rate ?? ""),
        freightType: d.frgttyp ?? "",
        freightQtl: String(d.frgt ?? ""),
      };
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editData, editingPobkncd]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const saveMutation = trpc.purOrderBooking.saveBooking.useMutation({
    onSuccess: d => {
      showToast("success", `Booking created: ${d.pobkncd}`);
      resetForm();
      refetchList();
    },
    onError: e => showToast("error", e.message),
  });

  const updateMutation = trpc.purOrderBooking.updateBooking.useMutation({
    onSuccess: () => {
      showToast("success", "Booking updated successfully");
      resetForm();
      refetchList();
    },
    onError: e => showToast("error", e.message),
  });

  const isSaving = saveMutation.isPending || updateMutation.isPending;
  const isEdit = !!editingPobkncd;

  // ── Form helpers ──────────────────────────────────────────────────────────
  const resetForm = () => {
    setSelectedUnit(null);
    setSelectedCategory(null);
    setDeliveryDate(today);
    setValidDate(today);
    setOrderLines([]);
    setRemark("");
    setBargainInfo(null);
    setEditingPobkncd(null);
  };

  const appendLine = () => {
    setOrderLines(prev => [...prev, {
      id: crypto.randomUUID(),
      party: null,
      broker: null,
      orderWgt: "",
      orderRate: String(bargainInfo?.bargainRate ?? ""),
      freightType: selectedCategory?.frghttyp ?? "Party",
      freightQtl: "",
    }]);
  };

  const removeLine = (id: string) => setOrderLines(prev => prev.filter(l => l.id !== id));
  const updateLine = (id: string, patch: Partial<OrderLine>) =>
    setOrderLines(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));

  const handleSave = () => {
    if (!selectedUnit) return showToast("error", "Please select a unit.");
    if (!selectedCategory) return showToast("error", "Please select a category.");
    if (orderLines.length === 0) return showToast("error", "Please add at least one order line.");
    if (orderLines.some(l => !l.party || !l.orderWgt)) return showToast("error", "Fill all required fields in order lines.");

    const lines = orderLines.map(l => ({
      ptyledcd: l.party!.ledcd,
      brkrledcd: l.broker?.ledcd ?? "",
      qty: parseFloat(l.orderWgt) || 0,
      frgttyp: l.freightType,
      frgt: parseFloat(l.freightQtl) || 0,
      rate: parseFloat(l.orderRate) || 0,
    }));

    if (isEdit) {
      updateMutation.mutate({
        pobkncd: editingPobkncd!,
        pocatcomcd: selectedCategory.pocatcomcd,
        dlydt: deliveryDate,
        valdt: validDate,
        supat: selectedCategory.cattyp ?? "Factory",
        remark,
        orderLines: lines,
      });
    } else {
      saveMutation.mutate({
        untcd: selectedUnit.untcd,
        pocatcomcd: selectedCategory.pocatcomcd,
        pobkndt: today,
        dlydt: deliveryDate,
        valdt: validDate,
        supat: selectedCategory.cattyp ?? "Factory",
        usrnm: user?.username ?? "system",
        remark,
        cmpcd: user?.cmpCode ?? "",
        finYear: user?.finYear ?? "",
        orderLines: lines,
      });
    }
  };

  const handleEdit = (pobkncd: string) => {
    setEditingPobkncd(pobkncd);
    setShowForm(true);
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#ECEAE4] p-4 font-sans">
      {/* Toast */}
      <AnimatePresence>{toast && <Toast type={toast.type} msg={toast.msg} />}</AnimatePresence>

      <div className="flex gap-3 max-w-[1400px] mx-auto">
        {/* ── Main Column ── */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">

          {/* Page header with hide/show toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[15px] font-semibold text-[#1a1a1a]">Purchase Order Booking</h1>
              <p className="text-[12px] text-[#999] mt-0.5">
                {isEdit ? `Editing: ${editingPobkncd}` : "Create a new purchase order booking"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isEdit && (
                <button onClick={resetForm}
                  className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-[#666] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-colors">
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 1l12 12M13 1L1 13" /></svg>
                  Cancel Edit
                </button>
              )}
              <button onClick={() => setShowForm(p => !p)}
                className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-[#555] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-colors">
                {showForm
                  ? <><svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 2v10M2 7h10" /></svg>Hide Form</>
                  : <><svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 2v10M2 7h10" /></svg>New Booking</>
                }
              </button>
            </div>
          </div>

          {/* ── Form (collapsible) ── */}
          <div ref={formTopRef} />
          <AnimatePresence initial={false}>
            {showForm && (
              <motion.div key="form"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden flex flex-col gap-3">

                {isEdit && isLoadingEdit ? (
                  <div className="bg-white rounded-2xl border border-[#E8E6E1] p-12 flex items-center justify-center gap-3">
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round">
                      <path d="M7 1a6 6 0 1 0 6 6" />
                    </svg>
                    <span className="text-[13px] text-[#aaa]">Loading booking data…</span>
                  </div>
                ) : (
                  <>
                    {/* General Information */}
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
                      className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden shadow-sm">
                      <SectionHeader title="General Information" />
                      <div className="p-5 flex flex-col gap-4">

                        {/* Unit — disabled on edit */}
                        <div className="grid grid-cols-2 gap-x-8">
                          <Field label="Unit Name">
                            <CustomCombobox
                              items={units as UnitItem[]}
                              value={selectedUnit}
                              onValueChange={v => setSelectedUnit(v)}
                              getLabel={u => u.untnm}
                              getKey={u => String(u.rowid)}
                              placeholder="Select unit…"
                              disabled={isEdit}
                              hasError={!selectedUnit}
                            />
                          </Field>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                          <Field label="Booking Date">
                            <ReadonlyInput value={isEdit && editData ? toDateInput(new Date(editData.header.pobkndt!)) : today} />
                          </Field>
                          <Field label="Delivery Date">
                            <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
                              className="w-full h-9 px-3 text-[13px] rounded-lg border border-[#E8E6E1] bg-white outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all" />
                          </Field>
                        </div>

                        {/* Category + Valid Date */}
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                          <Field label="Category">
                            <CustomCombobox
                              items={categories as any}
                              value={selectedCategory}
                              onValueChange={v => setSelectedCategory(v)}
                              getLabel={c => c.pocatcomnm}
                              getKey={c => c.pocatcomcd}
                              placeholder="Select category…"
                              hasError={!selectedCategory}
                            />
                          </Field>
                          <Field label="Valid Date">
                            <input type="date" value={validDate} onChange={e => setValidDate(e.target.value)}
                              className="w-full h-9 px-3 text-[13px] rounded-lg border border-[#E8E6E1] bg-white outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all" />
                          </Field>
                        </div>

                        {/* Supply At */}
                        <div className="grid grid-cols-2 gap-x-8">
                          <Field label="Supply At">
                            <ReadonlyInput value={selectedCategory?.cattyp ?? "—"} />
                          </Field>
                        </div>

                        <div className="border-t border-[#F0EEE9]" />

                        {/* Bargain stats */}
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                          <Field label="Bargain Rate">
                            <ReadonlyInput value={bargainInfo?.bargainRate ?? "—"} />
                          </Field>
                          <Field label="Total Bargain (Wgt)">
                            <ReadonlyInput value={bargainInfo?.totalBargainWgt ?? "—"} />
                          </Field>
                          <Field label="Booked Wgt">
                            <ReadonlyInput value={bargainInfo?.bookedWgt ?? "0"} />
                          </Field>
                          <Field label="Pending Wgt">
                            <ReadonlyInput
                              value={bargainInfo?.pendingWgt ?? "—"}
                              className={cn(bargainInfo && bargainInfo.pendingWgt <= 0 ? "text-red-500 font-medium" : "")}
                            />
                          </Field>
                        </div>
                      </div>
                    </motion.div>

                    {/* Order Description */}
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, delay: 0.04 }}
                      className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden shadow-sm">
                      <SectionHeader title="Order Description" />

                      {/* Toolbar */}
                      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#F0EEE9] bg-[#FAFAF8]">
                        <button type="button" onClick={appendLine}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10" /></svg>
                          Append
                        </button>
                        <button type="button" onClick={() => orderLines.length > 0 && removeLine(orderLines[orderLines.length - 1]!.id)}
                          disabled={orderLines.length === 0}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-40">
                          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 7h10" /></svg>
                          Remove
                        </button>
                      </div>

                      {/* Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-[12px]">
                          <thead>
                            <tr className="bg-[#F5F4F0] border-b border-[#E8E6E1]">
                              <th className="w-8 px-2 py-2.5 text-center text-[11px] text-[#aaa] font-medium">#</th>
                              <th className="px-2 py-2.5 text-left text-[11px] text-[#555] font-semibold min-w-[180px]">Party Name</th>
                              <th className="px-2 py-2.5 text-left text-[11px] text-[#555] font-semibold min-w-[160px]">Broker Name</th>
                              <th className="px-2 py-2.5 text-right text-[11px] text-[#555] font-semibold w-28">Order Wgt</th>
                              <th className="px-2 py-2.5 text-right text-[11px] text-[#555] font-semibold w-28">Order Rate</th>
                              <th className="px-2 py-2.5 text-center text-[11px] text-[#555] font-semibold w-28">Freight Type</th>
                              <th className="px-2 py-2.5 text-right text-[11px] text-[#555] font-semibold w-28">Freight/Qtl</th>
                              <th className="w-8" />
                            </tr>
                          </thead>
                          <tbody>
                            <AnimatePresence>
                              {orderLines.map((line, idx) => (
                                <motion.tr key={line.id}
                                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
                                  className="border-b border-[#F0EEE9] hover:bg-[#FAFAF8]">
                                  <td className="px-2 py-1.5 text-center text-[#bbb]">{idx + 1}</td>
                                  <td className="px-2 py-1.5">
                                    <CustomCombobox
                                      items={parties as LedgerItem[]}
                                      value={line.party}
                                      onValueChange={v => updateLine(line.id, { party: v })}
                                      getLabel={l => l.lednm ?? ""}
                                      getKey={l => l.ledcd}
                                      placeholder="Select party…"
                                      hasError={!line.party}
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <CustomCombobox
                                      items={brokers as LedgerItem[]}
                                      value={line.broker}
                                      onValueChange={v => updateLine(line.id, { broker: v })}
                                      getLabel={l => l.lednm ?? ""}
                                      getKey={l => l.ledcd}
                                      placeholder="Select broker…"
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input type="number" value={line.orderWgt}
                                      onChange={e => updateLine(line.id, { orderWgt: e.target.value })}
                                      className={cn("w-full h-9 px-2 text-[12px] text-right rounded-lg border bg-white outline-none transition-all",
                                        "focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]",
                                        !line.orderWgt ? "border-red-300 bg-red-50/40" : "border-[#E8E6E1]")}
                                      placeholder="0" />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input readOnly value={line.orderRate}
                                      className="w-full h-9 px-2 text-[12px] text-right rounded-lg border border-[#E8E6E1] bg-[#F9F8F6] outline-none" />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input readOnly value={line.freightType}
                                      className="w-full h-9 px-2 text-[12px] text-center rounded-lg border border-[#E8E6E1] bg-[#F9F8F6] outline-none" />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input type="number" value={line.freightQtl}
                                      onChange={e => updateLine(line.id, { freightQtl: e.target.value })}
                                      className="w-full h-9 px-2 text-[12px] text-right rounded-lg border border-[#E8E6E1] bg-white outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all"
                                      placeholder="0" />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <button type="button" onClick={() => removeLine(line.id)}
                                      className="p-1.5 rounded-lg text-[#ddd] hover:text-red-400 hover:bg-red-50 transition-colors">
                                      <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12" /></svg>
                                    </button>
                                  </td>
                                </motion.tr>
                              ))}
                            </AnimatePresence>
                            {orderLines.length === 0 && (
                              <tr>
                                <td colSpan={8} className="py-10 text-center text-[12px] text-[#ccc]">
                                  Click <span className="font-semibold text-emerald-600">Append</span> to add order lines
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>

                    {/* Remark + Footer */}
                    <div className="bg-white rounded-2xl border border-[#E8E6E1] px-5 py-4 shadow-sm flex items-center gap-4">
                      <Field label="Remark" className="flex-1">
                        <input type="text" value={remark} onChange={e => setRemark(e.target.value)}
                          placeholder="Optional remark…"
                          className="w-full h-9 px-3 text-[13px] rounded-lg border border-[#E8E6E1] bg-white outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all" />
                      </Field>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={resetForm}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-medium border border-[#E8E6E1] text-[#555] hover:bg-[#F5F4F0] transition-colors">
                          {isEdit ? "Cancel" : "Clear"}
                        </button>
                        <button type="button" onClick={handleSave} disabled={isSaving}
                          className={cn("flex items-center gap-1.5 px-5 py-2 rounded-xl text-[12px] font-medium text-white transition-colors disabled:opacity-50",
                            isEdit ? "bg-blue-600 hover:bg-blue-700" : "bg-[#1a1a1a] hover:bg-[#333]")}>
                          {isSaving
                            ? <><svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>{isEdit ? "Updating…" : "Saving…"}</>
                            : <><svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 7l3.5 3.5L12 3" /></svg>{isEdit ? "Update Booking" : "Save Booking"}</>
                          }
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Data Table ── */}
          <div className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden shadow-sm">
            {/* Table header */}
            <div className="px-5 py-3.5 border-b border-[#E8E6E1] flex items-center justify-between">
              <span className="text-[13px] font-medium text-[#1a1a1a]">
                All Bookings
                <span className="ml-2 text-[11px] font-normal text-[#aaa]">{totalCount} total</span>
              </span>
              <input type="text" placeholder="Search bookings…" value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="h-7 px-3 text-[12px] border border-[#E8E6E1] rounded-lg bg-[#FAFAF9] placeholder:text-[#ccc] focus:outline-none focus:border-[#ccc] w-44 transition-all" />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-[#F5F4F0] border-b border-[#E8E6E1]">
                    {["Booking Code", "Unit", "Category", "Booking Date", "Delivery Date", "Valid Date", "Supply At", "Booked By", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {listItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-[12px] text-[#ccc]">
                        {searchQuery ? "No bookings match your search" : "No bookings yet — create one above"}
                      </td>
                    </tr>
                  ) : (
                    listItems.map((item, i) => {
                      const isRowEditing = editingPobkncd === item.pobkncd;
                      return (
                        <motion.tr key={item.rowid}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                          className={cn("border-b border-[#F5F4F0] last:border-0 transition-colors",
                            isRowEditing ? "bg-blue-50/60" : "hover:bg-[#FAFAF9]")}>
                          <td className="px-4 py-3 font-mono text-[11px] text-[#4a90d9] font-medium">{item.pobkncd ?? "—"}</td>
                          <td className="px-4 py-3 text-[#555]">{item.untnm ?? "—"}</td>
                          <td className="px-4 py-3 text-[#555] max-w-[160px] truncate">{item.pocatcomnm ?? "—"}</td>
                          <td className="px-4 py-3 text-[#888]">{fmtDate(item.pobkndt)}</td>
                          <td className="px-4 py-3 text-[#888]">{fmtDate(item.dlydt)}</td>
                          <td className="px-4 py-3 text-[#888]">{fmtDate(item.valdt)}</td>
                          <td className="px-4 py-3 text-[#888]">{item.supat ?? "—"}</td>
                          <td className="px-4 py-3 text-[#aaa]">{item.usrnm ?? "—"}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleEdit(item.pobkncd!)}
                              className={cn("w-7 h-7 rounded-md flex items-center justify-center transition-all border",
                                isRowEditing
                                  ? "bg-blue-100 border-blue-200 text-blue-600"
                                  : "bg-white border-[#E8E6E1] text-[#aaa] hover:border-[#C8C5BE] hover:text-[#555] hover:bg-[#F5F4F0]")}>
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

            {/* Pagination */}
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
                      acc.push(p);
                      return acc;
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

        {/* ── PO Category Conditions Sidebar ── */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22 }}
          className="w-56 shrink-0">
          <div className="bg-white rounded-2xl border border-[#E8E6E1] overflow-hidden shadow-sm sticky top-4">
            <SectionHeader title="PO Conditions" />
            {selectedCategory ? (
              categoryConditions.length > 0 ? (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-[#F0EEE9]">
                      <th className="w-6 px-2 py-2 text-center text-[10px] text-[#bbb] font-medium">#</th>
                      <th className="px-2 py-2 text-left text-[10px] text-[#666] font-semibold">Description</th>
                      <th className="px-2 py-2 text-right text-[10px] text-[#666] font-semibold">Val</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryConditions.map((cond, idx) => (
                      <tr key={cond.rowid} className="border-b border-[#F9F8F6] last:border-0 hover:bg-[#FAFAF8]">
                        <td className="px-2 py-1.5 text-center text-[10px] text-[#ccc]">{idx + 1}</td>
                        <td className="px-2 py-1.5 text-[11px] text-[#444]">{cond.cndprmnm}</td>
                        <td className="px-2 py-1.5 text-right text-[11px] font-semibold text-[#1a1a1a]">{cond.cmnprmval}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-[11px] text-[#ccc]">No conditions found</div>
              )
            ) : (
              <div className="py-10 px-3 text-center text-[11px] text-[#ccc] leading-relaxed">
                Select a category<br />to view conditions
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}