"use client"

import { useI18n, type Locale } from "@/lib/i18n"
import { Languages, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n()

  const label = locale === "it" ? "IT" : "EN"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-muted-foreground hover:text-foreground"
          aria-label={t("header.language")}
        >
          <Languages className="h-4 w-4" />
          <span className="text-xs font-medium">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuItem
          onClick={() => setLocale("it" as Locale)}
          className="flex items-center justify-between gap-2"
        >
          <span className="flex items-center gap-2">
            <span className="text-base">🇮🇹</span>
            <span>Italiano</span>
          </span>
          {locale === "it" && <Check className="h-3.5 w-3.5 text-rose-500" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale("en" as Locale)}
          className="flex items-center justify-between gap-2"
        >
          <span className="flex items-center gap-2">
            <span className="text-base">🇬🇧</span>
            <span>English</span>
          </span>
          {locale === "en" && <Check className="h-3.5 w-3.5 text-rose-500" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
