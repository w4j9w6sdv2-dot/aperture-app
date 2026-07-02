"use client"

import { useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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

interface NSFWGateProps {
  open: boolean
  onClose: () => void
  onEnabled: () => void
}

export function NSFWGate({ open, onClose, onEnabled }: NSFWGateProps) {
  const t = useT()
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showAdultContent: true }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success(t("nsfw.enabled"))
      onEnabled()
      onClose()
    } catch {
      toast.error(t("common.error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#E60023]">
            <AlertTriangle className="h-5 w-5" />
            {t("nsfw.confirmTitle")}
          </DialogTitle>
          <DialogDescription className="text-left space-y-3 pt-2">
            <p>{t("nsfw.confirmText")}</p>
            <p className="text-xs text-muted-foreground">
              {t("nsfw.disclaimer")}
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-[#E60023] hover:bg-[#AD081B] text-white border-[#E60023]"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("nsfw.iAm18")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
