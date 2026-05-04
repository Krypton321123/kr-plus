"use client";

import { useState } from "react";
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

const GODOWN_TYPES = ["GODOWN", "VAN", "TANK"] as const;

const STOCK_CATEGORIES = [
  "FINISHED GOODS PACKED",
  "FINISHED STOCK LOOSE",
  "RAW MATERIAL STOCK",
  "FINISH MATERIAL STOCK",
  "STORE PARTS",
] as const;

// ─── Shared primitives ────────────────────────────────────────────────────────

const inputCls = (hasError?: boolean) =>
  `w-full h-9 px-3 text-[13px] bg-white border rounded-lg text-[#1a1a1a] placeholder:text-[#ccc]
   focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all duration-150
   ${hasError ? "border-red-300 bg-red-50/30" : "border-[#E8E6E1] hover:border-[#ccc]"}`;

const selectCls = (hasError?: boolean) =>
  `w-full h-9 px-3 text-[13px] bg-white border rounded-lg text-[#1a1a1a]
   hover:border-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]
   transition-all duration-150 cursor-pointer
   ${hasError ? "border-red-300 bg-red-50/30" : "border-[#E8E6E1]"}`;

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#999]">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// Reusable styled combobox
function StyledCombobox({
  items,
  value,
  onValueChange,
  placeholder,
  hasError,
  disabled,
}: {
  items: { label: string; value: string }[];
  value: string;
  onValueChange: (val: string) => void;
  placeholder: string;
  hasError?: boolean;
  disabled?: boolean;
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
        placeholder={placeholder}
        className={cn(
          "w-full h-9 px-3 text-[13px] rounded-lg border bg-white text-[#1a1a1a] placeholder:text-[#bbb]",
          "transition-all duration-150 outline-none",
          "focus:ring-2 focus:ring-[#1a1a1a]/8 focus:border-[#1a1a1a]",
          disabled && "opacity-50 cursor-not-allowed bg-[#FAFAF9]",
          hasError
            ? "border-red-300 bg-red-50/40"
            : "border-[#E8E6E1] hover:border-[#C8C5BE]"
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
        <ComboboxList className="max-h-55 overflow-y-auto scrollbar-none">
          {(item) => (
            <ComboboxItem
              key={item}
              value={item}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.75 rounded-lg",
                "text-[13px] text-[#1a1a1a] cursor-pointer select-none",
                "transition-colors duration-75 outline-none",
                "hover:bg-[#F5F4F0] data-highlighted:bg-[#F5F4F0]",
                "data-selected:font-medium",
                "data-selected:before:content-[''] data-selected:before:w-1 data-selected:before:h-1",
                "data-selected:before:rounded-full data-selected:before:bg-[#1a1a1a]/40 data-selected:before:shrink-0"
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

function Toast({
  toast,
}: {
  toast: { type: "success" | "error"; msg: string } | null;
}) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={`fixed top-15 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium shadow-sm border
            ${toast.type === "success"
              ? "bg-white border-green-200 text-green-700"
              : "bg-white border-red-200 text-red-600"
            }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`} />
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DeleteModal({
  label,
  onConfirm,
  onCancel,
  isPending,
}: {
  label: string;
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
        className="relative bg-white rounded-xl border border-[#E8E6E1] shadow-xl p-6 w-85 flex flex-col gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0 mt-0.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round">
              <path d="M7 2v5M7 10v.5" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#1a1a1a]">Delete godown?</p>
            <p className="text-[12px] text-[#999] mt-1 leading-relaxed">
              <span className="font-medium text-[#555]">{label}</span> and all its commodity assignments will be permanently removed.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onCancel} className="h-8 px-4 text-[12px] font-medium text-[#666] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-all duration-150">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isPending} className="h-8 px-4 text-[12px] font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all duration-150">
            {isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function TrashBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-7 h-7 rounded-md flex items-center justify-center border bg-white border-[#E8E6E1] text-[#aaa] hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
    >
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1.5 3.5h11M5 3.5V2h4v1.5M3 3.5l.7 8h6.6l.7-8" />
      </svg>
    </button>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommodityRow {
  itmmaincomcd: string;
  itmcomcd: string;
  // display names resolved locally
  mainComName: string;
  comName: string;
}

const defaultForm = {
  untcd: "",
  stkcat: "FINISHED GOODS PACKED" as string,
  gwntyp: "GODOWN" as string,
  gwnnm: "",
  // non-UI fields — sensible defaults
  hgt: 0,
  rel: 0,
  slsmancd: "",
  drvcd: "",
  mmlgwncd: "",
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function GodownPanelContent() {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof defaultForm | "commodities", string>>>({});
  const [commodityRows, setCommodityRows] = useState<CommodityRow[]>([]);

  // Commodity picker state (the add-row controls)
  const [pickedMainComcd, setPickedMainComcd] = useState("");
  const [pickedComcd, setPickedComcd] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<{ rowid: number; label: string } | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: units = [] } = trpc.godown.getUnits.useQuery();
  const { data: godowns = [], refetch } = trpc.godown.getAll.useQuery();
  const { data: mainCommodities = [] } = trpc.mainCommodity.getAll.useQuery();
  const { data: allCommodities = [] } = trpc.commodity.getAll.useQuery();

  // Filter commodities by selected main commodity
  const filteredCommodities = pickedMainComcd
    ? allCommodities.filter((c) => c.itmmaincomcd === pickedMainComcd)
    : [];

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const set = <K extends keyof typeof defaultForm>(key: K, val: typeof defaultForm[K]) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = trpc.godown.create.useMutation({
    onSuccess: () => {
      showToast("success", "Godown created successfully");
      resetForm();
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const deleteMutation = trpc.godown.delete.useMutation({
    onSuccess: () => {
      showToast("success", "Godown deleted");
      setDeleteTarget(null);
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm(defaultForm);
    setErrors({});
    setCommodityRows([]);
    setPickedMainComcd("");
    setPickedComcd("");
  };

  const handleAddCommodity = () => {
    if (!pickedMainComcd || !pickedComcd) return;

    // Prevent duplicates
    if (commodityRows.some((r) => r.itmcomcd === pickedComcd)) {
      showToast("error", "This commodity is already added");
      return;
    }

    const mainCom = mainCommodities.find((m) => m.itmmaincomcd === pickedMainComcd);
    const com = allCommodities.find((c) => c.itmcomcd === pickedComcd);

    setCommodityRows((p) => [
      ...p,
      {
        itmmaincomcd: pickedMainComcd,
        itmcomcd: pickedComcd,
        mainComName: mainCom?.itmmaincomnm ?? pickedMainComcd,
        comName: com?.itmcomnm ?? pickedComcd,
      },
    ]);
    // Reset only commodity picker, keep main com selected for quick multi-add
    setPickedComcd("");
  };

  const handleRemoveCommodity = (itmcomcd: string) => {
    setCommodityRows((p) => p.filter((r) => r.itmcomcd !== itmcomcd));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!form.untcd) errs.untcd = "Required";
    if (!form.gwnnm.trim()) errs.gwnnm = "Required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    createMutation.mutate({
      ...form,
      commodities: commodityRows.map((r) => ({
        itmmaincomcd: r.itmmaincomcd,
        itmcomcd: r.itmcomcd,
      })),
    });
  };

  const unitOptions = units.map((u) => ({ label: u.untnm, value: u.untcd }));
  const mainComOptions = mainCommodities.map((m) => ({ label: m.itmmaincomnm, value: m.itmmaincomcd }));
  const comOptions = filteredCommodities.map((c) => ({ label: c.itmcomnm, value: c.itmcomcd }));

  return (
    <div className="flex flex-col gap-5">
      <Toast toast={toast} />
      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal
            label={deleteTarget.label}
            onConfirm={() => deleteMutation.mutate({ rowid: deleteTarget.rowid })}
            onCancel={() => setDeleteTarget(null)}
            isPending={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Page header */}
      <div>
        <h2 className="text-[16px] font-medium text-[#1a1a1a]">Manage Godowns</h2>
        <p className="text-[12px] text-[#999] mt-0.5">Create and manage godown, van, and tank locations</p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">

        {/* ── Section 1: Godown Information ───────────────────────────────── */}
        <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E8E6E1] flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#1a1a1a] flex items-center justify-center shrink-0">
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                <path d="M1 6.5L7 2l6 4.5V13H9v-3H5v3H1V6.5z" />
              </svg>
            </div>
            <span className="text-[13px] font-medium text-[#1a1a1a]">Godown Information</span>
          </div>

          <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">
            {/* Unit Name */}
            <FormField label="Unit Name" required>
              <StyledCombobox
                items={unitOptions}
                value={form.untcd}
                onValueChange={(val) => set("untcd", val)}
                placeholder="Search unit…"
                hasError={!!errors.untcd}
              />
              {errors.untcd && <p className="text-[11px] text-red-400 mt-0.5">{errors.untcd}</p>}
            </FormField>

            {/* Stock Category */}
            <FormField label="Stock Category" required>
              <select
                className={selectCls()}
                value={form.stkcat}
                onChange={(e) => set("stkcat", e.target.value)}
              >
                {STOCK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FormField>

            {/* Type */}
            <FormField label="Type" required>
              <select
                className={selectCls()}
                value={form.gwntyp}
                onChange={(e) => set("gwntyp", e.target.value)}
              >
                {GODOWN_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </FormField>

            {/* Name */}
            <FormField label="Name" required>
              <input
                className={inputCls(!!errors.gwnnm)}
                placeholder="e.g. Main Godown A"
                value={form.gwnnm}
                onChange={(e) => set("gwnnm", e.target.value)}
              />
              {errors.gwnnm && <p className="text-[11px] text-red-400 mt-0.5">{errors.gwnnm}</p>}
            </FormField>
          </div>
        </div>

        {/* ── Section 2: Godown Commodity Information ──────────────────────── */}
        <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E8E6E1] flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#1a1a1a] flex items-center justify-center shrink-0">
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                <rect x="1" y="2" width="12" height="10" rx="1.5" />
                <path d="M4 6h6M4 9h4" />
              </svg>
            </div>
            <span className="text-[13px] font-medium text-[#1a1a1a]">Godown Commodity Information</span>
            <span className="ml-auto text-[11px] text-[#aaa]">{commodityRows.length} added</span>
          </div>

          {/* Picker row */}
          <div className="px-5 pt-4 pb-3 flex items-end gap-3 border-b border-[#F5F4F0]">
            {/* Main commodity picker */}
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#999]">Main Commodity</label>
              <StyledCombobox
                items={mainComOptions}
                value={pickedMainComcd}
                onValueChange={(val) => {
                  setPickedMainComcd(val);
                  setPickedComcd(""); // reset child when parent changes
                }}
                placeholder="Select main commodity…"
              />
            </div>

            {/* Commodity picker — enabled only after main com is selected */}
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#999]">Commodity</label>
              <StyledCombobox
                items={comOptions}
                value={pickedComcd}
                onValueChange={setPickedComcd}
                placeholder={pickedMainComcd ? "Select commodity…" : "Select main commodity first…"}
                disabled={!pickedMainComcd}
              />
            </div>

            {/* Add button */}
            <button
              type="button"
              onClick={handleAddCommodity}
              disabled={!pickedMainComcd || !pickedComcd}
              className="h-9 px-4 text-[12px] font-medium text-white bg-[#1a1a1a] rounded-lg hover:bg-[#333] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 flex items-center gap-1.5 shrink-0"
            >
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M7 1v12M1 7h12" />
              </svg>
              Add
            </button>
          </div>

          {/* Commodity rows table */}
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] w-8">#</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa]">Main Commodity</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa]">Commodity Name</th>
                <th className="px-4 py-2.5 w-12" />
              </tr>
            </thead>
            <tbody>
              {commodityRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[12px] text-[#ccc]">
                    No commodities added yet — use the picker above to add
                  </td>
                </tr>
              ) : (
                commodityRows.map((row, i) => (
                  <motion.tr
                    key={row.itmcomcd}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="border-b border-[#F5F4F0] last:border-0 hover:bg-[#FAFAF9] transition-colors"
                  >
                    <td className="px-4 py-3 text-[#ccc] font-mono">{i + 1}</td>
                    <td className="px-4 py-3 text-[#666]">{row.mainComName}</td>
                    <td className="px-4 py-3 font-medium text-[#1a1a1a]">{row.comName}</td>
                    <td className="px-4 py-3">
                      <TrashBtn onClick={() => handleRemoveCommodity(row.itmcomcd)} />
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] text-[#bbb]">Godown code auto-generated (GWNA_____)</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="h-8 px-4 text-[12px] font-medium text-[#666] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-all duration-150"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="h-8 px-4 text-[12px] font-medium text-white bg-[#1a1a1a] rounded-lg hover:bg-[#333] disabled:opacity-50 transition-all duration-150 flex items-center gap-1.5"
            >
              {createMutation.isPending ? (
                <>
                  <svg className="animate-spin" width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M7 1a6 6 0 1 0 6 6" /></svg>
                  Saving…
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><path d="M2 7l3.5 3.5L12 3" /></svg>
                  Save Godown
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* ── Godowns Table ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E8E6E1]">
          <span className="text-[13px] font-medium text-[#1a1a1a]">
            All Godowns
            <span className="ml-2 text-[11px] font-normal text-[#aaa]">{godowns.length} total</span>
          </span>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
              {["Code", "Name", "Unit", "Type", "Stock Category", "Commodities", ""].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {godowns.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[12px] text-[#ccc]">No godowns yet. Create one above.</td>
              </tr>
            ) : (
              godowns.map((g, i) => (
                <motion.tr
                  key={g.rowid}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[#F5F4F0] last:border-0 hover:bg-[#FAFAF9] transition-colors"
                >
                  <td className="px-4 py-3 text-[#aaa] font-mono">{g.gwncd}</td>
                  <td className="px-4 py-3 font-medium text-[#1a1a1a]">{g.gwnnm}</td>
                  <td className="px-4 py-3 text-[#666]">{g.unitName ?? g.untcd}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                      g.gwntyp === "GODOWN" && "bg-blue-50 text-blue-700",
                      g.gwntyp === "VAN"    && "bg-amber-50 text-amber-700",
                      g.gwntyp === "TANK"   && "bg-purple-50 text-purple-700",
                    )}>
                      {g.gwntyp}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#666] text-[11px]">{g.stkcat}</td>
                  <td className="px-4 py-3 text-[#aaa]">
                    {g.commodityCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F5F4F0] text-[#666]">
                        {g.commodityCount} {g.commodityCount === 1 ? "commodity" : "commodities"}
                      </span>
                    ) : (
                      <span className="text-[#ddd]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDeleteTarget({ rowid: g.rowid, label: g.gwnnm })}
                      className="w-7 h-7 rounded-md flex items-center justify-center border bg-white border-[#E8E6E1] text-[#aaa] hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
                    >
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1.5 3.5h11M5 3.5V2h4v1.5M3 3.5l.7 8h6.6l.7-8" />
                      </svg>
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}