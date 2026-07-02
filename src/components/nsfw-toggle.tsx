"use client"

import { useState } from "react"
import { EyeOff, Eye, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useUserPreferences, useUpdateUserPreferences } from "@/lib/api"
import { useT } from "@/lib/i18n"
import { toast } from "sonner"

export function NSFWToggle() {
  const t = useT()
  const { data: prefs } = useUserPreferences()
  const update = useUpdateUserPreferences()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const enabled = prefs?.showAdultContent ?? false

  const handleEnable = async () => {
    setConfirmOpen(false)
    try {
      await update.mutateAsync({ showAdultContent: true })
      toast.success(t("nsfw.enabled"))
    } catch (err) {
      toast.error(t("common.error"))
    }
  }

  const handleDisable = async () => {
    try {
      await update.mutateAsync({ showAdultContent: false })
      toast.success(t("nsfw.disabled"))
    } catch (err) {
      toast.error(t("common.error"))
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/60 bg-card/40">
      <div className="flex items-start gap-2.5">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${enabled ? "bg-[#E60023]/10" : "bg-muted"}`}>
          {enabled ? (
            <Eye className="h-4 w-4 text-[#E60023]" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">{t("nsfw.title")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("nsfw.description")}</p>
        </div>
      </div>

      {enabled ? (
        <Switch
          checked={true}
          onCheckedChange={() => handleDisable()}
          disabled={update.isPending}
          className="data-[state=checked]:bg-[#E60023]"
        />
      ) : (
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-border/60 hover:border-[#E60023]/60 hover:text-[#E60023] gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" />
              {t("nsfw.enable")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#E60023]" />
                {t("nsfw.confirmTitle")}
              </DialogTitle>
              <DialogDescription className="text-left">
                {t("nsfw.confirmText")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleEnable}
                className="bg-[#E60023] hover:bg-[#AD081B] text-white border-[#E60023] gap-1.5"
                disabled={update.isPending}
              >
                {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("nsfw.iAm18")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
