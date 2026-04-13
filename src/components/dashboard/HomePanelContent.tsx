"use client"

import { useAuthStore } from "@/store/authStore"

export function HomePanelContent() {
    const { user } = useAuthStore()

    const sessionTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    const infoRows = [
        { label: "Company", value: user?.cmpName ?? "—" },
        { label: "Location", value: user?.locationCode ?? "—" },
        { label: "Financial Year", value: user?.finYear ?? "—" },
        { label: "Logged in as", value: user?.username ?? "—" },
        { label: "User Category", value: user?.categoryName ?? "—" },
        { label: "Session started", value: sessionTime },
    ]

    return (
        <div className="flex flex-col items-center justify-center min-h-[420px] gap-2">
            {/* Company name */}
            <h1
                className="text-[20px] text-[#1a1a1a] leading-tight"
                style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic" }}
            >
                Mahesh Edible Oils Products Pvt. Ltd.
            </h1>
            <p className="text-[13px] text-[#888]">
                Sale Depot Agra · MMIG H. No. 65, Ground Floor, Tajganj Ward, Shaheed Nagar, Shahar Agra
            </p>

            {/* Session card */}
            <div className="mt-6 bg-white border border-[#E8E6E1] rounded-xl px-7 py-5 w-full max-w-[520px]">
                {infoRows.map((row, i) => (
                    <div
                        key={row.label}
                        className={`flex justify-between items-center py-2 text-[13px] ${i < infoRows.length - 1 ? "border-b border-[#F0EEEA]" : ""}`}
                    >
                        <span className="text-[#888]">{row.label}</span>
                        <span className="font-medium text-[#1a1a1a]">{row.value}</span>
                    </div>
                ))}
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[520px] mt-5">
                {[
                    { label: "Open Orders", value: "—", sub: "Sales this period" },
                    { label: "Pending POs", value: "—", sub: "Awaiting receipt" },
                    { label: "Locations", value: "—", sub: "Active units" },
                ].map(s => (
                    <div key={s.label} className="bg-white border border-[#E8E6E1] rounded-xl p-4">
                        <div className="text-[11px] text-[#aaa] uppercase tracking-[.06em] mb-1">{s.label}</div>
                        <div className="text-[22px] font-medium text-[#1a1a1a]">{s.value}</div>
                        <div className="text-[11px] text-[#C0BDB7] mt-0.5">{s.sub}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}