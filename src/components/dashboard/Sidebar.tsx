"use client"

import { useState, useRef, useCallback } from "react"
import { useTabStore } from "@/store/tabStore"
import { trpc } from "@/app/_trpc/client"

type ScreenItem = {
  rowid: number
  scrcd: string
  scrnm: string
  scrlnk: string
  scrcat: string
  scrtyp: string
  scrmodcd: string
  scrid: number
  scrpntid: number
  oldid: number
  granted: boolean
  viewOnly: boolean
}

type ModuleItem = ScreenItem & {
  children: ScreenItem[]
}

const CATEGORY_ORDER = ["Masters", "Transactions", "Reports"] as const
type Category = (typeof CATEGORY_ORDER)[number]

const CATEGORY_CONFIG: Record<Category, { icon: React.ReactNode; accent: string }> = {
  Masters: {
    accent: "#4F46E5",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7" cy="4.5" r="2.5" />
        <path d="M1.5 12.5c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" />
      </svg>
    ),
  },
  Transactions: {
    accent: "#0891B2",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1.5 5h11M10 2l3 3-3 3M4 9H1m3 3L1 9" />
      </svg>
    ),
  },
  Reports: {
    accent: "#059669",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="1.5" width="10" height="11" rx="1.5" />
        <line x1="4.5" y1="5" x2="9.5" y2="5" />
        <line x1="4.5" y1="7.5" x2="9.5" y2="7.5" />
        <line x1="4.5" y1="10" x2="7.5" y2="10" />
      </svg>
    ),
  },
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10" height="10" viewBox="0 0 10 10" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      style={{ transition: "transform 0.2s ease", transform: open ? "rotate(90deg)" : "rotate(0deg)", flexShrink: 0 }}
    >
      <polyline points="3,2 7,5 3,8" />
    </svg>
  )
}

function ScreenIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0, opacity: 0.35 }}>
      <rect x="1" y="1.5" width="10" height="7" rx="1" />
      <line x1="3.5" y1="11" x2="8.5" y2="11" />
      <line x1="6" y1="8.5" x2="6" y2="11" />
    </svg>
  )
}

/** Animated left-pointing double-chevron that flips when sidebar is open */
function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 14 14" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: "transform 0.25s ease", transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
    >
      <polyline points="8,3 4,7 8,11" />
      <polyline points="11,3 7,7 11,11" />
    </svg>
  )
}

const MIN_WIDTH = 220
const MAX_WIDTH = 480
const COLLAPSED_WIDTH = 0

