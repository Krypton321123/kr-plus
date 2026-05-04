"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { trpc } from "../../app/_trpc/client";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "../ui/combobox";
import { cn } from "@/lib/utils";

// ─── Shared primitives ────────────────────────────────────────────────────────

const inputCls = (hasError?: boolean) =>
  `w-full h-9 px-3] bg-white border rounded-lg text-[#1a1a1a] placeholder:text-[#ccc]
   focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all duration-150
   ${hasError ? "border-red-300 bg-red-50/30" : "border-[#E8E6E1] hover:border-[#ccc]"}`;

const selectCls = (hasError?: boolean) =>
  `w-full h-9 px-3 bg-white border rounded-lg text-[#1a1a1a]
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
      <label className=" font-medium tracking-[0.06em] uppercase text-[#999]">
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
            <p className="font-medium text-[#1a1a1a]">
              Delete record?
            </p>
            <p className=" text-[#999] mt-1 leading-relaxed">
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

// Trash icon button used in all tables
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

// Spinner for save button
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
      className="h-8 px-4  font-medium text-white bg-[#1a1a1a] rounded-lg hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center gap-1.5"
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

// ─── STATE PANEL ──────────────────────────────────────────────────────────────

export function StatePanelContent() {
  const [form, setForm] = useState({ stnm: "", stshnm: "" });
  const [errors, setErrors] = useState<{ stnm?: string; stshnm?: string }>({});
  const [deleteTarget, setDeleteTarget] = useState<{
    rowid: number;
    label: string;
  } | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const { data: states = [], refetch } = trpc.state.getAll.useQuery();

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const createMutation = trpc.state.create.useMutation({
    onSuccess: () => {
      showToast("success", "State created");
      setForm({ stnm: "", stshnm: "" });
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const deleteMutation = trpc.state.delete.useMutation({
    onSuccess: () => {
      showToast("success", "State deleted");
      setDeleteTarget(null);
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!form.stnm.trim()) errs.stnm = "Required";
    if (!form.stshnm.trim()) errs.stshnm = "Required";
    if (Object.keys(errs).length) {
      setErrors(errs);
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
        <h2 className="font-medium text-[#1a1a1a]">States</h2>
        <p className=" text-[#999] mt-0.5">
          Manage state master data
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSave}
        className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden"
      >
        <div className="px-5 py-3.5 border-b border-[#E8E6E1] flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#1a1a1a] flex items-center justify-center shrink-0">
            <svg
              width="10"
              height="10"
              viewBox="0 0 14 14"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M7 1C4.8 1 3 2.8 3 5c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z" />
              <circle cx="7" cy="5" r="1.5" />
            </svg>
          </div>
          <span className=" font-medium text-[#1a1a1a]">
            General Information
          </span>
        </div>
        <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">
          <FormField label="State Name" required>
            <input
              className={inputCls(!!errors.stnm)}
              placeholder="e.g. Uttar Pradesh"
              value={form.stnm}
              onChange={(e) => {
                setForm((p) => ({ ...p, stnm: e.target.value }));
                setErrors((p) => ({ ...p, stnm: undefined }));
              }}
            />
            {errors.stnm && (
              <p className=" text-red-400 mt-0.5">{errors.stnm}</p>
            )}
          </FormField>
          <FormField label="Short Name" required>
            <input
              className={inputCls(!!errors.stshnm)}
              placeholder="e.g. UP"
              value={form.stshnm}
              onChange={(e) => {
                setForm((p) => ({ ...p, stshnm: e.target.value }));
                setErrors((p) => ({ ...p, stshnm: undefined }));
              }}
            />
            {errors.stshnm && (
              <p className=" text-red-400 mt-0.5">{errors.stshnm}</p>
            )}
          </FormField>
        </div>
        <div className="px-5 py-3.5 border-t border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between">
          <p className="text-[#bbb]">
            Code will be auto-generated (STCA_____)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setForm({ stnm: "", stshnm: "" });
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
          <span className=" font-medium text-[#1a1a1a]">
            All States
            <span className="ml-2 font-normal text-[#aaa]">
              {states.length} total
            </span>
          </span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
              {["Code", "State Name", "Short Name", ""].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-2.5  font-semibold tracking-[0.08em] uppercase text-[#aaa]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {states.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[#ccc]">
                  No states yet
                </td>
              </tr>
            ) : (
              states.map((s, i) => (
                <motion.tr
                  key={s.rowid}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[#F5F4F0] last:border-0 hover:bg-[#FAFAF9] transition-colors"
                >
                  <td className="px-4 py-3 text-[#aaa] font-mono">{s.stcd}</td>
                  <td className="px-4 py-3 font-medium text-[#1a1a1a]">
                    {s.stnm}
                  </td>
                  <td className="px-4 py-3 text-[#666]">{s.stshnm}</td>
                  <td className="px-4 py-3">
                    <TrashBtn
                      onClick={() =>
                        setDeleteTarget({ rowid: s.rowid, label: s.stnm })
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

// ─── CITY PANEL ───────────────────────────────────────────────────────────────

export function CityPanelContent() {
  const [form, setForm] = useState({ ctynm: "", ctystcd: "" });
  const [errors, setErrors] = useState<{ ctynm?: string; ctystcd?: string }>(
    {},
  );
  const [deleteTarget, setDeleteTarget] = useState<{
    rowid: number;
    label: string;
  } | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const { data: cities = [], refetch } = trpc.city.getAll.useQuery();
  const { data: states = [] } = trpc.state.getAll.useQuery();

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const createMutation = trpc.city.create.useMutation({
    onSuccess: () => {
      showToast("success", "City created");
      setForm({ ctynm: "", ctystcd: "" });
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const deleteMutation = trpc.city.delete.useMutation({
    onSuccess: () => {
      showToast("success", "City deleted");
      setDeleteTarget(null);
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!form.ctynm.trim()) errs.ctynm = "Required";
    if (!form.ctystcd) errs.ctystcd = "Required";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    createMutation.mutate(form);
  };

  // Derive the display name for the currently selected state
  const selectedStateName =
    states.find((s) => s.stcd === form.ctystcd)?.stnm ?? "";

  return (
    <div className=" flex flex-col gap-5">
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

      <div>
        <h2 className=" font-medium text-[#1a1a1a]">Cities</h2>
        <p className=" text-[#999] mt-0.5">
          Manage city master data
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden"
      >
        <div className="px-5 py-3.5 border-b border-[#E8E6E1] flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#1a1a1a] flex items-center justify-center shrink-0">
            <svg
              width="10"
              height="10"
              viewBox="0 0 14 14"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <rect x="1" y="5" width="12" height="8" rx="1" />
              <path d="M4 5V3a3 3 0 0 1 6 0v2" />
            </svg>
          </div>
          <span className=" font-medium text-[#1a1a1a]">
            City Information
          </span>
        </div>

        <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">
          {/* City Name */}
          <FormField label="City Name" required>
            <input
              className={inputCls(!!errors.ctynm)}
              placeholder="e.g. Agra"
              value={form.ctynm}
              onChange={(e) => {
                setForm((p) => ({ ...p, ctynm: e.target.value }));
                setErrors((p) => ({ ...p, ctynm: undefined }));
              }}
            />
            {errors.ctynm && (
              <p className=" text-red-400 mt-0.5">{errors.ctynm}</p>
            )}
          </FormField>

          {/* State — Combobox */}
          <FormField label="State Name" required>
            <Combobox
              items={states.map((s) => s.stnm)}
              value={selectedStateName}
              onValueChange={(val) => {
                const state = states.find((s) => s.stnm === val);
                setForm((p) => ({ ...p, ctystcd: state?.stcd ?? "" }));
                setErrors((p) => ({ ...p, ctystcd: undefined }));
              }}
              autoHighlight
            >
              <ComboboxInput
                placeholder="Search state…"
                className={cn(
                  "w-full h-9 px-3  rounded-lg border bg-white text-[#1a1a1a] placeholder:text-[#bbb]",
                  "transition-all duration-150 outline-none",
                  "focus:ring-2 focus:ring-[#1a1a1a]/8 focus:border-[#1a1a1a]",
                  errors.ctystcd
                    ? "border-red-300 bg-red-50/40"
                    : "border-[#E8E6E1] hover:border-[#C8C5BE]",
                )}
              />
              <ComboboxContent
                className={cn(
                  "z-50 min-w-(--radix-popover-trigger-width)",
                  "mt-1.5 p-1 rounded-xl border border-[#E8E6E1] bg-white",
                  "shadow-[0_8px_24px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.05)]",
                  "animate-in fade-in-0 zoom-in-95 duration-100",
                )}
              >
                <ComboboxEmpty className="py-7 text-center] text-[#bbb] tracking-wide">
                  No states found.
                </ComboboxEmpty>
                <ComboboxList className="max-h-55 overflow-y-auto scrollbar-none">
                  {(item) => (
                    <ComboboxItem
                      key={item}
                      value={item}
                      className={cn(
                        "flex items-center gap-2 px-2.5 py-1.75 rounded-lg",
                        " text-[#1a1a1a] cursor-pointer select-none",
                        "transition-colors duration-75 outline-none",
                        "hover:bg-[#F5F4F0] data-highlighted:bg-[#F5F4F0]",
                        "data-selected:font-medium data-selected:text-[#1a1a1a]",
                        "data-selected:before:content-[''] data-selected:before:w-1 data-selected:before:h-1",
                        "data-selected:before:rounded-full data-selected:before:bg-[#1a1a1a]/40 data-selected:before:shrink-0",
                      )}
                    >
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            {errors.ctystcd && (
              <p className=" text-red-400 mt-0.5">
                {errors.ctystcd}
              </p>
            )}
          </FormField>
        </div>

        <div className="px-5 py-3.5 border-t border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between">
          <p className="] text-[#bbb]">
            Code will be auto-generated (CTYA_____)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setForm({ ctynm: "", ctystcd: "" });
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
          <span className=" font-medium text-[#1a1a1a]">
            All Cities
            <span className="ml-2 font-normal text-[#aaa]">
              {cities.length} total
            </span>
          </span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
              {["Code", "City Name", "State", ""].map((h) => (
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
            {cities.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[#ccc]">
                  No cities yet
                </td>
              </tr>
            ) : (
              cities.map((c, i) => (
                <motion.tr
                  key={c.rowid}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[#F5F4F0] last:border-0 hover:bg-[#FAFAF9] transition-colors"
                >
                  <td className="px-4 py-3 text-[#aaa] font-mono">{c.ctycd}</td>
                  <td className="px-4 py-3 font-medium text-[#1a1a1a]">
                    {c.ctynm}
                  </td>
                  <td className="px-4 py-3 text-[#666]">{c.stnm}</td>
                  <td className="px-4 py-3">
                    <TrashBtn
                      onClick={() =>
                        setDeleteTarget({ rowid: c.rowid, label: c.ctynm })
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

// ─── STATION PANEL ────────────────────────────────────────────────────────────

export function StationPanelContent() {
  const [form, setForm] = useState({ stnnm: "" });
  const [errors, setErrors] = useState<{ stnnm?: string }>({});
  const [deleteTarget, setDeleteTarget] = useState<{
    rowid: number;
    label: string;
  } | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const { data: stations = [], refetch } = trpc.station.getAll.useQuery();

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const createMutation = trpc.station.create.useMutation({
    onSuccess: () => {
      showToast("success", "Station created");
      setForm({ stnnm: "" });
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const deleteMutation = trpc.station.delete.useMutation({
    onSuccess: () => {
      showToast("success", "Station deleted");
      setDeleteTarget(null);
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.stnnm.trim()) {
      setErrors({ stnnm: "Required" });
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

      <div>
        <h2 className="font-medium text-[#1a1a1a]">Stations</h2>
        <p className=" text-[#999] mt-0.5">
          Manage station master data
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden"
      >
        <div className="px-5 py-3.5 border-b border-[#E8E6E1] flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#1a1a1a] flex items-center justify-center shrink-0">
            <svg
              width="10"
              height="10"
              viewBox="0 0 14 14"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <rect x="1" y="3" width="12" height="9" rx="1" />
              <path d="M4 3V1.5M10 3V1.5M1 7h12" />
            </svg>
          </div>
          <span className="font-medium text-[#1a1a1a]">
            City Information
          </span>
        </div>
        <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">
          <FormField label="Station Name" required>
            <input
              className={inputCls(!!errors.stnnm)}
              placeholder="e.g. Agra Cantt"
              value={form.stnnm}
              onChange={(e) => {
                setForm({ stnnm: e.target.value });
                setErrors({});
              }}
            />
            {errors.stnnm && (
              <p className=" text-red-400 mt-0.5">{errors.stnnm}</p>
            )}
          </FormField>
          <div /> {/* spacer */}
        </div>
        <div className="px-5 py-3.5 border-t border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between">
          <p className=" text-[#bbb]">
            Code will be auto-generated (STNA_____)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setForm({ stnnm: "" });
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
          <span className=" font-medium text-[#1a1a1a]">
            All Stations
            <span className="ml-2] font-normal text-[#aaa]">
              {stations.length} total
            </span>
          </span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
              {["Code", "Station Name", ""].map((h) => (
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
            {stations.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-[#ccc]">
                  No stations yet
                </td>
              </tr>
            ) : (
              stations.map((s, i) => (
                <motion.tr
                  key={s.rowid}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[#F5F4F0] last:border-0 hover:bg-[#FAFAF9] transition-colors"
                >
                  <td className="px-4 py-3 text-[#aaa] font-mono">{s.stncd}</td>
                  <td className="px-4 py-3 font-medium text-[#1a1a1a]">
                    {s.stnnm}
                  </td>
                  <td className="px-4 py-3">
                    <TrashBtn
                      onClick={() =>
                        setDeleteTarget({ rowid: s.rowid, label: s.stnnm })
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
