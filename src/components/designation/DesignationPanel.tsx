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

// ── Combobox ───────────────────────────────────────────────────────────────────
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
          "z-50 min-w-[var(--radix-popover-trigger-width)]",
          "mt-1.5 p-1 rounded-xl border border-[#E8E6E1] bg-white",
          "shadow-[0_8px_24px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.05)]",
          "animate-in fade-in-0 zoom-in-95 duration-100"
        )}
      >
        <ComboboxEmpty className="py-7 text-center text-[12px] text-[#bbb] tracking-wide">
          No results found.
        </ComboboxEmpty>
        <ComboboxList className="max-h-[220px] overflow-y-auto scrollbar-none">
          {(item) => (
            <ComboboxItem
              key={item}
              value={item}
              className={cn(
                "flex items-center gap-2 px-2.5 py-[7px] rounded-lg",
                "text-[13px] text-[#1a1a1a] cursor-pointer select-none",
                "transition-colors duration-75 outline-none",
                "hover:bg-[#F5F4F0] data-[highlighted]:bg-[#F5F4F0]",
                "data-[selected]:font-medium data-[selected]:text-[#1a1a1a]",
                "data-[selected]:before:content-[''] data-[selected]:before:w-1 data-[selected]:before:h-1",
                "data-[selected]:before:rounded-full data-[selected]:before:bg-[#1a1a1a]/40 data-[selected]:before:shrink-0"
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

function Toast({ toast }: { toast: { type: "success" | "error"; msg: string } | null }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={`fixed top-[60px] right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium shadow-sm border
            ${toast.type === "success" ? "bg-white border-green-200 text-green-700" : "bg-white border-red-200 text-red-600"}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`} />
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DeleteModal({
  label, onConfirm, onCancel, isPending,
}: {
  label: string; onConfirm: () => void; onCancel: () => void; isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 4 }}
        transition={{ duration: 0.15 }}
        className="relative bg-white rounded-xl border border-[#E8E6E1] shadow-xl p-6 w-[340px] flex flex-col gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
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

function EditBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-7 h-7 rounded-md flex items-center justify-center border bg-white border-[#E8E6E1] text-[#aaa] hover:border-[#1a1a1a]/30 hover:text-[#1a1a1a] hover:bg-[#F5F4F0] transition-all duration-150"
    >
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" />
      </svg>
    </button>
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

// ── Category badge ─────────────────────────────────────────────────────────────
function CatBadge({ value }: { value: string }) {
  const isOffice = value === "OfficeStaff";
  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap",
      isOffice
        ? "bg-blue-50 text-blue-600"
        : "bg-orange-50 text-orange-600"
    )}>
      {isOffice ? "Office Staff" : "Plant Staff"}
    </span>
  );
}

// ─── DESIGNATION PANEL (mstdsgnfo) ────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { label: "Office Staff", value: "OfficeStaff" },
  { label: "Plant Staff",  value: "PlantStaff"  },
];

const defaultForm = {
  dsgnm:     "",
  dsgcat:    "OfficeStaff" as "OfficeStaff" | "PlantStaff",
  prntdsgcd: "",
};

type DesignationForm = typeof defaultForm;

export function DesignationPanelContent() {
  const [form, setForm]     = useState<DesignationForm>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof DesignationForm, string>>>({});
  const [editingRowid, setEditingRowid] = useState<number | null>(null);
  const [editingCode, setEditingCode]   = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ rowid: number; label: string } | null>(null);
  const [toast, setToast]   = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const { data: designations = [], refetch } = trpc.designation.getAll.useQuery();
  const { data: allForLookup = [] }          = trpc.designation.getAllForLookup.useQuery();

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const set = <K extends keyof DesignationForm>(key: K, val: DesignationForm[K]) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const handleEdit = (row: typeof designations[number]) => {
    setForm({
      dsgnm:     row.dsgnm,
      dsgcat:    row.dsgcat as "OfficeStaff" | "PlantStaff",
      prntdsgcd: row.prntdsgcd ?? "",
    });
    setEditingRowid(row.rowid);
    setEditingCode(row.dsgcd);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setForm(defaultForm);
    setErrors({});
    setEditingRowid(null);
    setEditingCode("");
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof DesignationForm, string>> = {};
    if (!form.dsgnm.trim()) errs.dsgnm = "Required";
    if (!form.dsgcat)       errs.dsgcat = "Required";
    if (Object.keys(errs).length) { setErrors(errs); return false; }
    setErrors({});
    return true;
  };

  const createMutation = trpc.designation.create.useMutation({
    onSuccess: () => {
      showToast("success", "Designation created");
      setForm(defaultForm);
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const updateMutation = trpc.designation.update.useMutation({
    onSuccess: () => {
      showToast("success", "Designation updated");
      handleCancelEdit();
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const deleteMutation = trpc.designation.delete.useMutation({
    onSuccess: () => {
      showToast("success", "Designation deleted");
      setDeleteTarget(null);
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      dsgnm:     form.dsgnm,
      dsgcat:    form.dsgcat,
      prntdsgcd: form.prntdsgcd,
    };
    if (editingRowid !== null) {
      updateMutation.mutate({ rowid: editingRowid, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isEditing = editingRowid !== null;

  // Exclude current row from parent options to prevent self-reference
  const parentOptions = allForLookup
    .filter((d) => d.dsgcd !== editingCode)
    .map((d) => ({ label: d.dsgnm, value: d.dsgcd }));

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
        <h2 className="text-[16px] font-medium text-[#1a1a1a]">Designations</h2>
        <p className="text-[12px] text-[#999] mt-0.5">Manage designation master data</p>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSave} className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">

        {/* Header */}
        <div className={cn(
          "px-5 py-3.5 border-b border-[#E8E6E1] flex items-center justify-between",
          isEditing && "bg-amber-50 border-amber-200"
        )}>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0",
              isEditing ? "bg-amber-500" : "bg-[#1a1a1a]"
            )}>
              {isEditing ? (
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" />
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="1" y="2" width="12" height="10" rx="1.5" />
                  <path d="M4 6h6M4 9h4" />
                </svg>
              )}
            </div>
            <span className="text-[13px] font-medium text-[#1a1a1a]">
              {isEditing
                ? <>Editing <span className="font-mono text-amber-600">{editingCode}</span></>
                : "Designation Information"
              }
            </span>
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium text-[#666] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-all duration-150"
            >
              <svg width="9" height="9" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M2 2l10 10M12 2L2 12" />
              </svg>
              Cancel edit
            </button>
          )}
        </div>

        {/* Fields */}
        <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">

          <FormField label="Designation Name" required>
            <input
              className={inputCls(!!errors.dsgnm)}
              placeholder="e.g. Senior Manager"
              value={form.dsgnm}
              onChange={(e) => set("dsgnm", e.target.value)}
            />
            {errors.dsgnm && <p className="text-[11px] text-red-400 mt-0.5">{errors.dsgnm}</p>}
          </FormField>

          <FormField label="Category" required>
            <StyledSelect
              value={form.dsgcat}
              onChange={(val) => set("dsgcat", val as DesignationForm["dsgcat"])}
              options={CATEGORY_OPTIONS}
              hasError={!!errors.dsgcat}
            />
            {errors.dsgcat && <p className="text-[11px] text-red-400 mt-0.5">{errors.dsgcat}</p>}
          </FormField>

          

          <div /> {/* spacer */}
        </div>

        {/* Footer */}
        <div className={cn(
          "px-5 py-3.5 border-t border-[#E8E6E1] flex items-center justify-between",
          isEditing ? "bg-amber-50/60" : "bg-[#FAFAF9]"
        )}>
          <p className="text-[11px] text-[#bbb]">
            {isEditing
              ? "Editing existing record — code unchanged"
              : "Code auto-generated (DSGA_____)"
            }
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={isEditing ? handleCancelEdit : () => { setForm(defaultForm); setErrors({}); }}
              className="h-8 px-4 text-[12px] font-medium text-[#666] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-all duration-150"
            >
              {isEditing ? "Cancel" : "Clear"}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={cn(
                "h-8 px-4 text-[12px] font-medium text-white rounded-lg disabled:opacity-50 transition-all duration-150 flex items-center gap-1.5",
                isEditing ? "bg-amber-500 hover:bg-amber-600" : "bg-[#1a1a1a] hover:bg-[#333]"
              )}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin" width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M7 1a6 6 0 1 0 6 6" /></svg>
                  {isEditing ? "Updating…" : "Saving…"}
                </>
              ) : (
                <>
                  {isEditing ? (
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" />
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><path d="M2 7l3.5 3.5L12 3" /></svg>
                  )}
                  {isEditing ? "Update" : "Save"}
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
            All Designations
            <span className="ml-2 text-[11px] font-normal text-[#aaa]">{designations.length} total</span>
          </span>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
              {["Code", "Designation Name", "Category", ""].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {designations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[12px] text-[#ccc]">
                  No designations yet. Add one above.
                </td>
              </tr>
            ) : (
              designations.map((d, i) => {
                const isRowEditing = editingRowid === d.rowid;
                return (
                  <motion.tr
                    key={d.rowid}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn(
                      "border-b border-[#F5F4F0] last:border-0 transition-colors",
                      isRowEditing ? "bg-amber-50/60" : "hover:bg-[#FAFAF9]"
                    )}
                  >
                    <td className="px-4 py-3 font-mono whitespace-nowrap">
                      <span className={cn("text-[11px]", isRowEditing ? "text-amber-600 font-semibold" : "text-[#aaa]")}>
                        {d.dsgcd}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1a1a1a]">{d.dsgnm}</td>
                    <td className="px-4 py-3">
                      <CatBadge value={d.dsgcat} />
                    </td>
                    
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <EditBtn onClick={() => handleEdit(d)} />
                        <TrashBtn onClick={() => setDeleteTarget({ rowid: d.rowid, label: d.dsgnm })} />
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}