export function Sidebar({ userId }: { userId: number }) {
  const { openTab, active } = useTabStore()

  const { data, isLoading } = trpc.screen.getScreens.useQuery(
    { userId },
    { enabled: !!userId }
  )

  const [collapsed, setCollapsed] = useState(false)
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({})
  const [openModules, setOpenModules] = useState<Record<number, boolean>>({})
  const [sidebarWidth, setSidebarWidth] = useState(MIN_WIDTH)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(MIN_WIDTH)

  const toggleCategory = (cat: string) =>
    setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }))

  const toggleModule = (rowid: number) =>
    setOpenModules(prev => ({ ...prev, [rowid]: !prev[rowid] }))

  const isCatOpen = (cat: string) => openCategories[cat] === true
  const isModOpen = (rowid: number) => openModules[rowid] === true

  const onDragStart = useCallback((e: React.MouseEvent) => {
    if (collapsed) return
    isDragging.current = true
    startX.current = e.clientX
    startWidth.current = sidebarWidth
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const delta = e.clientX - startX.current
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta))
      setSidebarWidth(newWidth)
    }
    const onUp = () => {
      isDragging.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }, [sidebarWidth, collapsed])

  const effectiveWidth = collapsed ? COLLAPSED_WIDTH : sidebarWidth

  if (isLoading) {
    return (
      <>
        <aside
          style={{ width: sidebarWidth, transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)", overflow: "hidden" }}
          className="fixed top-12 left-0 bottom-0 z-40 bg-white border-r border-[#E8E6E1] flex flex-col overflow-y-auto"
        >
          <div className="p-4 space-y-2" style={{ width: sidebarWidth }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-7 bg-[#F5F4F0] rounded animate-pulse" style={{ opacity: 1 - i * 0.1 }} />
            ))}
          </div>
        </aside>
        {/* Toggle button placeholder */}
        <CollapseButton collapsed={false} onClick={() => {}} top={16} left={0}/>
      </>
    )
  }

  const modules: ModuleItem[] = (data?.modules ?? [])
    .map(module => ({ ...module, children: module.children.filter(c => c.granted) }))
    .filter(m => m.children.length > 0)

  const orphans: ScreenItem[] = (data?.orphans ?? []).filter(o => o.granted)

  const grouped = CATEGORY_ORDER.reduce<Record<Category, ModuleItem[]>>(
    (acc, cat) => { acc[cat] = modules.filter(m => m.scrtyp === cat); return acc },
    { Masters: [], Transactions: [], Reports: [] }
  )

  const groupedOrphans = CATEGORY_ORDER.reduce<Record<Category, ScreenItem[]>>(
    (acc, cat) => { acc[cat] = orphans.filter(o => o.scrtyp === cat); return acc },
    { Masters: [], Transactions: [], Reports: [] }
  )

  const hasContent = (cat: Category) =>
    grouped[cat].length > 0 || groupedOrphans[cat].length > 0

  return (
    <>
      {/* ── Sidebar panel ── */}
      <aside
        style={{
          width: effectiveWidth,
          minWidth: effectiveWidth,
          transition: "width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
        }}
        className="fixed top-12 left-0 bottom-0 z-40 bg-white border-r border-[#E8E6E1] flex flex-col"
      >
        {/* Inner scroll wrapper — fixed width prevents content squishing during animation */}
        <div style={{ width: sidebarWidth, height: "100%", overflowY: "auto", overflowX: "hidden", position: "relative" }}>
          {/* Drag-to-resize handle */}
          <div
            onMouseDown={onDragStart}
            style={{
              position: "absolute",
              top: 0, right: -4, bottom: 0,
              width: 8,
              cursor: collapsed ? "default" : "col-resize",
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{ width: 2, height: "100%", background: "transparent", transition: "background 0.15s" }}
              className="hover:bg-[#E0DEDA]"
            />
          </div>

          <div className="pb-6">
            {CATEGORY_ORDER.filter(hasContent).map(cat => {
              const catOpen = isCatOpen(cat)
              const { accent, icon } = CATEGORY_CONFIG[cat]

              return (
                <div key={cat} className="mt-1">
                  {/* ── Top-level category ── */}
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors duration-150 hover:bg-[#F5F4F0] group"
                    style={{
                      borderLeft: `3px solid ${catOpen ? accent : "transparent"}`,
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                  >
                    <span
                      style={{ color: catOpen ? accent : "#aaa" }}
                      className="transition-colors duration-150 group-hover:opacity-100"
                    >
                      {icon}
                    </span>
                    <span
                      className="flex-1 text-left font-bold tracking-wide transition-colors duration-150"
                      style={{ color: catOpen ? "#111" : "#666", letterSpacing: "0.03em" }}
                    >
                      {cat}
                    </span>
                    <span
                      className="transition-colors duration-150"
                      style={{ color: catOpen ? "#888" : "#ccc" }}
                    >
                      <ChevronIcon open={catOpen} />
                    </span>
                  </button>

                  {/* ── Category body ── */}
                  {catOpen && (
                    <div style={{ borderLeft: `3px solid ${accent}20`, marginLeft: 0 }}>
                      {grouped[cat].map(module => {
                        const modOpen = isModOpen(module.rowid)

                        return (
                          <div key={module.rowid}>
                            {/* Sub-module header */}
                            <button
                              onClick={() => toggleModule(module.rowid)}
                              className="w-full flex items-start gap-2 pl-6 pr-3 py-1.75 transition-colors duration-150 hover:bg-[#F5F4F0] group"
                            >
                              <span
                                className="mt-px transition-colors duration-150"
                                style={{ color: modOpen ? "#666" : "#bbb" }}
                              >
                                <ChevronIcon open={modOpen} />
                              </span>
                              <span
                                className="flex-1 text-left font-semibold transition-colors duration-150 group-hover:text-[#444]"
                                style={{
                                  color: modOpen ? "#444" : "#888",
                                  whiteSpace: "normal",
                                  wordBreak: "break-word",
                                  lineHeight: "1.4",
                                }}
                              >
                                {module.scrnm}
                              </span>
                            </button>

                            {/* Screen items */}
                            {modOpen && (
                              <div style={{ background: "#FAFAF9" }}>
                                {module.children.map(screen => (
                                  <ScreenButton
                                    key={screen.rowid}
                                    screen={screen}
                                    isActive={active === screen.scrcd}
                                    accent={accent}
                                    onOpen={() => openTab(screen.scrnm, screen.scrlnk)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {/* Orphan screens */}
                      {groupedOrphans[cat].map(screen => (
                        <ScreenButton
                          key={screen.rowid}
                          screen={screen}
                          isActive={active === screen.scrcd}
                          accent={accent}
                          onOpen={() => openTab(screen.scrnm, screen.scrlnk)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Separator between categories */}
                  <div style={{ height: 1, background: "#F0EEE9", margin: "4px 0 0" }} />
                </div>
              )
            })}
          </div>
        </div>
      </aside>

      {/* ── Floating collapse/expand button ── */}
      <CollapseButton
        collapsed={collapsed}
        onClick={() => setCollapsed(c => !c)}
        left={effectiveWidth}
      />
    </>
  )
}

/** The pill button that toggles collapse, floated right at the sidebar edge */
function CollapseButton({
  collapsed,
  onClick,
  left,
}: {
  collapsed: boolean
  onClick: () => void
  left: number
  top?: number
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      style={{
        position: "fixed",
        top: 56, // just below the top navbar (top-12 = 48px + a bit of breathing room)
        left: left,
        transform: "translateX(-50%)",
        transition: "left 0.25s cubic-bezier(0.4,0,0.2,1)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: "#fff",
        border: "1px solid #E0DEDA",
        boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
        cursor: "pointer",
        color: "#888",
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLElement).style.background = "#F5F4F0"
        ;(e.currentTarget as HTMLElement).style.color = "#333"
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLElement).style.background = "#fff"
        ;(e.currentTarget as HTMLElement).style.color = "#888"
      }}
    >
      <CollapseIcon collapsed={collapsed} />
    </button>
  )
}

function ScreenButton({
  screen,
  isActive,
  accent,
  onOpen,
}: {
  screen: ScreenItem
  isActive: boolean
  accent: string
  onOpen: () => void
}) {
  return (
    <button
      onClick={onOpen}
      className="relative w-full flex items-start gap-2 pl-10 pr-3 py-1.5 text-left transition-colors duration-150"
      style={{
        background: isActive ? "#EDECE8" : "transparent",
        color: isActive ? "#111" : "#555",
      }}
      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#F0EFeb" }}
      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent" }}
    >
      {isActive && (
        <span
          className="absolute left-0 top-1.5 bottom-1.5 w-0.75 rounded-r"
          style={{ background: accent }}
        />
      )}
      <span className="mt-0.75">
        <ScreenIcon />
      </span>
      <span
        className="flex-1 leading-[1.45]"
        style={{
          fontWeight: isActive ? 500 : 400,
          whiteSpace: "normal",
          wordBreak: "break-word",
        }}
      >
        {screen.scrnm}
      </span>
      {screen.viewOnly && (
        <span className="font-medium text-[#aaa] border border-[#ddd] rounded px-1 leading-4 mt-0.5 shrink-0">
          VIEW
        </span>
      )}
    </button>
  )
}