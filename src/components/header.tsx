"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Aperture, LogOut, Upload, User as UserIcon, Search, X, Compass, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useT } from "@/lib/i18n"
import { toast } from "sonner"
import { initialsFromName } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"

interface HeaderProps {
  onAuthOpen: (mode: "login" | "signup") => void
  onUploadOpen?: () => void
  onProfileClick?: () => void
  onSearch?: (query: string) => void
  onCategoryClick?: (slug: string) => void
  onHomeClick?: () => void
  onCollectionsClick?: () => void
}

export function Header({ onAuthOpen, onUploadOpen, onProfileClick, onSearch, onCategoryClick, onHomeClick, onCollectionsClick }: HeaderProps) {
  const t = useT()
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories")
      if (!res.ok) throw new Error("Failed")
      return res.json() as Promise<{ items: { id: string; name: string; slug: string; icon: string | null; isAdult: boolean; photoCount: number }[] }>
    },
  })

  const handleLogout = () => {
    signOut({ redirect: false }).then(() => {
      toast.success(t("toast.loggedOut"))
    })
  }

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    onSearch?.(q)
    setMobileSearchOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-3 sm:gap-6">
        {/* Logo */}
        <button onClick={onHomeClick} className="flex items-center gap-2 shrink-0">
          <span className="h-7 w-7 rounded-md bg-[#E60023] flex items-center justify-center shadow-lg shadow-red-900/30">
            <Aperture className="h-4 w-4 text-white" />
          </span>
          <span className="text-xl font-bold tracking-tight">Aperture</span>
        </button>

        {/* Desktop search */}
        <form onSubmit={submitSearch} className="hidden sm:flex flex-1 max-w-xl items-center relative">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("header.searchPlaceholder")}
            className="pl-9 pr-9 h-10 bg-muted/40 border-border/60 focus-visible:bg-background focus-visible:border-[#E60023]/50 rounded-full"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        {/* Categories dropdown (desktop) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex gap-1.5 text-muted-foreground hover:text-foreground">
              <Compass className="h-4 w-4" />
              <span>{t("nav.explore")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>{t("nav.categories")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {categoriesData?.items.map((cat) => (
                <DropdownMenuItem
                  key={cat.id}
                  onClick={() => onCategoryClick?.(cat.slug)}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="flex items-center gap-2">
                    {cat.name}
                    {cat.isAdult && (
                      <span className="text-[10px] px-1 py-0.5 rounded-full bg-[#E60023]/10 text-[#E60023] font-medium">
                        18+
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">{cat.photoCount}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Collections (desktop, logged in only) */}
        {session?.user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCollectionsClick}
            className="hidden sm:inline-flex gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <FolderOpen className="h-4 w-4" />
            <span>{t("collection.title")}</span>
          </Button>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          {/* Mobile search toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setMobileSearchOpen((v) => !v)}
            aria-label="Toggle search"
          >
            {mobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>

          <LanguageSwitcher />

          {session?.user ? (
            <>
              <Button
                onClick={onUploadOpen}
                size="sm"
                variant="outline"
                className="border-border/60 hover:border-foreground/40 hover:bg-foreground hover:text-background text-foreground bg-background gap-1.5 rounded-full"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">{t("header.upload")}</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full ring-1 ring-border hover:ring-[#E60023]/60 transition-all p-0.5">
                    <Avatar className="h-8 w-8">
                      {session.user.image ? (
                        <AvatarImage src={session.user.image} alt={session.user.name || ""} />
                      ) : null}
                      <AvatarFallback className="text-xs bg-muted">
                        {initialsFromName(session.user.name || session.user.email || "U")}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{session.user.name || session.user.username}</span>
                    <span className="text-xs text-muted-foreground font-normal">{session.user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onProfileClick}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    {t("header.profile")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-[#E60023] focus:text-[#E60023]"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("header.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAuthOpen("login")}
                className="text-muted-foreground hover:text-foreground"
              >
                {t("header.login")}
              </Button>
              <Button
                size="sm"
                onClick={() => onAuthOpen("signup")}
                className="bg-[#E60023] hover:bg-[#AD081B] text-white border-[#E60023] rounded-full"
              >
                {t("header.signup")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile search dropdown */}
      {mobileSearchOpen && (
        <div className="sm:hidden border-t border-border/60 px-4 py-3">
          <form onSubmit={submitSearch} className="flex items-center relative">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("header.searchPlaceholder")}
              className="pl-9 pr-9 h-10 bg-muted/40 rounded-full"
              autoFocus
            />
          </form>
        </div>
      )}
    </header>
  )
}
