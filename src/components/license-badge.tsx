"use client"

import { Badge } from "@/components/ui/badge"
import { Copyright, User, Ban, Lock } from "lucide-react"
import type { License } from "@/lib/api"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const LICENSES: Record<
  License,
  { icon: typeof Copyright; cls: string }
> = {
  "cc0": { icon: Copyright, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "cc-by": { icon: User, cls: "bg-blue-50 text-blue-700 border-blue-200" },
  "cc-by-nc": { icon: Ban, cls: "bg-amber-50 text-amber-700 border-amber-200" },
  "all-rights": { icon: Lock, cls: "bg-muted text-muted-foreground border-border" },
}

export function LicenseBadge({
  license,
  className,
  showLabel = true,
}: {
  license: License
  className?: string
  showLabel?: boolean
}) {
  const t = useT()
  const cfg = LICENSES[license] ?? LICENSES["all-rights"]
  const Icon = cfg.icon
  const labelMap: Record<License, string> = {
    "cc0": t("license.cc0"),
    "cc-by": t("license.ccBy"),
    "cc-by-nc": t("license.ccByNc"),
    "all-rights": t("license.allRights"),
  }
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 font-normal", cfg.cls, className)}
      title={labelMap[license]}
    >
      <Icon className="h-3 w-3" />
      {showLabel && <span className="text-[10px] uppercase tracking-wide">{license}</span>}
    </Badge>
  )
}

export function licenseDescription(license: License, t: (k: string) => string): string {
  switch (license) {
    case "cc0":
      return t("license.cc0Desc")
    case "cc-by":
      return t("license.ccByDesc")
    case "cc-by-nc":
      return t("license.ccByNcDesc")
    default:
      return t("license.allRightsDesc")
  }
}

export function LicenseBadgeList() {
  return null
}
