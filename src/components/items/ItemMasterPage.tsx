"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { trpc } from "../../app/_trpc/client";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
} from "../ui/combobox";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_CATEGORIES = [
  "Finished Goods Packed",
  "Finished Goods Loose",
  "Raw Material",
  "Packing Material",
  "Semi Finished",
  "Trading Goods",
  "Fixed Assets",
  "Consumables",
  "Scrap",
  "Services",
];
const PACKED_CATEGORIES = ["Bulk Pack", "Consumer Pack", "Other"];
const FILLED_GROUPS = ["JAR", "PCH", "KHAL BAGS", "MTK", "TIN", "CARTOON"];
const UOM_OPTIONS = ["QUANTITY UNIT", "WEIGHT UNIT", "BOTH UNITS"];
const UOM_RATE_OPTIONS = ["QUANTITY UNIT", "WEIGHT UNIT"];
const UNIT_CONVERSION_OPTIONS = [
  "Automatic By Conversion Factor",
  "Manual by user",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type ItemForm = {
  itmnm: string;
  itmtypcd: string;
  itmmaincomcd: string;
  itmcomcd: string;
  itmgrpcd: string;
  itmsubgrpcd: string;
  itmcat: string;
  itmsubcat: string;
  hsncode: string;
  itmcatgrp: string;
  fillitmcd: string;
  itmbrdcd: string;
  lsitmnm: string;
  lsitmunt: string;
  pcksz: number;
  emtbxwgt: number;
  stkmngin: string;
  rateappon: string;
  autowgtcalc: string;
  wgtconv: number;
  qtyitmunitcd: string;
  wgtitmunitcd: string;
  ordmngin: string;
  sale: number;
  poreq: string;
  smat: string;
  deprate: number;
  uselife: number;
  step: string;
  smatcd: string;
  pur: number;
  man: number;
  cons: number;
  exc: number;
  vat: number;
  kit: number;
  sttaxcatcd: string;
  cttaxcatcd: string;
  itrmcd: string;
};

const EMPTY_FORM: ItemForm = {
  itmnm: "",
  itmtypcd: "",
  itmmaincomcd: "",
  itmcomcd: "",
  itmgrpcd: "",
  itmsubgrpcd: "",
  itmcat: "",
  itmsubcat: "",
  hsncode: "",
  itmcatgrp: "",
  fillitmcd: "",
  itmbrdcd: "",
  lsitmnm: "",
  lsitmunt: "",
  pcksz: 1,
  emtbxwgt: 0,
  stkmngin: "QUANTITY UNIT",
  rateappon: "QUANTITY UNIT",
  autowgtcalc: "Automatic By Conversion Factor",
  wgtconv: 0,
  qtyitmunitcd: "",
  wgtitmunitcd: "",
  ordmngin: "QUANTITY UNIT",
  sale: 1,
  poreq: "1",
  smat: "0",
  deprate: 0,
  uselife: 0,
  step: "",
  smatcd: "",
  pur: 0,
  man: 0,
  cons: 0,
  exc: 0,
  vat: 0,
  kit: 0,
  sttaxcatcd: "",
  cttaxcatcd: "",
  itrmcd: "",
};

// ─── Shared style helpers ─────────────────────────────────────────────────────

const inputCls = (hasError?: boolean) =>
  `w-full h-9 px-3 text-[13px] bg-white border rounded-lg text-[#1a1a1a] placeholder:text-[#ccc]
   focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all duration-150
   ${hasError ? "border-red-300 bg-red-50/30" : "border-[#E8E6E1] hover:border-[#ccc]"}`;

const selectCls = (hasError?: boolean) =>
  `w-full h-9 px-3 text-[13px] bg-white border rounded-lg text-[#1a1a1a]
   hover:border-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]
   transition-all duration-150 cursor-pointer
   ${hasError ? "border-red-300 bg-red-50/30" : "border-[#E8E6E1]"}`;

// ─── useDebounce ──────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ─── StyledCombobox ───────────────────────────────────────────────────────────

export function StyledCombobox({
  items,
  value,
  onValueChange,
  placeholder,
  disabled,
  hasError,
}: {
  items: { label: string; value: string }[];
  value: string;
  onValueChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
}) {
  const displayValue = items.find((i) => i.value === value)?.label ?? "";

  return (
    <Combobox
      items={items.map((i) => i.label)}
      value={displayValue}
      onValueChange={(label) => {
        const found = items.find((i) => i.label === label);
        onValueChange(found?.value ?? "");
      }}
      autoHighlight
      disabled={disabled}
    >
      <ComboboxInput
        placeholder={disabled ? "Select parent first…" : (placeholder ?? "Select…")}
        className={cn(
          "w-full h-9 px-3 text-[13px] rounded-lg border bg-white text-[#1a1a1a] placeholder:text-[#bbb]",
          "transition-all duration-150 outline-none",
          "focus:ring-2 focus:ring-[#1a1a1a]/8 focus:border-[#1a1a1a]",
          hasError
            ? "border-red-300 bg-red-50/40"
            : "border-[#E8E6E1] hover:border-[#C8C5BE]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
      <ComboboxContent
        className={cn(
          "z-50 min-w-(--radix-popover-trigger-width)",
          "mt-1.5 p-1 rounded-xl border border-[#E8E6E1] bg-white",
          "shadow-[0_8px_24px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.05)]",
          "animate-in fade-in-0 zoom-in-95 duration-100"
        )}
      >
        <ComboboxEmpty className="py-7 text-center text-[12px] text-[#bbb] tracking-wide">
          No results found.
        </ComboboxEmpty>
        <ComboboxList className="max-h-52 overflow-y-auto scrollbar-none">
          {(item) => (
            <ComboboxItem
              key={item}
              value={item}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 rounded-lg",
                "text-[13px] text-[#1a1a1a] cursor-pointer select-none",
                "transition-colors duration-75 outline-none",
                "hover:bg-[#F5F4F0] data-highlighted:bg-[#F5F4F0]",
                "data-selected:font-medium data-selected:text-[#1a1a1a]"
              )}
            >
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

// ─── FormField ────────────────────────────────────────────────────────────────

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#999]">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-400 mt-0.5">{error}</p>}
    </div>
  );
}

// ─── Collapsible Section ──────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-[#E8E6E1] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-[#FAFAF9] hover:bg-[#F5F4F0] transition-colors duration-150"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-md bg-[#1a1a1a] flex items-center justify-center shrink-0">
            {icon}
          </div>
          <span className="text-[13px] font-medium text-[#1a1a1a]">{title}</span>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 14 14"
          fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round"
          className={`transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
        >
          <path d="M2 5l5 4 5-4" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4 border-t border-[#E8E6E1]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({
  itemName,
  onConfirm,
  onCancel,
  isPending,
}: {
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 4 }}
        transition={{ duration: 0.15 }}
        className="relative bg-white rounded-xl border border-[#E8E6E1] shadow-xl p-6 w-80 flex flex-col gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0 mt-0.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round">
              <path d="M7 2v5M7 10v.5" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#1a1a1a]">Delete item?</p>
            <p className="text-[12px] text-[#999] mt-1 leading-relaxed">
              <span className="font-medium text-[#555]">{itemName}</span> will be permanently removed.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="h-8 px-4 text-[12px] font-medium text-[#666] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="h-8 px-4 text-[12px] font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all duration-150 flex items-center gap-1.5"
          >
            {isPending ? (
              <>
                <svg className="animate-spin" width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M7 1a6 6 0 1 0 6 6" />
                </svg>
                Deleting…
              </>
            ) : "Delete"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  pageCount,
  total,
  onPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPage: (p: number) => void;
}) {
  if (pageCount <= 1) return null;

  // Build a compact page list: always show first, last, current ±1, with "…" gaps
  const pages: (number | "…")[] = [];
  const add = (n: number) => { if (!pages.includes(n)) pages.push(n); };

  add(1);
  if (page > 3) pages.push("…");
  for (let p = Math.max(2, page - 1); p <= Math.min(pageCount - 1, page + 1); p++) add(p);
  if (page < pageCount - 2) pages.push("…");
  if (pageCount > 1) add(pageCount);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8E6E1]">
      <span className="text-[11px] text-[#aaa]">
        Page {page} of {pageCount} · {total} items
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E8E6E1] bg-white text-[#aaa] hover:bg-[#F5F4F0] hover:text-[#555] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M9 2L4 7l5 5" />
          </svg>
        </button>

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center text-[11px] text-[#ccc]">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={cn(
                "w-7 h-7 flex items-center justify-center rounded-lg text-[12px] font-medium transition-all duration-150",
                p === page
                  ? "bg-[#1a1a1a] text-white border border-[#1a1a1a]"
                  : "border border-[#E8E6E1] bg-white text-[#666] hover:bg-[#F5F4F0]"
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPage(page + 1)}
          disabled={page === pageCount}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E8E6E1] bg-white text-[#aaa] hover:bg-[#F5F4F0] hover:text-[#555] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M5 2l5 5-5 5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function ItemMasterContent() {
  const [form, setForm] = useState<ItemForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ItemForm, string>>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ rowid: number; itmnm: string } | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(true);

  // Debounce search by 350 ms so we don't query on every keystroke
  const searchQuery = useDebounce(searchInput, 350);

  // Reset to page 1 whenever the search term changes
  useEffect(() => { setPage(1); }, [searchQuery]);

  const set = <K extends keyof ItemForm>(key: K, val: ItemForm[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  };

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: pagedResult, refetch, isFetching } = trpc.item.getAll.useQuery(
    { page, search: searchQuery },
    {
      // Keep previous data visible while the next page loads
      placeholderData: (prev) => prev,
    }
  );
  const items = pagedResult?.rows ?? [];
  const totalItems = pagedResult?.total ?? 0;
  const pageCount = pagedResult?.pageCount ?? 1;

  const { data: types = [] } = trpc.item.getTypes.useQuery();
  const { data: mainCommodities = [] } = trpc.item.getMainCommodities.useQuery();
  const { data: allCommodities = [] } = trpc.item.getCommodities.useQuery();
  const { data: groups = [] } = trpc.item.getGroups.useQuery();
  const { data: allSubGroups = [] } = trpc.item.getSubGroups.useQuery();
  const { data: brands = [] } = trpc.item.getBrands.useQuery();
  const { data: itemUnits = [] } = trpc.item.getItemUnits.useQuery();

  // Lightweight select-only list for the "Filled Item" combobox
  const { data: allItemsForSelect = [] } = trpc.item.getAllForSelect.useQuery();

  const commodities = useMemo(
    () => form.itmmaincomcd ? allCommodities.filter((c: any) => c.itmmaincomcd === form.itmmaincomcd) : allCommodities,
    [allCommodities, form.itmmaincomcd]
  );
  const subGroups = useMemo(
    () => form.itmgrpcd ? allSubGroups.filter((s: any) => s.itmgrpcd === form.itmgrpcd) : allSubGroups,
    [allSubGroups, form.itmgrpcd]
  );

  // Reset cascaded fields on parent change
  useEffect(() => { set("itmcomcd", ""); }, [form.itmmaincomcd]);
  useEffect(() => { set("itmsubgrpcd", ""); }, [form.itmgrpcd]);

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = trpc.item.create.useMutation({
    onSuccess: () => { showToast("success", "Item created successfully"); resetForm(); void refetch(); },
    onError: (err) => showToast("error", err.message),
  });
  const updateMutation = trpc.item.update.useMutation({
    onSuccess: () => { showToast("success", "Item updated successfully"); resetForm(); void refetch(); },
    onError: (err) => showToast("error", err.message),
  });
  const deleteMutation = trpc.item.delete.useMutation({
    onSuccess: () => { showToast("success", "Item deleted"); setDeleteTarget(null); void refetch(); },
    onError: (err) => showToast("error", err.message),
  });

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setErrors({});
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.itmnm.trim()) e.itmnm = "Required";
    if (!form.itmtypcd) e.itmtypcd = "Required";
    if (!form.qtyitmunitcd) e.qtyitmunitcd = "Required";
    if (!form.wgtitmunitcd) e.wgtitmunitcd = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (editingId !== null) {
      updateMutation.mutate({ rowid: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  }

  function handleEdit(item: any) {
    setEditingId(item.rowid);
    setForm({
      itmnm: item.itmnm ?? "",
      itmtypcd: item.itmtypcd ?? "",
      itmmaincomcd: item.itmmaincomcd ?? "",
      itmcomcd: item.itmcomcd ?? "",
      itmgrpcd: item.itmgrpcd ?? "",
      itmsubgrpcd: item.itmsubgrpcd ?? "",
      itmcat: item.itmcat ?? "",
      itmsubcat: item.itmsubcat ?? "",
      hsncode: item.hsncode ?? "",
      itmcatgrp: item.itmcatgrp ?? "",
      fillitmcd: item.fillitmcd ?? "",
      itmbrdcd: item.itmbrdcd ?? "",
      lsitmnm: item.lsitmnm ?? "",
      lsitmunt: item.lsitmunt ?? "",
      pcksz: item.pcksz ?? 1,
      emtbxwgt: item.emtbxwgt ?? 0,
      stkmngin: item.stkmngin ?? "QUANTITY UNIT",
      rateappon: item.rateappon ?? "QUANTITY UNIT",
      autowgtcalc: item.autowgtcalc ?? "Automatic By Conversion Factor",
      wgtconv: item.wgtconv ?? 0,
      qtyitmunitcd: item.qtyitmunitcd ?? "",
      wgtitmunitcd: item.wgtitmunitcd ?? "",
      ordmngin: item.ordmngin ?? "QUANTITY UNIT",
      sale: item.sale ?? 1,
      poreq: item.poreq ?? "1",
      smat: item.smat ?? "0",
      deprate: item.deprate ?? 0,
      uselife: item.uselife ?? 0,
      step: item.step ?? "",
      smatcd: item.smatcd ?? "",
      pur: item.pur ?? 0,
      man: item.man ?? 0,
      cons: item.cons ?? 0,
      exc: item.exc ?? 0,
      vat: item.vat ?? 0,
      kit: item.kit ?? 0,
      sttaxcatcd: item.sttaxcatcd ?? "",
      cttaxcatcd: item.cttaxcatcd ?? "",
      itrmcd: item.itrmcd ?? "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const isEdit = editingId !== null;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Combobox option lists
  const typeItems = types.map((t: any) => ({ label: t.itmtypnm, value: t.itmtypcd }));
  const mainComItems = mainCommodities.map((m: any) => ({ label: m.itmmaincomnm, value: m.itmmaincomcd }));
  const comItems = commodities.map((c: any) => ({ label: c.itmcomnm, value: c.itmcomcd }));
  const grpItems = groups.map((g: any) => ({ label: g.itmgrpnm, value: g.itmgrpcd }));
  const subGrpItems = subGroups.map((s: any) => ({ label: s.itmsubgrpnm, value: s.itmsubgrpcd }));
  const brandItems = brands.map((b: any) => ({ label: b.itmbrdnm, value: b.itmbrdcd }));
  const unitItems = itemUnits.map((u: any) => ({ label: u.itmuntnm, value: u.itmuntcd }));
  // Uses the lightweight select-only list — just {itrmcd, itmnm}
  const fillItemItems = allItemsForSelect.map((i: any) => ({ label: i.itmnm, value: i.itrmcd }));

  return (
    <div className="flex flex-col gap-5">

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`fixed top-15 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium shadow-sm border
              ${toast.type === "success" ? "bg-white border-green-200 text-green-700" : "bg-white border-red-200 text-red-600"}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`} />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal
            itemName={deleteTarget.itmnm}
            onConfirm={() => deleteMutation.mutate({ rowid: deleteTarget.rowid })}
            onCancel={() => setDeleteTarget(null)}
            isPending={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-medium text-[#1a1a1a]">Item Master</h2>
          <p className="text-[12px] text-[#999] mt-0.5">Manage inventory items and their configurations</p>
        </div>
        <button
          onClick={() => { if (isEdit) resetForm(); else setShowForm((p) => !p); }}
          className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-[#555] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] hover:text-[#1a1a1a] transition-all duration-150"
        >
          {isEdit ? (
            <>
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M1 1l12 12M13 1L1 13" />
              </svg>
              Cancel Edit
            </>
          ) : showForm ? "Hide Form" : "New Item"}
        </button>
      </div>

      {/* ── Form ──────────────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3">

              {isEdit && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-[12px] text-blue-600">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M2 10.5L4.5 11 11 4.5a1.77 1.77 0 0 0-2.5-2.5L2 8.5v2z" />
                  </svg>
                  Editing <span className="font-medium ml-1">{form.itmnm}</span> — make changes and click Update.
                </div>
              )}

              {/* ── Item Information ─────────────────────────────────── */}
              <Section
                title="Item Information"
                icon={
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="2" y="2" width="10" height="10" rx="1.5" />
                    <path d="M5 7h4M5 9.5h2.5" />
                  </svg>
                }
              >
                <FormField label="Item Name" required error={errors.itmnm}>
                  <input type="text" className={inputCls(!!errors.itmnm)} placeholder="e.g. Premium Refined Oil" value={form.itmnm} onChange={(e) => set("itmnm", e.target.value)} />
                </FormField>

                <FormField label="Type" required error={errors.itmtypcd}>
                  <StyledCombobox items={typeItems} value={form.itmtypcd} onValueChange={(v) => set("itmtypcd", v)} placeholder="Select type…" hasError={!!errors.itmtypcd} />
                </FormField>

                <FormField label="Main Commodity">
                  <StyledCombobox items={mainComItems} value={form.itmmaincomcd} onValueChange={(v) => set("itmmaincomcd", v)} placeholder="Select main commodity…" />
                </FormField>

                <FormField label="Commodity">
                  <StyledCombobox items={comItems} value={form.itmcomcd} onValueChange={(v) => set("itmcomcd", v)} placeholder="Select commodity…" disabled={!form.itmmaincomcd} />
                </FormField>

                <FormField label="Group">
                  <StyledCombobox items={grpItems} value={form.itmgrpcd} onValueChange={(v) => set("itmgrpcd", v)} placeholder="Select group…" />
                </FormField>

                <FormField label="Sub Group">
                  <StyledCombobox items={subGrpItems} value={form.itmsubgrpcd} onValueChange={(v) => set("itmsubgrpcd", v)} placeholder="Select sub group…" disabled={!form.itmgrpcd} />
                </FormField>

                <FormField label="Category">
                  <select className={selectCls()} value={form.itmcat} onChange={(e) => set("itmcat", e.target.value)}>
                    <option value="">Select category…</option>
                    {ITEM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>

                <FormField label="Packed Category">
                  <select className={selectCls()} value={form.itmsubcat} onChange={(e) => set("itmsubcat", e.target.value)}>
                    <option value="">Select…</option>
                    {PACKED_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>

                <FormField label="HSN Code">
                  <input type="text" className={inputCls()} placeholder="e.g. 15079000" value={form.hsncode} onChange={(e) => set("hsncode", e.target.value)} />
                </FormField>

                <div />
              </Section>

              {/* ── Packing Details ──────────────────────────────────── */}
              <Section
                title="Item Packing Details"
                icon={
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M7 1L1.5 4v6L7 13l5.5-3V4L7 1zM7 1v12M1.5 4l5.5 3 5.5-3" />
                  </svg>
                }
              >
                <FormField label="Filled Group">
                  <select className={selectCls()} value={form.itmcatgrp} onChange={(e) => set("itmcatgrp", e.target.value)}>
                    <option value="">Select…</option>
                    {FILLED_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </FormField>

                <FormField label="Filled Item">
                  <StyledCombobox items={fillItemItems} value={form.fillitmcd} onValueChange={(v) => set("fillitmcd", v)} placeholder="Select filled item…" />
                </FormField>

                <FormField label="Filled Brand">
                  <StyledCombobox items={brandItems} value={form.itmbrdcd} onValueChange={(v) => set("itmbrdcd", v)} placeholder="Select brand…" />
                </FormField>

                <FormField label="Loose Item">
                  <input type="text" className={inputCls()} placeholder="Loose item name" value={form.lsitmnm} onChange={(e) => set("lsitmnm", e.target.value)} />
                </FormField>

                <FormField label="Loose Item Unit">
                  <StyledCombobox items={unitItems} value={form.lsitmunt} onValueChange={(v) => set("lsitmunt", v)} placeholder="Select unit…" />
                </FormField>

                <FormField label="Packing Size">
                  <input type="number" step="1" className={inputCls()} value={form.pcksz} onChange={(e) => set("pcksz", parseInt(e.target.value) || 1)} />
                </FormField>

                <FormField label="Empty Box Weight">
                  <input type="number" step="any" className={inputCls()} value={form.emtbxwgt} onChange={(e) => set("emtbxwgt", parseFloat(e.target.value) || 0)} />
                </FormField>

                <div />
              </Section>

              {/* ── Unit of Measure ───────────────────────────────────── */}
              <Section
                title="Unit of Measure Details"
                icon={
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M2 12V2l2.5 2.5L7 2l2.5 2.5L12 2v10M2 8h10" />
                  </svg>
                }
              >
                <FormField label="Manage Stock">
                  <select className={selectCls()} value={form.stkmngin} onChange={(e) => set("stkmngin", e.target.value)}>
                    {UOM_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </FormField>

                <FormField label="Default Rate Applicable">
                  <select className={selectCls()} value={form.rateappon} onChange={(e) => set("rateappon", e.target.value)}>
                    {UOM_RATE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </FormField>

                <FormField label="Qty Unit" required error={errors.qtyitmunitcd}>
                  <StyledCombobox items={unitItems} value={form.qtyitmunitcd} onValueChange={(v) => set("qtyitmunitcd", v)} placeholder="Select qty unit…" hasError={!!errors.qtyitmunitcd} />
                </FormField>

                <FormField label="Wgt Unit" required error={errors.wgtitmunitcd}>
                  <StyledCombobox items={unitItems} value={form.wgtitmunitcd} onValueChange={(v) => set("wgtitmunitcd", v)} placeholder="Select wgt unit…" hasError={!!errors.wgtitmunitcd} />
                </FormField>

                <FormField label="Unit Conversion">
                  <select className={selectCls()} value={form.autowgtcalc} onChange={(e) => set("autowgtcalc", e.target.value)}>
                    {UNIT_CONVERSION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </FormField>

                <FormField label="Conversion Factor">
                  <input type="number" step="any" className={inputCls()} value={form.wgtconv} onChange={(e) => set("wgtconv", parseFloat(e.target.value) || 0)} />
                </FormField>

                <FormField label="Manage Order">
                  <select className={selectCls()} value={form.ordmngin} onChange={(e) => set("ordmngin", e.target.value)}>
                    {UOM_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </FormField>

                <FormField label="Sale">
                  <select className={selectCls()} value={String(form.sale)} onChange={(e) => set("sale", Number(e.target.value))}>
                    <option value="1">YES</option>
                    <option value="0">NO</option>
                  </select>
                </FormField>
              </Section>

              {/* ── Purchase Details ──────────────────────────────────── */}
              <Section
                title="Purchase Details"
                icon={
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M1.5 2h1.7l1.8 7h5.5l1.5-5H4.5" />
                    <circle cx="6" cy="12" r="0.75" fill="white" />
                    <circle cx="10" cy="12" r="0.75" fill="white" />
                  </svg>
                }
              >
                <FormField label="Purchase Order Required">
                  <select className={selectCls()} value={form.poreq} onChange={(e) => set("poreq", e.target.value)}>
                    <option value="1">YES</option>
                    <option value="0">NO</option>
                  </select>
                </FormField>

                <FormField label="Secondary Material">
                  <select className={selectCls()} value={form.smat} onChange={(e) => set("smat", e.target.value)}>
                    <option value="1">YES</option>
                    <option value="0">NO</option>
                  </select>
                </FormField>
              </Section>

              {/* ── Fix Assets ────────────────────────────────────────── */}
              <Section
                title="Fix Assets Details"
                icon={
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M7 1v2M7 11v2M1 7h2M11 7h2" />
                    <circle cx="7" cy="7" r="3" />
                  </svg>
                }
              >
                <FormField label="Depreciation Rate">
                  <div className="relative flex items-center">
                    <input type="number" step="any" className={inputCls() + " pr-7"} value={form.deprate} onChange={(e) => set("deprate", parseFloat(e.target.value) || 0)} />
                    <span className="absolute right-3 text-[12px] text-[#aaa] pointer-events-none">%</span>
                  </div>
                </FormField>

                <FormField label="Useful Life">
                  <input type="number" step="any" className={inputCls()} value={form.uselife} onChange={(e) => set("uselife", parseFloat(e.target.value) || 0)} />
                </FormField>
              </Section>

              {/* Form action buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={resetForm}
                  className="h-8 px-4 text-[12px] font-medium text-[#666] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-all duration-150"
                >
                  {isEdit ? "Cancel" : "Clear"}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`h-8 px-4 text-[12px] font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center gap-1.5
                    ${isEdit ? "bg-blue-600 hover:bg-blue-700" : "bg-[#1a1a1a] hover:bg-[#333]"}`}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin" width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                        <path d="M7 1a6 6 0 1 0 6 6" />
                      </svg>
                      {isEdit ? "Updating…" : "Saving…"}
                    </>
                  ) : (
                    <>
                      <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                        {isEdit
                          ? <path d="M2 10.5L4.5 11 11 4.5a1.77 1.77 0 0 0-2.5-2.5L2 8.5v2z" />
                          : <path d="M2 7l3.5 3.5L12 3" />
                        }
                      </svg>
                      {isEdit ? "Update Item" : "Save Item"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E8E6E1] flex items-center justify-between shrink-0">
          <span className="text-[13px] font-medium text-[#1a1a1a]">
            All Items
            <span className="ml-2 text-[11px] font-normal text-[#aaa]">{totalItems} total</span>
          </span>
          <div className="relative">
            <input
              type="text"
              placeholder="Search items…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-7 pl-7 pr-3 text-[12px] border border-[#E8E6E1] rounded-lg bg-[#FAFAF9] text-[#1a1a1a] placeholder:text-[#ccc] focus:outline-none focus:border-[#ccc] w-48 transition-all duration-150"
            />
            <svg className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="6" cy="6" r="4" />
              <path d="M9.5 9.5l2.5 2.5" />
            </svg>
            {/* Subtle loading indicator while fetching */}
            {isFetching && (
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin" width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round">
                <path d="M7 1a6 6 0 1 0 6 6" />
              </svg>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[12px] min-w-[960px]">
            <thead className="bg-[#FAFAF9]">
              <tr className="border-b border-[#E8E6E1]">
                {["Code", "Item Name", "Type", "Main Commodity", "Commodity", "Group", "Category", "Sale", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[#ccc] text-[12px]">
                    {isFetching ? "Loading…" : searchQuery ? "No items match your search" : "No items yet — create one above"}
                  </td>
                </tr>
              ) : (
                items.map((item: any) => {
                  const isRowEditing = editingId === item.rowid;
                  return (
                    // No motion.tr here — animating 25 rows on every page change
                    // causes unnecessary layout work; a plain tr is instant.
                    <tr
                      key={item.rowid}
                      className={`border-b border-[#F5F4F0] last:border-0 transition-colors duration-100 ${
                        isRowEditing ? "bg-blue-50/60" : "hover:bg-[#FAFAF9]"
                      }`}
                    >
                      <td className="px-4 py-3 text-[#aaa] font-mono whitespace-nowrap">{item.itrmcd}</td>
                      <td className="px-4 py-3 font-medium text-[#1a1a1a] whitespace-nowrap">{item.itmnm}</td>
                      <td className="px-4 py-3 text-[#666] whitespace-nowrap">{item.itmtypcd || "—"}</td>
                      <td className="px-4 py-3 text-[#666] whitespace-nowrap">{item.itmmaincomcd || "—"}</td>
                      <td className="px-4 py-3 text-[#666] whitespace-nowrap">{item.itmcomcd || "—"}</td>
                      <td className="px-4 py-3 text-[#666] whitespace-nowrap">{item.itmgrpcd || "—"}</td>
                      <td className="px-4 py-3 text-[#666] whitespace-nowrap">{item.itmcat || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
                          ${item.sale === 1 ? "bg-green-50 text-green-700" : "bg-[#F5F4F0] text-[#aaa]"}`}>
                          <span className={`w-1 h-1 rounded-full ${item.sale === 1 ? "bg-green-500" : "bg-[#ccc]"}`} />
                          {item.sale === 1 ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEdit(item)}
                            title="Edit"
                            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all duration-150 border
                              ${isRowEditing
                                ? "bg-blue-100 border-blue-200 text-blue-600"
                                : "bg-white border-[#E8E6E1] text-[#aaa] hover:border-[#C8C5BE] hover:text-[#555] hover:bg-[#F5F4F0]"}`}
                          >
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 10.5L4.5 11 11 4.5a1.77 1.77 0 0 0-2.5-2.5L2 8.5v2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ rowid: item.rowid, itmnm: item.itmnm })}
                            title="Delete"
                            className="w-7 h-7 rounded-md flex items-center justify-center border bg-white border-[#E8E6E1] text-[#aaa] hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
                          >
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1.5 3.5h11M5 3.5V2h4v1.5M3 3.5l.7 8h6.6l.7-8" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} pageCount={pageCount} total={totalItems} onPage={setPage} />
      </div>
    </div>
  );
}