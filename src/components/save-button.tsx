"use client"

import { useState } from "react"
import { Bookmark, BookmarkCheck, Plus, FolderPlus, Loader2, Check } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  useMyCollections,
  useCreateCollection,
  useSavePhoto,
  useUnsavePhoto,
  useCurrentUser,
  type CollectionSummary,
} from "@/lib/api"
import { useAppStore } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface SaveButtonProps {
  photoId: string
  savedByMe?: boolean
  variant?: "icon" | "outline" | "ghost"
  size?: "sm" | "md" | "icon"
  className?: string
}

export function SaveButton({
  photoId,
  savedByMe = false,
  variant = "ghost",
  size = "icon",
  className,
}: SaveButtonProps) {
  const t = useT()
  const openAuth = useAppStore((s) => s.openAuth)
  const { data: currentUser } = useCurrentUser()
  const { data: collections, isLoading } = useMyCollections()
  const saveMut = useSavePhoto()
  const unsaveMut = useUnsavePhoto()
  const createColl = useCreateCollection()

  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [creating, setCreating] = useState(false)

  // Find which collection this photo is saved in (if any). The first collection
  // (sorted by updatedAt desc) that contains the photo is treated as "primary"
  // for the unsave action.
  const containingCollection: CollectionSummary | undefined = collections?.find((c) =>
    c.thumbnails?.some((thumb) => thumb.id === photoId)
  )

  const handleSaveTo = (collectionId: string) => {
    if (!currentUser) {
      openAuth("login")
      return
    }
    saveMut.mutate(
      { photoId, collectionId },
      {
        onSuccess: () => toast.success(t("toast.saved")),
        onError: (e) => toast.error(e.message),
      }
    )
  }

  const handleUnsave = () => {
    if (!containingCollection) return
    unsaveMut.mutate(
      { photoId, collectionId: containingCollection.id },
      {
        onSuccess: () => toast.success(t("toast.unsaved")),
        onError: (e) => toast.error(e.message),
      }
    )
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    createColl.mutate(
      {
        name: newName.trim(),
        description: newDesc.trim() || null,
      },
      {
        onSuccess: (coll) => {
          setCreating(false)
          setCreateOpen(false)
          setNewName("")
          setNewDesc("")
          // Auto-save the photo into the new collection
          saveMut.mutate(
            { photoId, collectionId: coll.id },
            {
              onSuccess: () => toast.success(t("toast.saved")),
              onError: (e) => toast.error(e.message),
            }
          )
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
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn(className)}
        onClick={() => openAuth("login")}
        aria-label={t("photo.signInToSave")}
        title={t("photo.signInToSave")}
      >
        <Bookmark className="h-4 w-4" />
      </Button>
    )
  }

  const buttonContent =
    variant === "icon" || size === "icon" ? (
      savedByMe ? (
        <BookmarkCheck className="h-4 w-4 text-rose-500" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )
    ) : savedByMe ? (
      <>
        <BookmarkCheck className="h-4 w-4 text-rose-500" />
        <span>{t("photo.saved")}</span>
      </>
    ) : (
      <>
        <Bookmark className="h-4 w-4" />
        <span>{t("photo.save")}</span>
      </>
    )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant={variant}
            size={size}
            className={cn(className)}
            aria-label={t("photo.saveToCollection")}
            title={t("photo.saveToCollection")}
          >
            {buttonContent}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto scrollbar-thin">
          <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("photo.saveToCollection")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isLoading && (
            <div className="px-3 py-4 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && collections && collections.length === 0 && (
            <div className="px-3 py-3 text-xs text-muted-foreground">
              {t("collection.emptyDesc")}
            </div>
          )}
          {collections?.map((c) => {
            const contains = c.thumbnails?.some((th) => th.id === photoId)
            return (
              <DropdownMenuItem
                key={c.id}
                onClick={() => (contains ? handleUnsave() : handleSaveTo(c.id))}
                className="flex items-center justify-between gap-2 cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {c.photoCount} {t("collection.photos")}
                  </p>
                </div>
                {contains ? (
                  <Check className="h-4 w-4 text-rose-500 shrink-0" />
                ) : (
                  <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </DropdownMenuItem>
            )
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 cursor-pointer text-rose-600 focus:text-rose-700"
          >
            <FolderPlus className="h-4 w-4" />
            <span className="text-sm">{t("collection.create")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("collection.namePlaceholder")}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coll-desc">{t("collection.description")}</Label>
              <Input
                id="coll-desc"
                maxLength={500}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder={t("collection.descriptionPlaceholder")}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={!newName.trim() || creating}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : t("collection.createBtn")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
