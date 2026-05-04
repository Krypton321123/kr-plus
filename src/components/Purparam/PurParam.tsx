"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { trpc } from "@/app/_trpc/client";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const CNDPRMTYP_OPTIONS = [
  "FIXED",
  "INPUT FROM LAB",
  "INPUT FROM STORE",
] as const;
const VALTYP_OPTIONS = ["%", "On Wgt Unit", "NONE"] as const;
const CLCON_OPTIONS = [
  "Bill Amount",
  "Paid Amount",
  "Bill Weight",
  "Bill Quantity",
  "M1 Quantity",
  "M2 Quantity",
  "M3 Quantity",
  "M4 Quantity",
] as const;

type CndprmTyp = (typeof CNDPRMTYP_OPTIONS)[number];
type ValtypOpt = (typeof VALTYP_OPTIONS)[number];
type ClconOpt = (typeof CLCON_OPTIONS)[number];
type PrcusdOpt = "YES" | "NO";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingRow {
  _key: string;
  cndprmnm: string;
  cndprmtyp: CndprmTyp | "";
  inpprmnm: string;
  valtyp: ValtypOpt | "";
  clcon: ClconOpt | "";
  prcusd: PrcusdOpt | "";
}

interface SavedRow {
  rowid: number;
  prmcd: string;
  cndprmnm: string;
  cndprmtyp: string;
  inpprmnm: string;
  valtyp: string;
  clcon: string;
  prcusd: string;
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const inputCls = cn(
  "w-full h-8 px-2.5 text-[12px] bg-white border border-[#E8E6E1] rounded-lg text-[#1a1a1a] placeholder:text-[#ccc]",
  "focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all duration-150 hover:border-[#ccc]",
);

const selectCls = (hasError?: boolean) =>
  cn(
    "w-full h-8 px-2.5 text-[12px] bg-white border rounded-lg text-[#1a1a1a]",
    "focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all duration-150",
    "appearance-none cursor-pointer",
    hasError
      ? "border-red-300 bg-red-50/40"
      : "border-[#E8E6E1] hover:border-[#ccc]",
  );

// ─── Custom Combobox ──────────────────────────────────────────────────────────

interface CustomComboboxProps<T> {
  items: T[];
  value: T | null;
  onValueChange: (val: T | null) => void;
  /** Extract the display label from an item */
  getLabel: (item: T) => string;
  /** Extract a unique key from an item */
  getKey: (item: T) => string;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
}


import { useCallback } from "react";
import { createPortal } from "react-dom";

function CustomCombobox<T>({
  items,
  value,
  onValueChange,
  getLabel,
  getKey,
  placeholder = "Select…",
  disabled = false,
  hasError = false,
}: CustomComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Recompute dropdown position to match the input trigger
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  // Keep position in sync while open
  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  // Close on outside click — must check both the trigger and the portalled list
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !listRef.current?.contains(target)
      ) {
        setOpen(false);
        setQuery("");
        setHighlightedIndex(0);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? items.filter((item) =>
        getLabel(item).toLowerCase().includes(query.toLowerCase()),
      )
    : items;

  // Reset highlight whenever the list or open state changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, open]);

  // Scroll highlighted item into view inside the portalled list
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-index="${highlightedIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  const displayValue = value ? getLabel(value) : "";

  const handleSelect = (item: T) => {
    onValueChange(item);
    setOpen(false);
    setQuery("");
    setHighlightedIndex(0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (!open) setOpen(true);
    if (e.target.value === "") onValueChange(null);
  };

  const handleFocus = () => {
    setOpen(true);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlightedIndex])
          handleSelect(filtered[highlightedIndex]);
        break;
      case "Escape":
        setOpen(false);
        setQuery("");
        setHighlightedIndex(0);
        break;
    }
  };

  // The dropdown is portalled into document.body so no parent
  // overflow:hidden / overflow:clip can clip it
  const dropdown = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={listRef}
          style={dropdownStyle}
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.12 }}
          className="bg-white border border-[#E8E6E1] rounded-xl shadow-lg overflow-hidden"
        >
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-[12px] text-[#ccc] text-center">
                No results found
              </div>
            ) : (
              filtered.map((item, idx) => {
                const isSelected = value
                  ? getKey(value) === getKey(item)
                  : false;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <button
                    key={getKey(item)}
                    data-index={idx}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(item);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-[12px] transition-colors duration-75 flex items-center gap-2",
                      isSelected
                        ? "bg-[#1a1a1a] text-white"
                        : isHighlighted
                          ? "bg-[#F5F4F0] text-[#1a1a1a]"
                          : "text-[#1a1a1a]",
                    )}
                  >
                    <span className="w-3 shrink-0">
                      {isSelected && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 14 14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M2 7l3.5 3.5L12 3" />
                        </svg>
                      )}
                    </span>
                    {getLabel(item)}
                  </button>
                );
              })
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          placeholder={placeholder}
          value={open ? query : displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full h-9 px-3 pr-8 text-[13px] rounded-lg border bg-white text-[#1a1a1a] placeholder:text-[#ccc]",
            "transition-all duration-150 outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            hasError
              ? "border-red-300 bg-red-50/40"
              : "border-[#E8E6E1] hover:border-[#ccc]",
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            setOpen((o) => !o);
            if (!open) inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#ccc] hover:text-[#999] transition-colors disabled:pointer-events-none"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className={cn(
              "transition-transform duration-150",
              open && "rotate-180",
            )}
          >
            <path d="M2 5l5 5 5-5" />
          </svg>
        </button>
      </div>

      {/* Portal: renders outside all ancestor DOM nodes, escaping overflow:hidden */}
      {typeof window !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
}
// ─── Other helpers ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-5 py-3 border-b border-[#E8E6E1] bg-[#FAFAF9]">
      <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#888]">
        {title}
      </span>
    </div>
  );
}

