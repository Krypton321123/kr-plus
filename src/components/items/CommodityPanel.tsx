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

// ─── Shared primitives ────────────────────────────────────────────────────────

const inputCls = (hasError?: boolean) =>
  `w-full h-9 px-3 text-[13px] bg-white border rounded-lg text-[#1a1a1a] placeholder:text-[#ccc]
   focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all duration-150
   ${hasError ? "border-red-300 bg-red-50/30" : "border-[#E8E6E1] hover:border-[#ccc]"}`;

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

// ── Styled native <select> ─────────────────────────────────────────────────────
function StyledSelect({
  value,
  onChange,
  options,
  hasError,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  hasError?: boolean;
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full h-9 px-3 text-[13px] rounded-lg border bg-white text-[#1a1a1a]",
        "focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all duration-150",
        "appearance-none cursor-pointer",
        hasError
          ? "border-red-300 bg-red-50/30"
          : "border-[#E8E6E1] hover:border-[#ccc]",
        !value && "text-[#ccc]"
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23aaa' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
        paddingRight: "28px",
      }}
    >
      {placeholder && (
        <option value="" disabled hidden>
          {placeholder}
        </option>
      )}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ── Yes / No toggle ────────────────────────────────────────────────────────────
function YesNoToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex h-9 rounded-lg border border-[#E8E6E1] overflow-hidden text-[12px] font-medium w-full">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "flex-1 flex items-center justify-center gap-1.5 transition-all duration-150",
          value
            ? "bg-[#1a1a1a] text-white border-r border-[#1a1a1a]"
            : "bg-white text-[#999] hover:bg-[#F5F4F0] border-r border-[#E8E6E1]"
        )}
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            value ? "bg-green-400" : "bg-[#ddd]"
          )}
        />
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "flex-1 flex items-center justify-center gap-1.5 transition-all duration-150",
          !value
            ? "bg-[#1a1a1a] text-white"
            : "bg-white text-[#999] hover:bg-[#F5F4F0]"
        )}
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            !value ? "bg-red-400" : "bg-[#ddd]"
          )}
        />
        No
      </button>
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
}: {
  items: { label: string; value: string }[];
  value: string;
  onValueChange: (val: string) => void;
  placeholder: string;
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
    >
      <ComboboxInput
        placeholder={placeholder}
        className={cn(
          "w-full h-9 px-3 text-[13px] rounded-lg border bg-white text-[#1a1a1a] placeholder:text-[#bbb]",
          "transition-all duration-150 outline-none",
          "focus:ring-2 focus:ring-[#1a1a1a]/8 focus:border-[#1a1a1a]",
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
                "data-selected:font-medium data-selected:text-[#1a1a1a]",
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
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}
          />
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
            <p className="text-[13px] font-medium text-[#1a1a1a]">Delete record?</p>
            <p className="text-[12px] text-[#999] mt-1 leading-relaxed">
              <span className="font-medium text-[#555]">{label}</span> will be permanently removed.
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
            className="h-8 px-4 text-[12px] font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all duration-150"
          >
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
      onClick={onClick}
      className="w-7 h-7 rounded-md flex items-center justify-center border bg-white border-[#E8E6E1] text-[#aaa] hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
    >
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1.5 3.5h11M5 3.5V2h4v1.5M3 3.5l.7 8h6.6l.7-8" />
      </svg>
    </button>
  );
}

// ─── Select option sets ───────────────────────────────────────────────────────

const STYPE_OPTIONS = [
  { label: "N/A",                   value: "N/A" },
  { label: "Finished Goods Packed", value: "FINISHED GOODS PACKED" },
  { label: "Finished Stock Loose",  value: "FINISHED STOCK LOOSE" },
  { label: "Raw Material Stock",    value: "RAW MATERIAL STOCK" },
  { label: "Finish Material Stock", value: "FINISH MATERIAL STOCK" },
  { label: "Store Parts",           value: "STORE PARTS" },
];

const SNATURE_OPTIONS = [
  { label: "N/A",        value: "N/A" },
  { label: "Lot Wise",   value: "LOTWISE" },
  { label: "Non Lot Wise", value: "NONLOTWISE" },
];

const RATETAX_OPTIONS = [
  { label: "Excluding Tax", value: "EXCLUDING TAX" },
  { label: "Including Tax", value: "INCLUDING TAX" },
];

const RATEAUTOCALC_OPTIONS = [
  { label: "Manual",    value: "MANUAL" },
  { label: "Automatic", value: "AUTOMATIC" },
];

// ─── COMMODITY PANEL (mstitmcomnfo) ───────────────────────────────────────────

