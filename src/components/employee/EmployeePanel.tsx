"use client";

import { useState, useEffect, useCallback } from "react";
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

// ─── Primitives ───────────────────────────────────────────────────────────────

const inputCls = (hasError?: boolean) =>
  `w-full h-9 px-3 text-[13px] bg-white border rounded-lg text-[#1a1a1a] placeholder:text-[#ccc]
   focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all duration-150
   ${hasError ? "border-red-300 bg-red-50/30" : "border-[#E8E6E1] hover:border-[#ccc]"}`;

const textareaCls = (hasError?: boolean) =>
  `w-full px-3 py-2 text-[13px] bg-white border rounded-lg text-[#1a1a1a] placeholder:text-[#ccc] resize-none
   focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all duration-150
   ${hasError ? "border-red-300 bg-red-50/30" : "border-[#E8E6E1] hover:border-[#ccc]"}`;

function FormField({
  label, required, children, className,
}: {
  label: string; required?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#999]">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#E8E6E1] bg-[#FAFAF9]">
        <span className="text-[12px] font-semibold tracking-[0.06em] uppercase text-[#666]">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StyledSelect({
  value, onChange, options, hasError, placeholder, disabled,
}: {
  value: string; onChange: (v: string) => void;
  options: { label: string; value: string }[];
  hasError?: boolean; placeholder?: string; disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "w-full h-9 px-3 text-[13px] rounded-lg border bg-white text-[#1a1a1a]",
        "focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all duration-150 appearance-none cursor-pointer",
        hasError ? "border-red-300 bg-red-50/30" : "border-[#E8E6E1] hover:border-[#ccc]",
        disabled && "opacity-50 cursor-not-allowed",
        !value && "text-[#ccc]",
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23aaa' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
        paddingRight: "28px",
      }}
    >
      {placeholder && <option value="" disabled hidden>{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function StyledCombobox({
  items, value, onValueChange, placeholder, hasError,
}: {
  items: { label: string; value: string }[];
  value: string; onValueChange: (v: string) => void;
  placeholder: string; hasError?: boolean;
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
          "transition-all duration-150 outline-none focus:ring-2 focus:ring-[#1a1a1a]/8 focus:border-[#1a1a1a]",
          hasError ? "border-red-300 bg-red-50/40" : "border-[#E8E6E1] hover:border-[#C8C5BE]"
        )}
      />
      <ComboboxContent className={cn(
        "z-50 min-w-[var(--radix-popover-trigger-width)] mt-1.5 p-1 rounded-xl border border-[#E8E6E1] bg-white",
        "shadow-[0_8px_24px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.05)] animate-in fade-in-0 zoom-in-95 duration-100"
      )}>
        <ComboboxEmpty className="py-7 text-center text-[12px] text-[#bbb]">No results found.</ComboboxEmpty>
        <ComboboxList className="max-h-[220px] overflow-y-auto scrollbar-none">
          {(item) => (
            <ComboboxItem key={item} value={item} className={cn(
              "flex items-center gap-2 px-2.5 py-[7px] rounded-lg text-[13px] text-[#1a1a1a] cursor-pointer select-none",
              "transition-colors duration-75 outline-none hover:bg-[#F5F4F0] data-[highlighted]:bg-[#F5F4F0]",
              "data-[selected]:font-medium data-[selected]:before:content-[''] data-[selected]:before:w-1 data-[selected]:before:h-1",
              "data-[selected]:before:rounded-full data-[selected]:before:bg-[#1a1a1a]/40 data-[selected]:before:shrink-0"
            )}>{item}</ComboboxItem>
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
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
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

function DeleteModal({ label, onConfirm, onCancel, isPending }: {
  label: string; onConfirm: () => void; onCancel: () => void; isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 4 }} transition={{ duration: 0.15 }}
        className="relative bg-white rounded-xl border border-[#E8E6E1] shadow-xl p-6 w-[340px] flex flex-col gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"><path d="M7 2v5M7 10v.5" /></svg>
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#1a1a1a]">Delete employee?</p>
            <p className="text-[12px] text-[#999] mt-1"><span className="font-medium text-[#555]">{label}</span> will be permanently removed.</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onCancel} className="h-8 px-4 text-[12px] font-medium text-[#666] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-all">Cancel</button>
          <button onClick={onConfirm} disabled={isPending} className="h-8 px-4 text-[12px] font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all">
            {isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function EditBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-7 h-7 rounded-md flex items-center justify-center border bg-white border-[#E8E6E1] text-[#aaa] hover:border-[#1a1a1a]/30 hover:text-[#1a1a1a] hover:bg-[#F5F4F0] transition-all">
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" /></svg>
    </button>
  );
}

function TrashBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-7 h-7 rounded-md flex items-center justify-center border bg-white border-[#E8E6E1] text-[#aaa] hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all">
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 3.5h11M5 3.5V2h4v1.5M3 3.5l.7 8h6.6l.7-8" /></svg>
    </button>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type PrereqRow = { prfcd: string; ctgname: string; valtyp: string; value: number };

const defaultForm = {
  // General
  untcd:    "",
  currdt:   new Date().toISOString().slice(0, 10),
  entrydt:  "",
  empnm:    "",
  fthnm:    "",
  gender:   "MALE" as "MALE" | "FEMALE" | "OTHER",
  dob:      "",
  rlgcstcd: "",
  isactive: "ACTIVE" as "ACTIVE" | "INACTIVE",

  // Correspondence
  corraddr1:    "",
  corraddr2:    "",
  corrctycd:    "",
  corrctyState: "",   // derived, not saved
  corrareanm:   "",
  corrphno:     "",

  // Permanent
  sameAsAbove: false,
  peraddr1:    "",
  peraddr2:    "",
  perctycd:    "",
  perctyState: "",    // derived, not saved
  perareanm:   "",
  perphno:     "",

  // Contact
  mobno:    "",
  email:    "",
  prefby:   "",
  prefctno: "",
  srefby:   "",
  srefctno: "",

  // Joining
  jointyp: "ON STIPEND" as "ON STIPEND" | "ON SALARY",
  joindt:  "",
  dptcd:   "",
  dsgcd:   "",
  rptper:  "",

  // Payment
  paymod:   "CASH" as "CASH" | "NEFT" | "A/C TRANSFER" | "CHEQUE",
  bnkledcd: "",
  bnkaccnm: "",
  bnkaccno: "",

  // Salary
  bscsal: 0,
  tmpgs:  0,
  pfded:  "NO" as "YES" | "NO",

  empledcd: "",
};

type EmpForm = typeof defaultForm;

// ─── EMPLOYEE PANEL ────────────────────────────────────────────────────────────

export function EmployeePanelContent() {
  const [form, setForm]                   = useState<EmpForm>(defaultForm);
  const [errors, setErrors]               = useState<Partial<Record<string, string>>>({});
  const [prereqs, setPrereqs]             = useState<PrereqRow[]>([]);
  const [editingRowid, setEditingRowid]   = useState<number | null>(null);
  const [editingCode, setEditingCode]     = useState("");
  const [editingEmpcd, setEditingEmpcd]   = useState(""); // tracks empcd for fetching saved prereqs
  const [deleteTarget, setDeleteTarget]   = useState<{ rowid: number; label: string } | null>(null);
  const [toast, setToast]                 = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showForm, setShowForm]           = useState(false);

  const { data: employees = [], refetch } = trpc.employee.getAll.useQuery();
  const { data: units = [] }              = trpc.employee.getUnits.useQuery();
  const { data: rlgCastes = [] }          = trpc.employee.getReligionCastes.useQuery();
  const { data: cities = [] }             = trpc.employee.getCities.useQuery();
  const { data: areas = [] }              = trpc.employee.getAreas.useQuery();
  const { data: departments = [] }        = trpc.employee.getDepartments.useQuery();
  const { data: designations = [] }       = trpc.employee.getDesignations.useQuery();

  // Fetch prereq template for the selected department
  const deptPrereqQuery = trpc.employee.getDeptPrerequisites.useQuery(
    { dptcd: form.dptcd },
    { enabled: !!form.dptcd }
  );

  // Fetch saved prereq values for the employee being edited
  const empPrereqQuery = trpc.employee.getEmpPrereqs.useQuery(
    { empcd: editingEmpcd },
    { enabled: !!editingEmpcd }
  );

  // When creating (no editingEmpcd): load dept template with value = 0
  useEffect(() => {
    if (editingEmpcd) return; // editing path handled separately below
    if (deptPrereqQuery.data) {
      setPrereqs(deptPrereqQuery.data.map((p) => ({ ...p, value: 0 })));
    }
  }, [deptPrereqQuery.data, editingEmpcd]);

  // When editing: merge dept template with saved values once both are ready
  useEffect(() => {
    if (!editingEmpcd) return;
    if (!deptPrereqQuery.data || !empPrereqQuery.data) return;
    const savedMap = new Map(empPrereqQuery.data.map((r) => [r.prfcd, r.prfval]));
    setPrereqs(
      deptPrereqQuery.data.map((p) => ({
        ...p,
        value: savedMap.has(p.prfcd) ? Number(savedMap.get(p.prfcd)) : 0,
      }))
    );
  }, [deptPrereqQuery.data, empPrereqQuery.data, editingEmpcd]);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const set = useCallback(<K extends keyof EmpForm>(key: K, val: EmpForm[K]) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  }, []);

  const getCityState = (ctycd: string) =>
    cities.find((c) => c.ctycd === ctycd)?.stnm ?? "";

  const handleCorrCityChange = (ctycd: string) => {
    set("corrctycd", ctycd);
    set("corrctyState", getCityState(ctycd) as any);
  };

  const handlePerCityChange = (ctycd: string) => {
    set("perctycd", ctycd);
    set("perctyState", getCityState(ctycd) as any);
  };

  const handleSameAsAbove = (checked: boolean) => {
    set("sameAsAbove", checked as any);
    if (checked) {
      setForm((p) => ({
        ...p,
        sameAsAbove:  true,
        peraddr1:     p.corraddr1,
        peraddr2:     p.corraddr2,
        perctycd:     p.corrctycd,
        perctyState:  p.corrctyState,
        perareanm:    p.corrareanm,
        perphno:      p.corrphno,
      }));
    }
  };

  const getDeptHead = (dptcd: string) => {
    const dept = departments.find((d) => d.dptcd === dptcd);
    return dept?.empcd ?? "";
  };

  const handleDeptChange = (dptcd: string) => {
    set("dptcd", dptcd);
    setPrereqs([]); // clear until new dept template loads
  };

  const handlePrereqValueChange = (index: number, value: number) => {
    setPrereqs((prev) => prev.map((p, i) => i === index ? { ...p, value } : p));
  };

  const handleCancelEdit = () => {
    setForm(defaultForm);
    setErrors({});
    setEditingRowid(null);
    setEditingCode("");
    setEditingEmpcd("");
    setPrereqs([]);
    setShowForm(false);
  };

  const handleEdit = (row: typeof employees[number]) => {
    setForm({
      untcd:        row.untcd,
      currdt:       row.currdt  ? new Date(row.currdt).toISOString().slice(0, 10)  : "",
      entrydt:      row.entrydt ? new Date(row.entrydt).toISOString().slice(0, 10) : "",
      empnm:        row.empnm,
      fthnm:        row.fthnm,
      gender:       row.gender   as EmpForm["gender"],
      dob:          row.dob      ? new Date(row.dob).toISOString().slice(0, 10)    : "",
      rlgcstcd:     row.rlgcstcd,
      isactive:     row.isactive as EmpForm["isactive"],
      corraddr1:    row.corraddr1,
      corraddr2:    row.corraddr2  ?? "",
      corrctycd:    row.corrctycd,
      corrctyState: getCityState(row.corrctycd),
      corrareanm:   row.corrareanm,
      corrphno:     row.corrphno  ?? "",
      sameAsAbove:  false,
      peraddr1:     row.peraddr1,
      peraddr2:     row.peraddr2  ?? "",
      perctycd:     row.perctycd,
      perctyState:  getCityState(row.perctycd),
      perareanm:    row.perareanm,
      perphno:      row.perphno   ?? "",
      mobno:        row.mobno     ?? "",
      email:        row.email     ?? "",
      prefby:       row.prefby    ?? "",
      prefctno:     row.prefctno  ?? "",
      srefby:       row.srefby    ?? "",
      srefctno:     row.srefctno  ?? "",
      jointyp:      row.jointyp   as EmpForm["jointyp"],
      joindt:       row.joindt    ? new Date(row.joindt).toISOString().slice(0, 10) : "",
      dptcd:        row.dptcd,
      dsgcd:        row.dsgcd,
      rptper:       row.rptper    ?? "",
      paymod:       row.paymod    as EmpForm["paymod"],
      bnkledcd:     row.bnkledcd  ?? "",
      bnkaccnm:     row.bnkaccnm  ?? "",
      bnkaccno:     row.bnkaccno  ?? "",
      bscsal:       row.bscsal,
      tmpgs:        row.tmpgs,
      pfded:        row.pfded     as EmpForm["pfded"],
      empledcd:     row.empledcd,
    });
    setEditingRowid(row.rowid);
    setEditingCode(row.empcd ?? "");
    setEditingEmpcd(row.empcd ?? ""); // triggers empPrereqQuery
    setErrors({});
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.untcd)            errs.untcd     = "Required";
    if (!form.entrydt)          errs.entrydt   = "Required";
    if (!form.empnm.trim())     errs.empnm     = "Required";
    if (!form.fthnm.trim())     errs.fthnm     = "Required";
    if (!form.dob)              errs.dob       = "Required";
    if (!form.rlgcstcd)         errs.rlgcstcd  = "Required";
    if (!form.corraddr1.trim()) errs.corraddr1  = "Required";
    if (!form.corrctycd)        errs.corrctycd  = "Required";
    if (!form.peraddr1.trim())  errs.peraddr1   = "Required";
    if (!form.perctycd)         errs.perctycd   = "Required";
    if (!form.mobno.trim())     errs.mobno      = "Required";
    if (!form.joindt)           errs.joindt     = "Required";
    if (!form.dptcd)            errs.dptcd      = "Required";
    if (!form.dsgcd)            errs.dsgcd      = "Required";
    if (Object.keys(errs).length) { setErrors(errs); return false; }
    setErrors({});
    return true;
  };

  // Build the prereqs payload — always send whatever is currently in state
  const buildPrereqsPayload = () =>
    prereqs.map((p) => ({
      prfcd:  p.prfcd,
      prfval: String(p.value),
    }));

  const buildPayload = () => ({
    untcd:      form.untcd,
    currdt:     form.currdt,
    entrydt:    form.entrydt,
    empnm:      form.empnm,
    fthnm:      form.fthnm,
    gender:     form.gender,
    dob:        form.dob,
    rlgcstcd:   form.rlgcstcd,
    isactive:   form.isactive,
    corraddr1:  form.corraddr1,
    corraddr2:  form.corraddr2,
    corrctycd:  form.corrctycd,
    corrareanm: form.corrareanm,
    corrphno:   form.corrphno,
    peraddr1:   form.peraddr1,
    peraddr2:   form.peraddr2,
    perctycd:   form.perctycd,
    perareanm:  form.perareanm,
    perphno:    form.perphno,
    mobno:      form.mobno,
    email:      form.email,
    prefby:     form.prefby,
    prefctno:   form.prefctno,
    srefby:     form.srefby,
    srefctno:   form.srefctno,
    jointyp:    form.jointyp,
    joindt:     form.joindt,
    dptcd:      form.dptcd,
    dsgcd:      form.dsgcd,
    rptper:     form.rptper,
    paymod:     form.paymod,
    bnkledcd:   form.bnkledcd,
    bnkaccnm:   form.bnkaccnm,
    bnkaccno:   form.bnkaccno,
    bscsal:     form.bscsal,
    tmpgs:      form.tmpgs,
    pfded:      form.pfded,
    empledcd:   form.empledcd,
    prereqs:    buildPrereqsPayload(), // ← included in every save
  });

  const createMutation = trpc.employee.create.useMutation({
    onSuccess: () => {
      showToast("success", "Employee created successfully");
      setForm(defaultForm);
      setPrereqs([]);
      setShowForm(false);
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const updateMutation = trpc.employee.update.useMutation({
    onSuccess: () => {
      showToast("success", "Employee updated successfully");
      handleCancelEdit();
      refetch();
    },
    onError: (e) => showToast("error", e.message),
  });

  const deleteMutation = trpc.employee.delete.useMutation({
    onSuccess: () => {
      showToast("success", "Employee deleted");
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

  const isSaving  = createMutation.isPending || updateMutation.isPending;
  const isEditing = editingRowid !== null;

  // Options
  const unitOptions  = units.map((u) => ({ label: u.untnm,  value: u.untcd }));
  const casteOptions = rlgCastes.map((c) => ({ label: `${c.rlgcstnm} (${c.rlgnm})`, value: c.rlgcstcd }));
  const cityOptions  = cities.map((c) => ({ label: c.ctynm, value: c.ctycd }));
  const areaOptions  = areas.map((a) => ({ label: a.areanm, value: a.areacd }));
  const deptOptions  = departments.map((d) => ({ label: d.dptnm ?? (d.dptcd as string), value: d.dptcd ?? "" }));
  const dsgOptions   = designations.map((d) => ({ label: d.dsgnm, value: d.dsgcd }));

  // Prereq total
  const prereqTotal = prereqs.reduce((sum, p) => {
    if (p.valtyp === "%") return sum + (form.bscsal * p.value) / 100;
    return sum + p.value;
  }, 0);

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

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-medium text-[#1a1a1a]">Employees</h2>
          <p className="text-[12px] text-[#999] mt-0.5">Manage employee master data</p>
        </div>
        {!showForm && !isEditing && (
          <button
            onClick={() => setShowForm(true)}
            className="h-8 px-4 text-[12px] font-medium text-white bg-[#1a1a1a] rounded-lg hover:bg-[#333] transition-all flex items-center gap-1.5"
          >
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"><path d="M7 2v10M2 7h10" /></svg>
            Add Employee
          </button>
        )}
      </div>

      {/* ════ FORM ════ */}
      <AnimatePresence>
        {(showForm || isEditing) && (
          <motion.form
            onSubmit={handleSave}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            {/* Form header bar */}
            <div className={cn(
              "flex items-center justify-between px-5 py-3 rounded-xl border",
              isEditing ? "bg-amber-50 border-amber-200" : "bg-[#FAFAF9] border-[#E8E6E1]"
            )}>
              <div className="flex items-center gap-2">
                <div className={cn("w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0", isEditing ? "bg-amber-500" : "bg-[#1a1a1a]")}>
                  {isEditing ? (
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" /></svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><path d="M7 2v10M2 7h10" /></svg>
                  )}
                </div>
                <span className="text-[13px] font-medium text-[#1a1a1a]">
                  {isEditing ? <>Editing <span className="font-mono text-amber-600">{editingCode}</span></> : "New Employee"}
                </span>
              </div>
              <button type="button" onClick={handleCancelEdit} className="flex items-center gap-1.5 h-7 px-3 text-[11px] font-medium text-[#666] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-all">
                <svg width="9" height="9" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12" /></svg>
                {isEditing ? "Cancel edit" : "Cancel"}
              </button>
            </div>

            {/* ── General Information ── */}
            <Section title="General Information">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <FormField label="Unit Name" required>
                  <StyledCombobox items={unitOptions} value={form.untcd} onValueChange={(v) => set("untcd", v)} placeholder="Search unit…" hasError={!!errors.untcd} />
                  {errors.untcd && <p className="text-[11px] text-red-400 mt-0.5">{errors.untcd}</p>}
                </FormField>

                <FormField label="Employee Code">
                  <input className={inputCls()} value={isEditing ? editingCode : "Auto-generated"} disabled
                    style={{ opacity: 0.5, cursor: "not-allowed" }} readOnly />
                </FormField>

                <FormField label="Current Date">
                  <input type="date" className={inputCls()} value={form.currdt} onChange={(e) => set("currdt", e.target.value)} />
                </FormField>

                <FormField label="Entry Date" required>
                  <input type="date" className={inputCls(!!errors.entrydt)} value={form.entrydt} onChange={(e) => set("entrydt", e.target.value)} />
                  {errors.entrydt && <p className="text-[11px] text-red-400 mt-0.5">{errors.entrydt}</p>}
                </FormField>

                <FormField label="Employee Name" required>
                  <input className={inputCls(!!errors.empnm)} placeholder="Full name" value={form.empnm} onChange={(e) => set("empnm", e.target.value)} />
                  {errors.empnm && <p className="text-[11px] text-red-400 mt-0.5">{errors.empnm}</p>}
                </FormField>

                <FormField label="Father Name" required>
                  <input className={inputCls(!!errors.fthnm)} placeholder="Father's full name" value={form.fthnm} onChange={(e) => set("fthnm", e.target.value)} />
                  {errors.fthnm && <p className="text-[11px] text-red-400 mt-0.5">{errors.fthnm}</p>}
                </FormField>

                <FormField label="Gender">
                  <StyledSelect value={form.gender} onChange={(v) => set("gender", v as EmpForm["gender"])}
                    options={[{ label: "Male", value: "MALE" }, { label: "Female", value: "FEMALE" }, { label: "Other", value: "OTHER" }]} />
                </FormField>

                <FormField label="Date of Birth" required>
                  <input type="date" className={inputCls(!!errors.dob)} value={form.dob} onChange={(e) => set("dob", e.target.value)} />
                  {errors.dob && <p className="text-[11px] text-red-400 mt-0.5">{errors.dob}</p>}
                </FormField>

                <FormField label="Caste" required>
                  <StyledCombobox items={casteOptions} value={form.rlgcstcd} onValueChange={(v) => set("rlgcstcd", v)} placeholder="Search caste…" hasError={!!errors.rlgcstcd} />
                  {errors.rlgcstcd && <p className="text-[11px] text-red-400 mt-0.5">{errors.rlgcstcd}</p>}
                </FormField>

                <FormField label="Religion">
                  <input className={inputCls()} readOnly
                    value={rlgCastes.find((c) => c.rlgcstcd === form.rlgcstcd)?.rlgnm ?? ""}
                    placeholder="Auto-filled from caste"
                    style={{ opacity: form.rlgcstcd ? 1 : 0.5, cursor: "default" }} />
                </FormField>

                <FormField label="Status">
                  <StyledSelect value={form.isactive} onChange={(v) => set("isactive", v as EmpForm["isactive"])}
                    options={[{ label: "Active", value: "ACTIVE" }, { label: "Inactive", value: "INACTIVE" }]} />
                </FormField>

                <div />
              </div>
            </Section>

            {/* ── Correspondence Address ── */}
            <Section title="Correspondence Address">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <FormField label="Address Line 1" required>
                  <textarea rows={2} className={textareaCls(!!errors.corraddr1)} placeholder="Street, locality…"
                    value={form.corraddr1} onChange={(e) => set("corraddr1", e.target.value)} />
                  {errors.corraddr1 && <p className="text-[11px] text-red-400 mt-0.5">{errors.corraddr1}</p>}
                </FormField>

                <FormField label="Address Line 2">
                  <textarea rows={2} className={textareaCls()} placeholder="Landmark, area…"
                    value={form.corraddr2} onChange={(e) => set("corraddr2", e.target.value)} />
                </FormField>

                <FormField label="City" required>
                  <StyledCombobox items={cityOptions} value={form.corrctycd} onValueChange={handleCorrCityChange} placeholder="Search city…" hasError={!!errors.corrctycd} />
                  {errors.corrctycd && <p className="text-[11px] text-red-400 mt-0.5">{errors.corrctycd}</p>}
                </FormField>

                <FormField label="State">
                  <input className={inputCls()} readOnly value={form.corrctyState} placeholder="Auto-filled from city"
                    style={{ opacity: form.corrctyState ? 1 : 0.5, cursor: "default" }} />
                </FormField>

                <FormField label="Area / Village">
                  <StyledCombobox items={areaOptions} value={form.corrareanm} onValueChange={(v) => set("corrareanm", v)} placeholder="Search area…" />
                </FormField>

                <FormField label="Phone No">
                  <input className={inputCls()} placeholder="e.g. 0120-4567890" value={form.corrphno} onChange={(e) => set("corrphno", e.target.value)} />
                </FormField>
              </div>
            </Section>

            {/* ── Permanent Address ── */}
            <Section title="Permanent Address">
              <label className="flex items-center gap-2 cursor-pointer mb-4 w-fit">
                <div
                  onClick={() => handleSameAsAbove(!form.sameAsAbove)}
                  className={cn(
                    "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                    form.sameAsAbove ? "bg-[#1a1a1a] border-[#1a1a1a]" : "bg-white border-[#ccc]"
                  )}
                >
                  {form.sameAsAbove && (
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M1.5 5l2.5 2.5L8.5 2" /></svg>
                  )}
                </div>
                <span className="text-[12px] text-[#666]">Same as Correspondence Address</span>
              </label>

              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <FormField label="Address Line 1" required>
                  <textarea rows={2} className={textareaCls(!!errors.peraddr1)} placeholder="Street, locality…"
                    value={form.peraddr1} onChange={(e) => { if (!form.sameAsAbove) set("peraddr1", e.target.value); }}
                    readOnly={form.sameAsAbove} style={{ opacity: form.sameAsAbove ? 0.6 : 1 }} />
                  {errors.peraddr1 && <p className="text-[11px] text-red-400 mt-0.5">{errors.peraddr1}</p>}
                </FormField>

                <FormField label="Address Line 2">
                  <textarea rows={2} className={textareaCls()} placeholder="Landmark, area…"
                    value={form.peraddr2} onChange={(e) => { if (!form.sameAsAbove) set("peraddr2", e.target.value); }}
                    readOnly={form.sameAsAbove} style={{ opacity: form.sameAsAbove ? 0.6 : 1 }} />
                </FormField>

                <FormField label="City" required>
                  <div style={{ opacity: form.sameAsAbove ? 0.6 : 1, pointerEvents: form.sameAsAbove ? "none" : "auto" }}>
                    <StyledCombobox items={cityOptions} value={form.perctycd} onValueChange={handlePerCityChange} placeholder="Search city…" hasError={!!errors.perctycd} />
                  </div>
                  {errors.perctycd && <p className="text-[11px] text-red-400 mt-0.5">{errors.perctycd}</p>}
                </FormField>

                <FormField label="State">
                  <input className={inputCls()} readOnly value={form.perctyState} placeholder="Auto-filled from city"
                    style={{ opacity: form.perctyState ? 1 : 0.5, cursor: "default" }} />
                </FormField>

                <FormField label="Area / Village">
                  <div style={{ opacity: form.sameAsAbove ? 0.6 : 1, pointerEvents: form.sameAsAbove ? "none" : "auto" }}>
                    <StyledCombobox items={areaOptions} value={form.perareanm} onValueChange={(v) => set("perareanm", v)} placeholder="Search area…" />
                  </div>
                </FormField>

                <FormField label="Phone No">
                  <input className={inputCls()} placeholder="e.g. 0120-4567890" value={form.perphno}
                    onChange={(e) => { if (!form.sameAsAbove) set("perphno", e.target.value); }}
                    readOnly={form.sameAsAbove} style={{ opacity: form.sameAsAbove ? 0.6 : 1 }} />
                </FormField>

                <FormField label="Mobile No" required>
                  <input className={inputCls(!!errors.mobno)} placeholder="e.g. 9876543210" value={form.mobno} onChange={(e) => set("mobno", e.target.value)} />
                  {errors.mobno && <p className="text-[11px] text-red-400 mt-0.5">{errors.mobno}</p>}
                </FormField>

                <FormField label="Email Id">
                  <input className={inputCls()} placeholder="e.g. name@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
                </FormField>

                <FormField label="Ref. By (Primary)">
                  <input className={inputCls()} placeholder="Primary referee name" value={form.prefby} onChange={(e) => set("prefby", e.target.value)} />
                </FormField>

                <FormField label="Contact No (Primary)">
                  <input className={inputCls()} placeholder="Primary referee contact" value={form.prefctno} onChange={(e) => set("prefctno", e.target.value)} />
                </FormField>

                <FormField label="Ref. By (Secondary)">
                  <input className={inputCls()} placeholder="Secondary referee name" value={form.srefby} onChange={(e) => set("srefby", e.target.value)} />
                </FormField>

                <FormField label="Contact No (Secondary)">
                  <input className={inputCls()} placeholder="Secondary referee contact" value={form.srefctno} onChange={(e) => set("srefctno", e.target.value)} />
                </FormField>
              </div>
            </Section>

            {/* ── Joining Details ── */}
            <Section title="Joining Details">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <FormField label="Joining Type">
                  <StyledSelect value={form.jointyp} onChange={(v) => set("jointyp", v as EmpForm["jointyp"])}
                    options={[{ label: "On Stipend", value: "ON STIPEND" }, { label: "On Salary", value: "ON SALARY" }]} />
                </FormField>

                <FormField label="Joining Date" required>
                  <input type="date" className={inputCls(!!errors.joindt)} value={form.joindt} onChange={(e) => set("joindt", e.target.value)} />
                  {errors.joindt && <p className="text-[11px] text-red-400 mt-0.5">{errors.joindt}</p>}
                </FormField>

                <FormField label="Department" required>
                  <StyledCombobox items={deptOptions} value={form.dptcd} onValueChange={handleDeptChange} placeholder="Search department…" hasError={!!errors.dptcd} />
                  {errors.dptcd && <p className="text-[11px] text-red-400 mt-0.5">{errors.dptcd}</p>}
                </FormField>

                <FormField label="Designation" required>
                  <StyledCombobox items={dsgOptions} value={form.dsgcd} onValueChange={(v) => set("dsgcd", v)} placeholder="Search designation…" hasError={!!errors.dsgcd} />
                  {errors.dsgcd && <p className="text-[11px] text-red-400 mt-0.5">{errors.dsgcd}</p>}
                </FormField>

                <FormField label="Department Head">
                  <input className={inputCls()} readOnly value={getDeptHead(form.dptcd)} placeholder="Auto-filled from department"
                    style={{ opacity: form.dptcd ? 1 : 0.5, cursor: "default" }} />
                </FormField>

                <FormField label="Rep. Person">
                  <input className={inputCls()} placeholder="Reporting person name" value={form.rptper} onChange={(e) => set("rptper", e.target.value)} />
                </FormField>
              </div>
            </Section>

            {/* ── Payment Details ── */}
            <Section title="Payment Details">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <FormField label="Payment Mode">
                  <StyledSelect value={form.paymod} onChange={(v) => set("paymod", v as EmpForm["paymod"])}
                    options={[
                      { label: "Cash",         value: "CASH" },
                      { label: "NEFT",         value: "NEFT" },
                      { label: "A/C Transfer", value: "A/C TRANSFER" },
                      { label: "Cheque",       value: "CHEQUE" },
                    ]} />
                </FormField>

                {form.paymod !== "CASH" && (
                  <>
                    <FormField label="Bank Name">
                      <input className={inputCls()} placeholder="e.g. State Bank of India"
                        value={form.bnkledcd} onChange={(e) => set("bnkledcd", e.target.value)} />
                    </FormField>

                    <FormField label="Account Name">
                      <input className={inputCls()} placeholder="Account holder name"
                        value={form.bnkaccnm} onChange={(e) => set("bnkaccnm", e.target.value)} />
                    </FormField>

                    <FormField label="Account No">
                      <input className={inputCls()} placeholder="e.g. 00110012345678"
                        value={form.bnkaccno} onChange={(e) => set("bnkaccno", e.target.value)} />
                    </FormField>
                  </>
                )}

                {form.paymod === "CASH" && <div />}
              </div>
            </Section>

            {/* ── Salary Details ── */}
            <Section title="Salary Details">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <FormField label="Basic Salary">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#666] pointer-events-none select-none">Rs.</span>
                    <input
                      type="number" min={0}
                      className={cn(inputCls(), "pl-9")}
                      placeholder="0"
                      value={form.bscsal === 0 ? "" : form.bscsal}
                      onChange={(e) => set("bscsal", e.target.value === "" ? 0 : Number(e.target.value))}
                    />
                  </div>
                </FormField>

                <FormField label="PF Deducted">
                  <StyledSelect value={form.pfded} onChange={(v) => set("pfded", v as EmpForm["pfded"])}
                    options={[{ label: "Yes", value: "YES" }, { label: "No", value: "NO" }]} />
                </FormField>
              </div>
            </Section>

            {/* ── Perquisites ── */}
            {prereqs.length > 0 && (
              <Section title="Perquisites Details">
                <div className="border border-[#E8E6E1] rounded-lg overflow-hidden">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
                        <th className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] w-8">#</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa]">Category Name</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] w-28">Value</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] w-20">Type</th>
                        <th className="text-right px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] w-32">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prereqs.map((p, i) => {
                        const amount = p.valtyp === "%" ? (form.bscsal * p.value) / 100 : p.value;
                        return (
                          <tr key={p.prfcd} className="border-b border-[#F5F4F0] last:border-0">
                            <td className="px-4 py-3 text-[#aaa]">{i + 1}</td>
                            <td className="px-4 py-3 font-medium text-[#1a1a1a]">{p.ctgname}</td>
                            <td className="px-4 py-2 text-right">
                              <input
                                type="number" min={0}
                                className="w-24 h-7 px-2 text-[12px] text-right border border-[#E8E6E1] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all"
                                value={p.value === 0 ? "" : p.value}
                                onChange={(e) => handlePrereqValueChange(i, e.target.value === "" ? 0 : Number(e.target.value))}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5F4F0] text-[#666]">
                                {p.valtyp === "%" ? "%" : "Fix"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-[#1a1a1a] font-medium tabular-nums">
                              Rs {amount.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-[#FAFAF9]">
                        <td colSpan={4} className="px-4 py-3 text-[12px] font-semibold text-[#1a1a1a]">Total</td>
                        <td className="px-4 py-3 text-right text-[12px] font-bold text-[#1a1a1a] tabular-nums">Rs {prereqTotal.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Section>
            )}

            {/* ── Save bar ── */}
            <div className={cn(
              "flex items-center justify-between px-5 py-3.5 rounded-xl border",
              isEditing ? "bg-amber-50/60 border-amber-200" : "bg-[#FAFAF9] border-[#E8E6E1]"
            )}>
              <p className="text-[11px] text-[#bbb]">
                {isEditing ? "Editing existing record — code unchanged" : "Employee code auto-generated (EMPA_____)"}
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={handleCancelEdit}
                  className="h-8 px-4 text-[12px] font-medium text-[#666] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-all">
                  {isEditing ? "Cancel" : "Discard"}
                </button>
                <button type="submit" disabled={isSaving}
                  className={cn(
                    "h-8 px-4 text-[12px] font-medium text-white rounded-lg disabled:opacity-50 transition-all flex items-center gap-1.5",
                    isEditing ? "bg-amber-500 hover:bg-amber-600" : "bg-[#1a1a1a] hover:bg-[#333]"
                  )}>
                  {isSaving ? (
                    <>
                      <svg className="animate-spin" width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M7 1a6 6 0 1 0 6 6" /></svg>
                      {isEditing ? "Updating…" : "Saving…"}
                    </>
                  ) : (
                    <>
                      <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"><path d="M2 7l3.5 3.5L12 3" /></svg>
                      {isEditing ? "Update" : "Save Employee"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ════ TABLE ════ */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E8E6E1]">
          <span className="text-[13px] font-medium text-[#1a1a1a]">
            All Employees
            <span className="ml-2 text-[11px] font-normal text-[#aaa]">{employees.length} total</span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
                {["Code", "Name", "Unit", "Department", "Designation", "Mobile", "Joining Date", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[12px] text-[#ccc]">No employees yet. Add one above.</td>
                </tr>
              ) : (
                employees.map((emp, i) => {
                  const isRowEditing = editingRowid === emp.rowid;
                  return (
                    <motion.tr key={emp.rowid}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className={cn("border-b border-[#F5F4F0] last:border-0 transition-colors", isRowEditing ? "bg-amber-50/60" : "hover:bg-[#FAFAF9]")}
                    >
                      <td className="px-4 py-3">
                        <span className={cn("font-mono text-[11px]", isRowEditing ? "text-amber-600 font-semibold" : "text-[#aaa]")}>{emp.empcd}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#1a1a1a] whitespace-nowrap">{emp.empnm}</td>
                      <td className="px-4 py-3 text-[#666] whitespace-nowrap">{emp.unitName}</td>
                      <td className="px-4 py-3 text-[#666] whitespace-nowrap">{emp.deptName}</td>
                      <td className="px-4 py-3 text-[#666] whitespace-nowrap">{emp.dsgName}</td>
                      <td className="px-4 py-3 text-[#666] tabular-nums">{emp.mobno}</td>
                      <td className="px-4 py-3 text-[#666] whitespace-nowrap">
                        {emp.joindt ? new Date(emp.joindt).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                          emp.isactive === "ACTIVE" ? "bg-green-50 text-green-600" : "bg-[#F5F4F0] text-[#aaa]"
                        )}>
                          {emp.isactive === "ACTIVE" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <EditBtn onClick={() => handleEdit(emp)} />
                          <TrashBtn onClick={() => setDeleteTarget({ rowid: emp.rowid, label: emp.empnm })} />
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