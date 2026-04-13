"use client"

import { useTabStore } from "@/store/tabStore"
import { HomePanelContent } from "./HomePanelContent"
import { UsersPanelContent } from "../userCreation/UserPanelContent"


const PANEL_MAP: Record<string, React.ReactNode> = {
    home: <HomePanelContent />,
    users: <UsersPanelContent />
}

function PlaceholderPanel({ label }: { label: string }) {
    return (
        <div className="flex flex-col">
            <p className="text-[16px] font-medium text-[#1a1a1a] mb-1">{label}</p>
            <p className="text-[13px] text-[#888] mb-5">Connect this panel to your tRPC backend.</p>
            <div className="bg-white border border-[#E8E6E1] rounded-xl p-10 flex flex-col items-center justify-center text-[#C0BDB7]">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#C0BDB7" strokeWidth="1.5" strokeLinecap="round" className="mb-3">
                    <rect x="4" y="6" width="24" height="20" rx="2" />
                    <line x1="4" y1="12" x2="28" y2="12" />
                    <line x1="10" y1="18" x2="18" y2="18" />
                    <line x1="10" y1="22" x2="15" y2="22" />
                </svg>
                <span className="text-[13px]">{label} — no data loaded yet</span>
            </div>
        </div>
    )
}

export function TabPanels() {
    const { tabs, active } = useTabStore()

    return (
        <>
            {tabs.map(tab => (
                <div
                    key={tab.id}
                    className={`${active === tab.id ? "block" : "hidden"}`}
                >
                    {PANEL_MAP[tab.id] ?? <PlaceholderPanel label={tab.label} />}
                </div>
            ))}
        </>
    )
}