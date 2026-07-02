"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Aperture, LogOut, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useT } from "@/lib/i18n"
import { toast } from "sonner"
import { initialsFromName } from "@/lib/utils"

interface HeaderProps {
  onAuthOpen: (mode: "login" | "signup") => void
  onUploadOpen?: () => void
}

export function Header({ onAuthOpen, onUploadOpen }: HeaderProps) {
  const t = useT()
  const { data: session } = useSession()

  const handleLogout = () => {
    signOut({ redirect: false }).then(() => {
      toast.success(t("toast.loggedOut"))
    })
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-3 sm:gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="h-7 w-7 rounded-md bg-[#E60023] flex items-center justify-center shadow-lg shadow-red-900/30">
            <Aperture className="h-4 w-4 text-white" />
          </span>
          <span className="text-xl font-bold tracking-tight">Aperture</span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
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
    </header>
  )
}
