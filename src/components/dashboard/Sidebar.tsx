"use client"

import { useState } from "react"
import { useTabStore } from "@/store/tabStore"

interface NavItem {
    label: string
    id: string
    icon: React.ReactNode
}

interface NavGroup {
    label: string
    items: NavItem[]
}

const navGroups: NavGroup[] = [
    {
        label: "Masters",
        items: [
            {
                label: "Units", id: "units",
                icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="1" width="5" height="5" rx="1" /><rect x="8" y="1" width="5" height="5" rx="1" /><rect x="1" y="8" width="5" height="5" rx="1" /><rect x="8" y="8" width="5" height="5" rx="1" /></svg>
            },
            {
                label: "Users", id: "users",
                icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="4.5" r="2.5" /><path d="M1.5 12.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /></svg>
            },
            {
                label: "Products", id: "products",
                icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 3l5-2 5 2v6l-5 2-5-2V3z" /><line x1="7" y1="1" x2="7" y2="13" /></svg>
            },
            {
                label: "Locations", id: "locations",
                icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="5.5" r="2" /><path d="M7 1C4.24 1 2 3.24 2 6c0 3.5 5 8 5 8s5-4.5 5-7c0-2.76-2.24-5-5-5z" /></svg>
            },
        ]
    },
    {
        label: "Transactions",
        items: [
            {
                label: "Sales Orders", id: "sales",
                icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="2" width="12" height="10" rx="1" /><line x1="1" y1="5" x2="13" y2="5" /><line x1="4" y1="8" x2="7" y2="8" /></svg>
            },
            {
                label: "Purchase Orders", id: "purchase",
                icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 1h2l1.5 7h7l1.5-5H4" /><circle cx="6" cy="12" r="1" /><circle cx="11" cy="12" r="1" /></svg>
            },
            {
                label: "Stock Transfer", id: "stock",
                icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="3,5 7,1 11,5" /><polyline points="3,9 7,13 11,9" /><line x1="7" y1="1" x2="7" y2="13" /></svg>
            },
            {
                label: "Invoices", id: "invoices",
                icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 1h8a1 1 0 0 1 1 1v10l-2-1-2 1-2-1-2 1V2a1 1 0 0 1 1-1z" /><line x1="5" y1="5" x2="9" y2="5" /><line x1="5" y1="8" x2="9" y2="8" /></svg>
            },
        ]
    },
    {
        label: "Reports",
        items: [
            {
                label: "Sales Report", id: "salesrpt",
                icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="1,11 4,7 7,9 10,4 13,6" /></svg>
            },
            {
                label: "Stock Report", id: "stockrpt",
                icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="8" width="3" height="5" /><rect x="5.5" y="5" width="3" height="8" /><rect x="10" y="2" width="3" height="11" /></svg>
            },
        ]
    },
]

export function Sidebar() {
    const { openTab, active } = useTabStore()
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
        Masters: true, Transactions: true, Reports: true
    })

    const toggleGroup = (label: string) => {
        setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }))
    }

    return (
        <aside className="fixed top-12 left-0 bottom-0 w-[220px] z-40 bg-white border-r border-[#E8E6E1] flex flex-col overflow-y-auto">
            {navGroups.map(group => (
                <div key={group.label} className="pt-3 pb-1">
                    {/* Group header */}
                    <button
                        onClick={() => toggleGroup(group.label)}
                        className="w-full flex items-center justify-between px-4 pb-2 group"
                    >
                        <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#aaa] group-hover:text-[#666] transition-colors duration-150">
                            {group.label}
                        </span>
                        <svg
                            width="10" height="10" viewBox="0 0 10 10" fill="none"
                            stroke="#aaa" strokeWidth="1.5" strokeLinecap="round"
                            className={`transition-transform duration-200 ${openGroups[group.label] ? "rotate-180" : ""}`}
                        >
                            <polyline points="2,3 5,7 8,3" />
                        </svg>
                    </button>

                    {/* Items */}
                    <div className={`overflow-hidden transition-all duration-200 ${openGroups[group.label] ? "max-h-96" : "max-h-0"}`}>
                        {group.items.map(item => {
                            const isActive = active === item.id
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => openTab(item.label, item.id)}
                                    className={`relative w-full flex items-center gap-2 px-4 py-[7px] text-[13px] transition-all duration-150 text-left
                                        ${isActive
                                            ? "text-[#1a1a1a] font-medium bg-[#F5F4F0]"
                                            : "text-[#555] hover:text-[#1a1a1a] hover:bg-[#F5F4F0]"
                                        }`}
                                >
                                    {isActive && (
                                        <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-[#1a1a1a] rounded-r" />
                                    )}
                                    <span className={`flex-shrink-0 ${isActive ? "opacity-100" : "opacity-50"}`}>
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            ))}
        </aside>
    )
}