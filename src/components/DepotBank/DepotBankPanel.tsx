"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { trpc } from "@/app/_trpc/client";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
} from "../ui/combobox";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PendingRow {
  _key: string;
  bankledcd: string;
  hountcd: string;
  displayName: string;
  hountnm: string;
}

// A "display row" is either a saved row (from server) or a pending new row.
// We keep them separate in state and merge for rendering.
interface SavedDisplayRow {
  rowid: number;
  bankledcd: string;
  hountcd: string;
  displayName: string;
  hountnm: string;
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const inputCls = cn(
  "w-full h-9 px-3 text-[13px] bg-white border border-[#E8E6E1] rounded-lg text-[#1a1a1a] placeholder:text-[#ccc]",
  "focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all duration-150 hover:border-[#ccc]"
);

const comboboxInputCls = (hasError?: boolean) =>
  cn(
    "w-full h-9 px-3 text-[13px] rounded-lg border bg-white text-[#1a1a1a] placeholder:text-[#ccc]",
    "transition-all duration-150 outline-none focus:ring-2 focus:ring-[#1a1a1a]/8 focus:border-[#1a1a1a]",
    hasError ? "border-red-300 bg-red-50/40" : "border-[#E8E6E1] hover:border-[#ccc]"
  );

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-5 py-3 border-b border-[#E8E6E1] bg-[#FAFAF9]">
      <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#888]">
        {title}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DepotBankPanelContent() {
  const today = new Date().toISOString().slice(0, 10);

  const [selectedUntcd, setSelectedUntcd] = useState("");
  const [frmdt, setFrmdt] = useState(today);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Saved rows: which saved rows have been locally removed (pending delete on save)
  const [removedRowids, setRemovedRowids] = useState<Set<number>>(new Set());

  // Pending new rows: only rows not yet saved to the server
  const [pendingRows, setPendingRows] = useState<PendingRow[]>([]);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Queries ───────────────────────────────────────────────────────────

  const { data: units = [] } = trpc.depotBank.getUnits.useQuery();
  const { data: bankLedgers = [] } = trpc.depotBank.getBankLedgers.useQuery();

  const { data: savedRows = [], refetch, isFetching } = trpc.depotBank.getByUnit.useQuery(
    { untcd: selectedUntcd },
    { enabled: !!selectedUntcd, staleTime: 0 }
  );

  // ── Mutation ──────────────────────────────────────────────────────────

  const saveMutation = trpc.depotBank.save.useMutation({
    onSuccess: () => {
      showToast("success", "Bank information saved successfully");
      // Clear local edits — server is now source of truth
      setRemovedRowids(new Set());
      setPendingRows([]);
      refetch();
    },
    onError: (err) => showToast("error", err.message),
  });

  // ── Location change: clear all local edits ────────────────────────────

  const handleLocationChange = (val: any) => {
    setSelectedUntcd(val ?? "");
    setRemovedRowids(new Set());
    setPendingRows([]);
  };

  // ── Derived display rows (no useEffect, no setState loop) ─────────────
  // Merge: saved rows (minus locally removed) + pending new rows
  const visibleSavedRows: SavedDisplayRow[] = savedRows
    .filter((r) => !removedRowids.has(r.rowid))
    .map((r) => ({
      rowid: r.rowid,
      bankledcd: r.bankledcd,
      hountcd: r.hountcd,
      displayName: r.displayName,
      hountnm: r.hountnm,
    }));

  const totalRowCount = visibleSavedRows.length + pendingRows.length;

  // ── Row helpers ───────────────────────────────────────────────────────

  const appendRow = () => {
    setPendingRows((prev) => [
      ...prev,
      { _key: `new_${Date.now()}`, bankledcd: "", hountcd: "", displayName: "", hountnm: "" },
    ]);
  };

  const removeLastRow = () => {
    // Remove from pending first, then from visible saved
    if (pendingRows.length > 0) {
      setPendingRows((prev) => prev.slice(0, -1));
    } else if (visibleSavedRows.length > 0) {
      const last = visibleSavedRows[visibleSavedRows.length - 1];
      setRemovedRowids((prev) => new Set([...prev, last.rowid]));
    }
  };

  const removeSavedRow = (rowid: number) => {
    setRemovedRowids((prev) => new Set([...prev, rowid]));
  };

  const removePendingRow = (_key: string) => {
    setPendingRows((prev) => prev.filter((r) => r._key !== _key));
  };

  const updatePendingBank = (_key: string, bankledcd: string) => {
    const ledger = bankLedgers.find((l) => l.ledcd === bankledcd);
    setPendingRows((prev) =>
      prev.map((r) =>
        r._key === _key
          ? {
              ...r,
              bankledcd,
              displayName: ledger?.displayName ?? bankledcd,
              hountcd: ledger?.hountcd ?? r.hountcd,
              hountnm: ledger?.hountnm ?? r.hountnm,
            }
          : r
      )
    );
  };

  const updatePendingHO = (_key: string, hountcd: string) => {
    const unit = units.find((u) => u.untcd === hountcd);
    setPendingRows((prev) =>
      prev.map((r) =>
        r._key === _key ? { ...r, hountcd, hountnm: unit?.untnm ?? hountcd } : r
      )
    );
  };

  // ── Save / Reject ─────────────────────────────────────────────────────

  const handleSave = () => {
    if (!selectedUntcd) { showToast("error", "Please select a location first"); return; }
    if (pendingRows.some((r) => !r.bankledcd || !r.hountcd)) {
      showToast("error", "All new rows must have a bank account and HO location");
      return;
    }
    const allRows = [
      ...visibleSavedRows.map((r) => ({ bankledcd: r.bankledcd, hountcd: r.hountcd })),
      ...pendingRows.map((r) => ({ bankledcd: r.bankledcd, hountcd: r.hountcd })),
    ];
    saveMutation.mutate({ untcd: selectedUntcd, frmdt, rows: allRows });
  };

  const handleReject = () => {
    setRemovedRowids(new Set());
    setPendingRows([]);
    showToast("success", "Changes discarded");
  };

  // ── Derived ───────────────────────────────────────────────────────────

  const selectedUnitName = units.find((u) => u.untcd === selectedUntcd)?.untnm ?? "";
  const isSaving = saveMutation.isPending;

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "fixed top-15 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium shadow-sm border",
              toast.type === "success"
                ? "bg-white border-green-200 text-green-700"
                : "bg-white border-red-200 text-red-600"
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", toast.type === "success" ? "bg-green-500" : "bg-red-500")} />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page header */}
      <div>
        <h2 className="text-[16px] font-medium text-[#1a1a1a]">Location Wise Bank Information</h2>
        <p className="text-[12px] text-[#999] mt-0.5">Manage bank accounts linked to each depot location</p>
      </div>

      {/* ── TOP CARD ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <SectionHeader title="Location Wise Bank Information" />
        <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4 max-w-2xl">

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#999]">Current Date</label>
            <input type="date" className={inputCls} value={frmdt} onChange={(e) => setFrmdt(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#999]">
              Location <span className="text-red-400">*</span>
            </label>
            <Combobox
              items={units}
              value={selectedUntcd}
              onValueChange={handleLocationChange}
              autoHighlight
            >
              <ComboboxInput placeholder="Select location…" className={comboboxInputCls()} />
              <ComboboxContent>
                <ComboboxEmpty>No locations found.</ComboboxEmpty>
                <ComboboxList>
                  {(u) => <ComboboxItem key={u.untcd} value={u.untcd}>{u.untnm}</ComboboxItem>}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

        </div>
      </div>

      {/* ── BANK DETAILS TABLE ─────────────────────────────────────────── */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">

        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#888]">
            Location Wise Bank Details
            {selectedUnitName && (
              <span className="ml-2 normal-case text-[#aaa] font-normal tracking-normal">— {selectedUnitName}</span>
            )}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={appendRow}
              disabled={!selectedUntcd}
              className="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium rounded-lg border transition-all duration-150 text-green-700 border-green-200 bg-green-50 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7 1v12M1 7h12" /></svg>
              Append
            </button>

            <button
              onClick={removeLastRow}
              disabled={!selectedUntcd || totalRowCount === 0}
              className="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium rounded-lg border transition-all duration-150 text-red-600 border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 7h12" /></svg>
              Remove
            </button>

            <div className="w-px h-4 bg-[#E8E6E1] mx-1" />

            <button
              onClick={handleSave}
              disabled={!selectedUntcd || isSaving}
              className="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium rounded-lg border transition-all duration-150 text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving
                ? <svg className="animate-spin" width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 1a6 6 0 1 0 6 6" /></svg>
                : <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 7l3.5 3.5L12 3" /></svg>
              }
              Accept
            </button>

            <button
              onClick={handleReject}
              disabled={!selectedUntcd || isSaving}
              className="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium rounded-lg border transition-all duration-150 text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 4L4 10M4 4l6 6" /></svg>
              Reject
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isFetching ? (
            <div className="flex items-center justify-center gap-3 py-14">
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round"><path d="M7 1a6 6 0 1 0 6 6" /></svg>
              <span className="text-[13px] text-[#aaa]">Loading…</span>
            </div>
          ) : (
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] w-10">#</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa]">Bank Account Name</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] w-64">H O Location</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {!selectedUntcd ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-[12px] text-[#ccc]">
                      Select a location above to view or manage its bank accounts
                    </td>
                  </tr>
                ) : totalRowCount === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-[12px] text-[#ccc]">
                      No bank accounts linked — click <span className="font-medium text-[#aaa]">Append</span> to add one
                    </td>
                  </tr>
                ) : (
                  <>
                    {/* Saved rows (read-only display, removable) */}
                    <AnimatePresence initial={false}>
                      {visibleSavedRows.map((row, idx) => (
                        <motion.tr
                          key={`saved_${row.rowid}`}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                          transition={{ duration: 0.15 }}
                          className="border-b border-[#F5F4F0] hover:bg-[#FAFAF9] group"
                        >
                          <td className="px-4 py-2.5 text-[#ccc] text-[11px] font-mono">{idx + 1}</td>
                          <td className="px-4 py-2.5 text-[13px] text-[#1a1a1a]">{row.displayName}</td>
                          <td className="px-4 py-2.5 text-[13px] text-[#666]">{row.hountnm}</td>
                          <td className="px-3 py-2 w-10">
                            <button
                              onClick={() => removeSavedRow(row.rowid)}
                              className="w-6 h-6 flex items-center justify-center rounded-md border border-[#E8E6E1] text-[#ccc] hover:border-red-200 hover:text-red-400 hover:bg-red-50 transition-all duration-150 opacity-0 group-hover:opacity-100"
                            >
                              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 1l12 12M13 1L1 13" /></svg>
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>

                    {/* Pending new rows (editable comboboxes) */}
                    <AnimatePresence initial={false}>
                      {pendingRows.map((row, idx) => (
                        <motion.tr
                          key={row._key}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                          transition={{ duration: 0.15 }}
                          className="border-b border-[#F5F4F0] last:border-0 bg-blue-50/30 group"
                        >
                          <td className="px-4 py-2 text-[#ccc] text-[11px] font-mono">
                            {visibleSavedRows.length + idx + 1}
                          </td>

                          <td className="px-3 py-2">
                            <Combobox
                              items={bankLedgers}
                              value={row.bankledcd}
                              onValueChange={(val) => updatePendingBank(row._key, val ?? "")}
                              autoHighlight
                            >
                              <ComboboxInput placeholder="Select bank account…" className={comboboxInputCls(!row.bankledcd)} />
                              <ComboboxContent>
                                <ComboboxEmpty>No bank ledgers found.</ComboboxEmpty>
                                <ComboboxList>
                                  {(l) => <ComboboxItem key={l.ledcd} value={l.ledcd}>{l.displayName}</ComboboxItem>}
                                </ComboboxList>
                              </ComboboxContent>
                            </Combobox>
                          </td>

                          <td className="px-3 py-2 w-64">
                            <Combobox
                              items={units}
                              value={row.hountcd}
                              onValueChange={(val) => updatePendingHO(row._key, val ?? "")}
                              autoHighlight
                            >
                              <ComboboxInput placeholder="Select HO location…" className={comboboxInputCls(!row.hountcd)} />
                              <ComboboxContent>
                                <ComboboxEmpty>No locations found.</ComboboxEmpty>
                                <ComboboxList>
                                  {(u) => <ComboboxItem key={u.untcd} value={u.untcd}>{u.untnm}</ComboboxItem>}
                                </ComboboxList>
                              </ComboboxContent>
                            </Combobox>
                          </td>

                          <td className="px-3 py-2 w-10">
                            <button
                              onClick={() => removePendingRow(row._key)}
                              className="w-6 h-6 flex items-center justify-center rounded-md border border-[#E8E6E1] text-[#ccc] hover:border-red-200 hover:text-red-400 hover:bg-red-50 transition-all duration-150 opacity-0 group-hover:opacity-100"
                            >
                              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 1l12 12M13 1L1 13" /></svg>
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {selectedUntcd && (
          <div className="px-5 py-3 border-t border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between">
            <span className="text-[11px] text-[#bbb]">
              {totalRowCount} bank account{totalRowCount !== 1 ? "s" : ""} linked
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReject}
                disabled={isSaving}
                className="h-8 px-4 text-[12px] font-medium text-[#666] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-all duration-150 disabled:opacity-50"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 px-4 text-[12px] font-medium text-white rounded-lg disabled:opacity-50 transition-all duration-150 flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#333]"
              >
                {isSaving ? (
                  <><svg className="animate-spin" width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M7 1a6 6 0 1 0 6 6" /></svg>Saving…</>
                ) : (
                  <><svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><path d="M2 7l3.5 3.5L12 3" /></svg>Save</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}