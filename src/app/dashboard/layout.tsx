"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { Topbar } from "@/components/dashboard/Topbar"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { TabBar } from "@/components/dashboard/TabBar"
import { TabPanels } from "@/components/dashboard/Tabpanels"
import { useTabStore } from "@/store/tabStore"

const SIDEBAR_DEFAULT = 220

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const raw = localStorage.getItem("auth")
    if (!raw) return router.replace("/login")
    const localuser = JSON.parse(raw)
    if (!localuser?.state?.user) return router.replace("/login")
    setUser(localuser.state.user)
  }, [])

  if (!user) return null

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: "#F5F3EF",
      }}
    >
      {/* Topbar — fixed, full width */}
      <Topbar />

      {/* Sidebar — fixed left, below topbar */}
      <Sidebar userId={user.rowid} />

      {/* Main content area — offset for sidebar + topbar */}
      <MainContent userId={user.rowid} />
    </div>
  )
}

/**
 * Separated so it can read sidebar width from store if needed,
 * or simply use a CSS variable approach. For now, uses a fixed offset
 * that matches the sidebar's default width with a smooth transition.
 */
function MainContent({ userId }: { userId: number }) {
  return (
    <div
      style={{
        // top-12 = 48px navbar, then TabBar is ~36px → total 84px
        marginTop: 84,
        // Sidebar default 220px. If sidebar is collapsible and you want
        // to sync marginLeft dynamically, lift `sidebarWidth` and
        // `collapsed` into a shared store and read it here.
        marginLeft: SIDEBAR_DEFAULT,
        transition: "margin-left 0.25s cubic-bezier(0.4,0,0.2,1)",
        minHeight: "calc(100vh - 84px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* TabBar sits flush under the navbar, above the content */}
      <div
        style={{
          position: "fixed",
          top: 48,
          left: SIDEBAR_DEFAULT,
          right: 0,
          zIndex: 30,
          transition: "left 0.25s cubic-bezier(0.4,0,0.2,1)",
          background: "#EEECEA",
          borderBottom: "1px solid #E2DFD9",
        }}
      >
        <TabBar />
      </div>

      {/* Scrollable panel area */}
      <div
        style={{
          flex: 1,
          padding: "28px 28px 40px",
          overflowY: "auto",
        }}
      >
        <TabPanels />
      </div>
    </div>
  )
}