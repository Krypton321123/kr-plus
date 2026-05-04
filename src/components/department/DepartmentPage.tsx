"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { toast } from "sonner";
import { StyledCombobox } from "../items/ItemMasterPage";

// ── Types ──────────────────────────────────────────────────────────────────
type MasterPerq = {
  rowid: number;
  prfcd: string;
  ctgname: string;
  valtyp: string;
};

type DeptForm = {
  untcd: string;
  dptnm: string;
  empcd: string;
  wkoff: string;
  wkoffday: string;
  almlv: string;
  nolv: number;
  alflv: string;
  alnhd: string;
  ernlv: string;
  dismlv: string;
  eldys: number;
  mldys: number;
  linkedPrfcds: string[]; // prfcd codes of selected perquisites
};

type DeptRow = {
  rowid: number;
  dptcd: string | null;
  dptnm: string | null;
  untcd: string | null;
  untnm: string;
  wkoff: string | null;
  wkoffday: string | null;
};

const EMPTY_FORM: DeptForm = {
  untcd: "",
  dptnm: "",
  empcd: "",
  wkoff: "YES",
  wkoffday: "Sunday",
  almlv: "YES",
  nolv: 0,
  alflv: "YES",
  alnhd: "YES",
  ernlv: "Forward",
  dismlv: "Absent Days Are Greater Than Monthly Leaves",
  eldys: 0,
  mldys: 0,
  linkedPrfcds: [],
};

const YES_NO = ["YES", "NO"];
const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const EARNED_LEAVE_OPTS = ["Forward", "Encash", "Lapse"];
const DISMLV_OPTS = [
  "Absent Days Are Greater Than Monthly Leaves",
  "Absent Days Are Greater Than Half Month",
  "Never",
];

// ── Shared style helpers ───────────────────────────────────────────────────
const inputCls =
  "w-full h-9 px-3 text-[13px] bg-white border border-[#E8E6E1] rounded-lg text-[#1a1a1a] placeholder:text-[#ccc] " +
  "hover:border-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all duration-150";

const selectCls =
  "w-full h-9 px-3 text-[13px] bg-white border border-[#E8E6E1] rounded-lg text-[#1a1a1a] " +
  "hover:border-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] " +
  "transition-all duration-150 cursor-pointer";

