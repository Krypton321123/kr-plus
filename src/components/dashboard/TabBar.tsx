"use client"

import { useTabStore } from "@/store/tabStore"

const HomeIcon = () => (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M1 7L7 1l6 6" /><path d="M3 5v7a1 1 0 0 0 1 1h2.5V9h3v4H12a1 1 0 0 0 1-1V5" />
    </svg>
)

const PageIcon = () => (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="1" y="2" width="12" height="10" rx="1" /><line x1="1" y1="5" x2="13" y2="5" />
    </svg>
)

export function TabBar() {
    const { tabs, active, setActive, closeTab } = useTabStore()

    return (
        <div className="fixed top-12 left-55 right-0 h-10 z-40 bg-white border-b border-[#E8E6E1] flex items-end overflow-x-auto px-2 gap-0.5 scrollbar-none">
            {tabs.map(tab => {
                const isActive = tab.id === active
                return (
                    <div
                        key={tab.id}
                        onClick={() => setActive(tab.id)}
                        className={`group flex items-center gap-1.5 px-3 h-8 rounded-t-md cursor-pointer shrink-0 text-[12px] font-normal border border-transparent border-b-0 select-none transition-all duration-150 relative -bottom-px
                            ${isActive
                                ? "bg-white text-[#1a1a1a] font-medium border-[#E8E6E1] border-b-white"
                                : "text-[#888] hover:text-[#1a1a1a] hover:bg-[#F5F4F0]"
                            }`}
                    >
                        <span className="shrink-0 opacity-60">
                            {tab.id === "home" ? <HomeIcon /> : <PageIcon />}
                        </span>
                        <span>{tab.label}</span>
                        {tab.closable && (
                            <button
                                onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                                className="w-3.5 h-3.5 flex items-center justify-center rounded text-[#bbb] hover:bg-[#E8E6E1] hover:text-[#1a1a1a] transition-colors duration-100 opacity-0 group-hover:opacity-100 ml-0.5"
                            >
                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                    <line x1="1" y1="1" x2="7" y2="7" /><line x1="7" y1="1" x2="1" y2="7" />
                                </svg>
                            </button>
                        )}
                    </div>
                )
            })}
        </div>
    )
}