"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { trpc } from "../../app/_trpc/client";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ValTyp = "%" | "Fix";

type PrqForm = {
  ctgname: string;
  valtyp: ValTyp;
};

const EMPTY_FORM: PrqForm = {
  ctgname: "",
  valtyp: "%",
};

// ─── Shared style helpers (mirrors ItemMasterContent) ─────────────────────────

const inputCls = (hasError?: boolean) =>
  `w-full h-9 px-3 text-[13px] bg-white border rounded-lg text-[#1a1a1a] placeholder:text-[#ccc]
   focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all duration-150
   ${hasError ? "border-red-300 bg-red-50/30" : "border-[#E8E6E1] hover:border-[#ccc]"}`;

const selectCls = (hasError?: boolean) =>
  `w-full h-9 px-3 text-[13px] bg-white border rounded-lg text-[#1a1a1a]
   hover:border-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]
   transition-all duration-150 cursor-pointer appearance-none
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

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({
  name,
  onConfirm,
  onCancel,
  isPending,
}: {
  name: string;
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
            <p className="text-[13px] font-medium text-[#1a1a1a]">Delete category?</p>
            <p className="text-[12px] text-[#999] mt-1 leading-relaxed">
              <span className="font-medium text-[#555]">{name}</span> will be permanently removed.
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
        Page {page} of {pageCount} · {total} records
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

export function PrqSitCtgContent() {
  const [form, setForm] = useState<PrqForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof PrqForm, string>>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ rowid: number; ctgname: string } | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(true);

  const searchQuery = useDebounce(searchInput, 350);
  useEffect(() => { setPage(1); }, [searchQuery]);

  const set = <K extends keyof PrqForm>(key: K, val: PrqForm[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  };

  // ── Query ──────────────────────────────────────────────────────────────────
  const { data: pagedResult, refetch, isFetching } = trpc.prqSitCtg.getAll.useQuery(
    { page, search: searchQuery },
    { placeholderData: (prev) => prev }
  );
  const rows = pagedResult?.rows ?? [];
  const total = pagedResult?.total ?? 0;
  const pageCount = pagedResult?.pageCount ?? 1;

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = trpc.prqSitCtg.create.useMutation({
    onSuccess: () => { showToast("success", "Category created"); resetForm(); void refetch(); },
    onError: (err) => showToast("error", err.message),
  });
  const updateMutation = trpc.prqSitCtg.update.useMutation({
    onSuccess: () => { showToast("success", "Category updated"); resetForm(); void refetch(); },
    onError: (err) => showToast("error", err.message),
  });
  const deleteMutation = trpc.prqSitCtg.delete.useMutation({
    onSuccess: () => { showToast("success", "Category deleted"); setDeleteTarget(null); void refetch(); },
    onError: (err) => showToast("error", err.message),
  });

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setErrors({});
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.ctgname.trim()) e.ctgname = "Required";
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

  function handleEdit(row: any) {
    setEditingId(row.rowid);
    setForm({
      ctgname: row.ctgname ?? "",
      valtyp: row.valtyp === "Fix" ? "Fix" : "%",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const isEdit = editingId !== null;
  const isSaving = createMutation.isPending || updateMutation.isPending;

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
            name={deleteTarget.ctgname}
            onConfirm={() => deleteMutation.mutate({ rowid: deleteTarget.rowid })}
            onCancel={() => setDeleteTarget(null)}
            isPending={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-medium text-[#1a1a1a]">PRQ Site Categories</h2>
          <p className="text-[12px] text-[#999] mt-0.5">Manage purchase requisition site category profiles</p>
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
          ) : showForm ? "Hide Form" : "New Category"}
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
            <div className="border border-[#E8E6E1] rounded-xl overflow-hidden">

              {/* Section header */}
              <div className="flex items-center gap-2.5 px-5 py-3.5 bg-[#FAFAF9] border-b border-[#E8E6E1]">
                <div className="w-5 h-5 rounded-md bg-[#1a1a1a] flex items-center justify-center shrink-0">
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M7 1L1.5 4v6L7 13l5.5-3V4L7 1z" />
                  </svg>
                </div>
                <span className="text-[13px] font-medium text-[#1a1a1a]">General Information</span>
              </div>

              <div className="p-5 flex flex-col gap-4">

                {isEdit && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-[12px] text-blue-600">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M2 10.5L4.5 11 11 4.5a1.77 1.77 0 0 0-2.5-2.5L2 8.5v2z" />
                    </svg>
                    Editing <span className="font-medium ml-1">{form.ctgname}</span> — make changes and click Update.
                  </div>
                )}

                {/* Profile Code — read-only, auto-generated */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <FormField label="Profile Code">
                    <div className={`${inputCls()} flex items-center bg-[#FAFAF9] text-[#aaa] cursor-not-allowed select-none`}>
                      {isEdit ? (rows.find((r: any) => r.rowid === editingId)?.prfcd ?? "—") : "Auto-generated"}
                    </div>
                  </FormField>

                  <div /> {/* spacer to keep 2-col grid */}

                  <FormField label="Category Name" required error={errors.ctgname}>
                    <input
                      type="text"
                      className={inputCls(!!errors.ctgname)}
                      placeholder="e.g. Fuel Surcharge"
                      value={form.ctgname}
                      onChange={(e) => set("ctgname", e.target.value)}
                    />
                  </FormField>

                  <FormField label="Value Type">
                    {/* Styled select with a custom chevron so it matches the rest of the UI */}
                    <div className="relative">
                      <select
                        className={selectCls()}
                        value={form.valtyp}
                        onChange={(e) => set("valtyp", e.target.value as ValTyp)}
                      >
                        <option value="%">%</option>
                        <option value="Fix">Fix</option>
                      </select>
                      <svg
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                        width="12" height="12" viewBox="0 0 14 14"
                        fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round"
                      >
                        <path d="M2 5l5 4 5-4" />
                      </svg>
                    </div>
                  </FormField>
                </div>

                {/* Action buttons */}
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
                        {isEdit ? "Update Category" : "Save Category"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E8E6E1] flex items-center justify-between shrink-0">
          <span className="text-[13px] font-medium text-[#1a1a1a]">
            All Categories
            <span className="ml-2 text-[11px] font-normal text-[#aaa]">{total} total</span>
          </span>
          <div className="relative">
            <input
              type="text"
              placeholder="Search…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-7 pl-7 pr-3 text-[12px] border border-[#E8E6E1] rounded-lg bg-[#FAFAF9] text-[#1a1a1a] placeholder:text-[#ccc] focus:outline-none focus:border-[#ccc] w-44 transition-all duration-150"
            />
            <svg className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="6" cy="6" r="4" />
              <path d="M9.5 9.5l2.5 2.5" />
            </svg>
            {isFetching && (
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin" width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round">
                <path d="M7 1a6 6 0 1 0 6 6" />
              </svg>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-[#FAFAF9]">
              <tr className="border-b border-[#E8E6E1]">
                {["Profile Code", "Category Name", "Value Type", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-[#ccc] text-[12px]">
                    {isFetching ? "Loading…" : searchQuery ? "No categories match your search" : "No categories yet — create one above"}
                  </td>
                </tr>
              ) : (
                rows.map((row: any) => {
                  const isRowEditing = editingId === row.rowid;
                  return (
                    <tr
                      key={row.rowid}
                      className={`border-b border-[#F5F4F0] last:border-0 transition-colors duration-100 ${
                        isRowEditing ? "bg-blue-50/60" : "hover:bg-[#FAFAF9]"
                      }`}
                    >
                      <td className="px-4 py-3 text-[#aaa] font-mono whitespace-nowrap">{row.prfcd}</td>
                      <td className="px-4 py-3 font-medium text-[#1a1a1a]">{row.ctgname}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                          row.valtyp === "%"
                            ? "bg-purple-50 text-purple-700"
                            : "bg-amber-50 text-amber-700"
                        )}>
                          <span className={cn(
                            "w-1 h-1 rounded-full",
                            row.valtyp === "%" ? "bg-purple-500" : "bg-amber-500"
                          )} />
                          {row.valtyp}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEdit(row)}
                            title="Edit"
                            className={cn(
                              "w-7 h-7 rounded-md flex items-center justify-center transition-all duration-150 border",
                              isRowEditing
                                ? "bg-blue-100 border-blue-200 text-blue-600"
                                : "bg-white border-[#E8E6E1] text-[#aaa] hover:border-[#C8C5BE] hover:text-[#555] hover:bg-[#F5F4F0]"
                            )}
                          >
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 10.5L4.5 11 11 4.5a1.77 1.77 0 0 0-2.5-2.5L2 8.5v2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ rowid: row.rowid, ctgname: row.ctgname })}
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

        <Pagination page={page} pageCount={pageCount} total={total} onPage={setPage} />
      </div>
    </div>
  );
}