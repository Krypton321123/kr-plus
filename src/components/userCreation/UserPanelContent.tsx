"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { trpc } from "../../app/_trpc/client"
import { useAuthStore } from "@/store/authStore"

const YES_NO = ["Yes", "No"] as const
const USER_TYPES = ["Depo", "HO", "Factory"] as const
const DEPARTMENTS = ["Marketing", "Accounts", "Operations", "Admin", "Logistics"] as const
const STATUSES = [
    { value: "ENABLED", label: "Enabled" },
    { value: "DISABLED", label: "Disabled" },
] as const

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
}

type FormState = typeof defaultForm

function FormField({ label, required, children }: {
    label: string
    required?: boolean
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium tracking-[0.06em] uppercase text-[#999]">
                {label}
                {required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    )
}

const inputCls = (hasError?: boolean) =>
    `w-full h-9 px-3 text-[13px] bg-white border rounded-lg text-[#1a1a1a] placeholder:text-[#ccc]
     focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-all duration-150
     ${hasError ? "border-red-300 bg-red-50/30" : "border-[#E8E6E1] hover:border-[#ccc]"}`

const selectCls = `w-full h-9 px-3 text-[13px] bg-white border border-[#E8E6E1] rounded-lg text-[#1a1a1a]
    hover:border-[#ccc] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]
    transition-all duration-150 cursor-pointer`

export function UsersPanelContent() {
    const { user } = useAuthStore()
    const [form, setForm] = useState<FormState>(defaultForm)
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [showForm, setShowForm] = useState(true)

    const { data: units = [] } = trpc.users.getUnits.useQuery()
    const { data: categories = [] } = trpc.users.getCategories.useQuery()
    const { data: users = [], refetch } = trpc.users.getAll.useQuery()

    console.log("categories", categories); 

    const createMutation = trpc.users.create.useMutation({
        onSuccess: () => {
            showToast("success", "User created successfully")
            setForm(defaultForm)
            refetch()
        },
        onError: (err) => {
            showToast("error", err.message)
        }
    })

    const showToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg })
        setTimeout(() => setToast(null), 3500)
    }

    const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
        setForm(prev => ({ ...prev, [key]: val }))
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
    }

    const validate = (): boolean => {
        const e: typeof errors = {}
        if (!form.bseuntcd) e.bseuntcd = "Required"
        if (!form.usrcat) e.usrcat = "Required"
        if (!form.usrnm) e.usrnm = "Required"
        if (!form.usrshnm) e.usrshnm = "Required"
        if (!form.pass) e.pass = "Required"
        if (!form.confirmPass) e.confirmPass = "Required"
        if (form.pass && form.confirmPass && form.pass !== form.confirmPass)
            e.confirmPass = "Passwords don't match"
        if (!form.validdt) e.validdt = "Required"
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSave = () => {
        if (!validate()) return
        createMutation.mutate({ ...form, entusrnm: user?.username ?? "system" })
    }

    const handleClear = () => {
        setForm(defaultForm)
        setErrors({})
    }

    const filteredUsers = users.filter(u =>
        u.usrnm.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.usrcd?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.bseuntcd.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-5">

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className={`fixed top-[60px] right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium shadow-sm border
                            ${toast.type === "success"
                                ? "bg-white border-green-200 text-green-700"
                                : "bg-white border-red-200 text-red-600"}`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`} />
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-[16px] font-medium text-[#1a1a1a]">Users</h2>
                    <p className="text-[12px] text-[#999] mt-0.5">Manage system users and their access</p>
                </div>
                <button
                    onClick={() => setShowForm(p => !p)}
                    className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-[#555] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] hover:text-[#1a1a1a] transition-all duration-150"
                >
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        {showForm
                            ? <><line x1="7" y1="1" x2="7" y2="13" /><line x1="1" y1="7" x2="13" y2="7" /></>
                            : <><line x1="7" y1="1" x2="7" y2="13" /><line x1="1" y1="7" x2="13" y2="7" /></>
                        }
                    </svg>
                    {showForm ? "Hide Form" : "New User"}
                </button>
            </div>

            {/* Creation Form */}
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
                            <div className="px-5 py-3.5 border-b border-[#E8E6E1] flex items-center gap-2">
                                <div className="w-5 h-5 rounded-md bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                                        <circle cx="7" cy="4.5" r="2.5" />
                                        <path d="M1.5 12.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
                                    </svg>
                                </div>
                                <span className="text-[13px] font-medium text-[#1a1a1a]">User Information</span>
                            </div>

                            {/* Form grid */}
                            <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4">

                                {/* Row 1 */}
                                <FormField label="Location Name" required>
                                    <select
                                        className={selectCls + (errors.bseuntcd ? " border-red-300" : "")}
                                        value={form.bseuntcd}
                                        onChange={e => set("bseuntcd", e.target.value)}
                                    >
                                        <option value="">Select location…</option>
                                        {units.map(u => (
                                            <option key={u.untnm} value={u.untcd}>{u.untnm}</option>
                                        ))}
                                    </select>
                                    {errors.bseuntcd && <p className="text-[11px] text-red-400 mt-0.5">{errors.bseuntcd}</p>}
                                </FormField>

                                <FormField label="User Category" required>
                                    <select
                                        className={selectCls + (errors.usrcat ? " border-red-300" : "")}
                                        value={form.usrcat}
                                        onChange={e => set("usrcat", e.target.value)}
                                    >
                                        <option value="">Select category…</option>
                                        {categories.map(c => (
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
                                        onChange={e => set("usrnm", e.target.value)}
                                    />
                                    {errors.usrnm && <p className="text-[11px] text-red-400 mt-0.5">{errors.usrnm}</p>}
                                </FormField>

                                <FormField label="User Code">
                                    <input
                                        type="text"
                                        className={inputCls()}
                                        placeholder="e.g. USR001"
                                        value={form.usrcd}
                                        onChange={e => set("usrcd", e.target.value)}
                                    />
                                </FormField>

                                {/* Row 3 */}
                                <FormField label="Short Name" required>
                                    <input
                                        type="text"
                                        className={inputCls(!!errors.usrshnm)}
                                        placeholder="e.g. JD"
                                        value={form.usrshnm}
                                        onChange={e => set("usrshnm", e.target.value)}
                                    />
                                    {errors.usrshnm && <p className="text-[11px] text-red-400 mt-0.5">{errors.usrshnm}</p>}
                                </FormField>

                                <div /> {/* spacer */}

                                {/* Row 4 */}
                                <FormField label="Password" required>
                                    <input
                                        type="password"
                                        className={inputCls(!!errors.pass)}
                                        placeholder="••••••••"
                                        value={form.pass}
                                        onChange={e => set("pass", e.target.value)}
                                    />
                                    {errors.pass && <p className="text-[11px] text-red-400 mt-0.5">{errors.pass}</p>}
                                </FormField>

                                <FormField label="Re-Password" required>
                                    <input
                                        type="password"
                                        className={inputCls(!!errors.confirmPass)}
                                        placeholder="••••••••"
                                        value={form.confirmPass}
                                        onChange={e => set("confirmPass", e.target.value)}
                                    />
                                    {errors.confirmPass && <p className="text-[11px] text-red-400 mt-0.5">{errors.confirmPass}</p>}
                                </FormField>

                                {/* Row 5 */}
                                <FormField label="Valid Date" required>
                                    <input
                                        type="date"
                                        className={inputCls(!!errors.validdt)}
                                        value={form.validdt}
                                        onChange={e => set("validdt", e.target.value)}
                                    />
                                    {errors.validdt && <p className="text-[11px] text-red-400 mt-0.5">{errors.validdt}</p>}
                                </FormField>

                                <FormField label="Date Lock">
                                    <select className={selectCls} value={form.dlock} onChange={e => set("dlock", e.target.value as "Yes" | "No")}>
                                        {YES_NO.map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </FormField>

                                {/* Row 6 */}
                                <FormField label="Message Enable">
                                    <select className={selectCls} value={form.msgenable} onChange={e => set("msgenable", e.target.value as "Yes" | "No")}>
                                        {YES_NO.map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </FormField>

                                <FormField label="Browse All Locations">
                                    <select className={selectCls} value={form.untall} onChange={e => set("untall", e.target.value as "Yes" | "No")}>
                                        {YES_NO.map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </FormField>

                                {/* Row 7 */}
                                <FormField label="User Type">
                                    <select className={selectCls} value={form.usertyp} onChange={e => set("usertyp", e.target.value)}>
                                        {USER_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </FormField>

                                <FormField label="User Department">
                                    <select className={selectCls} value={form.userdep} onChange={e => set("userdep", e.target.value)}>
                                        {DEPARTMENTS.map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </FormField>

                                {/* Row 8 */}
                                <FormField label="Account Status">
                                    <select className={selectCls} value={form.sts} onChange={e => set("sts", e.target.value as "ENABLED" | "DISABLED")}>
                                        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </FormField>

                                <div /> {/* spacer */}
                            </div>

                            {/* Footer actions */}
                            <div className="px-5 py-3.5 border-t border-[#E8E6E1] bg-[#FAFAF9] flex items-center justify-end gap-2">
                                <button
                                    onClick={handleClear}
                                    className="h-8 px-4 text-[12px] font-medium text-[#666] border border-[#E8E6E1] rounded-lg bg-white hover:bg-[#F5F4F0] transition-all duration-150"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={createMutation.isPending}
                                    className="h-8 px-4 text-[12px] font-medium text-white bg-[#1a1a1a] rounded-lg hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center gap-1.5"
                                >
                                    {createMutation.isPending ? (
                                        <>
                                            <svg className="animate-spin" width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                                                <path d="M7 1a6 6 0 1 0 6 6" />
                                            </svg>
                                            Saving…
                                        </>
                                    ) : (
                                        <>
                                            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                                                <path d="M2 7l3.5 3.5L12 3" />
                                            </svg>
                                            Save User
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
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-7 px-3 text-[12px] border border-[#E8E6E1] rounded-lg bg-[#FAFAF9] text-[#1a1a1a] placeholder:text-[#ccc] focus:outline-none focus:border-[#ccc] w-[180px] transition-all duration-150"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-[12px]">
                        <thead>
                            <tr className="border-b border-[#E8E6E1] bg-[#FAFAF9]">
                                {["Code", "Username", "Short Name", "Location", "Category", "Type", "Dept", "Status", "Valid Till"].map(h => (
                                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-[#aaa] whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-10 text-center text-[#ccc] text-[12px]">
                                        {searchQuery ? "No users match your search" : "No users yet — create one above"}
                                    </td>
                                </tr>
                            ) : filteredUsers.map((u, i) => (
                                <motion.tr
                                    key={u.rowid}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="border-b border-[#F5F4F0] last:border-0 hover:bg-[#FAFAF9] transition-colors duration-100"
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
                                            ${u.sts === "ENABLED"
                                                ? "bg-green-50 text-green-700"
                                                : "bg-[#F5F4F0] text-[#aaa]"}`}>
                                            <span className={`w-1 h-1 rounded-full ${u.sts === "ENABLED" ? "bg-green-500" : "bg-[#ccc]"}`} />
                                            {u.sts === "ENABLED" ? "Enabled" : "Disabled"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-[#aaa]">
                                        {new Date(u.validdt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}