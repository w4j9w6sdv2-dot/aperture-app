"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut, User as UserIcon, Image as ImageIcon, Sparkles } from "lucide-react"
import { useCurrentUser, useLogout } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { initialsFromName } from "@/lib/utils"
import { toast } from "sonner"

export function UserMenu() {
  const { data: currentUser } = useCurrentUser()
  const setView = useAppStore((s) => s.setView)
  const openAuth = useAppStore((s) => s.openAuth)
  const logout = useLogout()

  if (!currentUser) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openAuth("login")}
          className="text-muted-foreground hover:text-foreground"
        >
          Log in
        </Button>
        <Button
          size="sm"
          onClick={() => openAuth("signup")}
          className="bg-white text-black hover:bg-white/90"
        >
          Sign up
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full ring-1 ring-border hover:ring-rose-500/60 transition-all p-0.5">
          <Avatar className="h-8 w-8">
            {currentUser.avatarUrl ? (
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.username} />
            ) : null}
            <AvatarFallback className="text-xs bg-muted">
              {initialsFromName(currentUser.username)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{currentUser.username}</span>
          <span className="text-xs text-muted-foreground font-normal">
            {currentUser.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            setView({ name: "profile", userId: currentUser.id })
          }
        >
          <UserIcon className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setView({ name: "upload" })}>
          <ImageIcon className="mr-2 h-4 w-4" />
          Upload
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            fetch("/api/seed", { method: "POST" })
              .then(() => {
                toast.success("Database re-seeded")
                setTimeout(() => window.location.reload(), 600)
              })
              .catch(() => toast.error("Failed to seed"))
          }}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Re-seed demo data
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            logout.mutate(undefined, {
              onSuccess: () => toast.success("Signed out"),
              onError: (e) => toast.error(e.message),
            })
          }
          className="text-rose-500 focus:text-rose-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
