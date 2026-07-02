"use client"

import { useI18n, LOCALES, type Locale } from "@/lib/i18n"
import { Languages, Check, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n()

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-muted-foreground hover:text-foreground"
          aria-label={t("header.language")}
        >
          <Globe className="h-4 w-4" />
          <span className="text-xs font-medium uppercase">{current.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t("header.language")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLocale(l.code as Locale)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <span className="text-base leading-none">{l.flag}</span>
              <span className="flex flex-col">
                <span className="text-sm">{l.nativeName}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {l.code}
                </span>
              </span>
            </span>
            {locale === l.code && <Check className="h-3.5 w-3.5 text-rose-500" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
