"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { trpc } from "../../app/_trpc/client";
import { useAuthStore } from "@/store/authStore";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
} from "../ui/combobox";
import { cn } from "@/lib/utils";

const YES_NO = ["Yes", "No"] as const;
const USER_TYPES = ["Depo", "HO", "Factory"] as const;
const DEPARTMENTS = [
  "Marketing",
  "Accounts",
  "Operations",
  "Admin",
  "Logistics",
] as const;
const STATUSES = [
  { value: "ENABLED", label: "Enabled" },
  { value: "DISABLED", label: "Disabled" },
] as const;

const defaultForm = {
  bseuntcd: "",
  usrcat: "",
  usrnm: "",
  usrcd: "",
  usrshnm: "",
  pass: "",
  confirmPass: "",
  validdt: "",
  dlock: "No" as "Yes" | "No",
  msgenable: "No" as "Yes" | "No",
  untall: "No" as "Yes" | "No",
  usertyp: "Depo",
  userdep: "Marketing",
  sts: "ENABLED" as "ENABLED" | "DISABLED",
};

type FormState = typeof defaultForm;

// The user we're editing — null means create mode
type EditingUser = { rowid: number } | null;

// ─── Confirm Delete Modal ──────────────────────────────────────────────────────

function DeleteModal({
  userName,
  onConfirm,
  onCancel,
  isPending,
}: {
  userName: string;
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
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round">
              <path d="M7 2v5M7 10v.5" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#1a1a1a]">Delete user?</p>
            <p className="text-[12px] text-[#999] mt-1 leading-relaxed">
              <span className="font-medium text-[#555]">{userName}</span> will be permanently removed along with all their screen and location permissions.
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
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Form Field ───────────────────────────────────────────────────────────────

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

const inputCls = (hasError?: boolean) =>
  `w-full h-9 px-3 text-[13px] bg-white border rounded-lg text-[#1a1a1a] placeholder:text-[#ccc]
   focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all duration-150
   ${hasError ? "border-red-300 bg-red-50/30" : "border-[#E8E6E1] hover:border-[#ccc]"}`;

const selectCls = `w-full h-9 px-3 text-[13px] bg-white border border-[#E8E6E1] rounded-lg text-[#1a1a1a]
   hover:border-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]
   transition-all duration-150 cursor-pointer`;

// ─── Main Component ───────────────────────────────────────────────────────────

export function UsersPanelContent() {
  const { user } = useAuthStore();

  const [form, setForm] = useState<FormState>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [editingUser, setEditingUser] = useState<EditingUser>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ rowid: number; usrnm: string } | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(true);

  const { data: units = [] } = trpc.users.getUnits.useQuery();
  const { data: categories = [] } = trpc.users.getCategories.useQuery();
  const { data: users = [], refetch } = trpc.users.getAll.useQuery();

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      showToast("success", "User created successfully");
      resetForm();
      refetch();
    },
    onError: (err) => showToast("error", err.message),
  });

  const updateMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      showToast("success", "User updated successfully");
      resetForm();
      refetch();
    },
    onError: (err) => showToast("error", err.message),
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      showToast("success", "User deleted");
      setDeleteTarget(null);
      refetch();
    },
    onError: (err) => showToast("error", err.message),
  });

  // ── Form helpers ───────────────────────────────────────────────────────────

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const resetForm = () => {
    setForm(defaultForm);
    setErrors({});
    setEditingUser(null);
  };

  const loadForEdit = (u: (typeof users)[0]) => {
    setForm({
      bseuntcd: u.bseuntcd,
      usrcat: u.usrcat,
      usrnm: u.usrnm,
      usrcd: u.usrcd ?? "",
      usrshnm: u.usrshnm,
      pass: "",           // never pre-fill password
      confirmPass: "",
      validdt: u.validdt.slice(0, 10),  // ISO → YYYY-MM-DD for date input
      dlock: u.dlock as "Yes" | "No",
      msgenable: u.msgenable as "Yes" | "No",
      untall: u.untall as "Yes" | "No",
      usertyp: u.usertyp,
      userdep: u.userdep,
      sts: u.sts as "ENABLED" | "DISABLED",
    });
    setErrors({});
    setEditingUser({ rowid: u.rowid });
    setShowForm(true);
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validate = (isEdit: boolean): boolean => {
    const e: typeof errors = {};
    if (!form.bseuntcd) e.bseuntcd = "Required";
    if (!form.usrcat) e.usrcat = "Required";
    if (!form.usrnm) e.usrnm = "Required";
    if (!form.usrshnm) e.usrshnm = "Required";
    if (!isEdit) {
      // Password required only on create
      if (!form.pass) e.pass = "Required";
      if (!form.confirmPass) e.confirmPass = "Required";
    }
    if (form.pass && form.confirmPass && form.pass !== form.confirmPass)
      e.confirmPass = "Passwords don't match";
    if (!form.validdt) e.validdt = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    const isEdit = !!editingUser;
    if (!validate(isEdit)) return;

    if (isEdit) {
      updateMutation.mutate({ rowid: editingUser.rowid, ...form });
    } else {
      createMutation.mutate({ ...form, entusrnm: user?.username ?? "system" });
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const isEdit = !!editingUser;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const filteredUsers = users.filter(
    (u) =>
      u.usrnm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.usrcd?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.bseuntcd.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Toast */}
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
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`} />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal
            userName={deleteTarget.usrnm}
            onConfirm={() => deleteMutation.mutate({ rowid: deleteTarget.rowid })}
            onCancel={() => setDeleteTarget(null)}
            isPending={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-medium text-[#1a1a1a]">Users</h2>
          <p className="text-[12px] text-[#999] mt-0.5">
            Manage system users and their access
          </p>
        </div>
        <button
          onClick={() => {
            if (isEdit) {
              resetForm();
            } else {
              setShowForm((p) => !p);
            }
          }}
          className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-[#555] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] hover:text-[#1a1a1a] transition-all duration-150"
        >
          {isEdit ? (
            <>
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M1 1l12 12M13 1L1 13" />
              </svg>
              Cancel Edit
            </>
          ) : showForm ? (
            "Hide Form"
          ) : (
            "New User"
          )}
        </button>
      </div>

      {/* Creation / Edit Form */}
      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
              {/* Form header */}
              <div className="px-5 py-3.5 border-b border-[#E8E6E1] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${isEdit ? "bg-blue-600" : "bg-[#1a1a1a]"}`}>
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                      {isEdit ? (
                        <path d="M2 10.5L4.5 11 11 4.5a1.77 1.77 0 0 0-2.5-2.5L2 8.5v2z" />
                      ) : (
                        <>
                          <circle cx="7" cy="4.5" r="2.5" />
                          <path d="M1.5 12.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
                        </>
                      )}
                    </svg>
                  </div>
                  <span className="text-[13px] font-medium text-[#1a1a1a]">
                    {isEdit ? "Edit User" : "User Information"}
                  </span>
                </div>
                {isEdit && (
                  <span className="text-[11px] text-blue-500 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                    Editing — leave passwords blank to keep unchanged
                  </span>
                )}
              </div>

              {/* Form grid */}
              <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">
                {/* Row 1 */}
                <FormField label="Location Name" required>
                  <Combobox
                    items={units.map((u) => u.untnm)}
                    value={units.find((u) => u.untcd === form.bseuntcd)?.untnm ?? ""}
                    onValueChange={(val) => {
                      const unit = units.find((u) => u.untnm === val);
                      set("bseuntcd", unit?.untcd ?? "");
                    }}
                    autoHighlight
                  >
                    <ComboboxInput
                      placeholder="Select unit…"
                      className={cn(
                        "w-full h-9 px-3 text-[13px] rounded-lg border bg-white text-[#1a1a1a] placeholder:text-[#bbb]",
                        "transition-all duration-150 outline-none",
                        "focus:ring-2 focus:ring-[#1a1a1a]/8 focus:border-[#1a1a1a]",
                        errors.bseuntcd
                          ? "border-red-300 bg-red-50/40"
                          : "border-[#E8E6E1] hover:border-[#C8C5BE]"
                      )}
                    />
                    <ComboboxContent
                      className={cn(
                        "z-50 min-w-(--radix-popover-trigger-width)",
                        "mt-1.5 p-1 rounded-xl border border-[#E8E6E1] bg-white",
                        "shadow-[0_8px_24px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.05)]",
                        "animate-in fade-in-0 zoom-in-95 duration-100"
                      )}
                    >
                      <ComboboxEmpty className="py-7 text-center text-[12px] text-[#bbb] tracking-wide">
                        No units found.
                      </ComboboxEmpty>
                      <ComboboxList className="max-h-55 overflow-y-auto scrollbar-none">
                        {(item) => (
                          <ComboboxItem
                            key={item}
                            value={item}
                            className={cn(
                              "flex items-center gap-2 px-2.5 py-1.75 rounded-lg",
                              "text-[13px] text-[#1a1a1a] cursor-pointer select-none",
                              "transition-colors duration-75 outline-none",
                              "hover:bg-[#F5F4F0] data-highlighted:bg-[#F5F4F0]",
                              "data-selected:font-medium data-selected:text-[#1a1a1a]",
                              "data-selected:before:content-[''] data-selected:before:w-1 data-selected:before:h-1",
                              "data-selected:before:rounded-full data-selected:before:bg-[#1a1a1a]/40 data-selected:before:shrink-0"
                            )}
                          >
                            {item}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  {errors.bseuntcd && <p className="text-[11px] text-red-400 mt-0.5">{errors.bseuntcd}</p>}
                </FormField>

                <FormField label="User Category" required>
                  <select
                    className={selectCls + (errors.usrcat ? " border-red-300" : "")}
                    value={form.usrcat}
                    onChange={(e) => set("usrcat", e.target.value)}
                  >
                    <option value="">Select category…</option>
                    {categories.map((c) => (
                      <option key={c.catcd} value={c.catcd ?? ""}>{c.catnm}</option>
                    ))}
                  </select>
                  {errors.usrcat && <p className="text-[11px] text-red-400 mt-0.5">{errors.usrcat}</p>}
                </FormField>

                {/* Row 2 */}
                <FormField label="User Name" required>
                  <input
                    type="text"
                    className={inputCls(!!errors.usrnm)}
                    placeholder="e.g. john.doe"
                    value={form.usrnm}
                    onChange={(e) => set("usrnm", e.target.value)}
                  />
                  {errors.usrnm && <p className="text-[11px] text-red-400 mt-0.5">{errors.usrnm}</p>}
                </FormField>

                <FormField label="User Code">
                  <input
                    type="text"
                    className={inputCls()}
                    placeholder="AUTO GENERATED"
                    value={form.usrcd}
                    disabled
                    onChange={(e) => set("usrcd", e.target.value)}
                  />
                </FormField>

                {/* Row 3 */}
                <FormField label="Short Name" required>
                  <input
                    type="text"
                    className={inputCls(!!errors.usrshnm)}
                    placeholder="e.g. JD"
                    value={form.usrshnm}
                    onChange={(e) => set("usrshnm", e.target.value)}
                  />
                  {errors.usrshnm && <p className="text-[11px] text-red-400 mt-0.5">{errors.usrshnm}</p>}
                </FormField>
                <div />

                {/* Row 4 — Password */}
                <FormField label={isEdit ? "New Password" : "Password"} required={!isEdit}>
                  <input
                    type="password"
                    className={inputCls(!!errors.pass)}
                    placeholder={isEdit ? "Leave blank to keep current" : "••••••••"}
                    value={form.pass}
                    onChange={(e) => set("pass", e.target.value)}
                  />
                  {errors.pass && <p className="text-[11px] text-red-400 mt-0.5">{errors.pass}</p>}
                </FormField>

                <FormField label={isEdit ? "Confirm New Password" : "Re-Password"} required={!isEdit}>
                  <input
                    type="password"
                    className={inputCls(!!errors.confirmPass)}
                    placeholder={isEdit ? "Leave blank to keep current" : "••••••••"}
                    value={form.confirmPass}
                    onChange={(e) => set("confirmPass", e.target.value)}
                  />
                  {errors.confirmPass && <p className="text-[11px] text-red-400 mt-0.5">{errors.confirmPass}</p>}
                </FormField>

                {/* Row 5 */}
                <FormField label="Valid Date" required>
                  <input
                    type="date"
                    className={inputCls(!!errors.validdt)}
                    value={form.validdt}
                    onChange={(e) => set("validdt", e.target.value)}
                  />
                  {errors.validdt && <p className="text-[11px] text-red-400 mt-0.5">{errors.validdt}</p>}
                </FormField>

                <FormField label="Date Lock">
                  <select className={selectCls} value={form.dlock} onChange={(e) => set("dlock", e.target.value as "Yes" | "No")}>
                    {YES_NO.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </FormField>

                {/* Row 6 */}
                <FormField label="Message Enable">
                  <select className={selectCls} value={form.msgenable} onChange={(e) => set("msgenable", e.target.value as "Yes" | "No")}>
                    {YES_NO.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </FormField>

                <FormField label="Browse All Locations">
                  <select className={selectCls} value={form.untall} onChange={(e) => set("untall", e.target.value as "Yes" | "No")}>
                    {YES_NO.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </FormField>

                {/* Row 7 */}
                <FormField label="User Type">
                  <select className={selectCls} value={form.usertyp} onChange={(e) => set("usertyp", e.target.value)}>
                    {USER_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </FormField>

                <FormField label="User Department">
                  <select className={selectCls} value={form.userdep} onChange={(e) => set("userdep", e.target.value)}>
                    {DEPARTMENTS.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </FormField>

                {/* Row 8 */}
                <FormField label="Account Status">
                  <select className={selectCls} value={form.sts} onChange={(e) => set("sts", e.target.value as "ENABLED" | "DISABLED")}>
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </FormField>
                <div />
              </div>

              {/* Footer */}
              <div className="px-5 py-3.5 border-t border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-end gap-2">
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
                        {isEdit ? (
                          <path d="M2 10.5L4.5 11 11 4.5a1.77 1.77 0 0 0-2.5-2.5L2 8.5v2z" />
                        ) : (
                          <path d="M2 7l3.5 3.5L12 3" />
                        )}
                      </svg>
                      {isEdit ? "Update User" : "Save User"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users Table */}
      <div className="bg-white border border-[#E8E6E1] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E8E6E1] flex items-center justify-between">
          <span className="text-[13px] font-medium text-[#1a1a1a]">
            All Users
            <span className="ml-2 text-[11px] font-normal text-[#aaa]">{users.length} total</span>
          </span>
          <input
            type="text"
            placeholder="Search users…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 px-3 text-[12px] border border-[#E8E6E1] rounded-lg bg-[#FAFAF9] text-[#1a1a1a] placeholder:text-[#ccc] focus:outline-none focus:border-[#ccc] w-45 transition-all duration-150"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
                {["Code", "Username", "Short Name", "Location", "Category", "Type", "Dept", "Status", "Valid Till", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-[#ccc] text-[12px]">
                    {searchQuery ? "No users match your search" : "No users yet — create one above"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, i) => {
                  const isRowEditing = editingUser?.rowid === u.rowid;
                  return (
                    <motion.tr
                      key={u.rowid}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={`border-b border-[#F5F4F0] last:border-0 transition-colors duration-100 ${
                        isRowEditing ? "bg-blue-50/60" : "hover:bg-[#FAFAF9]"
                      }`}
                    >
                      <td className="px-4 py-3 text-[#aaa] font-mono">{u.usrcd || "—"}</td>
                      <td className="px-4 py-3 font-medium text-[#1a1a1a]">{u.usrnm}</td>
                      <td className="px-4 py-3 text-[#666]">{u.usrshnm}</td>
                      <td className="px-4 py-3 text-[#666]">{u.bseuntcd}</td>
                      <td className="px-4 py-3 text-[#666]">{u.userCat.catnm}</td>
                      <td className="px-4 py-3 text-[#666]">{u.usertyp}</td>
                      <td className="px-4 py-3 text-[#666]">{u.userdep}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
                          ${u.sts === "ENABLED" ? "bg-green-50 text-green-700" : "bg-[#F5F4F0] text-[#aaa]"}`}
                        >
                          <span className={`w-1 h-1 rounded-full ${u.sts === "ENABLED" ? "bg-green-500" : "bg-[#ccc]"}`} />
                          {u.sts === "ENABLED" ? "Enabled" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#aaa]">
                        {new Date(u.validdt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {/* Edit */}
                          <button
                            onClick={() => loadForEdit(u)}
                            title="Edit user"
                            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all duration-150 border
                              ${isRowEditing
                                ? "bg-blue-100 border-blue-200 text-blue-600"
                                : "bg-white border-[#E8E6E1] text-[#aaa] hover:border-[#C8C5BE] hover:text-[#555] hover:bg-[#F5F4F0]"
                              }`}
                          >
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 10.5L4.5 11 11 4.5a1.77 1.77 0 0 0-2.5-2.5L2 8.5v2z" />
                            </svg>
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget({ rowid: u.rowid, usrnm: u.usrnm })}
                            title="Delete user"
                            className="w-7 h-7 rounded-md flex items-center justify-center border bg-white border-[#E8E6E1] text-[#aaa] hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
                          >
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1.5 3.5h11M5 3.5V2h4v1.5M3 3.5l.7 8h6.6l.7-8" />
                            </svg>
                          </button>
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