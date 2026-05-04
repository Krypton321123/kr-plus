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
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", value ? "bg-green-400" : "bg-[#ddd]")} />
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
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", !value ? "bg-red-400" : "bg-[#ddd]")} />
        No
      </button>
    </div>
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

// ── Edit pencil button ─────────────────────────────────────────────────────────
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

function FlagBadge({ value }: { value: string }) {
  const yes = value === "Y";
  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-[10px] font-semibold",
      yes ? "bg-green-50 text-green-600" : "bg-[#F5F4F0] text-[#aaa]"
    )}>
      {yes ? "Yes" : "No"}
    </span>
  );
}

// ─── LEDGER CATEGORY PANEL ────────────────────────────────────────────────────

const defaultForm = {
  ledctnm:      "",
  ledctshtnm:   "",
  sysledcd:     "",
  ledgrpcd:     "",
  itmcomcd:     "",
  hasled:        false,
  hasparties:    false,
  showintrial:   false,
  locwisemerge:  false,
};

type LedgerCatForm = typeof defaultForm;

// When editingRowid is non-null we're in edit mode
export function LedgerCategoryPanelContent() {
  const [form, setForm]           = useState<LedgerCatForm>(defaultForm);
  const [errors, setErrors]       = useState<Partial<Record<keyof LedgerCatForm, string>>>({});
  const [editingRowid, setEditingRowid] = useState<number | null>(null);
  const [editingCode, setEditingCode]   = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<{ rowid: number; label: string } | null>(null);
  const [toast, setToast]         = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const { data: categories = [], refetch } = trpc.ledgerCategory.getAll.useQuery();
  const { data: sysLedgers = [] }          = trpc.ledgerCategory.getSysLedgers.useQuery();
  const { data: ledgerGroups = [] }        = trpc.ledgerCategory.getLedgerGroups.useQuery();
  const { data: commodities = [] }         = trpc.ledgerCategory.getCommodities.useQuery();

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const set = <K extends keyof LedgerCatForm>(key: K, val: LedgerCatForm[K]) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  // ── Load a row into the form for editing ──────────────────────────────────
  const handleEdit = (row: typeof categories[number]) => {
    setForm({
      ledctnm:     row.ledctnm,
      ledctshtnm:  row.ledctshtnm,
      sysledcd:    row.sysledcd,
      ledgrpcd:    row.ledgrpcd,
      itmcomcd:    row.itmcomcd,
      hasled:       row.hasled       === "Y",
      hasparties:   row.hasparties   === "Y",
      showintrial:  row.showintrial  === "Y",
      locwisemerge: row.locwisemerge === "Y",
    });
    setEditingRowid(row.rowid);
    setEditingCode(row.ledctcd);
    setErrors({});
    // Scroll to top of form smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setForm(defaultForm);
    setErrors({});
    setEditingRowid(null);
    setEditingCode("");
  };

  // ── Shared field payload builder ──────────────────────────────────────────
  const buildPayload = () => ({
    ledctnm:     form.ledctnm,
    ledctshtnm:  form.ledctshtnm,
    sysledcd:    form.sysledcd,
    ledgrpcd:    form.ledgrpcd,
    itmcomcd:    form.itmcomcd,
    hasled:       form.hasled       ? "Y" as const : "N" as const,
    hasparties:   form.hasparties   ? "Y" as const : "N" as const,
    showintrial:  form.showintrial  ? "Y" as const : "N" as const,
    locwisemerge: form.locwisemerge ? "Y" as const : "N" as const,
  });

  const validate = (): boolean => {
    const errs: Partial<Record<keyof LedgerCatForm, string>> = {};
    if (!form.ledctnm.trim())    errs.ledctnm    = "Required";
    if (!form.ledctshtnm.trim()) errs.ledctshtnm = "Required";
    if (!form.sysledcd)          errs.sysledcd   = "Required";
    if (!form.ledgrpcd)          errs.ledgrpcd   = "Required";
    if (Object.keys(errs).length) { setErrors(errs); return false; }
    setErrors({});
    return true;
  };

  const createMutation = trpc.ledgerCategory.create.useMutation({
    onSuccess: () => {
      showToast("success", "Ledger category created");
      setForm(defaultForm);
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const updateMutation = trpc.ledgerCategory.update.useMutation({
    onSuccess: () => {
      showToast("success", "Ledger category updated");
      handleCancelEdit();
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const deleteMutation = trpc.ledgerCategory.delete.useMutation({
    onSuccess: () => {
      showToast("success", "Ledger category deleted");
      setDeleteTarget(null);
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = buildPayload();
    if (editingRowid !== null) {
      updateMutation.mutate({ rowid: editingRowid, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const sysLedOptions = sysLedgers.map((s) => ({ label: s.syslednm,  value: s.sysledcd }));
  const groupOptions  = ledgerGroups.map((g) => ({ label: g.ledgrpnm, value: g.ledgrpcd }));
  const comOptions    = commodities.map((c) => ({ label: c.itmcomnm,  value: c.itmcomcd }));

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
        <h2 className="text-[16px] font-medium text-[#1a1a1a]">Ledger Categories</h2>
        <p className="text-[12px] text-[#999] mt-0.5">Manage ledger category master data</p>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSave} className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">

        {/* Header — changes colour + label when editing */}
        <div className={cn(
          "px-5 py-3.5 border-b border-[#E8E6E1] flex items-center justify-between",
          editingRowid !== null && "bg-amber-50 border-amber-200"
        )}>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0",
              editingRowid !== null ? "bg-amber-500" : "bg-[#1a1a1a]"
            )}>
              {editingRowid !== null ? (
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
              {editingRowid !== null
                ? <>Editing <span className="font-mono text-amber-600">{editingCode}</span></>
                : "Ledger Category Information"
              }
            </span>
          </div>

          {/* Cancel edit button */}
          {editingRowid !== null && (
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

        <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">

          <FormField label="Category Name" required>
            <input
              className={inputCls(!!errors.ledctnm)}
              placeholder="e.g. Sales Ledger"
              value={form.ledctnm}
              onChange={(e) => set("ledctnm", e.target.value)}
            />
            {errors.ledctnm && <p className="text-[11px] text-red-400 mt-0.5">{errors.ledctnm}</p>}
          </FormField>

          <FormField label="Category Short Name" required>
            <input
              className={inputCls(!!errors.ledctshtnm)}
              placeholder="e.g. SLS"
              value={form.ledctshtnm}
              onChange={(e) => set("ledctshtnm", e.target.value)}
            />
            {errors.ledctshtnm && <p className="text-[11px] text-red-400 mt-0.5">{errors.ledctshtnm}</p>}
          </FormField>

          <FormField label="Category Type" required>
            <StyledCombobox
              items={sysLedOptions}
              value={form.sysledcd}
              onValueChange={(val) => set("sysledcd", val)}
              placeholder="Search category type…"
              hasError={!!errors.sysledcd}
            />
            {errors.sysledcd && <p className="text-[11px] text-red-400 mt-0.5">{errors.sysledcd}</p>}
          </FormField>

          <FormField label="Under Group" required>
            <StyledCombobox
              items={groupOptions}
              value={form.ledgrpcd}
              onValueChange={(val) => set("ledgrpcd", val)}
              placeholder="Search ledger group…"
              hasError={!!errors.ledgrpcd}
            />
            {errors.ledgrpcd && <p className="text-[11px] text-red-400 mt-0.5">{errors.ledgrpcd}</p>}
          </FormField>

          <FormField label="Commodity Name">
            <StyledCombobox
              items={comOptions}
              value={form.itmcomcd}
              onValueChange={(val) => set("itmcomcd", val)}
              placeholder="Search commodity…"
            />
          </FormField>

          <div />

          <div className="col-span-2 pt-1">
            <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-[#bbb] border-b border-[#F0EEE9] pb-2">
              Flags
            </p>
          </div>

          <FormField label="Has Ledger">
            <YesNoToggle value={form.hasled} onChange={(val) => set("hasled", val)} />
          </FormField>

          <FormField label="Has Parties">
            <YesNoToggle value={form.hasparties} onChange={(val) => set("hasparties", val)} />
          </FormField>

          <FormField label="Show in Trial">
            <YesNoToggle value={form.showintrial} onChange={(val) => set("showintrial", val)} />
          </FormField>

          <FormField label="Location Wise Merge">
            <YesNoToggle value={form.locwisemerge} onChange={(val) => set("locwisemerge", val)} />
          </FormField>
        </div>

        {/* Footer */}
        <div className={cn(
          "px-5 py-3.5 border-t border-[#E8E6E1] flex items-center justify-between",
          editingRowid !== null ? "bg-amber-50/60" : "bg-[#FAFAF9]"
        )}>
          <p className="text-[11px] text-[#bbb]">
            {editingRowid !== null
              ? "Editing existing record — code unchanged"
              : "Code auto-generated (LCCA_____)"
            }
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={editingRowid !== null ? handleCancelEdit : () => { setForm(defaultForm); setErrors({}); }}
              className="h-8 px-4 text-[12px] font-medium text-[#666] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-all duration-150"
            >
              {editingRowid !== null ? "Cancel" : "Clear"}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={cn(
                "h-8 px-4 text-[12px] font-medium text-white rounded-lg disabled:opacity-50 transition-all duration-150 flex items-center gap-1.5",
                editingRowid !== null
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-[#1a1a1a] hover:bg-[#333]"
              )}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin" width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M7 1a6 6 0 1 0 6 6" /></svg>
                  {editingRowid !== null ? "Updating…" : "Saving…"}
                </>
              ) : (
                <>
                  {editingRowid !== null ? (
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" />
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><path d="M2 7l3.5 3.5L12 3" /></svg>
                  )}
                  {editingRowid !== null ? "Update" : "Save"}
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
            All Ledger Categories
            <span className="ml-2 text-[11px] font-normal text-[#aaa]">{categories.length} total</span>
          </span>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[420px]">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
                {[
                  "Code", "Category Name", "Short Name",
                  "Category Type", "Under Group", "Commodity",
                  "Has Led", "Has Parties", "Trial", "Loc Merge", "",
                ].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-[12px] text-[#ccc]">
                    No ledger categories yet. Add one above.
                  </td>
                </tr>
              ) : (
                categories.map((c, i) => {
                  const isEditing = editingRowid === c.rowid;
                  return (
                    <motion.tr
                      key={c.rowid}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={cn(
                        "border-b border-[#F5F4F0] last:border-0 transition-colors",
                        isEditing
                          ? "bg-amber-50/60"
                          : "hover:bg-[#FAFAF9]"
                      )}
                    >
                      <td className="px-4 py-3 font-mono whitespace-nowrap">
                        <span className={cn(
                          "text-[11px]",
                          isEditing ? "text-amber-600 font-semibold" : "text-[#aaa]"
                        )}>
                          {c.ledctcd}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#1a1a1a] whitespace-nowrap">{c.ledctnm}</td>
                      <td className="px-4 py-3 text-[#666]">{c.ledctshtnm}</td>
                      <td className="px-4 py-3 text-[#666] whitespace-nowrap">{c.sysLedgerName}</td>
                      <td className="px-4 py-3 text-[#666] whitespace-nowrap">{c.ledgerGroupName}</td>
                      <td className="px-4 py-3 text-[#666] whitespace-nowrap">{c.commodityName || "—"}</td>
                      <td className="px-4 py-3"><FlagBadge value={c.hasled} /></td>
                      <td className="px-4 py-3"><FlagBadge value={c.hasparties} /></td>
                      <td className="px-4 py-3"><FlagBadge value={c.showintrial} /></td>
                      <td className="px-4 py-3"><FlagBadge value={c.locwisemerge} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <EditBtn onClick={() => handleEdit(c)} />
                          <TrashBtn onClick={() => setDeleteTarget({ rowid: c.rowid, label: c.ledctnm })} />
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
    </div>
  );
}