import { create } from "zustand"

export interface Tab {
    id: string
    label: string
    closable: boolean
}

interface TabStore {
    tabs: Tab[]
    active: string
    openTab: (label: string, id: string) => void
    closeTab: (id: string) => void
    setActive: (id: string) => void
    closeActive: () => void
}

export const useTabStore = create<TabStore>((set, get) => ({
    tabs: [{ id: "home", label: "Home", closable: false }],
    active: "home",

    openTab: (label, id) => {
        const { tabs } = get()
        if (!tabs.find(t => t.id === id)) {
            set({ tabs: [...tabs, { id, label, closable: true }] })
        }
        set({ active: id })
    },

    closeTab: (id) => {
        const { tabs, active } = get()
        const idx = tabs.findIndex(t => t.id === id)
        if (idx === -1) return
        const next = tabs[Math.max(0, idx - 1)]
        set({
            tabs: tabs.filter(t => t.id !== id),
            active: active === id ? next.id : active,
        })
    },

    setActive: (id) => set({ active: id }),

    closeActive: () => {
        const { tabs, active, closeTab } = get()
        const t = tabs.find(t => t.id === active)
        if (t?.closable) closeTab(active)
    },
}))