"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { trpc } from "@/app/_trpc/client";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const MODE_OPTIONS = ["Reverse Entry", "Sale"] as const;
type ModeOption = (typeof MODE_OPTIONS)[number];

// ─── Types ────────────────────────────────────────────────────────────────────

interface UnitItem {
  rowid: number;
  untcd: string;
  untnm: string;
  untshnm: string | null;
}

interface LedgerItem {
  rowid: number;
  ledcd: string;
  lednm: string | null;
}

interface PendingRow {
  _key: string;
  ledger: LedgerItem | null;
  lednarr: string;
  amtdr: string;
  amtcr: string;
}

interface SavedJV {
  rowid: number;
  untcd: string;
  jvcd: string;
  jvdt: Date;
  mode: string;
}

interface JVDetail {
  rowid: number;
  jvcd: string;
  ledcd: string;
  lednm: string | null; // resolved from mstlednfo
  lednarr: string;
  amtdr: number;
  amtcr: number;
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const inputCls = cn(
  "w-full h-8 px-2.5 text-[12px] bg-white border border-[#E8E6E1] rounded-lg text-[#1a1a1a] placeholder:text-[#ccc]",
  "focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all duration-150 hover:border-[#ccc]",
);

const readonlyCls = cn(
  "w-full h-8 px-2.5 text-[12px] bg-[#F5F4F0] border border-[#E8E6E1] rounded-lg text-[#888]",
  "cursor-default select-all",
);

// ─── Custom Combobox (project-standard) ───────────────────────────────────────

interface CustomComboboxProps<T> {
  items: T[];
  value: T | null;
  onValueChange: (val: T | null) => void;
  getLabel: (item: T) => string;
  getKey: (item: T) => string;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  size?: "sm" | "md";
}

function CustomCombobox<T>({
  items,
  value,
  onValueChange,
  getLabel,
  getKey,
  placeholder = "Select…",
  disabled = false,
  hasError = false,
  size = "md",
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
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

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

  useEffect(() => { setHighlightedIndex(0); }, [query, open]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") { setOpen(true); e.preventDefault(); }
      return;
    }
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1)); break;
      case "ArrowUp":   e.preventDefault(); setHighlightedIndex((i) => Math.max(i - 1, 0)); break;
      case "Enter":     e.preventDefault(); if (filtered[highlightedIndex]) handleSelect(filtered[highlightedIndex]); break;
      case "Escape":    setOpen(false); setQuery(""); setHighlightedIndex(0); break;
    }
  };

  const heightCls = size === "sm" ? "h-8" : "h-9";
  const textCls   = size === "sm" ? "text-[12px]" : "text-[13px]";

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
              <div className="px-3 py-3 text-[12px] text-[#ccc] text-center">No results found</div>
            ) : (
              filtered.map((item, idx) => {
                const isSelected  = value ? getKey(value) === getKey(item) : false;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <button
                    key={getKey(item)}
                    data-index={idx}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-[12px] transition-colors duration-75 flex items-center gap-2",
                      isSelected   ? "bg-[#1a1a1a] text-white"
                      : isHighlighted ? "bg-[#F5F4F0] text-[#1a1a1a]"
                      : "text-[#1a1a1a]",
                    )}
                  >
                    <span className="w-3 shrink-0">
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
          onFocus={() => { setOpen(true); setQuery(""); }}
          onKeyDown={handleKeyDown}
          className={cn(
            `w-full ${heightCls} px-3 pr-8 ${textCls} rounded-lg border bg-white text-[#1a1a1a] placeholder:text-[#ccc]`,
            "transition-all duration-150 outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            hasError ? "border-red-300 bg-red-50/40" : "border-[#E8E6E1] hover:border-[#ccc]",
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => { if (disabled) return; setOpen((o) => !o); if (!open) inputRef.current?.focus(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#ccc] hover:text-[#999] transition-colors disabled:pointer-events-none"
        >
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

// ─── Ledger Combobox (server-search, debounced) ───────────────────────────────

interface LedgerComboboxProps {
  value: LedgerItem | null;
  onValueChange: (val: LedgerItem | null) => void;
  hasError?: boolean;
}

function LedgerCombobox({ value, onValueChange, hasError = false }: LedgerComboboxProps) {
  const [open, setOpen]                   = useState(false);
  const [inputText, setInputText]         = useState("");
  const [debouncedQ, setDebouncedQ]       = useState("");
  const [highlightedIndex, setHighlighted] = useState(0);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const listRef      = useRef<HTMLDivElement>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInput = (v: string) => {
    setInputText(v);
    if (!open) setOpen(true);
    if (v === "") onValueChange(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQ(v), 300);
  };

  const { data: results = [], isFetching } = trpc.jv.searchLedgers.useQuery(
    { query: debouncedQ },
    { staleTime: 30_000 },
  );

  const items: LedgerItem[] = useMemo(() => {
    if (!value) return results;
    const inList = results.some((r) => r.ledcd === value.ledcd);
    return inList ? results : [value, ...results];
  }, [results, value]);

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
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!containerRef.current?.contains(t) && !listRef.current?.contains(t)) {
        setOpen(false);
        setInputText("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setHighlighted(0); }, [debouncedQ, open]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.querySelector<HTMLElement>(`[data-index="${highlightedIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  const handleSelect = (item: LedgerItem) => {
    onValueChange(item);
    setOpen(false);
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") { setOpen(true); e.preventDefault(); }
      return;
    }
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); setHighlighted((i) => Math.min(i + 1, items.length - 1)); break;
      case "ArrowUp":   e.preventDefault(); setHighlighted((i) => Math.max(i - 1, 0)); break;
      case "Enter":     e.preventDefault(); if (items[highlightedIndex]) handleSelect(items[highlightedIndex]); break;
      case "Escape":    setOpen(false); setInputText(""); break;
    }
  };

  // Display: when open show the typed query; when closed show the ledger name (preferred) or code
  const displayValue = open ? inputText : (value ? (value.lednm ?? value.ledcd) : "");

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
          {isFetching && (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#F5F4F0]">
              <svg className="animate-spin shrink-0" width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round"><path d="M7 1a6 6 0 1 0 6 6" /></svg>
              <span className="text-[11px] text-[#bbb]">Searching…</span>
            </div>
          )}
          <div className="max-h-52 overflow-y-auto">
            {items.length === 0 && !isFetching ? (
              <div className="px-3 py-3 text-[12px] text-[#ccc] text-center">No results found</div>
            ) : (
              items.map((item, idx) => {
                const isSelected    = value?.ledcd === item.ledcd;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <button
                    key={item.ledcd}
                    data-index={idx}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
                    onMouseEnter={() => setHighlighted(idx)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-[12px] transition-colors duration-75 flex items-center gap-2",
                      isSelected ? "bg-[#1a1a1a] text-white" : isHighlighted ? "bg-[#F5F4F0] text-[#1a1a1a]" : "text-[#1a1a1a]",
                    )}
                  >
                    <span className="w-3 shrink-0">
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 7l3.5 3.5L12 3" /></svg>
                      )}
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span className="truncate">{item.lednm ?? item.ledcd}</span>
                      {item.lednm && <span className={cn("text-[10px]", isSelected ? "text-white/60" : "text-[#bbb]")}>{item.ledcd}</span>}
                    </span>
                  </button>
                );
              })
            )}
          </div>
          {!isFetching && items.length === 25 && (
            <div className="px-3 py-1.5 border-t border-[#F5F4F0] text-[10px] text-[#ccc] text-center">
              Showing top 25 — type to narrow
            </div>
          )}
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
          placeholder="Search ledger…"
          value={displayValue}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => { setOpen(true); setInputText(""); }}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full h-8 px-3 pr-8 text-[12px] rounded-lg border bg-white text-[#1a1a1a] placeholder:text-[#ccc]",
            "transition-all duration-150 outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]",
            hasError ? "border-red-300 bg-red-50/40" : "border-[#E8E6E1] hover:border-[#ccc]",
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => { setOpen((o) => !o); if (!open) inputRef.current?.focus(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#ccc] hover:text-[#999] transition-colors"
        >
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

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="px-5 py-3 border-b border-[#E8E6E1] bg-[#FAFAF9]">
      <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#888]">
        {title}
      </span>
      {sub && (
        <span className="ml-2 normal-case text-[#aaa] font-normal tracking-normal text-[11px]">
          — {sub}
        </span>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtAmt(n: number) {
  if (!n) return "—";
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(n);
}

function onlyNums(v: string) {
  return v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function JournalVoucherContent() {
  // ── LocalStorage context ───────────────────────────────────────────────────
  const finYearRowid = useMemo(() => {
    if (typeof window === "undefined") return null;
    const v = localStorage.getItem("finYearRowid");
    return v ? parseInt(v, 10) : null;
  }, []);

  const cmpCode = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("cmpCode") ?? "";
  }, []);

  // ── State ──────────────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);

  const [selectedUnit, setSelectedUnit] = useState<UnitItem | null>(null);
  const [voucherNo, setVoucherNo]       = useState("New");
  const [voucherPrefix, setVoucherPrefix] = useState("");
  const [jvdt, setJvdt]                 = useState(today);
  const [mode, setMode]                 = useState<ModeOption>("Reverse Entry");

  const [pendingRows, setPendingRows] = useState<PendingRow[]>([]);

  const [editingJvcd, setEditingJvcd]   = useState<string | null>(null);
  const [expandedJvcd, setExpandedJvcd] = useState<string | null>(null);

  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: units    = [] } = trpc.jv.getUnits.useQuery();
  const { data: allJvs   = [], refetch: refetchAll } = trpc.jv.getAll.useQuery();

  const { data: finYear } = trpc.jv.getFinYear.useQuery(
    { rowid: finYearRowid! },
    { enabled: !!finYearRowid },
  );

  const { data: cmpVchChar = "A" } = trpc.jv.getCompanyVchChar.useQuery(
    { cmpcd: cmpCode },
    { enabled: !!cmpCode },
  );

  const finYearSuffix = useMemo(() => {
    if (!finYear?.finyear) return "";
    const parts = finYear.finyear.split(/[-–\s]+/).filter(Boolean);
    const endYear = parts[parts.length - 1];
    return endYear ? endYear.slice(-2) : "";
  }, [finYear]);

  const fyStart = finYear?.startdate
    ? new Date(finYear.startdate).toISOString().slice(0, 10)
    : `${new Date().getFullYear()}-04-01`;
  const fyEnd = finYear?.enddate
    ? new Date(finYear.enddate).toISOString().slice(0, 10)
    : `${new Date().getFullYear() + 1}-03-31`;

  // ── Build prefix ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedUnit || !finYearSuffix) {
      setVoucherNo("New");
      setVoucherPrefix("");
      return;
    }
    const shnm = (selectedUnit.untshnm ?? selectedUnit.untcd).toUpperCase();
    const prefix = `${shnm}JVR${finYearSuffix}${cmpVchChar}`;
    setVoucherPrefix(prefix);
  }, [selectedUnit, finYearSuffix, cmpVchChar]);

  // ── Next voucher code ──────────────────────────────────────────────────────
  const { data: nextCode, isFetching: nextCodeFetching } =
    trpc.jv.getNextVoucherNo.useQuery(
      { prefix: voucherPrefix },
      { enabled: !!voucherPrefix && !editingJvcd, staleTime: 0 },
    );

  useEffect(() => {
    if (nextCode && !editingJvcd) setVoucherNo(nextCode);
  }, [nextCode, editingJvcd]);

  // ── Expanded JV details — now returns lednm too (via updated router) ───────
  const { data: expandedDetails = [] } = trpc.jv.getDetails.useQuery(
    { jvcd: expandedJvcd! },
    { enabled: !!expandedJvcd, staleTime: 0 },
  ) as { data: JVDetail[] };

  // ── Save mutation ──────────────────────────────────────────────────────────
  const saveMutation = trpc.jv.save.useMutation({
    onSuccess: () => {
      showToast("success", editingJvcd ? "Journal voucher updated" : "Journal voucher saved");
      refetchAll();
      handleReject();
    },
    onError: (err) => showToast("error", err.message),
  });

  // ── Row helpers ────────────────────────────────────────────────────────────
  const appendRow = () => {
    setPendingRows((prev) => [
      ...prev,
      { _key: `r_${Date.now()}`, ledger: null, lednarr: "", amtdr: "", amtcr: "" },
    ]);
  };

  const removeLastRow = () => {
    if (pendingRows.length > 0) setPendingRows((prev) => prev.slice(0, -1));
  };

  const removeRow = (_key: string) => {
    setPendingRows((prev) => prev.filter((r) => r._key !== _key));
  };

  const updateRow = (_key: string, field: keyof Omit<PendingRow, "_key" | "ledger">, value: string) => {
    setPendingRows((prev) => prev.map((r) => r._key === _key ? { ...r, [field]: value } : r));
  };

  const updateLedger = (_key: string, ledger: LedgerItem | null) => {
    setPendingRows((prev) => prev.map((r) => r._key === _key ? { ...r, ledger } : r));
  };

  // ── Edit a saved JV ────────────────────────────────────────────────────────
  // Called from the expanded detail panel — at this point expandedDetails already
  // contains the resolved lednm from the updated router.
  const handleEdit = (jv: SavedJV, details: JVDetail[]) => {
    const unit = units.find((u) => u.untcd === jv.untcd) ?? null;
    setSelectedUnit(unit);
    setEditingJvcd(jv.jvcd);
    setVoucherNo(jv.jvcd);
    setJvdt(new Date(jv.jvdt).toISOString().slice(0, 10));
    setMode(jv.mode as ModeOption);

    // Build pending rows using the resolved lednm so the combobox shows the
    // ledger name immediately — no need for the user to reselect anything.
    const rows: PendingRow[] = details.map((d) => ({
      _key: `edit_${d.rowid}`,
      ledger: {
        rowid: 0,
        ledcd: d.ledcd,
        lednm: d.lednm ?? d.ledcd, // prefer real name; fall back to code
      },
      lednarr: d.lednarr,
      amtdr: d.amtdr ? String(d.amtdr) : "",
      amtcr: d.amtcr ? String(d.amtcr) : "",
    }));
    setPendingRows(rows);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Reject / discard ───────────────────────────────────────────────────────
  const handleReject = () => {
    setSelectedUnit(null);
    setVoucherNo("New");
    setVoucherPrefix("");
    setJvdt(today);
    setMode("Reverse Entry");
    setPendingRows([]);
    setEditingJvcd(null);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!selectedUnit) { showToast("error", "Please select a unit"); return; }
    if (!jvdt)         { showToast("error", "Please set a voucher date"); return; }
    if (pendingRows.length === 0) { showToast("error", "Add at least one entry row"); return; }

    const invalid = pendingRows.some((r) => !r.ledger);
    if (invalid) { showToast("error", "All rows must have an account head"); return; }

    if (!isBalanced || totalDr === 0) {
      showToast("error", `Debit and Credit totals must be equal and non-zero (Dr: ${fmtAmt(totalDr)}, Cr: ${fmtAmt(totalCr)})`);
      return;
    }

    const jvCode = editingJvcd ?? voucherNo;

    saveMutation.mutate({
      jvcd: jvCode,
      untcd: selectedUnit.untcd,
      jvdt,
      mode,
      rows: pendingRows.map((r) => ({
        ledcd:   r.ledger!.ledcd,
        lednarr: r.lednarr,
        amtdr:   parseFloat(r.amtdr) || 0,
        amtcr:   parseFloat(r.amtcr) || 0,
      })),
    });
  };

  // ── Totals ─────────────────────────────────────────────────────────────────
  const totalDr = pendingRows.reduce((s, r) => s + (parseFloat(r.amtdr) || 0), 0);
  const totalCr = pendingRows.reduce((s, r) => s + (parseFloat(r.amtcr) || 0), 0);
  const isBalanced = Math.abs(totalDr - totalCr) < 0.01;

  const isSaving = saveMutation.isPending;
  const hasUnit  = !!selectedUnit;

  // ── Render ─────────────────────────────────────────────────────────────────
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
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", toast.type === "success" ? "bg-green-500" : "bg-red-500")} />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page header */}
      <div>
        <h2 className="text-[16px] font-medium text-[#1a1a1a]">Journal Voucher</h2>
        <p className="text-[12px] text-[#999] mt-0.5">
          Create and manage journal entries for selected units
        </p>
      </div>

      {/* ── GENERAL INFORMATION ─────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <SectionHeader
          title="General Information"
          sub={editingJvcd ? `Editing ${editingJvcd}` : undefined}
        />
        <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4 max-w-3xl">

          {/* Unit Name */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#999]">
              Unit Name <span className="text-red-400">*</span>
            </label>
            <CustomCombobox
              items={units}
              value={selectedUnit}
              onValueChange={(val) => {
                setSelectedUnit(val);
                if (!val) { setVoucherNo("New"); setVoucherPrefix(""); }
                if (!editingJvcd) { setPendingRows([]); }
              }}
              getLabel={(u) => u.untnm}
              getKey={(u) => u.untcd}
              placeholder="Select unit…"
              disabled={!!editingJvcd}
            />
          </div>

          {/* Voucher No */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#999]">
              Voucher No.
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={nextCodeFetching && !editingJvcd ? "Generating…" : voucherNo}
                className={readonlyCls}
              />
              {nextCodeFetching && !editingJvcd && (
                <svg className="animate-spin absolute right-2 top-1/2 -translate-y-1/2" width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round">
                  <path d="M7 1a6 6 0 1 0 6 6" />
                </svg>
              )}
            </div>
          </div>

          {/* Voucher Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#999]">
              Voucher Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              className={cn(inputCls, !hasUnit && "opacity-50 pointer-events-none")}
              value={jvdt}
              min={fyStart}
              max={fyEnd}
              onChange={(e) => {
                const v = e.target.value;
                if (v >= fyStart && v <= fyEnd) setJvdt(v);
              }}
              disabled={!hasUnit}
            />
            {finYear && (
              <span className="text-[10px] text-[#bbb]">
                FY {finYear.finyear} · {fmtDate(fyStart)} – {fmtDate(fyEnd)}
              </span>
            )}
          </div>

          {/* Mode */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#999]">
              Mode <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as ModeOption)}
                disabled={!hasUnit}
                className={cn(
                  "w-full h-9 px-3 pr-8 text-[13px] bg-white border border-[#E8E6E1] rounded-lg text-[#1a1a1a]",
                  "focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all duration-150",
                  "appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                {MODE_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#ccc]" width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M2 5l5 5 5-5" />
              </svg>
            </div>
          </div>

        </div>
      </div>

      {/* ── JOURNAL VOUCHER DESCRIPTION ─────────────────────────────────────── */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#888]">
            Journal Voucher Description
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={appendRow}
              disabled={!hasUnit}
              className="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium rounded-lg border transition-all duration-150 text-green-700 border-green-200 bg-green-50 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7 1v12M1 7h12" /></svg>
              Append
            </button>
            <button
              onClick={removeLastRow}
              disabled={!hasUnit || pendingRows.length === 0}
              className="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium rounded-lg border transition-all duration-150 text-red-600 border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 7h12" /></svg>
              Remove
            </button>
            <div className="w-px h-4 bg-[#E8E6E1] mx-1" />
            <button
              onClick={handleSave}
              disabled={!hasUnit || isSaving}
              className="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium rounded-lg border transition-all duration-150 text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <svg className="animate-spin" width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 1a6 6 0 1 0 6 6" /></svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 7l3.5 3.5L12 3" /></svg>
              )}
              Accept
            </button>
            <button
              onClick={handleReject}
              disabled={isSaving}
              className="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium rounded-lg border transition-all duration-150 text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 4L4 10M4 4l6 6" /></svg>
              Reject
            </button>
          </div>
        </div>

        {/* Entry table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] w-8">#</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] min-w-[220px]">Account Head</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] min-w-[200px]">Ledger Narration</th>
                <th className="text-right px-3 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] min-w-[120px]">Debit Amount</th>
                <th className="text-right px-3 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] min-w-[120px]">Credit Amount</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {!hasUnit ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[12px] text-[#ccc]">
                    Select a unit above to start entering journal entries
                  </td>
                </tr>
              ) : pendingRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[12px] text-[#ccc]">
                    No entries — click <span className="font-medium text-[#aaa]">Append</span> to add a row
                  </td>
                </tr>
              ) : (
                <AnimatePresence initial={false}>
                  {pendingRows.map((row, idx) => (
                    <motion.tr
                      key={row._key}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                      transition={{ duration: 0.15 }}
                      className="border-b border-[#F5F4F0] last:border-0 bg-blue-50/20 group"
                    >
                      <td className="px-4 py-2 text-[#ccc] text-[11px] font-mono">{idx + 1}</td>
                      <td className="px-3 py-2 min-w-[220px]">
                        <LedgerCombobox
                          value={row.ledger}
                          onValueChange={(v) => updateLedger(row._key, v)}
                          hasError={!row.ledger}
                        />
                      </td>
                      <td className="px-3 py-2 min-w-[200px]">
                        <input
                          type="text"
                          value={row.lednarr}
                          onChange={(e) => updateRow(row._key, "lednarr", e.target.value)}
                          placeholder="Narration…"
                          className={inputCls}
                        />
                      </td>
                      <td className="px-3 py-2 min-w-[120px]">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={row.amtdr}
                          onChange={(e) => updateRow(row._key, "amtdr", onlyNums(e.target.value))}
                          placeholder="0.00"
                          className={cn(inputCls, "text-right")}
                        />
                      </td>
                      <td className="px-3 py-2 min-w-[120px]">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={row.amtcr}
                          onChange={(e) => updateRow(row._key, "amtcr", onlyNums(e.target.value))}
                          placeholder="0.00"
                          className={cn(inputCls, "text-right")}
                        />
                      </td>
                      <td className="px-3 py-2 w-10">
                        <button
                          onClick={() => removeRow(row._key)}
                          className="w-6 h-6 flex items-center justify-center rounded-md border border-[#E8E6E1] text-[#ccc] hover:border-red-200 hover:text-red-400 hover:bg-red-50 transition-all duration-150 opacity-0 group-hover:opacity-100"
                        >
                          <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M1 1l12 12M13 1L1 13" />
                          </svg>
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
            {pendingRows.length > 0 && (
              <tfoot>
                <tr className="border-t border-[#E8E6E1] bg-[#FAFAF9]">
                  <td colSpan={3} className="px-4 py-2.5 text-[11px] font-medium text-[#888]">
                    Total
                    {!isBalanced && (
                      <span className="ml-2 text-red-500 text-[10px]">⚠ Unbalanced by {fmtAmt(Math.abs(totalDr - totalCr))}</span>
                    )}
                    {isBalanced && totalDr > 0 && (
                      <span className="ml-2 text-green-600 text-[10px]">✓ Balanced</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[12px] font-semibold text-[#1a1a1a]">
                    {fmtAmt(totalDr)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[12px] font-semibold text-[#1a1a1a]">
                    {fmtAmt(totalCr)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {hasUnit && (
          <div className="px-5 py-3 border-t border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between">
            <span className="text-[11px] text-[#bbb]">
              {pendingRows.length} row{pendingRows.length !== 1 ? "s" : ""}
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
                    <svg className="animate-spin" width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M7 1a6 6 0 1 0 6 6" /></svg>
                    Saving…
                  </>
                ) : (
                  <>
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><path d="M2 7l3.5 3.5L12 3" /></svg>
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── HISTORY TABLE ────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <SectionHeader title="Journal Voucher History" />
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] w-8">#</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa]">Voucher No.</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa]">Unit</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa]">Date</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa]">Mode</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {(allJvs as any).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[12px] text-[#ccc]">
                    No journal vouchers saved yet
                  </td>
                </tr>
              ) : (
                (allJvs as any).map((jv: any, idx: any) => {
                  const isExpanded = expandedJvcd === jv.jvcd;
                  return (
                    <>
                      <motion.tr
                        key={jv.jvcd}
                        layout
                        className={cn(
                          "border-b border-[#F5F4F0] group cursor-pointer transition-colors duration-100",
                          isExpanded ? "bg-[#FAFAF9]" : "hover:bg-[#FAFAF9]",
                        )}
                        onClick={() => setExpandedJvcd(isExpanded ? null : jv.jvcd)}
                      >
                        <td className="px-4 py-2.5 text-[#ccc] text-[11px] font-mono">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-mono text-[12px] text-[#1a1a1a]">{jv.jvcd}</td>
                        <td className="px-3 py-2.5 text-[12px] text-[#555]">
                          {units.find((u) => u.untcd === jv.untcd)?.untnm ?? jv.untcd}
                        </td>
                        <td className="px-3 py-2.5 text-[12px] text-[#555]">{fmtDate(jv.jvdt)}</td>
                        <td className="px-3 py-2.5">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium",
                            jv.mode === "Sale"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-[#F5F4F0] text-[#555] border border-[#E8E6E1]",
                          )}>
                            {jv.mode}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setExpandedJvcd(isExpanded ? null : jv.jvcd); }}
                              className="w-6 h-6 flex items-center justify-center rounded-md border border-[#E8E6E1] text-[#aaa] hover:border-[#ccc] hover:text-[#555] hover:bg-[#F5F4F0] transition-all duration-150"
                            >
                              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                                className={cn("transition-transform duration-150", isExpanded && "rotate-180")}>
                                <path d="M2 5l5 5 5-5" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedJvcd(jv.jvcd);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-md border border-[#E8E6E1] text-[#aaa] hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50 transition-all duration-150"
                            >
                              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                <path d="M9 2l3 3-7 7H2v-3L9 2z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </motion.tr>

                      {/* Expanded details sub-row */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.tr
                            key={`${jv.jvcd}_detail`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <td colSpan={6} className="px-0 pb-0">
                              <div className="mx-4 mb-3 border border-[#E8E6E1] rounded-xl overflow-hidden">
                                <div className="px-4 py-2 bg-[#F5F4F0] border-b border-[#E8E6E1] flex items-center justify-between">
                                  <span className="text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa]">
                                    Entries — {jv.jvcd}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleEdit(jv, expandedDetails)}
                                    className="flex items-center gap-1 h-6 px-2.5 text-[10px] font-medium rounded-md border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all duration-150"
                                  >
                                    <svg width="8" height="8" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                      <path d="M9 2l3 3-7 7H2v-3L9 2z" />
                                    </svg>
                                    Edit Voucher
                                  </button>
                                </div>
                                <table className="w-full text-[12px]">
                                  <thead>
                                    <tr className="border-b border-[#E8E6E1] bg-white">
                                      {/* ↓ Show "Account Head" with both name and code */}
                                      <th className="text-left px-4 py-2 text-[10px] font-semibold tracking-[0.06em] uppercase text-[#bbb]">Account Head</th>
                                      <th className="text-left px-3 py-2 text-[10px] font-semibold tracking-[0.06em] uppercase text-[#bbb]">Narration</th>
                                      <th className="text-right px-3 py-2 text-[10px] font-semibold tracking-[0.06em] uppercase text-[#bbb]">Dr</th>
                                      <th className="text-right px-4 py-2 text-[10px] font-semibold tracking-[0.06em] uppercase text-[#bbb]">Cr</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {expandedDetails.length === 0 ? (
                                      <tr>
                                        <td colSpan={4} className="px-4 py-6 text-center text-[11px] text-[#ccc]">
                                          No entries found
                                        </td>
                                      </tr>
                                    ) : (
                                      expandedDetails.map((d) => (
                                        <tr key={d.rowid} className="border-b border-[#F5F4F0] last:border-0">
                                          {/* ↓ Show ledger name prominently; show code as a subtle sub-line */}
                                          <td className="px-4 py-2">
                                            <span className="flex flex-col min-w-0">
                                              <span className="text-[#1a1a1a] truncate">
                                                {d.lednm ?? d.ledcd}
                                              </span>
                                              {d.lednm && (
                                                <span className="text-[10px] text-[#bbb]">{d.ledcd}</span>
                                              )}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2 text-[#666]">{d.lednarr || "—"}</td>
                                          <td className="px-3 py-2 text-right font-mono text-[#1a1a1a]">{fmtAmt(d.amtdr)}</td>
                                          <td className="px-4 py-2 text-right font-mono text-[#1a1a1a]">{fmtAmt(d.amtcr)}</td>
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                  {expandedDetails.length > 0 && (
                                    <tfoot>
                                      <tr className="border-t border-[#E8E6E1] bg-[#FAFAF9]">
                                        <td colSpan={2} className="px-4 py-2 text-[11px] font-medium text-[#888]">Total</td>
                                        <td className="px-3 py-2 text-right text-[12px] font-semibold text-[#1a1a1a] font-mono">
                                          {fmtAmt(expandedDetails.reduce((s, d) => s + d.amtdr, 0))}
                                        </td>
                                        <td className="px-4 py-2 text-right text-[12px] font-semibold text-[#1a1a1a] font-mono">
                                          {fmtAmt(expandedDetails.reduce((s, d) => s + d.amtcr, 0))}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  )}
                                </table>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </>
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