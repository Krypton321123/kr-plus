"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/app/_trpc/client";
import {toast} from "sonner"

type CasteRow = {
  rowid: number;
  rlgcstcd: string;
  rlgcstnm: string;
  rlgcd: string;
  rlgnm: string;
};

type ReligionOption = {
  rowid: number;
  rlgcd: string;
  rlgnm: string;
};

const EMPTY_FORM = { rlgcstnm: "", rlgcd: "" };

export default function CastePage() {
  // ── Form state ────────────────────────────────────────────────────────
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // ── tRPC ──────────────────────────────────────────────────────────────
  const utils = trpc.useUtils();

  const { data: castes = [], isLoading } = trpc.caste.getAll.useQuery();
  const { data: religions = [] } = trpc.caste.getAllReligions.useQuery();

  const createMutation = trpc.caste.create.useMutation({
    onSuccess: () => {
      toast.success("Caste saved successfully");
      resetForm();
      utils.caste.getAll.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.caste.update.useMutation({
    onSuccess: () => {
      toast.success("Caste updated successfully");
      resetForm();
      utils.caste.getAll.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.caste.delete.useMutation({
    onSuccess: () => {
      toast.success("Caste deleted");
      setDeleteConfirm(null);
      utils.caste.getAll.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // ── Helpers ───────────────────────────────────────────────────────────
  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function handleEdit(row: CasteRow) {
    setForm({ rlgcstnm: row.rlgcstnm, rlgcd: row.rlgcd });
    setEditingId(row.rowid);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSave() {
    if (!form.rlgcstnm.trim()) {
      toast.error("Caste name is required");
      return;
    }
    if (!form.rlgcd) {
      toast.error("Please select a religion");
      return;
    }
    if (editingId !== null) {
      updateMutation.mutate({ rowid: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  }

  const filtered = castes.filter(
    (c) =>
      c.rlgcstnm.toLowerCase().includes(search.toLowerCase()) ||
      c.rlgnm.toLowerCase().includes(search.toLowerCase()) ||
      c.rlgcstcd.toLowerCase().includes(search.toLowerCase())
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ── UI ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-blue-600" />
          <h1 className="text-xl font-semibold text-slate-800 tracking-tight">
            Caste Master
          </h1>
          <span className="ml-auto text-xs text-slate-400 font-mono">
            mstrlgcstnfo
          </span>
        </div>

        {/* ── Form card ──────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {/* card header */}
          <div className="bg-blue-50 border-b border-blue-100 px-5 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-blue-800">
              Caste Information
            </span>
            {editingId !== null && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                Editing ID #{editingId}
              </span>
            )}
          </div>

          {/* fields */}
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Caste Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-600">
                Caste Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.rlgcstnm}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rlgcstnm: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                placeholder="Enter caste name"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-400"
              />
            </div>

            {/* Religion */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-600">
                Religion Name <span className="text-red-500">*</span>
              </label>
              <select
                value={form.rlgcd}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rlgcd: e.target.value }))
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
              >
                <option value="">-- Select Religion --</option>
                {(religions as ReligionOption[]).map((r) => (
                  <option key={r.rowid} value={r.rlgcd}>
                    {r.rlgnm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* actions */}
          <div className="px-5 pb-5 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg transition"
            >
              {isSaving ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <SaveIcon />
                  {editingId !== null ? "Update" : "Save"}
                </>
              )}
            </button>

            {editingId !== null && (
              <button
                onClick={resetForm}
                className="text-sm font-medium text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg border border-slate-200 hover:border-slate-300 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* ── Records table ──────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-700">
              Records
              {castes.length > 0 && (
                <span className="ml-2 text-xs font-normal text-slate-400">
                  ({filtered.length} of {castes.length})
                </span>
              )}
            </span>
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 transition"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm gap-2">
              <span className="h-4 w-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <EmptyIcon />
              <span className="text-sm">No records found</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide w-10">
                      #
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Code
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Caste Name
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Religion
                    </th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((row, i) => (
                    <tr
                      key={row.rowid}
                      className={`group transition ${
                        editingId === row.rowid ? "bg-amber-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-4 py-2.5 text-slate-400 text-xs">
                        {i + 1}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-500">
                        {row.rlgcstcd}
                      </td>
                      <td className="px-4 py-2.5 text-slate-800 font-medium">
                        {row.rlgcstnm}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {row.rlgnm}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => handleEdit(row)}
                            className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition"
                            title="Edit"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(row.rowid)}
                            className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition"
                            title="Delete"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Delete confirm modal ──────────────────────────────────────── */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <TrashIcon className="text-red-500 h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">
                  Delete Caste?
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() =>
                  deleteMutation.mutate({ rowid: deleteConfirm })
                }
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition"
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-slate-200 hover:border-slate-300 text-slate-600 text-sm font-medium py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tiny inline SVG icons ──────────────────────────────────────────────────
function SaveIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-8H7v8M7 3v5h8" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.768-6.768a2 2 0 112.828 2.828L11.828 15.828 8 17l1.172-3.828z" />
    </svg>
  );
}

function TrashIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a2 2 0 00-2-2H9a2 2 0 00-2 2m10 0H5" />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg className="h-10 w-10 text-slate-200" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );
}