const defaultCommodityForm = {
  // existing
  itmcomnm:     "",
  itmcomshnm:   "",
  itmmaincomcd: "",
  itmcomtxcd:   "",
  // new
  itcrate:      0,
  stype:        "N/A" as typeof STYPE_OPTIONS[number]["value"],
  snature:      "N/A" as typeof SNATURE_OPTIONS[number]["value"],
  poreq:        false,   // false = 0, true = 1
  ratetax:      "EXCLUDING TAX" as typeof RATETAX_OPTIONS[number]["value"],
  srcmng:       false,   // false = "NO", true = "YES"
  rateautocalc: "MANUAL" as typeof RATEAUTOCALC_OPTIONS[number]["value"],
};

type CommodityForm = typeof defaultCommodityForm;

export function CommodityPanelContent() {
  const [form, setForm]     = useState<CommodityForm>(defaultCommodityForm);
  const [errors, setErrors] = useState<Partial<Record<keyof CommodityForm, string>>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ rowid: number; label: string } | null>(null);
  const [toast, setToast]   = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const { data: commodities = [], refetch } = trpc.commodity.getAll.useQuery();
  const { data: mainCommodities = [] }      = trpc.mainCommodity.getAll.useQuery();

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // Generic setter — clears that field's error on change
  const set = <K extends keyof CommodityForm>(key: K, val: CommodityForm[K]) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const createMutation = trpc.commodity.create.useMutation({
    onSuccess: () => {
      showToast("success", "Commodity created");
      setForm(defaultCommodityForm);
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const deleteMutation = trpc.commodity.delete.useMutation({
    onSuccess: () => {
      showToast("success", "Commodity deleted");
      setDeleteTarget(null);
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Partial<Record<keyof CommodityForm, string>> = {};
    if (!form.itmcomnm.trim())   errs.itmcomnm   = "Required";
    if (!form.itmcomshnm.trim()) errs.itmcomshnm  = "Required";
    if (!form.itmmaincomcd)      errs.itmmaincomcd = "Required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    createMutation.mutate({
      itmcomnm:     form.itmcomnm,
      itmcomshnm:   form.itmcomshnm,
      itmmaincomcd: form.itmmaincomcd,
      itmcomtxcd:   form.itmcomtxcd,
      itcrate:      form.itcrate,
      stype:        form.stype as any,
      snature:      form.snature as any,
      poreq:        form.poreq ? 1 : 0,
      ratetax:      form.ratetax as any,
      srcmng:       form.srcmng ? "YES" : "NO",
      rateautocalc: form.rateautocalc as any,
    });
  };

  const mainComOptions = mainCommodities.map((m) => ({
    label: m.itmmaincomnm,
    value: m.itmmaincomcd,
  }));

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

      <div>
        <h2 className="text-[16px] font-medium text-[#1a1a1a]">Commodities</h2>
        <p className="text-[12px] text-[#999] mt-0.5">Manage commodity master data</p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        {/* ── Section header ── */}
        <div className="px-5 py-3.5 border-b border-[#E8E6E1] flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#1a1a1a] flex items-center justify-center shrink-0">
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
              <rect x="1" y="2" width="12" height="10" rx="1.5" />
              <path d="M4 6h6M4 9h4" />
            </svg>
          </div>
          <span className="text-[13px] font-medium text-[#1a1a1a]">Commodity Information</span>
        </div>

        <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">

          {/* ── Row 1: basic identity ── */}
          <FormField label="Commodity Name" required>
            <input
              className={inputCls(!!errors.itmcomnm)}
              placeholder="e.g. Mobile Phones"
              value={form.itmcomnm}
              onChange={(e) => set("itmcomnm", e.target.value)}
            />
            {errors.itmcomnm && <p className="text-[11px] text-red-400 mt-0.5">{errors.itmcomnm}</p>}
          </FormField>

          <FormField label="Short Name" required>
            <input
              className={inputCls(!!errors.itmcomshnm)}
              placeholder="e.g. MOB"
              value={form.itmcomshnm}
              onChange={(e) => set("itmcomshnm", e.target.value)}
            />
            {errors.itmcomshnm && <p className="text-[11px] text-red-400 mt-0.5">{errors.itmcomshnm}</p>}
          </FormField>

          {/* ── Row 2: classification ── */}
          <FormField label="Main Commodity" required>
            <StyledCombobox
              items={mainComOptions}
              value={form.itmmaincomcd}
              onValueChange={(val) => set("itmmaincomcd", val)}
              placeholder="Search main commodity…"
              hasError={!!errors.itmmaincomcd}
            />
            {errors.itmmaincomcd && <p className="text-[11px] text-red-400 mt-0.5">{errors.itmmaincomcd}</p>}
          </FormField>

          <FormField label="Tax Code">
            <input
              className={inputCls()}
              placeholder="e.g. GST18"
              value={form.itmcomtxcd}
              onChange={(e) => set("itmcomtxcd", e.target.value)}
            />
          </FormField>

          {/* ── Divider label ── */}
          <div className="col-span-2 pt-1">
            <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-[#bbb] border-b border-[#F0EEE9] pb-2">
              Stock &amp; Rate Configuration
            </p>
          </div>

          {/* ── Row 3 ── */}
          <FormField label="Stock Type">
            <StyledSelect
              value={form.stype}
              onChange={(val) => set("stype", val as CommodityForm["stype"])}
              options={STYPE_OPTIONS}
            />
          </FormField>

          <FormField label="Stock Nature">
            <StyledSelect
              value={form.snature}
              onChange={(val) => set("snature", val as CommodityForm["snature"])}
              options={SNATURE_OPTIONS}
            />
          </FormField>

          {/* ── Row 4 ── */}
          <FormField label="IT C Rate">
            <input
              type="number"
              min={0}
              className={inputCls()}
              placeholder="0"
              value={form.itcrate === 0 ? "" : form.itcrate}
              onChange={(e) => set("itcrate", e.target.value === "" ? 0 : Number(e.target.value))}
            />
          </FormField>

          <FormField label="Rate Tax">
            <StyledSelect
              value={form.ratetax}
              onChange={(val) => set("ratetax", val as CommodityForm["ratetax"])}
              options={RATETAX_OPTIONS}
            />
          </FormField>

          {/* ── Row 5 ── */}
          <FormField label="Rate Auto Calc">
            <StyledSelect
              value={form.rateautocalc}
              onChange={(val) => set("rateautocalc", val as CommodityForm["rateautocalc"])}
              options={RATEAUTOCALC_OPTIONS}
            />
          </FormField>

          {/* spacer to keep grid tidy */}
          <div />

          {/* ── Divider label ── */}
          <div className="col-span-2 pt-1">
            <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-[#bbb] border-b border-[#F0EEE9] pb-2">
              Flags
            </p>
          </div>

          {/* ── Row 6: yes/no toggles ── */}
          <FormField label="PO Required">
            <YesNoToggle
              value={form.poreq}
              onChange={(val) => set("poreq", val)}
            />
          </FormField>

          <FormField label="Source Managed">
            <YesNoToggle
              value={form.srcmng}
              onChange={(val) => set("srcmng", val)}
            />
          </FormField>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3.5 border-t border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between">
          <p className="text-[11px] text-[#bbb]">Code auto-generated (ICCA_____)</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setForm(defaultCommodityForm); setErrors({}); }}
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
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* ── Table ── */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E8E6E1]">
          <span className="text-[13px] font-medium text-[#1a1a1a]">
            All Commodities
            <span className="ml-2 text-[11px] font-normal text-[#aaa]">{commodities.length} total</span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
                {[
                  "Code", "Commodity Name", "Short Name", "Main Commodity",
                  "Tax Code", "Stock Type", "Nature", "ITC Rate",
                  "Rate Tax", "Auto Calc", "PO Req", "Src Mng", "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commodities.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-10 text-center text-[12px] text-[#ccc]">
                    No commodities yet. Add one above.
                  </td>
                </tr>
              ) : (
                commodities.map((c, i) => (
                  <motion.tr
                    key={c.rowid}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-[#F5F4F0] last:border-0 hover:bg-[#FAFAF9] transition-colors"
                  >
                    <td className="px-4 py-3 text-[#aaa] font-mono whitespace-nowrap">{c.itmcomcd}</td>
                    <td className="px-4 py-3 font-medium text-[#1a1a1a] whitespace-nowrap">{c.itmcomnm}</td>
                    <td className="px-4 py-3 text-[#666]">{c.itmcomshnm}</td>
                    <td className="px-4 py-3 text-[#666] whitespace-nowrap">{c.mainCommodityName ?? c.itmmaincomcd}</td>
                    <td className="px-4 py-3 text-[#aaa] font-mono">{c.itmcomtxcd || "—"}</td>
                    <td className="px-4 py-3 text-[#666] whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-[#F5F4F0] text-[10px] font-medium text-[#666]">
                        {c.stype || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#666]">{c.snature || "—"}</td>
                    <td className="px-4 py-3 text-[#666] text-right tabular-nums">{c.itcrate}</td>
                    <td className="px-4 py-3 text-[#666] whitespace-nowrap">{c.ratetax || "—"}</td>
                    <td className="px-4 py-3 text-[#666]">{c.rateautocalc || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                        c.poreq === 1
                          ? "bg-green-50 text-green-600"
                          : "bg-[#F5F4F0] text-[#aaa]"
                      )}>
                        {c.poreq === 1 ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                        c.srcmng === "YES"
                          ? "bg-green-50 text-green-600"
                          : "bg-[#F5F4F0] text-[#aaa]"
                      )}>
                        {c.srcmng === "YES" ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <TrashBtn onClick={() => setDeleteTarget({ rowid: c.rowid, label: c.itmcomnm })} />
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}