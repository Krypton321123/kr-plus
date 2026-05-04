import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AuthUser {
    username: string
    usrcat: string
    categoryName: string
    locationCode: string
    cmpCode: string
    cmpName: string
    finYear: string
    rowid: number; 
}

interface AuthStore {
    user: AuthUser | null
    setUser: (user: AuthUser) => void
    logout: () => void
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            setUser: (user) => set({ user }),
            logout: () =>  set({ user: null }),
        }),
        {
            name: "auth", // localStorage key
        }
    )
)