function InlineSelect({
  value,
  onChange,
  options,
  placeholder,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder: string;
  hasError?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectCls(hasError)}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#ccc]"
        width="10"
        height="10"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="M2 5l5 5 5-5" />
      </svg>
    </div>
  );
}

function YesNoToggle({
  value,
  onChange,
  hasError,
}: {
  value: PrcusdOpt | "";
  onChange: (v: PrcusdOpt) => void;
  hasError?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex rounded-lg border overflow-hidden text-[11px] font-medium",
        hasError ? "border-red-300" : "border-[#E8E6E1]",
      )}
    >
      {(["YES", "NO"] as PrcusdOpt[]).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "flex-1 h-8 transition-all duration-150",
            value === opt
              ? opt === "YES"
                ? "bg-green-600 text-white"
                : "bg-red-500 text-white"
              : "bg-white text-[#999] hover:bg-[#F5F4F0]",
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PurParamPanelContent() {
  const today = new Date().toISOString().slice(0, 10);

  const [selectedUntcd, setSelectedUntcd] = useState<{
    untcd: string;
    untnm: string;
  } | null>(null);
  const [selectedItmcomcd, setSelectedItmcomcd] = useState<{
    itmcomcd: string;
    itmcomnm: string;
  } | null>(null);
  const [fromdt, setFromdt] = useState(today);
  const [toDt, setToDt] = useState(today);
  const [currentPrmcd, setCurrentPrmcd] = useState<string | undefined>(
    undefined,
  );

  const [removedRowids, setRemovedRowids] = useState<Set<number>>(new Set());
  const [pendingRows, setPendingRows] = useState<PendingRow[]>([]);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: units = [] } = trpc.purParam.getUnits.useQuery();
  const { data: commodities = [] } = trpc.purParam.getCommodities.useQuery();

  const { data: latestHeader, isFetching: headerFetching } =
    trpc.purParam.getLatestHeader.useQuery(
      {
        untcd: selectedUntcd?.untcd ?? "",
        itmcomcd: selectedItmcomcd?.itmcomcd ?? "",
      },
      { enabled: !!selectedUntcd && !!selectedItmcomcd, staleTime: 0 },
    );

  const {
    data: savedRows = [],
    refetch: refetchDetails,
    isFetching: detailsFetching,
  } = trpc.purParam.getDetails.useQuery(
    { prmcd: currentPrmcd! },
    { enabled: !!currentPrmcd, staleTime: 0 },
  );

  useEffect(() => {
    if (latestHeader) {
      setFromdt(latestHeader.fromdt.toString().slice(0, 10));
      setToDt(latestHeader.toDt.toString().slice(0, 10));
      setCurrentPrmcd(latestHeader.prmcd);
    } else if (selectedUntcd && selectedItmcomcd && !headerFetching) {
      setFromdt(today);
      setToDt(today);
      setCurrentPrmcd(undefined);
    }
    setRemovedRowids(new Set());
    setPendingRows([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestHeader, headerFetching]);

  // ── Mutation ──────────────────────────────────────────────────────────────

  const saveMutation = trpc.purParam.save.useMutation({
    onSuccess: (data) => {
      showToast("success", "Purchase parameters saved successfully");
      setCurrentPrmcd(data.prmcd);
      setRemovedRowids(new Set());
      setPendingRows([]);
      refetchDetails();
    },
    onError: (err) => showToast("error", err.message),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleDepotChange = (val: { untcd: string; untnm: string } | null) => {
    setSelectedUntcd(val);
    setSelectedItmcomcd(null);
    setCurrentPrmcd(undefined);
    setRemovedRowids(new Set());
    setPendingRows([]);
    setFromdt(today);
    setToDt(today);
  };

  const handleCommodityChange = (
    val: { itmcomcd: string; itmcomnm: string } | null,
  ) => {
    setSelectedItmcomcd(val);
    setCurrentPrmcd(undefined);
    setRemovedRowids(new Set());
    setPendingRows([]);
    setFromdt(today);
    setToDt(today);
  };

  // ── Derived rows ──────────────────────────────────────────────────────────

  const visibleSavedRows: SavedRow[] = (savedRows as SavedRow[]).filter(
    (r) => !removedRowids.has(r.rowid),
  );
  const totalRowCount = visibleSavedRows.length + pendingRows.length;

  // ── Row helpers ───────────────────────────────────────────────────────────

  const appendRow = () => {
    setPendingRows((prev) => [
      ...prev,
      {
        _key: `new_${Date.now()}`,
        cndprmnm: "",
        cndprmtyp: "",
        inpprmnm: "",
        valtyp: "",
        clcon: "",
        prcusd: "",
      },
    ]);
  };

  const removeLastRow = () => {
    if (pendingRows.length > 0) {
      setPendingRows((prev) => prev.slice(0, -1));
    } else if (visibleSavedRows.length > 0) {
      const last = visibleSavedRows[visibleSavedRows.length - 1];
      setRemovedRowids((prev) => new Set([...prev, last.rowid]));
    }
  };

  const removeSavedRow = (rowid: number) => {
    setRemovedRowids((prev) => new Set([...prev, rowid]));
  };

  const removePendingRow = (_key: string) => {
    setPendingRows((prev) => prev.filter((r) => r._key !== _key));
  };

  const updatePending = (
    _key: string,
    field: keyof Omit<PendingRow, "_key">,
    value: string,
  ) => {
    setPendingRows((prev) =>
      prev.map((r) => (r._key === _key ? { ...r, [field]: value } : r)),
    );
  };

  // ── Save / Reject ─────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!selectedUntcd) {
      showToast("error", "Please select a depot first");
      return;
    }
    if (!selectedItmcomcd) {
      showToast("error", "Please select a commodity first");
      return;
    }
    if (!fromdt || !toDt) {
      showToast("error", "Please fill in the date range");
      return;
    }
    if (new Date(toDt) < new Date(fromdt)) {
      showToast("error", "To date must be on or after From date");
      return;
    }

    const invalidPending = pendingRows.some(
      (r) => !r.cndprmnm || !r.cndprmtyp || !r.valtyp || !r.clcon || !r.prcusd,
    );
    if (invalidPending) {
      showToast("error", "All new rows must have required fields filled");
      return;
    }

    const allRows = [
      ...visibleSavedRows.map((r) => ({
        cndprmnm: r.cndprmnm,
        cndprmtyp: r.cndprmtyp as CndprmTyp,
        inpprmnm: r.inpprmnm,
        valtyp: r.valtyp as ValtypOpt,
        clcon: r.clcon as ClconOpt,
        prcusd: r.prcusd as PrcusdOpt,
      })),
      ...pendingRows.map((r) => ({
        cndprmnm: r.cndprmnm,
        cndprmtyp: r.cndprmtyp as CndprmTyp,
        inpprmnm: r.inpprmnm,
        valtyp: r.valtyp as ValtypOpt,
        clcon: r.clcon as ClconOpt,
        prcusd: r.prcusd as PrcusdOpt,
      })),
    ];

    saveMutation.mutate({
      untcd: selectedUntcd.untcd,
      itmcomcd: selectedItmcomcd.itmcomcd,
      fromdt,
      toDt,
      prmcd: currentPrmcd,
      rows: allRows,
    });
  };

  const handleReject = () => {
    setRemovedRowids(new Set());
    setPendingRows([]);
    showToast("success", "Changes discarded");
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const isSaving = saveMutation.isPending;
  const isLoading = headerFetching || detailsFetching;
  const bothSelected = !!selectedUntcd && !!selectedItmcomcd;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "fixed top-15 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium shadow-sm border",
              toast.type === "success"
                ? "bg-white border-green-200 text-green-700"
                : "bg-white border-red-200 text-red-600",
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                toast.type === "success" ? "bg-green-500" : "bg-red-500",
              )}
            />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page header */}
      <div>
        <h2 className="text-[16px] font-medium text-[#1a1a1a]">
          Purchase Parameter Master
        </h2>
        <p className="text-[12px] text-[#999] mt-0.5">
          Define purchase parameters for each depot and commodity combination
        </p>
      </div>

      {/* ── TOP CARD ──────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <SectionHeader title="Purchase Parameter Master" />
        <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4 max-w-3xl">
          {/* Depot */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#999]">
              Depot <span className="text-red-400">*</span>
            </label>
            <CustomCombobox
              items={units}
              value={selectedUntcd}
              onValueChange={handleDepotChange}
              getLabel={(u) => u.untnm}
              getKey={(u) => u.untcd}
              placeholder="Select depot…"
            />
          </div>

          {/* Commodity */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#999]">
              Commodity <span className="text-red-400">*</span>
            </label>
            <CustomCombobox
              items={commodities}
              value={selectedItmcomcd}
              onValueChange={handleCommodityChange}
              getLabel={(c) => c.itmcomnm}
              getKey={(c) => c.itmcomcd}
              placeholder="Select commodity…"
              disabled={!selectedUntcd}
            />
          </div>

          {/* From Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#999]">
              From Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              className={inputCls}
              value={fromdt}
              onChange={(e) => setFromdt(e.target.value)}
              disabled={!bothSelected}
            />
          </div>

          {/* To Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#999]">
              To Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              className={inputCls}
              value={toDt}
              onChange={(e) => setToDt(e.target.value)}
              disabled={!bothSelected}
            />
          </div>

          {/* Existing prmcd badge */}
          {currentPrmcd && (
            <div className="col-span-2 flex items-center gap-2">
              <span className="text-[11px] text-[#aaa]">Parameter Code:</span>
              <span className="text-[11px] font-mono bg-[#F5F4F0] px-2 py-0.5 rounded text-[#555]">
                {currentPrmcd}
              </span>
              <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                Editing existing record
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── DETAIL TABLE ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#888]">
            Parameter Details
            {bothSelected && (
              <span className="ml-2 normal-case text-[#aaa] font-normal tracking-normal">
                — {selectedUntcd.untnm} / {selectedItmcomcd.itmcomnm}
              </span>
            )}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={appendRow}
              disabled={!bothSelected}
              className="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium rounded-lg border transition-all duration-150 text-green-700 border-green-200 bg-green-50 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M7 1v12M1 7h12" />
              </svg>
              Append
            </button>

            <button
              onClick={removeLastRow}
              disabled={!bothSelected || totalRowCount === 0}
              className="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium rounded-lg border transition-all duration-150 text-red-600 border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M1 7h12" />
              </svg>
              Remove
            </button>

            <div className="w-px h-4 bg-[#E8E6E1] mx-1" />

            <button
              onClick={handleSave}
              disabled={!bothSelected || isSaving}
              className="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium rounded-lg border transition-all duration-150 text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <svg
                  className="animate-spin"
                  width="10"
                  height="10"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M7 1a6 6 0 1 0 6 6" />
                </svg>
              ) : (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M2 7l3.5 3.5L12 3" />
                </svg>
              )}
              Accept
            </button>

            <button
              onClick={handleReject}
              disabled={!bothSelected || isSaving}
              className="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium rounded-lg border transition-all duration-150 text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M10 4L4 10M4 4l6 6" />
              </svg>
              Reject
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-14">
              <svg
                className="animate-spin"
                width="16"
                height="16"
                viewBox="0 0 14 14"
                fill="none"
                stroke="#aaa"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M7 1a6 6 0 1 0 6 6" />
              </svg>
              <span className="text-[13px] text-[#aaa]">Loading…</span>
            </div>
          ) : (
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] w-8">
                    #
                  </th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] min-w-[130px]">
                    Condition Param
                  </th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] min-w-[160px]">
                    Param Type
                  </th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] min-w-[120px]">
                    Input Param
                  </th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] min-w-[120px]">
                    Value Type
                  </th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] min-w-[140px]">
                    Calc On
                  </th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] w-20">
                    Price Used
                  </th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {!bothSelected ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-[12px] text-[#ccc]"
                    >
                      Select a depot and commodity above to view or manage
                      parameters
                    </td>
                  </tr>
                ) : totalRowCount === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-[12px] text-[#ccc]"
                    >
                      No parameters defined — click{" "}
                      <span className="font-medium text-[#aaa]">Append</span> to
                      add one
                    </td>
                  </tr>
                ) : (
                  <>
                    <AnimatePresence initial={false}>
                      {visibleSavedRows.map((row, idx) => (
                        <motion.tr
                          key={`saved_${row.rowid}`}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                          transition={{ duration: 0.15 }}
                          className="border-b border-[#F5F4F0] hover:bg-[#FAFAF9] group"
                        >
                          <td className="px-4 py-2.5 text-[#ccc] text-[11px] font-mono">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2.5 text-[12px] text-[#1a1a1a]">
                            {row.cndprmnm}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#F5F4F0] text-[#555]">
                              {row.cndprmtyp}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[12px] text-[#666]">
                            {row.inpprmnm || "—"}
                          </td>
                          <td className="px-3 py-2.5 text-[12px] text-[#666]">
                            {row.valtyp}
                          </td>
                          <td className="px-3 py-2.5 text-[12px] text-[#666]">
                            {row.clcon}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium",
                                row.prcusd === "YES"
                                  ? "bg-green-50 text-green-700 border border-green-200"
                                  : "bg-red-50 text-red-600 border border-red-200",
                              )}
                            >
                              {row.prcusd}
                            </span>
                          </td>
                          <td className="px-3 py-2 w-10">
                            <button
                              onClick={() => removeSavedRow(row.rowid)}
                              className="w-6 h-6 flex items-center justify-center rounded-md border border-[#E8E6E1] text-[#ccc] hover:border-red-200 hover:text-red-400 hover:bg-red-50 transition-all duration-150 opacity-0 group-hover:opacity-100"
                            >
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 14 14"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              >
                                <path d="M1 1l12 12M13 1L1 13" />
                              </svg>
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>

                    <AnimatePresence initial={false}>
                      {pendingRows.map((row, idx) => (
                        <motion.tr
                          key={row._key}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                          transition={{ duration: 0.15 }}
                          className="border-b border-[#F5F4F0] last:border-0 bg-blue-50/30 group"
                        >
                          <td className="px-4 py-2 text-[#ccc] text-[11px] font-mono">
                            {visibleSavedRows.length + idx + 1}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={row.cndprmnm}
                              onChange={(e) =>
                                updatePending(
                                  row._key,
                                  "cndprmnm",
                                  e.target.value,
                                )
                              }
                              placeholder="Condition param…"
                              className={cn(
                                inputCls,
                                !row.cndprmnm && "border-red-300 bg-red-50/40",
                              )}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <InlineSelect
                              value={row.cndprmtyp}
                              onChange={(v) =>
                                updatePending(row._key, "cndprmtyp", v)
                              }
                              options={CNDPRMTYP_OPTIONS}
                              placeholder="Select type…"
                              hasError={!row.cndprmtyp}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={row.inpprmnm}
                              onChange={(e) =>
                                updatePending(
                                  row._key,
                                  "inpprmnm",
                                  e.target.value,
                                )
                              }
                              placeholder="Input param…"
                              className={inputCls}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <InlineSelect
                              value={row.valtyp}
                              onChange={(v) =>
                                updatePending(row._key, "valtyp", v)
                              }
                              options={VALTYP_OPTIONS}
                              placeholder="Value type…"
                              hasError={!row.valtyp}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <InlineSelect
                              value={row.clcon}
                              onChange={(v) =>
                                updatePending(row._key, "clcon", v)
                              }
                              options={CLCON_OPTIONS}
                              placeholder="Calc on…"
                              hasError={!row.clcon}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <YesNoToggle
                              value={row.prcusd}
                              onChange={(v) =>
                                updatePending(row._key, "prcusd", v)
                              }
                              hasError={!row.prcusd}
                            />
                          </td>
                          <td className="px-3 py-2 w-10">
                            <button
                              onClick={() => removePendingRow(row._key)}
                              className="w-6 h-6 flex items-center justify-center rounded-md border border-[#E8E6E1] text-[#ccc] hover:border-red-200 hover:text-red-400 hover:bg-red-50 transition-all duration-150 opacity-0 group-hover:opacity-100"
                            >
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 14 14"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              >
                                <path d="M1 1l12 12M13 1L1 13" />
                              </svg>
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
              {totalRowCount} parameter{totalRowCount !== 1 ? "s" : ""} defined
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReject}
                disabled={isSaving}
                className="h-8 px-4 text-[12px] font-medium text-[#666] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-all duration-150 disabled:opacity-50"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 px-4 text-[12px] font-medium text-white rounded-lg disabled:opacity-50 transition-all duration-150 flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#333]"
              >
                {isSaving ? (
                  <>
                    <svg
                      className="animate-spin"
                      width="11"
                      height="11"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M7 1a6 6 0 1 0 6 6" />
                    </svg>
                    Saving…
                  </>
                ) : (
                  <>
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M2 7l3.5 3.5L12 3" />
                    </svg>
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
