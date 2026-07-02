"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Plus, FolderOpen, Trash2, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import { formatRelativeTime } from "@/lib/utils"

interface CollectionsViewProps {
  onCollectionClick?: (collectionId: string) => void
}

interface Collection {
  id: string
  name: string
  description: string | null
  isPrivate: boolean
  createdAt: string
  updatedAt: string
  photoCount: number
  thumbnails: string[]
}

export function CollectionsView({ onCollectionClick }: CollectionsViewProps) {
  const t = useT()
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newPrivate, setNewPrivate] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const res = await fetch("/api/collections")
      if (!res.ok) throw new Error("Failed")
      return res.json() as Promise<{ items: Collection[] }>
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/collections/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collections"] })
      toast.success(t("collection.deleted"))
    },
    onError: () => toast.error(t("common.error")),
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim() || null,
          isPrivate: newPrivate,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collections"] })
      setCreateOpen(false)
      setNewName("")
      setNewDesc("")
      setNewPrivate(false)
      toast.success(t("collection.created"))
    },
    onError: () => toast.error(t("common.error")),
  })

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm(t("common.confirmDelete"))) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("collection.title")}</h1>
        <Button
          onClick={() => setCreateOpen(true)}
          size="sm"
          className="bg-[#E60023] hover:bg-[#AD081B] text-white border-[#E60023] gap-1.5 rounded-full"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("collection.create")}</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FolderOpen className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">{t("collection.empty")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t("collection.emptyDesc")}</p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-[#E60023] hover:bg-[#AD081B] text-white border-[#E60023] gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {t("collection.create")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {data.items.map((col, i) => (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
              onClick={() => onCollectionClick?.(col.id)}
              className="group cursor-pointer rounded-xl border border-border/60 bg-card hover:border-black/20 hover:shadow-lg transition-all overflow-hidden"
            >
              {/* Thumbnails preview */}
              <div className="grid grid-cols-2 gap-0.5 aspect-video bg-muted">
                {col.thumbnails.length > 0 ? (
                  col.thumbnails.slice(0, 4).map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ))
                ) : (
                  <div className="col-span-2 flex items-center justify-center text-muted-foreground">
                    <FolderOpen className="h-8 w-8" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-sm truncate">{col.name}</h3>
                  <button
                    onClick={(e) => handleDelete(e, col.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-[#E60023]"
                    aria-label={t("collection.delete")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {col.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{col.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                  <span>{col.photoCount} {t("profile.photos")}</span>
                  <span>·</span>
                  <span>{formatRelativeTime(col.updatedAt)}</span>
                  {col.isPrivate && (
                    <>
                      <span>·</span>
                      <span className="text-[#E60023]">{t("collection.private")}</span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => !v && setCreateOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("collection.create")}</DialogTitle>
            <DialogDescription>{t("collection.createDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="col-name">{t("collection.name")}</Label>
              <Input
                id="col-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("collection.namePlaceholder")}
                maxLength={60}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="col-desc">{t("collection.description")}</Label>
              <Textarea
                id="col-desc"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder={t("collection.descriptionPlaceholder")}
                maxLength={500}
                rows={2}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="col-private">{t("collection.private")}</Label>
              <Switch
                id="col-private"
                checked={newPrivate}
                onCheckedChange={setNewPrivate}
                className="data-[state=checked]:bg-[#E60023]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!newName.trim() || createMutation.isPending}
              className="bg-[#E60023] hover:bg-[#AD081B] text-white border-[#E60023]"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("collection.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
