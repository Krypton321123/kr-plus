"use client"

import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { useTabStore } from "@/store/tabStore"

export function Topbar() {
    const router = useRouter()
    const { user, logout } = useAuthStore()
    const { closeActive } = useTabStore()

    const handleLogout = () => {
        logout()
        router.push("/login")
    }

    return (
        <header className="fixed top-0 left-0 right-0 h-12 z-50 bg-white border-b border-[#E8E6E1] flex items-center">
            {/* Brand */}
            <div className="w-[220px] flex items-center gap-2 px-4 border-r border-[#E8E6E1] h-full flex-shrink-0">
                <div className="w-6 h-6 bg-[#1a1a1a] rounded-[5px] flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <rect x="1" y="1" width="4" height="4" rx="1" fill="white" opacity="0.9" />
                        <rect x="7" y="1" width="4" height="4" rx="1" fill="white" opacity="0.5" />
                        <rect x="1" y="7" width="4" height="4" rx="1" fill="white" opacity="0.5" />
                        <rect x="7" y="7" width="4" height="4" rx="1" fill="white" opacity="0.9" />
                    </svg>
                </div>
                <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#1a1a1a]">APS</span>
            </div>

            {/* Session meta */}
            <div className="flex items-center flex-1 px-4 gap-0">
                <div className="flex items-center gap-1.5 px-3 h-7 border-r border-[#E8E6E1] text-[12px] text-[#888]">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                    Logged in as <span className="text-[#1a1a1a] font-medium ml-1">{user?.username ?? "—"}</span>
                </div>
                <div className="flex items-center px-3 h-7 border-r border-[#E8E6E1] text-[12px] text-[#888]">
                    At <span className="text-[#1a1a1a] font-medium ml-1">{user?.locationCode ?? "—"}</span>
                </div>
                <div className="flex items-center px-3 h-7 text-[12px] text-[#888]">
                    FY <span className="text-[#1a1a1a] font-medium ml-1">{user?.finYear ?? "—"}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 px-3 border-l border-[#E8E6E1] h-full">
                <TopbarBtn title="Close tab" onClick={closeActive}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <line x1="3" y1="3" x2="11" y2="11" /><line x1="11" y1="3" x2="3" y2="11" />
                    </svg>
                </TopbarBtn>
                <TopbarBtn title="Logout" onClick={handleLogout}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M9 2H12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9" />
                        <polyline points="6,9.5 9,7 6,4.5" />
                        <line x1="1" y1="7" x2="9" y2="7" />
                    </svg>
                </TopbarBtn>
            </div>
        </header>
    )
}

function TopbarBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            title={title}
            onClick={onClick}
            className="w-7 h-7 flex items-center justify-center rounded-md text-[#888] hover:bg-[#F5F4F0] hover:text-[#1a1a1a] transition-colors duration-150"
        >
            {children}
        </button>
    )
}