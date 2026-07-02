"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Bookmark, Plus, Loader2, Check, FolderOpen, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useSession } from "next-auth/react"
import { useT } from "@/lib/i18n"
import { toast } from "sonner"

interface SaveButtonProps {
  photoId: string
  size?: "sm" | "md"
}

interface Collection {
  id: string
  name: string
  photoCount: number
}

export function SaveButton({ photoId, size = "sm" }: SaveButtonProps) {
  const t = useT()
  const { data: session } = useSession()
  const qc = useQueryClient()
  const [newCollectionName, setNewCollectionName] = useState("")
  const [creating, setCreating] = useState(false)

  const { data: collectionsData } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const res = await fetch("/api/collections")
      if (!res.ok) throw new Error("Failed")
      return res.json() as Promise<{ items: Collection[] }>
    },
    enabled: !!session?.user,
  })

  const saveMutation = useMutation({
    mutationFn: async (collectionId: string) => {
      const res = await fetch(`/api/photos/${photoId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId }),
      })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collections"] })
      toast.success(t("photo.saved"))
    },
    onError: () => toast.error(t("common.error")),
  })

  const createAndSaveMutation = useMutation({
    mutationFn: async (name: string) => {
      // Create collection
      const createRes = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!createRes.ok) throw new Error("Failed")
      const col = await createRes.json()
      // Save photo to new collection
      const saveRes = await fetch(`/api/photos/${photoId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId: col.id }),
      })
      if (!saveRes.ok) throw new Error("Failed")
      return saveRes.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collections"] })
      setNewCollectionName("")
      setCreating(false)
      toast.success(t("photo.saved"))
    },
    onError: () => toast.error(t("common.error")),
  })

  const handleSave = (collectionId: string) => {
    saveMutation.mutate(collectionId)
  }

  const handleCreate = () => {
    const name = newCollectionName.trim()
    if (!name) return
    createAndSaveMutation.mutate(name)
  }

  if (!session?.user) {
    return null
  }

  const isMd = size === "md"
  const iconSize = isMd ? "h-5 w-5" : "h-3.5 w-3.5"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`inline-flex items-center gap-1.5 transition-colors text-muted-foreground hover:text-[#E60023] ${isMd ? "text-sm" : "text-xs"}`}
          aria-label={t("photo.save")}
        >
          {saveMutation.isPending || createAndSaveMutation.isPending ? (
            <Loader2 className={`${iconSize} animate-spin`} />
          ) : (
            <Bookmark className={iconSize} />
          )}
          {isMd && <span>{t("photo.save")}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>{t("photo.save")}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {collectionsData?.items.length === 0 ? (
          <div className="px-2 py-3 text-center text-xs text-muted-foreground">
            {t("collection.empty")}
          </div>
        ) : (
          collectionsData?.items.map((col) => (
            <DropdownMenuItem
              key={col.id}
              onClick={() => handleSave(col.id)}
              className="flex items-center justify-between gap-2 cursor-pointer"
            >
              <span className="flex items-center gap-2 text-sm">
                <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                {col.name}
              </span>
              <span className="text-xs text-muted-foreground">{col.photoCount}</span>
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />

        {/* Create new collection inline */}
        <div className="px-2 py-2">
          {creating ? (
            <div className="flex gap-1.5">
              <Input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder={t("collection.name")}
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleCreate()
                  }
                  if (e.key === "Escape") {
                    setCreating(false)
                    setNewCollectionName("")
                  }
                }}
              />
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!newCollectionName.trim() || createAndSaveMutation.isPending}
                className="h-8 px-2 bg-[#E60023] hover:bg-[#AD081B] text-white border-[#E60023]"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full px-1 py-1"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("collection.create")}
            </button>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
