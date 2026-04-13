"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { Topbar } from "@/components/dashboard/Topbar"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { TabBar } from "@/components/dashboard/TabBar"
import { TabPanels } from "@/components/dashboard/Tabpanels"


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        if (!user) router.replace("/login")
    }, [user, router])

    if (!user) return null

    return (
        <div className="min-h-screen bg-[#F5F4F0]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <Topbar />
            <Sidebar />
            <TabBar />
            <main className="ml-[220px] mt-[88px] p-6 min-h-[calc(100vh-88px)]">
                <TabPanels />
            </main>
        </div>
    )
}