"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Upload, Aperture, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppStore } from "@/lib/store"
import { UserMenu } from "@/components/user-menu"
import { useCurrentUser } from "@/lib/api"
import { cn } from "@/lib/utils"

export function Header() {
  const setView = useAppStore((s) => s.setView)
  const openAuth = useAppStore((s) => s.openAuth)
  const { data: currentUser } = useCurrentUser()
  const [query, setQuery] = useState("")
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // close mobile search on Escape
  useEffect(() => {
    if (!mobileSearchOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileSearchOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [mobileSearchOpen])

  useEffect(() => {
    if (mobileSearchOpen) inputRef.current?.focus()
  }, [mobileSearchOpen])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setView({ name: "search", query: q })
    setMobileSearchOpen(false)
  }

  const handleUpload = () => {
    if (!currentUser) {
      openAuth("signup")
      return
    }
    setView({ name: "upload" })
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-3 sm:gap-6">
        {/* Logo */}
        <button
          onClick={() => setView({ name: "home" })}
          className="flex items-center gap-2 shrink-0 group"
          aria-label="Aperture home"
        >
          <span className="h-7 w-7 rounded-md brand-gradient flex items-center justify-center shadow-lg shadow-rose-900/40">
            <Aperture className="h-4 w-4 text-white" />
          </span>
          <span className="text-xl font-bold tracking-tight hidden sm:inline">
            Aperture
          </span>
        </button>

        {/* Desktop search */}
        <form
          onSubmit={submitSearch}
          className="hidden sm:flex flex-1 max-w-xl items-center relative"
        >
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search photos, tags, or photographers…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-3 h-10 bg-muted/60 border-border/60 focus-visible:bg-background focus-visible:border-rose-500/50"
          />
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setMobileSearchOpen((v) => !v)}
            aria-label="Toggle search"
          >
            {mobileSearchOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>

          <Button
            onClick={handleUpload}
            size="sm"
            className="bg-rose-600 hover:bg-rose-700 text-white border-rose-600 gap-1.5"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </Button>

          <UserMenu />
        </div>
      </div>

      {/* Mobile search dropdown */}
      <div
        className={cn(
          "sm:hidden overflow-hidden transition-all duration-200 border-t border-border/60",
          mobileSearchOpen ? "max-h-20" : "max-h-0 border-t-0"
        )}
      >
        <form onSubmit={submitSearch} className="px-4 py-3 flex items-center relative">
          <Search className="absolute left-7 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search photos, tags, photographers…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-10 bg-muted/60"
          />
        </form>
      </div>
    </header>
  )
}
