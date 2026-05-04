"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { trpc } from "../../app/_trpc/client";

// ─── Shared primitives (mirrors pattern from location panels) ─────────────────

const inputCls = (hasError?: boolean) =>
  `w-full h-9 px-3 bg-white border rounded-lg text-[#1a1a1a] placeholder:text-[#ccc]
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
      <label className="font-medium tracking-[0.06em] uppercase text-[#999]">
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
          className={`fixed top-15 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl font-medium shadow-sm border
            ${
              toast.type === "success"
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
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
        onClick={onCancel}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 4 }}
        transition={{ duration: 0.15 }}
        className="relative bg-white rounded-xl border border-[#E8E6E1] shadow-xl p-6 w-85 flex flex-col gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0 mt-0.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M7 2v5M7 10v.5" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-[#1a1a1a]">Delete record?</p>
            <p className="text-[#999] mt-1 leading-relaxed">
              <span className="font-medium text-[#555]">{label}</span> will be
              permanently removed.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="h-8 px-4 font-medium text-[#666] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="h-8 px-4 font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all duration-150 flex items-center gap-1.5"
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
      <svg
        width="12"
        height="12"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1.5 3.5h11M5 3.5V2h4v1.5M3 3.5l.7 8h6.6l.7-8" />
      </svg>
    </button>
  );
}

function SaveBtn({
  isPending,
  label = "Save",
}: {
  isPending: boolean;
  label?: string;
}) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="h-8 px-4 font-medium text-white bg-[#1a1a1a] rounded-lg hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center gap-1.5"
    >
      {isPending ? (
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
          {label}
        </>
      )}
    </button>
  );
}

// ─── PARTY CATEGORY PANEL ─────────────────────────────────────────────────────

export function PartyCatPanelContent() {
  const [form, setForm] = useState({ pcatnm: "" });
  const [errors, setErrors] = useState<{ pcatnm?: string }>({});
  const [deleteTarget, setDeleteTarget] = useState<{
    rowid: number;
    label: string;
  } | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const { data: partyCategories = [], refetch } =
    trpc.partyCat.getAll.useQuery();

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const createMutation = trpc.partyCat.create.useMutation({
    onSuccess: () => {
      showToast("success", "Party category created");
      setForm({ pcatnm: "" });
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const deleteMutation = trpc.partyCat.delete.useMutation({
    onSuccess: () => {
      showToast("success", "Party category deleted");
      setDeleteTarget(null);
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pcatnm.trim()) {
      setErrors({ pcatnm: "Required" });
      return;
    }
    setErrors({});
    createMutation.mutate(form);
  };

  return (
    <div className="flex flex-col gap-5">
      <Toast toast={toast} />
      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal
            label={deleteTarget.label}
            onConfirm={() =>
              deleteMutation.mutate({ rowid: deleteTarget.rowid })
            }
            onCancel={() => setDeleteTarget(null)}
            isPending={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h2 className="font-medium text-[#1a1a1a]">Party Categories</h2>
        <p className="text-[#999] mt-0.5">Manage party category master data</p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSave}
        className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden"
      >
        <div className="px-5 py-3.5 border-b border-[#E8E6E1] flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#1a1a1a] flex items-center justify-center shrink-0">
            {/* Tag / label icon */}
            <svg
              width="10"
              height="10"
              viewBox="0 0 14 14"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 1h5.5l6 6a1.5 1.5 0 0 1 0 2.1l-3.4 3.4a1.5 1.5 0 0 1-2.1 0L1 6.5V1z" />
              <circle cx="4" cy="4" r="1" fill="white" stroke="none" />
            </svg>
          </div>
          <span className="font-medium text-[#1a1a1a]">
            Category Information
          </span>
        </div>

        <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">
          <FormField label="Party Category Name" required>
            <input
              className={inputCls(!!errors.pcatnm)}
              placeholder="e.g. Supplier"
              value={form.pcatnm}
              onChange={(e) => {
                setForm({ pcatnm: e.target.value });
                setErrors({});
              }}
            />
            {errors.pcatnm && (
              <p className="text-red-400 mt-0.5">{errors.pcatnm}</p>
            )}
          </FormField>
          <div /> {/* spacer to keep grid balanced */}
        </div>

        <div className="px-5 py-3.5 border-t border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between">
          <p className="text-[#bbb]">Code will be auto-generated (PCAT_____)</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setForm({ pcatnm: "" });
                setErrors({});
              }}
              className="h-8 px-4 font-medium text-[#666] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-all duration-150"
            >
              Clear
            </button>
            <SaveBtn isPending={createMutation.isPending} />
          </div>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E8E6E1]">
          <span className="font-medium text-[#1a1a1a]">
            All Party Categories
            <span className="ml-2 font-normal text-[#aaa]">
              {partyCategories.length} total
            </span>
          </span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
              {["Code", "Category Name", ""].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-2.5 font-semibold tracking-[0.08em] uppercase text-[#aaa]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {partyCategories.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-[#ccc]">
                  No party categories yet
                </td>
              </tr>
            ) : (
              partyCategories.map((pc, i) => (
                <motion.tr
                  key={pc.rowid}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[#F5F4F0] last:border-0 hover:bg-[#FAFAF9] transition-colors"
                >
                  <td className="px-4 py-3 text-[#aaa] font-mono">
                    {pc.pcatcd}
                  </td>
                  <td className="px-4 py-3 font-medium text-[#1a1a1a]">
                    {pc.pcatnm}
                  </td>
                  <td className="px-4 py-3">
                    <TrashBtn
                      onClick={() =>
                        setDeleteTarget({
                          rowid: pc.rowid,
                          label: pc.pcatnm,
                        })
                      }
                    />
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