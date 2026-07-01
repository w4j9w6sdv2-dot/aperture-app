"use client"

import { motion } from "framer-motion"
import { FolderHeart, Plus, Folder, Lock, Trash2, ImageOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useMyCollections, useCreateCollection, useCurrentUser } from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { formatDate, formatCount, cn } from "@/lib/utils"
import { toast } from "sonner"

export function CollectionsView() {
  const t = useT()
  const setView = useAppStore((s) => s.setView)
  const openAuth = useAppStore((s) => s.openAuth)
  const { data: currentUser } = useCurrentUser()
  const { data: collections, isLoading } = useMyCollections()
  const createMut = useCreateCollection()

  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [creating, setCreating] = useState(false)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    createMut.mutate(
      { name: name.trim(), description: desc.trim() || null },
      {
        onSuccess: () => {
          setCreating(false)
          setCreateOpen(false)
          setName("")
          setDesc("")
          toast.success(t("toast.collectionCreated"))
        },
        onError: (e) => {
          setCreating(false)
          toast.error(e.message)
        },
      }
    )
  }

  if (!currentUser) {
    return (
      <EmptyState
        icon={FolderHeart}
        title={t("collection.loginRequired")}
        description={t("collection.subtitle")}
        action={
          <Button
            className="bg-rose-600 hover:bg-rose-700 text-white"
            onClick={() => openAuth("login")}
          >
            {t("auth.loginSubmit")}
          </Button>
        }
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <header className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FolderHeart className="h-6 w-6 text-rose-500" />
            <h1 className="text-2xl sm:text-3xl font-bold">{t("collection.title")}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{t("collection.subtitle")}</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
        >
          <Plus className="h-4 w-4" /> {t("collection.create")}
        </Button>
      </header>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && (!collections || collections.length === 0) && (
        <EmptyState
          icon={ImageOff}
          title={t("collection.empty")}
          description={t("collection.emptyDesc")}
          action={
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> {t("collection.create")}
            </Button>
          }
        />
      )}

      {!isLoading && collections && collections.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.05, 0.4) }}
            >
              <Card
                onClick={() => setView({ name: "collection", collectionId: c.id })}
                className="overflow-hidden cursor-pointer p-0 border-border/60 hover:border-rose-300/60 hover:shadow-lg transition-all rounded-xl group"
              >
                {/* Thumbnail grid */}
                <div className="grid grid-cols-2 gap-0.5 h-32 sm:h-36 bg-muted">
                  {c.thumbnails.length > 0 ? (
                    c.thumbnails.slice(0, 4).map((th, idx) => (
                      <div key={th.id} className="overflow-hidden">
                        <img
                          src={th.imageUrl}
                          alt={th.title}
                          loading="lazy"
                          className={cn(
                            "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
                            c.thumbnails.length === 1 && "col-span-2",
                            c.thumbnails.length === 2 && "col-span-1",
                            c.thumbnails.length === 3 && idx === 0 && "col-span-2 row-span-1"
                          )}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 flex items-center justify-center text-muted-foreground">
                      <Folder className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold truncate flex-1">{c.name}</h3>
                    {c.isPrivate && (
                      <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                  </div>
                  {c.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>
                      {formatCount(c.photoCount)} {t("collection.photos")}
                    </span>
                    <span>{formatDate(c.updatedAt)}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("collection.create")}</DialogTitle>
            <DialogDescription>{t("collection.subtitle")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="coll-name">{t("collection.name")}</Label>
              <Input
                id="coll-name"
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("collection.namePlaceholder")}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coll-desc">{t("collection.description")}</Label>
              <Input
                id="coll-desc"
                maxLength={500}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder={t("collection.descriptionPlaceholder")}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={!name.trim() || creating}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {creating ? "…" : t("collection.createBtn")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// Re-export Badge, Trash2 to satisfy import graph
export { Badge, Trash2 }
