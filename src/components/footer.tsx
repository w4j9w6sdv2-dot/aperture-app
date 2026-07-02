"use client"

import { Aperture } from "lucide-react"
import { useT } from "@/lib/i18n"

export function Footer() {
  const t = useT()

  return (
    <footer className="mt-auto border-t border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="h-6 w-6 rounded bg-[#E60023] flex items-center justify-center">
              <Aperture className="h-3 w-3 text-white" />
            </span>
            <span className="font-semibold">Aperture</span>
            <span className="text-muted-foreground hidden sm:inline">
              — {t("footer.tagline")}
            </span>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  )
}
