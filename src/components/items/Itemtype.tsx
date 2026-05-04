"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { trpc } from "../../app/_trpc/client";

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

// ─── ITEM TYPE PANEL (mstitmtypnfo) ──────────────────────────────────────────

export function ItemTypePanelContent() {
  const [name, setName]           = useState("");
  const [error, setError]         = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ rowid: number; label: string } | null>(null);
  const [toast, setToast]         = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const { data: itemTypes = [], refetch } = trpc.itemType.getAll.useQuery();

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const createMutation = trpc.itemType.create.useMutation({
    onSuccess: () => {
      showToast("success", "Item type created");
      setName("");
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const deleteMutation = trpc.itemType.delete.useMutation({
    onSuccess: () => {
      showToast("success", "Item type deleted");
      setDeleteTarget(null);
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Required"); return; }
    setError("");
    createMutation.mutate({ itmtypnm: name.trim() });
  };

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
        <h2 className="text-[16px] font-medium text-[#1a1a1a]">Item Types</h2>
        <p className="text-[12px] text-[#999] mt-0.5">Manage item type master data</p>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSave} className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E8E6E1] flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#1a1a1a] flex items-center justify-center shrink-0">
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
              <rect x="1" y="2" width="12" height="10" rx="1.5" />
              <path d="M4 6h6M4 9h4" />
            </svg>
          </div>
          <span className="text-[13px] font-medium text-[#1a1a1a]">Item Type Information</span>
        </div>

        <div className="p-5">
          <div className="max-w-sm">
            <FormField label="Item Type Name" required>
              <input
                className={inputCls(!!error)}
                placeholder="e.g. Electronics"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
              />
              {error && <p className="text-[11px] text-red-400 mt-0.5">{error}</p>}
            </FormField>
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between">
          <p className="text-[11px] text-[#bbb]">Code auto-generated (ITCA_____)</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setName(""); setError(""); }}
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
            All Item Types
            <span className="ml-2 text-[11px] font-normal text-[#aaa]">{itemTypes.length} total</span>
          </span>
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
              {["Code", "Item Type Name", ""].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {itemTypes.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-[12px] text-[#ccc]">
                  No item types yet. Add one above.
                </td>
              </tr>
            ) : (
              itemTypes.map((t, i) => (
                <motion.tr
                  key={t.rowid}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[#F5F4F0] last:border-0 hover:bg-[#FAFAF9] transition-colors"
                >
                  <td className="px-4 py-3 text-[#aaa] font-mono">{t.itmtypcd}</td>
                  <td className="px-4 py-3 font-medium text-[#1a1a1a]">{t.itmtypnm}</td>
                  <td className="px-4 py-3">
                    <TrashBtn onClick={() => setDeleteTarget({ rowid: t.rowid, label: t.itmtypnm })} />
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