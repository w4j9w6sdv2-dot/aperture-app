"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useT } from "@/lib/i18n"
import { toast } from "sonner"

export function DeleteAccountButton() {
  const t = useT()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [confirmText, setConfirmText] = useState("")

  const handleDelete = async () => {
    if (confirmText !== t("account.deleteConfirmWord")) return
    if (!password) return

    setLoading(true)
    try {
      const res = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed")
      }

      toast.success(t("account.deleted"))
      setOpen(false)
      setPassword("")
      setConfirmText("")
      signOut({ redirect: false, callbackUrl: "/" })
      setTimeout(() => window.location.reload(), 500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"))
    } finally {
      setLoading(false)
    }
  }

  if (!session?.user) return null

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-[#E60023] hover:bg-[#E60023]/10 hover:text-[#E60023] border-[#E60023]/30 gap-1.5 rounded-full"
      >
        <Trash2 className="h-4 w-4" />
        <span className="hidden sm:inline">{t("account.delete")}</span>
      </Button>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#E60023]">
              <AlertTriangle className="h-5 w-5" />
              {t("account.deleteTitle")}
            </DialogTitle>
            <DialogDescription className="text-left space-y-3 pt-2">
              <p className="text-foreground font-medium">{t("account.deleteWarning")}</p>
              <p className="text-sm">{t("account.deleteDesc")}</p>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="confirm-text">
                {t("account.deleteConfirmLabel")} <span className="font-bold">"{t("account.deleteConfirmWord")}"</span>
              </Label>
              <Input
                id="confirm-text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={t("account.deleteConfirmWord")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="delete-password">{t("auth.password")}</Label>
              <Input
                id="delete-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleDelete}
              disabled={loading || !password || confirmText !== t("account.deleteConfirmWord")}
              className="bg-[#E60023] hover:bg-[#AD081B] text-white border-[#E60023]"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Trash2 className="h-4 w-4 mr-2" />
              {t("account.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
