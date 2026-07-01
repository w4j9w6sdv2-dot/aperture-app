"use client"

import { create } from "zustand"

export type View =
  | { name: "home" }
  | { name: "photo"; photoId: string }
  | { name: "upload" }
  | { name: "profile"; userId: string }
  | { name: "search"; query: string }
  | { name: "tag"; tagName: string }
  | { name: "about" }

interface AppState {
  view: View
  history: View[]
  homeTab: "discover" | "feed"
  authOpen: boolean
  authMode: "login" | "signup"

  setView: (view: View) => void
  goBack: () => void
  canGoBack: () => boolean
  setHomeTab: (tab: "discover" | "feed") => void
  openAuth: (mode?: "login" | "signup") => void
  closeAuth: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  view: { name: "home" },
  history: [],
  homeTab: "discover",
  authOpen: false,
  authMode: "login",

  setView: (view) =>
    set((state) => ({
      history: [...state.history, state.view],
      view,
      authOpen: false,
    })),

  goBack: () =>
    set((state) => {
      if (state.history.length === 0) {
        return { view: { name: "home" } }
      }
      const history = [...state.history]
      const prev = history.pop()!
      return { view: prev, history }
    }),

  canGoBack: () => get().history.length > 0,

  setHomeTab: (tab) => set({ homeTab: tab }),

  openAuth: (mode = "login") => set({ authOpen: true, authMode: mode }),
  closeAuth: () => set({ authOpen: false }),
}))
