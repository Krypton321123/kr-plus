"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { trpc } from "../../app/_trpc/client";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "../ui/combobox";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

type Day = (typeof DAYS)[number];

// ─── Shared primitives ────────────────────────────────────────────────────────

const inputCls = (hasError?: boolean) =>
  `w-full h-9 px-3 bg-white border rounded-lg text-[#1a1a1a] placeholder:text-[#ccc]
   focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all duration-150
   ${hasError ? "border-red-300 bg-red-50/30" : "border-[#E8E6E1] hover:border-[#ccc]"}`;

const selectCls = (hasError?: boolean) =>
  `w-full h-9 px-3 bg-white border rounded-lg text-[#1a1a1a]
   hover:border-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]
   transition-all duration-150 cursor-pointer
   ${hasError ? "border-red-300 bg-red-50/30" : "border-[#E8E6E1]"}`;

const comboboxInputCls = (hasError?: boolean) =>
  cn(
    "w-full h-9 px-3 rounded-lg border bg-white text-[#1a1a1a] placeholder:text-[#bbb]",
    "transition-all duration-150 outline-none",
    "focus:ring-2 focus:ring-[#1a1a1a]/8 focus:border-[#1a1a1a]",
    hasError
      ? "border-red-300 bg-red-50/40"
      : "border-[#E8E6E1] hover:border-[#C8C5BE]"
  );

const comboboxContentCls = cn(
  "z-50 min-w-[var(--radix-popover-trigger-width)]",
  "mt-1.5 p-1 rounded-xl border border-[#E8E6E1] bg-white",
  "shadow-[0_8px_24px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.05)]",
  "animate-in fade-in-0 zoom-in-95 duration-100"
);

const comboboxItemCls = cn(
  "flex items-center gap-2 px-2.5 py-[7px] rounded-lg",
  "text-[#1a1a1a] cursor-pointer select-none",
  "transition-colors duration-75 outline-none",
  "hover:bg-[#F5F4F0] data-[highlighted]:bg-[#F5F4F0]",
  "data-[selected]:font-medium data-[selected]:text-[#1a1a1a]",
  "data-[selected]:before:content-[''] data-[selected]:before:w-1 data-[selected]:before:h-1",
  "data-[selected]:before:rounded-full data-[selected]:before:bg-[#1a1a1a]/40 data-[selected]:before:shrink-0"
);

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

// ─── Reusable Combobox Field ──────────────────────────────────────────────────

