"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { trpc } from "@/app/_trpc/client";// adjust to your trpc client path
import { useAuthStore } from "@/store/authStore";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Unit {
  untcd: string;
  untnm: string;
}
interface Commodity {
  itmcomcd: string;
  itmcomnm: string;
}

// ─── Custom Combobox (matches project standard) ───────────────────────────────
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
        getLabel(item).toLowerCase().includes(query.toLowerCase())
      )
    : items;

  useEffect(() => { setHighlightedIndex(0); }, [query, open]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-index="${highlightedIndex}"]`
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

  const handleFocus = () => { setOpen(true); setQuery(""); };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") { setOpen(true); e.preventDefault(); }
      return;
    }
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1)); break;
      case "ArrowUp": e.preventDefault(); setHighlightedIndex((i) => Math.max(i - 1, 0)); break;
      case "Enter": e.preventDefault(); if (filtered[highlightedIndex]) handleSelect(filtered[highlightedIndex]); break;
      case "Escape": setOpen(false); setQuery(""); setHighlightedIndex(0); break;
    }
  };

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
                const isSelected = value ? getKey(value) === getKey(item) : false;
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
                      isSelected ? "bg-[#1a1a1a] text-white" : isHighlighted ? "bg-[#F5F4F0] text-[#1a1a1a]" : "text-[#1a1a1a]"
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
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full h-9 px-3 pr-8 text-[13px] rounded-lg border bg-white text-[#1a1a1a] placeholder:text-[#ccc]",
            "transition-all duration-150 outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            hasError ? "border-red-300 bg-red-50/40" : "border-[#E8E6E1] hover:border-[#ccc]"
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

function formatDisplayDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const today = new Date().toISOString().split("T")[0];

// ─── Form State ───────────────────────────────────────────────────────────────
interface FormState {
  unit: Unit | null;
  commodity: Commodity | null;
  frmdt: string;
  todt: string;
  advper: string;
}

const defaultForm: FormState = {
  unit: null,
  commodity: null,
  frmdt: today,
  todt: today,
  advper: "",
};

interface FormErrors {
  unit?: string;
  commodity?: string;
  frmdt?: string;
  todt?: string;
  advper?: string;
}

// ─── Label component ──────────────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[12px] font-medium text-[#555] whitespace-nowrap">
      {children}
    </label>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdvancePercentagePage() {
  const user = useAuthStore((s) => s.user);

  const { data: units = [] } = trpc.advPer.getUnits.useQuery();
  const { data: commodities = [] } = trpc.advPer.getCommodities.useQuery();
  const { data: records = [], refetch } = trpc.advPer.getAll.useQuery();

  const createMutation = trpc.advPer.create.useMutation({ onSuccess: () => refetch() });
  const updateMutation = trpc.advPer.update.useMutation({ onSuccess: () => refetch() });
  const deleteMutation = trpc.advPer.delete.useMutation({ onSuccess: () => refetch() });

  const [form, setForm] = useState<FormState>(defaultForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [editingRowid, setEditingRowid] = useState<number | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Validation ─────────────────────────────────────────────────────────────
  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.unit) e.unit = "Required";
    if (!form.commodity) e.commodity = "Required";
    if (!form.frmdt) e.frmdt = "Required";
    if (!form.todt) e.todt = "Required";
    if (form.frmdt && form.todt && form.todt < form.frmdt) e.todt = "Must be after Valid From";
    if (!form.advper) {
      e.advper = "Required";
    } else {
      const n = parseFloat(form.advper);
      if (isNaN(n) || n < 0 || n >= 100) e.advper = "Must be between 0 and 100";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function flash(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!validate()) return;
    setServerError(null);
    const payload = {
      untcd: form.unit!.untcd,
      itmcomcd: form.commodity!.itmcomcd,
      frmdt: new Date(form.frmdt).toISOString(),
      todt: new Date(form.todt).toISOString(),
      advper: form.advper,
      entusrnm: user?.username ?? "SYSTEM",
    };
    try {
      if (editingRowid !== null) {
        await updateMutation.mutateAsync({ rowid: editingRowid, ...payload });
        flash("Record updated successfully.");
      } else {
        await createMutation.mutateAsync(payload);
        flash("Record saved successfully.");
      }
      handleClear();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred.";
      setServerError(msg);
    }
  }

  // ── Edit ───────────────────────────────────────────────────────────────────
  function handleEdit(row: typeof records[0]) {
    const unit = units.find((u) => u.untcd === row.untcd) ?? null;
    const commodity = commodities.find((c) => c.itmcomcd === row.itmcomcd) ?? null;
    setForm({
      unit,
      commodity,
      frmdt: toDateInputValue(row.frmdt),
      todt: toDateInputValue(row.todt),
      advper: row.advper,
    });
    setEditingRowid(row.rowid);
    setErrors({});
    setServerError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Clear ──────────────────────────────────────────────────────────────────
  function handleClear() {
    setForm(defaultForm);
    setEditingRowid(null);
    setErrors({});
    setServerError(null);
  }

  const isBusy = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-[#F7F6F3] p-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-semibold text-[#1a1a1a] tracking-tight">
              Set Advance Percentage
            </h1>
            <p className="text-[12px] text-[#999] mt-0.5">
              Manage advance percentage by location and commodity
            </p>
          </div>
          {editingRowid !== null && (
            <span className="text-[11px] bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-full font-medium">
              Editing record #{editingRowid}
            </span>
          )}
        </div>

        {/* ── Form Card ──────────────────────────────────────────────────── */}
        <motion.div
          layout
          className="bg-white rounded-2xl border border-[#E8E6E1] shadow-sm overflow-hidden"
        >
          {/* Card header */}
          <div className="px-5 py-3.5 border-b border-[#F0EEE9] bg-[#FAFAF8]">
            <span className="text-[12px] font-semibold text-[#1a1a1a] uppercase tracking-wider">
              {editingRowid !== null ? "Edit Entry" : "New Entry"}
            </span>
          </div>

          {/* Form body */}
          <div className="p-5 space-y-4">
            {/* Row 1: Location + Commodity */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div className="flex items-center gap-3">
                <FieldLabel>Location</FieldLabel>
                <div className="flex-1">
                  <CustomCombobox<Unit>
                    items={units}
                    value={form.unit}
                    onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}
                    getLabel={(u) => u.untnm}
                    getKey={(u) => u.untcd}
                    placeholder="Select location…"
                    hasError={!!errors.unit}
                  />
                  {errors.unit && <p className="text-[11px] text-red-500 mt-1">{errors.unit}</p>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FieldLabel>Commodity</FieldLabel>
                <div className="flex-1">
                  <CustomCombobox<Commodity>
                    items={commodities}
                    value={form.commodity}
                    onValueChange={(v) => setForm((f) => ({ ...f, commodity: v }))}
                    getLabel={(c) => c.itmcomnm}
                    getKey={(c) => c.itmcomcd}
                    placeholder="Select commodity…"
                    hasError={!!errors.commodity}
                  />
                  {errors.commodity && <p className="text-[11px] text-red-500 mt-1">{errors.commodity}</p>}
                </div>
              </div>
            </div>

            {/* Row 2: Valid From + Valid To */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div className="flex items-center gap-3">
                <FieldLabel>Valid From</FieldLabel>
                <div className="flex-1">
                  <input
                    type="date"
                    value={form.frmdt}
                    onChange={(e) => setForm((f) => ({ ...f, frmdt: e.target.value }))}
                    className={cn(
                      "w-full h-9 px-3 text-[13px] rounded-lg border bg-white text-[#1a1a1a]",
                      "transition-all duration-150 outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]",
                      errors.frmdt ? "border-red-300 bg-red-50/40" : "border-[#E8E6E1] hover:border-[#ccc]"
                    )}
                  />
                  {errors.frmdt && <p className="text-[11px] text-red-500 mt-1">{errors.frmdt}</p>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FieldLabel>Valid To</FieldLabel>
                <div className="flex-1">
                  <input
                    type="date"
                    value={form.todt}
                    min={form.frmdt}
                    onChange={(e) => setForm((f) => ({ ...f, todt: e.target.value }))}
                    className={cn(
                      "w-full h-9 px-3 text-[13px] rounded-lg border bg-white text-[#1a1a1a]",
                      "transition-all duration-150 outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]",
                      errors.todt ? "border-red-300 bg-red-50/40" : "border-[#E8E6E1] hover:border-[#ccc]"
                    )}
                  />
                  {errors.todt && <p className="text-[11px] text-red-500 mt-1">{errors.todt}</p>}
                </div>
              </div>
            </div>

            {/* Row 3: Advance Percentage */}
            <div className="grid grid-cols-2 gap-x-8">
              <div className="flex items-center gap-3">
                <FieldLabel>Advance %</FieldLabel>
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={99.99}
                      step="0.01"
                      placeholder="0.00"
                      value={form.advper}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Clamp to < 100
                        if (val === "" || parseFloat(val) < 100) {
                          setForm((f) => ({ ...f, advper: val }));
                        }
                      }}
                      className={cn(
                        "w-full h-9 px-3 pr-8 text-[13px] rounded-lg border bg-white text-[#1a1a1a] placeholder:text-[#ccc]",
                        "transition-all duration-150 outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]",
                        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                        errors.advper ? "border-red-300 bg-red-50/40" : "border-[#E8E6E1] hover:border-[#ccc]"
                      )}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#aaa] pointer-events-none">
                      %
                    </span>
                  </div>
                  {errors.advper && <p className="text-[11px] text-red-500 mt-1">{errors.advper}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Form footer */}
          <div className="px-5 py-3 border-t border-[#F0EEE9] bg-[#FAFAF8] flex items-center justify-between">
            {/* Error / success messages */}
            <div className="flex-1 min-w-0">
              <AnimatePresence>
                {serverError && (
                  <motion.p
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[12px] text-red-600 truncate"
                  >
                    {serverError}
                  </motion.p>
                )}
                {successMsg && (
                  <motion.p
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[12px] text-green-600 truncate"
                  >
                    {successMsg}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 ml-4">
              {editingRowid !== null && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="h-8 px-4 text-[12px] font-medium rounded-lg border border-[#E8E6E1] text-[#666] hover:bg-[#F5F4F0] transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={isBusy}
                className={cn(
                  "h-8 px-5 text-[12px] font-semibold rounded-lg transition-all duration-150",
                  "bg-[#1a1a1a] text-white hover:bg-[#333] active:scale-95",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isBusy ? "Saving…" : editingRowid !== null ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Data Table ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#E8E6E1] shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#F0EEE9] bg-[#FAFAF8] flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#1a1a1a] uppercase tracking-wider">
              Records
            </span>
            <span className="text-[11px] text-[#aaa]">{records.length} entries</span>
          </div>

          {records.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-[#ccc]">
              No records found. Create one above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[#F0EEE9]">
                    {["Location", "Commodity", "Valid From", "Valid To", "Adv %", "Entry By", "Entry Date", ""].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-[11px] font-semibold text-[#999] uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((row, i) => (
                    <motion.tr
                      key={row.rowid}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={cn(
                        "border-b border-[#F7F6F3] transition-colors hover:bg-[#FAFAF8]",
                        editingRowid === row.rowid && "bg-amber-50/50"
                      )}
                    >
                      <td className="px-4 py-2.5 text-[#1a1a1a] font-medium">{row.untnm}</td>
                      <td className="px-4 py-2.5 text-[#444]">{row.itmcomnm}</td>
                      <td className="px-4 py-2.5 text-[#666] tabular-nums">{formatDisplayDate(row.frmdt)}</td>
                      <td className="px-4 py-2.5 text-[#666] tabular-nums">{formatDisplayDate(row.todt)}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-0.5 bg-[#F5F4F0] text-[#1a1a1a] font-semibold px-2 py-0.5 rounded-md">
                          {row.advper}
                          <span className="text-[10px] text-[#999]">%</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[#888]">{row.entusrnm}</td>
                      <td className="px-4 py-2.5 text-[#aaa] tabular-nums whitespace-nowrap">
                        {formatDisplayDate(row.entdt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEdit(row)}
                            className="h-7 px-3 text-[11px] font-medium rounded-lg border border-[#E8E6E1] text-[#555] hover:bg-[#F5F4F0] hover:border-[#ccc] transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm("Delete this record?")) return;
                              await deleteMutation.mutateAsync({ rowid: row.rowid });
                              if (editingRowid === row.rowid) handleClear();
                            }}
                            className="h-7 px-3 text-[11px] font-medium rounded-lg border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}