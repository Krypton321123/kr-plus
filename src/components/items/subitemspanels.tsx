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

// Reusable styled combobox — same pattern as UsersPanelContent
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

// ─── COMMODITY PANEL (mstitmcomnfo) ───────────────────────────────────────────

const defaultCommodityForm = {
  itmcomnm: "",
  itmcomshnm: "",
  itmmaincomcd: "",
  itmcomtxcd: "",
};

export function CommodityPanelContent() {
  const [form, setForm] = useState(defaultCommodityForm);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof defaultCommodityForm, string>>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ rowid: number; label: string } | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const { data: commodities = [], refetch } = trpc.commodity.getAll.useQuery();
  const { data: mainCommodities = [] } = trpc.mainCommodity.getAll.useQuery();

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const set = <K extends keyof typeof defaultCommodityForm>(key: K, val: string) => {
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
    const errs: typeof errors = {};
    if (!form.itmcomnm.trim()) errs.itmcomnm = "Required";
    if (!form.itmcomshnm.trim()) errs.itmcomshnm = "Required";
    if (!form.itmmaincomcd) errs.itmmaincomcd = "Required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    createMutation.mutate(form);
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
          {/* Commodity Name */}
          <FormField label="Commodity Name" required>
            <input
              className={inputCls(!!errors.itmcomnm)}
              placeholder="e.g. Mobile Phones"
              value={form.itmcomnm}
              onChange={(e) => set("itmcomnm", e.target.value)}
            />
            {errors.itmcomnm && <p className="text-[11px] text-red-400 mt-0.5">{errors.itmcomnm}</p>}
          </FormField>

          {/* Short Name */}
          <FormField label="Short Name" required>
            <input
              className={inputCls(!!errors.itmcomshnm)}
              placeholder="e.g. MOB"
              value={form.itmcomshnm}
              onChange={(e) => set("itmcomshnm", e.target.value)}
            />
            {errors.itmcomshnm && <p className="text-[11px] text-red-400 mt-0.5">{errors.itmcomshnm}</p>}
          </FormField>

          {/* Main Commodity — Combobox */}
          <FormField label="Main Commodity Name" required>
            <StyledCombobox
              items={mainComOptions}
              value={form.itmmaincomcd}
              onValueChange={(val) => set("itmmaincomcd", val)}
              placeholder="Search main commodity…"
              hasError={!!errors.itmmaincomcd}
            />
            {errors.itmmaincomcd && <p className="text-[11px] text-red-400 mt-0.5">{errors.itmmaincomcd}</p>}
          </FormField>

          {/* Tax Code */}
          <FormField label="Tax Code">
            <input
              className={inputCls()}
              placeholder="e.g. GST18"
              value={form.itmcomtxcd}
              onChange={(e) => set("itmcomtxcd", e.target.value)}
            />
          </FormField>
        </div>

        <div className="px-5 py-3.5 border-t border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between">
          <p className="text-[11px] text-[#bbb]">Code auto-generated (ICMA_____)</p>
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

      {/* Table */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E8E6E1]">
          <span className="text-[13px] font-medium text-[#1a1a1a]">
            All Commodities
            <span className="ml-2 text-[11px] font-normal text-[#aaa]">{commodities.length} total</span>
          </span>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
              {["Code", "Commodity Name", "Short Name", "Main Commodity", "Tax Code", ""].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {commodities.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[12px] text-[#ccc]">No commodities yet. Add one above.</td>
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
                  <td className="px-4 py-3 text-[#aaa] font-mono">{c.itmcomcd}</td>
                  <td className="px-4 py-3 font-medium text-[#1a1a1a]">{c.itmcomnm}</td>
                  <td className="px-4 py-3 text-[#666]">{c.itmcomshnm}</td>
                  <td className="px-4 py-3 text-[#666]">{c.mainCommodityName ?? c.itmmaincomcd}</td>
                  <td className="px-4 py-3 text-[#aaa] font-mono">{c.itmcomtxcd || "—"}</td>
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
  );
}

// ─── ITEM SUB-GROUP PANEL (mstitmsubgrpnfo) ───────────────────────────────────

const defaultSubGroupForm = {
  itmsubgrpnm: "",
  itmsubgrpshnm: "",
  itmgrpcd: "",
};

export function ItemSubGroupPanelContent() {
  const [form, setForm] = useState(defaultSubGroupForm);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof defaultSubGroupForm, string>>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ rowid: number; label: string } | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const { data: subGroups = [], refetch } = trpc.itemSubGroup.getAll.useQuery();
  const { data: groups = [] } = trpc.itemGroup.getAll.useQuery();

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const set = <K extends keyof typeof defaultSubGroupForm>(key: K, val: string) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const createMutation = trpc.itemSubGroup.create.useMutation({
    onSuccess: () => {
      showToast("success", "Sub-group created");
      setForm(defaultSubGroupForm);
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const deleteMutation = trpc.itemSubGroup.delete.useMutation({
    onSuccess: () => {
      showToast("success", "Sub-group deleted");
      setDeleteTarget(null);
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!form.itmsubgrpnm.trim()) errs.itmsubgrpnm = "Required";
    if (!form.itmsubgrpshnm.trim()) errs.itmsubgrpshnm = "Required";
    if (!form.itmgrpcd) errs.itmgrpcd = "Required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    createMutation.mutate(form);
  };

  const groupOptions = groups.map((g) => ({
    label: g.itmgrpnm,
    value: g.itmgrpcd,
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
        <h2 className="text-[16px] font-medium text-[#1a1a1a]">Item Sub-Groups</h2>
        <p className="text-[12px] text-[#999] mt-0.5">Manage item sub-group master data</p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E8E6E1] flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#1a1a1a] flex items-center justify-center shrink-0">
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
              <rect x="1" y="2" width="12" height="10" rx="1.5" />
              <path d="M4 6h6M4 9h4" />
            </svg>
          </div>
          <span className="text-[13px] font-medium text-[#1a1a1a]">Item Sub-Group Information</span>
        </div>

        <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">
          {/* Sub-Group Name */}
          <FormField label="Item Sub-Group Name" required>
            <input
              className={inputCls(!!errors.itmsubgrpnm)}
              placeholder="e.g. Smartphones"
              value={form.itmsubgrpnm}
              onChange={(e) => set("itmsubgrpnm", e.target.value)}
            />
            {errors.itmsubgrpnm && <p className="text-[11px] text-red-400 mt-0.5">{errors.itmsubgrpnm}</p>}
          </FormField>

          {/* Short Name */}
          <FormField label="Short Name" required>
            <input
              className={inputCls(!!errors.itmsubgrpshnm)}
              placeholder="e.g. SMRT"
              value={form.itmsubgrpshnm}
              onChange={(e) => set("itmsubgrpshnm", e.target.value)}
            />
            {errors.itmsubgrpshnm && <p className="text-[11px] text-red-400 mt-0.5">{errors.itmsubgrpshnm}</p>}
          </FormField>

          {/* Parent Item Group — Combobox */}
          <FormField label="Item Group Name" required>
            <StyledCombobox
              items={groupOptions}
              value={form.itmgrpcd}
              onValueChange={(val) => set("itmgrpcd", val)}
              placeholder="Search item group…"
              hasError={!!errors.itmgrpcd}
            />
            {errors.itmgrpcd && <p className="text-[11px] text-red-400 mt-0.5">{errors.itmgrpcd}</p>}
          </FormField>

          <div /> {/* spacer */}
        </div>

        <div className="px-5 py-3.5 border-t border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between">
          <p className="text-[11px] text-[#bbb]">Code auto-generated (ISGA_____)</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setForm(defaultSubGroupForm); setErrors({}); }}
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

      {/* Table */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E8E6E1]">
          <span className="text-[13px] font-medium text-[#1a1a1a]">
            All Sub-Groups
            <span className="ml-2 text-[11px] font-normal text-[#aaa]">{subGroups.length} total</span>
          </span>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
              {["Code", "Sub-Group Name", "Short Name", "Parent Group", ""].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subGroups.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[12px] text-[#ccc]">No sub-groups yet. Add one above.</td>
              </tr>
            ) : (
              subGroups.map((sg, i) => (
                <motion.tr
                  key={sg.rowid}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[#F5F4F0] last:border-0 hover:bg-[#FAFAF9] transition-colors"
                >
                  <td className="px-4 py-3 text-[#aaa] font-mono">{sg.itmsubgrpcd}</td>
                  <td className="px-4 py-3 font-medium text-[#1a1a1a]">{sg.itmsubgrpnm}</td>
                  <td className="px-4 py-3 text-[#666]">{sg.itmsubgrpshnm}</td>
                  <td className="px-4 py-3 text-[#666]">{sg.parentGroupName ?? sg.itmgrpcd}</td>
                  <td className="px-4 py-3">
                    <TrashBtn onClick={() => setDeleteTarget({ rowid: sg.rowid, label: sg.itmsubgrpnm })} />
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