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

  const stats = [
    { label: "Open Orders", value: "—", sub: "Sales this period", accent: "#4F46E5" },
    { label: "Pending POs", value: "—", sub: "Awaiting receipt", accent: "#0891B2" },
    { label: "Active Locations", value: "—", sub: "Operational units", accent: "#059669" },
  ]

  return (
    <div className="flex flex-col items-center justify-start pt-10 gap-0 w-full">
      {/* ── Hero header ── */}
      <div className="w-full max-w-2xl mb-8 text-center">
        {/* Eyebrow */}
        <p
          className="text-[11px] uppercase tracking-[0.18em] text-[#B0A99F] mb-3"
          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
        >
          Mahesh Edible Oils Products Pvt. Ltd.
        </p>

        {/* Main heading */}
        <h1
          className="text-[32px] leading-[1.18] text-[#1C1A17] mb-2"
          style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic" }}
        >
          Good to have you back
          {user?.username ? (
            <span className="not-italic" style={{ color: "#4F46E5" }}>
              {", "}
              {user.username.split(" ")[0]}
            </span>
          ) : null}
          .
        </h1>

        {/* Address line */}
        <p className="text-[12.5px] text-[#ADA89F]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Sale Depot Agra &nbsp;·&nbsp; MMIG H. No. 65, Ground Floor, Tajganj Ward, Shaheed Nagar
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-2xl mb-6">
        {stats.map(s => (
          <div
            key={s.label}
            className="relative bg-white rounded-2xl p-5 overflow-hidden"
            style={{
              border: "1px solid #EAE8E3",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
            }}
          >
            {/* Accent blob in corner */}
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: s.accent,
                opacity: 0.07,
              }}
            />
            <div
              className="text-[10.5px] uppercase tracking-[0.12em] mb-3"
              style={{ color: "#B8B3AA", fontWeight: 600 }}
            >
              {s.label}
            </div>
            <div
              className="text-[28px] leading-none mb-1"
              style={{ fontFamily: "'DM Serif Display', serif", color: "#1C1A17" }}
            >
              {s.value}
            </div>
            <div className="text-[11px]" style={{ color: "#C8C3BA" }}>
              {s.sub}
            </div>
            {/* Bottom accent line */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 2,
                background: s.accent,
                opacity: 0.35,
                borderRadius: "0 0 16px 16px",
              }}
            />
          </div>
        ))}
      </div>

      {/* ── Session info card ── */}
      <div
        className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden"
        style={{
          border: "1px solid #EAE8E3",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
        }}
      >
        {/* Card header */}
        <div
          className="px-6 py-3.5 flex items-center justify-between"
          style={{ borderBottom: "1px solid #F0EEEA", background: "#FAFAF8" }}
        >
          <span
            className="text-[11px] uppercase tracking-[0.13em]"
            style={{ color: "#B0A99F", fontWeight: 600 }}
          >
            Session Details
          </span>
          <span
            className="flex items-center gap-1.5 text-[11px]"
            style={{ color: "#059669" }}
          >
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#059669",
                boxShadow: "0 0 0 2px #D1FAE5",
              }}
            />
            Active
          </span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#F4F2EE]">
          {infoRows.map(row => (
            <div
              key={row.label}
              className="flex justify-between items-center px-6 py-3"
            >
              <span className="text-[12.5px]" style={{ color: "#A8A29A" }}>
                {row.label}
              </span>
              <span
                className="text-[12.5px]"
                style={{ color: "#1C1A17", fontWeight: 500 }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}