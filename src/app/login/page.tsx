"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "../_trpc/client";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const [locationCode, setLocationCode] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [financialYear, setFinancialYear] = useState("");
  const [focused, setFocused] = useState<string | null>(null);
  const { setUser } = useAuthStore();
  const router = useRouter();

  const { data, isLoading } = trpc.auth.getCompanies.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const companies = data || [];

  const { data: finYears, isLoading: finYearLoading } = trpc.auth.getFinYear.useQuery(companyCode, {
    enabled: !!companyCode,
  });

  const financialYears = finYears || [];

  // ✅ Hook at top level
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (result) => {
      setUser(result.user);
      router.push(result.redirectTo);
    },
    onError: (err) => {
      alert(err.message); // swap with a toast if you have one
    },
  });

  useEffect(() => {
    if (companies.length > 0 && !companyCode) {
      setCompanyCode(companies[0].cmpcd);
    }
  }, [companies]);

  // Auto-select first financial year when they load
  useEffect(() => {
    if (financialYears.length > 0 && !financialYear) {
      setFinancialYear(String(financialYears[0].rowid));
    }
  }, [financialYears]);

  // ✅ Just calls the mutation
  const handleLogin = () => {
    loginMutation.mutate({
      username: userName,
      password,
      locationCode,
      cmpCode: companyCode,
      finYear: financialYear,
    });
  };

  const fields = [
    { id: "locationCode", label: "Location Code", value: locationCode, setter: setLocationCode, type: "text" },
    { id: "userName",     label: "User Name",     value: userName,     setter: setUserName,     type: "text" },
    { id: "password",     label: "Password",      value: password,     setter: setPassword,     type: "password" },
  ];

  const isLoggingIn = loginMutation.isPending;

  return (
    <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        .card { animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .field-row { animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .field-row:nth-child(1) { animation-delay: 0.08s; }
        .field-row:nth-child(2) { animation-delay: 0.14s; }
        .field-row:nth-child(3) { animation-delay: 0.20s; }
        .field-row:nth-child(4) { animation-delay: 0.26s; }
        .field-row:nth-child(5) { animation-delay: 0.32s; }
        .btn-primary { position: relative; overflow: hidden; transition: all 0.2s ease; }
        .btn-primary::after { content: ''; position: absolute; inset: 0; background: white; opacity: 0; transition: opacity 0.15s; }
        .btn-primary:hover::after { opacity: 0.06; }
        .btn-primary:active { transform: scale(0.98); }
        .input-field { transition: border-color 0.15s, box-shadow 0.15s; outline: none; }
        .input-field:focus { border-color: #1a1a1a; box-shadow: 0 0 0 3px rgba(26,26,26,0.06); }
        select.input-field {
          appearance: none; -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%231a1a1a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 14px center;
          padding-right: 36px; cursor: pointer;
        }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .divider-line { flex: 1; height: 1px; background: #E0DED8; }
        .skeleton {
          background: linear-gradient(90deg, #F0EEEA 25%, #E8E6E1 50%, #F0EEEA 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 12px;
        }
        @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
      `}</style>

      <div className="w-full max-w-md px-4">
        {/* Brand */}
        <div className="mb-10 text-center card">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1" fill="white" opacity="0.9" />
                <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.5" />
                <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.5" />
                <rect x="9" y="9" width="5" height="5" rx="1" fill="white" opacity="0.9" />
              </svg>
            </div>
            <span className="text-[13px] font-semibold tracking-[0.12em] text-[#1a1a1a] uppercase">APS</span>
          </div>
          <h1
            style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic" }}
            className="text-[28px] text-[#1a1a1a] leading-tight mb-1"
          >
            Advanced Planning
          </h1>
          <p className="text-[13px] text-[#888] tracking-wide">& Scheduling System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E8E6E1] shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-8 card">
          
          {/* Error banner */}
          {loginMutation.isError && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600">
              {loginMutation.error.message}
            </div>
          )}

          <div className="space-y-5">
            {fields.map(({ id, label, value, setter, type }) => (
              <div key={id} className="field-row">
                <label className="block text-[12px] font-semibold tracking-[0.06em] text-[#888] uppercase mb-1.5">
                  {label}
                </label>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  onFocus={() => setFocused(id)}
                  onBlur={() => setFocused(null)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="input-field w-full h-11 px-3.5 rounded-xl border border-[#E0DED8] bg-[#FAFAF8] text-[14px] text-[#1a1a1a] placeholder:text-[#C8C6C0]"
                  placeholder={`Enter ${label.toLowerCase()}`}
                />
              </div>
            ))}

            <div className="field-row flex items-center gap-3 py-1">
              <div className="divider-line" />
              <span className="text-[11px] text-[#C0BDB7] tracking-wider uppercase">Configuration</span>
              <div className="divider-line" />
            </div>

            {/* Company */}
            <div className="field-row">
              <label className="block text-[12px] font-semibold tracking-[0.06em] text-[#888] uppercase mb-1.5">
                Company Code
              </label>
              {isLoading ? (
                <div className="skeleton w-full h-11" />
              ) : (
                <select
                  value={companyCode}
                  onChange={(e) => {
                    setCompanyCode(e.target.value);
                    setFinancialYear(""); // reset fin year when company changes
                  }}
                  onFocus={() => setFocused("companyCode")}
                  onBlur={() => setFocused(null)}
                  className="input-field w-full h-11 px-3.5 rounded-xl border border-[#E0DED8] bg-[#FAFAF8] text-[14px] text-[#1a1a1a]"
                >
                  {companies.map((o) => (
                    <option key={o.cmpcd} value={o.cmpcd}>
                      {o.cmpnm || o.cmpcd}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Financial Year */}
            <div className="field-row">
              <label className="block text-[12px] font-semibold tracking-[0.06em] text-[#888] uppercase mb-1.5">
                Financial Year
              </label>
              {finYearLoading ? (
                <div className="skeleton w-full h-11" />
              ) : (
                <select
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  onFocus={() => setFocused("financialYear")}
                  onBlur={() => setFocused(null)}
                  className="input-field w-full h-11 px-3.5 rounded-xl border border-[#E0DED8] bg-[#FAFAF8] text-[14px] text-[#1a1a1a]"
                >
                  {financialYears.map((y) => (
                    <option key={y.rowid} value={String(y.rowid)}>
                      {y.finyear}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={handleLogin}
              disabled={isLoggingIn || isLoading}
              className="btn-primary flex-1 h-11 bg-[#1a1a1a] text-white text-[13px] font-semibold tracking-[0.04em] rounded-xl flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoggingIn ? (
                <>
                  <div className="spinner" />
                  <span>Signing in…</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>
            <button
              onClick={() => {
                setLocationCode("");
                setUserName("");
                setPassword("");
                loginMutation.reset();
              }}
              className="h-11 px-5 rounded-xl border border-[#E0DED8] bg-white text-[13px] text-[#666] font-semibold tracking-[0.04em] hover:bg-[#FAFAF8] transition-colors duration-150"
            >
              Clear
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-[#C0BDB7] mt-6 tracking-wide">
          © {new Date().getFullYear()} Advanced Planning & Scheduling · All rights reserved
        </p>
      </div>
    </div>
  );
}