function Field({
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

// ── Perquisites Picker Component ────────────────────────────────────────────
function PerquisitesPicker({
  allPerquisites,
  linkedPrfcds,
  onChange,
}: {
  allPerquisites: MasterPerq[];
  linkedPrfcds: string[];
  onChange: (prfcds: string[]) => void;
}) {
  // The currently selected item in the top dropdown (to add)
  const [pickerValue, setPickerValue] = useState("");
  // The highlighted row index in the table (for − removal)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Full perquisite objects for the currently linked prfcds (in order)
  const linkedRows = linkedPrfcds
    .map((prfcd) => allPerquisites.find((p) => p.prfcd === prfcd))
    .filter(Boolean) as MasterPerq[];

  // Only show unlinked ones in the picker dropdown
  const availableOptions = allPerquisites.filter(
    (p) => !linkedPrfcds.includes(p.prfcd)
  );

  function handleAdd() {
    if (!pickerValue) return;
    if (linkedPrfcds.includes(pickerValue)) {
      toast.error("Already added");
      return;
    }
    onChange([...linkedPrfcds, pickerValue]);
    setPickerValue("");
    setSelectedIdx(linkedPrfcds.length); // select the newly added row
  }

  function handleRemove() {
    if (selectedIdx === null) {
      if (linkedPrfcds.length === 0) return;
      // Remove last if nothing selected
      onChange(linkedPrfcds.slice(0, -1));
      return;
    }
    const next = linkedPrfcds.filter((_, i) => i !== selectedIdx);
    onChange(next);
    setSelectedIdx(null);
  }

  return (
    <div className="border border-[#E8E6E1] rounded-xl overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 bg-[#FAFAF9]">
        <div className="w-5 h-5 rounded-md bg-[#1a1a1a] flex items-center justify-center shrink-0">
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 4h10M2 7h10M2 10h6" />
          </svg>
        </div>
        <span className="text-[13px] font-medium text-[#1a1a1a]">Perquisites Categories</span>
        {linkedPrfcds.length > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[#F0EFEB] text-[#888] rounded-md">
            {linkedPrfcds.length}
          </span>
        )}
      </div>

      <div className="p-4 border-t border-[#E8E6E1] flex flex-col gap-3">

        {/* ── Picker row: dropdown + + − ──────────────────────────────── */}
        <div className="flex items-center gap-2">
          {/* Dropdown of available (not yet linked) perquisites */}
          <div className="relative flex-1">
            <select
              value={pickerValue}
              onChange={(e) => setPickerValue(e.target.value)}
              className={
                "w-full h-9 pl-3 pr-8 text-[13px] bg-white border border-[#E8E6E1] rounded-lg text-[#1a1a1a] " +
                "hover:border-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] " +
                "transition-all duration-150 cursor-pointer appearance-none"
              }
            >
              <option value="">
                {availableOptions.length === 0
                  ? "— All perquisites already added —"
                  : "— Select a perquisite to add —"}
              </option>
              {availableOptions.map((p) => (
                <option key={p.prfcd} value={p.prfcd}>
                  {p.ctgname}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#aaa]"
              width="11" height="11" viewBox="0 0 14 14" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
            >
              <path d="M3 5l4 4 4-4" />
            </svg>
          </div>

          {/* + Add button */}
          <button
            onClick={handleAdd}
            disabled={!pickerValue}
            title="Add selected perquisite"
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#E8E6E1] bg-white text-[#555] hover:bg-[#1a1a1a] hover:text-white hover:border-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M7 1v12M1 7h12" />
            </svg>
          </button>

          {/* − Remove selected/last button */}
          <button
            onClick={handleRemove}
            disabled={linkedPrfcds.length === 0}
            title="Remove selected row"
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#E8E6E1] bg-white text-[#555] hover:bg-red-500 hover:text-white hover:border-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 shrink-0"
          >
            <svg width="12" height="4" viewBox="0 0 14 4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M1 2h12" />
            </svg>
          </button>
        </div>

        {/* ── Linked perquisites table ────────────────────────────────── */}
        {linkedRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 border border-dashed border-[#E8E6E1] rounded-lg">
            <svg className="h-8 w-8 text-[#E8E6E1]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
            </svg>
            <span className="text-[12px] text-[#bbb]">No perquisites linked yet</span>
            <p className="text-[11px] text-[#ccc]">Select one from the dropdown above and click +</p>
          </div>
        ) : (
          <div className="border border-[#E8E6E1] rounded-lg overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#FAFAF9] border-b border-[#E8E6E1]">
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] w-8">#</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa]">Perquisites Name</th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] w-28">Valid Type</th>
                  <th className="px-3 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F4F0]">
                {linkedRows.map((row, idx) => {
                  const isSelected = selectedIdx === idx;
                  return (
                    <tr
                      key={row.prfcd}
                      onClick={() => setSelectedIdx(isSelected ? null : idx)}
                      className={`group cursor-pointer transition-colors duration-100 ${
                        isSelected ? "bg-blue-50/70" : "hover:bg-[#FAFAF9]"
                      }`}
                    >
                      {/* # */}
                      <td className="px-3 py-2.5 text-[#aaa] text-[12px]">{idx + 1}</td>

                      {/* Name — read-only, it's from the master */}
                      <td className="px-3 py-2.5 font-medium text-[#1a1a1a]">
                        {row.ctgname}
                      </td>

                      {/* Valid Type badge */}
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium
                          ${row.valtyp === "%"
                            ? "bg-purple-50 text-purple-700 border border-purple-100"
                            : "bg-[#F5F4F0] text-[#666] border border-[#E8E6E1]"
                          }`}>
                          {row.valtyp === "%" ? "%" : "Fix"}
                        </span>
                      </td>

                      {/* Remove button */}
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            onChange(linkedPrfcds.filter((_, i) => i !== idx));
                            if (selectedIdx === idx) setSelectedIdx(null);
                            else if (selectedIdx !== null && selectedIdx > idx)
                              setSelectedIdx(selectedIdx - 1);
                          }}
                          title="Remove"
                          className="w-7 h-7 flex items-center justify-center rounded-md border border-transparent text-[#ccc] hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all duration-150 opacity-0 group-hover:opacity-100"
                        >
                          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1.5 3.5h11M5 3.5V2h4v1.5M3 3.5l.7 8h6.6l.7-8" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function DepartmentPage() {
  const [form, setForm] = useState<DeptForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDptcd, setEditingDptcd] = useState<string>("");
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ rowid: number; dptcd: string } | null>(null);

  const utils = trpc.useUtils();
  const { data: depts = [], isLoading } = trpc.department.getAll.useQuery();
  const { data: units = [] } = trpc.department.getUnits.useQuery();
  const { data: allPerquisites = [] } = trpc.department.getAllPerquisites.useQuery();

  const unitItems = (units as any[]).map((u) => ({
    label: u.untnm as string,
    value: u.untcd as string,
  }));

  const createMutation = trpc.department.create.useMutation({
    onSuccess: () => { toast.success("Department saved"); resetForm(); utils.department.getAll.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.department.update.useMutation({
    onSuccess: () => { toast.success("Department updated"); resetForm(); utils.department.getAll.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.department.delete.useMutation({
    onSuccess: () => { toast.success("Department deleted"); setDeleteConfirm(null); utils.department.getAll.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  function set<K extends keyof DeptForm>(key: K, val: DeptForm[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setEditingDptcd("");
  }

  async function handleEdit(row: DeptRow) {
    const result = await utils.department.getOne.fetch({ rowid: row.rowid });
    setForm({
      untcd: result.untcd ?? "",
      dptnm: result.dptnm ?? "",
      empcd: result.empcd ?? "",
      wkoff: result.wkoff ?? "YES",
      wkoffday: result.wkoffday ?? "Sunday",
      almlv: result.almlv ?? "YES",
      nolv: result.nolv ?? 0,
      alflv: result.alflv ?? "YES",
      alnhd: result.alnhd ?? "YES",
      ernlv: result.ernlv ?? "Forward",
      dismlv: result.dismlv ?? DISMLV_OPTS[0],
      eldys: result.eldys ?? 0,
      mldys: result.mldys ?? 0,
      linkedPrfcds: result.linkedPrfcds ?? [],
    });
    setEditingId(row.rowid);
    setEditingDptcd(row.dptcd ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSave() {
    if (!form.dptnm.trim()) { toast.error("Department name is required"); return; }
    if (editingId !== null) {
      updateMutation.mutate({ rowid: editingId, dptcd: editingDptcd, ...form });
    } else {
      createMutation.mutate(form);
    }
  }

  const filtered = (depts as DeptRow[]).filter(
    (d) =>
      (d.dptnm ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.dptcd ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.untnm ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isEdit = editingId !== null;

  return (
    <div className="flex flex-col gap-5">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-medium text-[#1a1a1a]">Department Master</h2>
          <p className="text-[12px] text-[#999] mt-0.5">Manage departments and their leave configurations</p>
        </div>
        {isEdit && (
          <button
            onClick={resetForm}
            className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-[#555] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] hover:text-[#1a1a1a] transition-all duration-150"
          >
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
            Cancel Edit
          </button>
        )}
      </div>

      {/* ── Edit banner ──────────────────────────────────────────────────── */}
      {isEdit && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-[12px] text-blue-600">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 10.5L4.5 11 11 4.5a1.77 1.77 0 0 0-2.5-2.5L2 8.5v2z" />
          </svg>
          Editing <span className="font-medium ml-1">{form.dptnm}</span>
          <span className="ml-1 font-mono text-blue-400">· {editingDptcd}</span>
          — make changes and click Update.
        </div>
      )}

      {/* ── Department Information Card ───────────────────────────────────── */}
      <div className="border border-[#E8E6E1] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#FAFAF9]">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-[#1a1a1a] flex items-center justify-center shrink-0">
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                <rect x="2" y="2" width="10" height="10" rx="1.5" />
                <path d="M5 7h4M5 9.5h2.5" />
              </svg>
            </div>
            <span className="text-[13px] font-medium text-[#1a1a1a]">Department Information</span>
          </div>
          {!isEdit && (
            <span className="text-[11px] font-mono text-[#bbb]">Code: Auto</span>
          )}
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 border-t border-[#E8E6E1]">

          <Field label="Unit Name">
            <StyledCombobox
              items={unitItems}
              value={form.untcd}
              onValueChange={(v) => set("untcd", v)}
              placeholder="Select unit…"
            />
          </Field>

          <Field label="Department Name" required>
            <input
              type="text"
              value={form.dptnm}
              onChange={(e) => set("dptnm", e.target.value)}
              placeholder="e.g. Human Resources"
              className={inputCls}
            />
          </Field>

          <Field label="Weekly Off">
            <select value={form.wkoff} onChange={(e) => set("wkoff", e.target.value)} className={selectCls}>
              {YES_NO.map((v) => <option key={v}>{v}</option>)}
            </select>
          </Field>

          <Field label="Weekly Off Day">
            <select value={form.wkoffday} onChange={(e) => set("wkoffday", e.target.value)} className={selectCls}>
              {WEEK_DAYS.map((v) => <option key={v}>{v}</option>)}
            </select>
          </Field>

          <Field label="Allow Monthly Leaves">
            <select value={form.almlv} onChange={(e) => set("almlv", e.target.value)} className={selectCls}>
              {YES_NO.map((v) => <option key={v}>{v}</option>)}
            </select>
          </Field>

          <Field label="No. Of Leaves">
            <div className="relative">
              <input
                type="number" min={0}
                value={form.nolv}
                onChange={(e) => set("nolv", Number(e.target.value))}
                className={inputCls + " pr-12"}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#aaa] pointer-events-none">Days</span>
            </div>
          </Field>

          <Field label="Allow Festival Leaves">
            <select value={form.alflv} onChange={(e) => set("alflv", e.target.value)} className={selectCls}>
              {YES_NO.map((v) => <option key={v}>{v}</option>)}
            </select>
          </Field>

          <Field label="Allow National Holidays">
            <select value={form.alnhd} onChange={(e) => set("alnhd", e.target.value)} className={selectCls}>
              {YES_NO.map((v) => <option key={v}>{v}</option>)}
            </select>
          </Field>

          <Field label="Earned Leaves">
            <select value={form.ernlv} onChange={(e) => set("ernlv", e.target.value)} className={selectCls}>
              {EARNED_LEAVE_OPTS.map((v) => <option key={v}>{v}</option>)}
            </select>
          </Field>

          <Field label="Disallow Monthly Leaves If">
            <select value={form.dismlv} onChange={(e) => set("dismlv", e.target.value)} className={selectCls}>
              {DISMLV_OPTS.map((v) => <option key={v}>{v}</option>)}
            </select>
          </Field>

          <Field label="Working Days For EL (min)">
            <div className="relative">
              <input
                type="number" min={0}
                value={form.eldys}
                onChange={(e) => set("eldys", Number(e.target.value))}
                className={inputCls + " pr-12"}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#aaa] pointer-events-none">Days</span>
            </div>
          </Field>

          <Field label="Medical Leaves (Per Year)">
            <div className="relative">
              <input
                type="number" min={0}
                value={form.mldys}
                onChange={(e) => set("mldys", Number(e.target.value))}
                className={inputCls + " pr-12"}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#aaa] pointer-events-none">Days</span>
            </div>
          </Field>
        </div>
      </div>

      {/* ── Perquisites Picker Card ────────────────────────────────────────── */}
      <PerquisitesPicker
        allPerquisites={allPerquisites as MasterPerq[]}
        linkedPrfcds={form.linkedPrfcds}
        onChange={(prfcds) => set("linkedPrfcds", prfcds)}
      />

      {/* ── Action buttons ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-2">
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
                  : <path d="M2 7l3.5 3.5L12 3" />}
              </svg>
              {isEdit ? "Update Department" : "Save Department"}
            </>
          )}
        </button>
      </div>

      {/* ── Records Table ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E8E6E1] flex items-center justify-between shrink-0">
          <span className="text-[13px] font-medium text-[#1a1a1a]">
            All Departments
            <span className="ml-2 text-[11px] font-normal text-[#aaa]">{depts.length} total</span>
          </span>
          <div className="relative">
            <input
              type="text"
              placeholder="Search departments…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 pl-7 pr-3 text-[12px] border border-[#E8E6E1] rounded-lg bg-[#FAFAF9] text-[#1a1a1a] placeholder:text-[#ccc] focus:outline-none focus:border-[#ccc] w-48 transition-all duration-150"
            />
            <svg className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="6" cy="6" r="4" />
              <path d="M9.5 9.5l2.5 2.5" />
            </svg>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-[#ccc] text-[13px] gap-2">
            <svg className="animate-spin" width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round">
              <path d="M7 1a6 6 0 1 0 6 6" />
            </svg>
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-[#ccc]">
            <svg className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <span className="text-[12px]">{search ? "No departments match your search" : "No departments yet — create one above"}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-[#FAFAF9]">
                <tr className="border-b border-[#E8E6E1]">
                  {["#", "Code", "Department Name", "Unit", "Weekly Off", "Off Day", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const isRowEditing = editingId === row.rowid;
                  return (
                    <tr
                      key={row.rowid}
                      className={`border-b border-[#F5F4F0] last:border-0 transition-colors duration-100 ${
                        isRowEditing ? "bg-blue-50/60" : "hover:bg-[#FAFAF9]"
                      }`}
                    >
                      <td className="px-4 py-3 text-[#aaa]">{i + 1}</td>
                      <td className="px-4 py-3 text-[#aaa] font-mono whitespace-nowrap">{row.dptcd}</td>
                      <td className="px-4 py-3 font-medium text-[#1a1a1a] whitespace-nowrap">{row.dptnm}</td>
                      <td className="px-4 py-3 text-[#666] whitespace-nowrap">{row.untnm || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
                          ${row.wkoff === "YES" ? "bg-green-50 text-green-700" : "bg-[#F5F4F0] text-[#aaa]"}`}>
                          <span className={`w-1 h-1 rounded-full ${row.wkoff === "YES" ? "bg-green-500" : "bg-[#ccc]"}`} />
                          {row.wkoff ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#666] whitespace-nowrap">{row.wkoffday ?? "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEdit(row)}
                            title="Edit"
                            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all duration-150 border
                              ${isRowEditing
                                ? "bg-blue-100 border-blue-200 text-blue-600"
                                : "bg-white border-[#E8E6E1] text-[#aaa] hover:border-[#C8C5BE] hover:text-[#555] hover:bg-[#F5F4F0]"}`}
                          >
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 10.5L4.5 11 11 4.5a1.77 1.77 0 0 0-2.5-2.5L2 8.5v2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ rowid: row.rowid, dptcd: row.dptcd ?? "" })}
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
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Delete confirm modal ────────────────────────────────────────────── */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-[#E8E6E1] shadow-xl p-6 w-80 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M7 2v5M7 10v.5" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-medium text-[#1a1a1a]">Delete Department?</p>
                <p className="text-[12px] text-[#999] mt-1 leading-relaxed">
                  This will also remove all linked perquisite associations. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="h-8 px-4 text-[12px] font-medium text-[#666] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-all duration-150"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm)}
                disabled={deleteMutation.isPending}
                className="h-8 px-4 text-[12px] font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all duration-150 flex items-center gap-1.5"
              >
                {deleteMutation.isPending ? (
                  <>
                    <svg className="animate-spin" width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      <path d="M7 1a6 6 0 1 0 6 6" />
                    </svg>
                    Deleting…
                  </>
                ) : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}