function ComboField({
  label,
  required,
  placeholder,
  items,
  value,
  onValueChange,
  hasError,
  errorMsg,
}: {
  label: string;
  required?: boolean;
  placeholder: string;
  items: string[];
  value: any;
  onValueChange: (val: string) => void;
  hasError?: boolean;
  errorMsg?: string;
}) {
  return (
    <FormField label={label} required={required}>
      <Combobox
        items={items}
        value={value}
        onValueChange={onValueChange}
        autoHighlight
      >
        <ComboboxInput
          placeholder={placeholder}
          className={comboboxInputCls(hasError)}
        />
        <ComboboxContent className={comboboxContentCls}>
          <ComboboxEmpty className="py-7 text-center text-[#bbb] tracking-wide">
            No results found.
          </ComboboxEmpty>
          <ComboboxList className="max-h-55 overflow-y-auto scrollbar-none">
            {(item) => (
              <ComboboxItem key={item} value={item} className={comboboxItemCls}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {hasError && errorMsg && (
        <p className="text-red-400 mt-0.5">{errorMsg}</p>
      )}
    </FormField>
  );
}

// ─── AREA INFO PANEL ──────────────────────────────────────────────────────────

type FormState = {
  areanm: string;
  zipcd: string;
  untcd: string;
  areactycd: string;
  areaday: Day | "";
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
  areanm: "",
  zipcd: "",
  untcd: "",
  areactycd: "",
  areaday: "",
};

export function AreaPanelContent() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [deleteTarget, setDeleteTarget] = useState<{
    rowid: number;
    label: string;
  } | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const { data: areas = [], refetch } = trpc.area.getAll.useQuery();
  const { data: units = [] } = trpc.unit.getAll.useQuery();
  const { data: cities = [] } = trpc.city.getAll.useQuery();

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const createMutation = trpc.area.create.useMutation({
    onSuccess: () => {
      showToast("success", "Area created");
      setForm(emptyForm);
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const deleteMutation = trpc.area.delete.useMutation({
    onSuccess: () => {
      showToast("success", "Area deleted");
      setDeleteTarget(null);
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: FormErrors = {};
    if (!form.areanm.trim()) errs.areanm = "Required";
    if (!form.zipcd.trim()) errs.zipcd = "Required";
    if (!form.untcd) errs.untcd = "Required";
    if (!form.areactycd) errs.areactycd = "Required";
    if (!form.areaday) errs.areaday = "Required";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    createMutation.mutate({ ...form, areaday: form.areaday as Day });
  };

  const clearField = <K extends keyof FormErrors>(key: K) =>
    setErrors((p) => ({ ...p, [key]: undefined }));

  const selectedUnitName = units.find((u) => u.untcd === form.untcd)?.untnm ?? "";
  const selectedCityName = cities.find((c) => c.ctycd === form.areactycd)?.ctynm ?? "";

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
        <h2 className="font-medium text-[#1a1a1a]">Areas</h2>
        <p className="text-[#999] mt-0.5">Manage area master data</p>
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
              strokeLinejoin="round"
            >
              <path d="M7 1C4.8 1 3 2.8 3 5c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z" />
              <circle cx="7" cy="5" r="1.3" />
            </svg>
          </div>
          <span className="font-medium text-[#1a1a1a]">Area Information</span>
        </div>

        {/* 3-col first row, 3-col second row */}
        <div className="p-5 grid grid-cols-3 gap-x-8 gap-y-4">
          {/* Area Name */}
          <FormField label="Area Name" required>
            <input
              className={inputCls(!!errors.areanm)}
              placeholder="e.g. Civil Lines"
              value={form.areanm}
              onChange={(e) => {
                setForm((p) => ({ ...p, areanm: e.target.value }));
                clearField("areanm");
              }}
            />
            {errors.areanm && (
              <p className="text-red-400 mt-0.5">{errors.areanm}</p>
            )}
          </FormField>

          {/* Zip Code */}
          <FormField label="Zip Code" required>
            <input
              className={inputCls(!!errors.zipcd)}
              placeholder="e.g. 282001"
              value={form.zipcd}
              onChange={(e) => {
                setForm((p) => ({ ...p, zipcd: e.target.value }));
                clearField("zipcd");
              }}
            />
            {errors.zipcd && (
              <p className="text-red-400 mt-0.5">{errors.zipcd}</p>
            )}
          </FormField>

          {/* Day */}
          <FormField label="Day" required>
            <select
              className={selectCls(!!errors.areaday)}
              value={form.areaday}
              onChange={(e) => {
                setForm((p) => ({ ...p, areaday: e.target.value as Day | "" }));
                clearField("areaday");
              }}
            >
              <option value="" disabled>
                Select day…
              </option>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {errors.areaday && (
              <p className="text-red-400 mt-0.5">{errors.areaday}</p>
            )}
          </FormField>

          {/* Unit / Depot */}
          <ComboField
            label="Unit / Depot"
            required
            placeholder="Search unit…"
            items={units.map((u) => u.untnm)}
            value={selectedUnitName}
            onValueChange={(val) => {
              const unit = units.find((u) => u.untnm === val);
              setForm((p) => ({ ...p, untcd: unit?.untcd ?? "" }));
              clearField("untcd");
            }}
            hasError={!!errors.untcd}
            errorMsg={errors.untcd}
          />

          {/* City */}
          <ComboField
            label="City"
            required
            placeholder="Search city…"
            items={cities.map((c) => c.ctynm)}
            value={selectedCityName}
            onValueChange={(val) => {
              const city = cities.find((c) => c.ctynm === val);
              setForm((p) => ({ ...p, areactycd: city?.ctycd ?? "" }));
              clearField("areactycd");
            }}
            hasError={!!errors.areactycd}
            errorMsg={errors.areactycd}
          />
        </div>

        <div className="px-5 py-3.5 border-t border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-between">
          <p className="text-[#bbb]">Code will be auto-generated (ARCA_____)</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setForm(emptyForm);
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
            All Areas
            <span className="ml-2 font-normal text-[#aaa]">
              {areas.length} total
            </span>
          </span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
              {["Code", "Area Name", "Zip", "Day", "Unit", "City", ""].map((h) => (
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
            {areas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[#ccc]">
                  No areas yet
                </td>
              </tr>
            ) : (
              areas.map((a, i) => (
                <motion.tr
                  key={a.rowid}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[#F5F4F0] last:border-0 hover:bg-[#FAFAF9] transition-colors"
                >
                  <td className="px-4 py-3 text-[#aaa] font-mono">{a.areacd}</td>
                  <td className="px-4 py-3 font-medium text-[#1a1a1a]">{a.areanm}</td>
                  <td className="px-4 py-3 text-[#666] font-mono">{a.zipcd}</td>
                  <td className="px-4 py-3 text-[#666]">{a.areaday}</td>
                  <td className="px-4 py-3 text-[#666]">{a.untnm}</td>
                  <td className="px-4 py-3 text-[#666]">{a.ctynm}</td>
                  <td className="px-4 py-3">
                    <TrashBtn
                      onClick={() =>
                        setDeleteTarget({ rowid: a.rowid, label: a.areanm })
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