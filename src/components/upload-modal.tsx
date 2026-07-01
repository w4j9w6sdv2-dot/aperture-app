"use client"

import { useState, useRef, useCallback } from "react"
import { UploadCloud, X, ImageIcon, Loader2, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/lib/store"
import { useCreatePhoto, useSearchTags, useCurrentUser } from "@/lib/api"
import { fileToResizedDataUrl, cn } from "@/lib/utils"
import { useT } from "@/lib/i18n"
import { toast } from "sonner"

export function UploadModal() {
  const open = useAppStore((s) => s.view.name === "upload")
  const setView = useAppStore((s) => s.setView)
  const openAuth = useAppStore((s) => s.openAuth)
  const { data: currentUser } = useCurrentUser()

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [processing, setProcessing] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const createMut = useCreatePhoto()
  const t = useT()

  const { data: tagSuggestions } = useSearchTags(tagInput)

  const reset = () => {
    setFile(null)
    setPreview(null)
    setTitle("")
    setDescription("")
    setTags([])
    setTagInput("")
    setProcessing(false)
  }

  const close = () => {
    reset()
    setView({ name: "home" })
  }

  const handleFile = useCallback(async (f: File) => {
    if (!f.type.startsWith("image/")) {
      toast.error(t("upload.imageFile"))
      return
    }
    if (f.size > 25 * 1024 * 1024) {
      toast.error(t("upload.imageSize"))
      return
    }
    setFile(f)
    setProcessing(true)
    try {
      const dataUrl = await fileToResizedDataUrl(f, 1600, 0.82)
      setPreview(dataUrl)
    } catch {
      toast.error(t("upload.readFailed"))
      setFile(null)
    } finally {
      setProcessing(false)
    }
  }, [t])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const f = e.dataTransfer.files?.[0]
      if (f) handleFile(f)
    },
    [handleFile]
  )

  const addTag = (tagStr: string) => {
    const cleaned = tagStr.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-")
    if (!cleaned) return
    if (tags.includes(cleaned)) return
    if (tags.length >= 10) {
      toast.warning(t("upload.maxTags"))
      return
    }
    setTags((prev) => [...prev, cleaned])
    setTagInput("")
  }

  const removeTag = (tagStr: string) => setTags((prev) => prev.filter((x) => x !== tagStr))

  const onTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      openAuth("signup")
      return
    }
    if (!preview) {
      toast.error(t("upload.noFile"))
      return
    }
    if (!title.trim()) {
      toast.error(t("upload.titleRequired"))
      return
    }
    createMut.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        imageUrl: preview,
        tags,
      },
      {
        onSuccess: (photo) => {
          toast.success(t("upload.success"))
          reset()
          setView({ name: "photo", photoId: photo.id })
        },
        onError: (err) => toast.error(err.message),
      }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && close()}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin p-0">
        <div className="brand-gradient h-1.5" />
        <DialogHeader className="px-6 pt-4 pb-2">
          <DialogTitle className="text-xl">{t("upload.title")}</DialogTitle>
          <DialogDescription>
            {t("upload.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {/* Dropzone */}
          {!preview ? (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                isDragging
                  ? "border-rose-500 bg-rose-500/10"
                  : "border-border hover:border-rose-500/50 hover:bg-muted/30"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />
              <div className="flex flex-col items-center gap-3">
                {processing ? (
                  <Loader2 className="h-10 w-10 text-rose-500 animate-spin" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <UploadCloud className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">
                    {processing ? t("upload.processing") : t("upload.dragDrop")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("upload.orClick")}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-black/40 border border-border">
                <img
                  src={preview}
                  alt="preview"
                  className="max-h-[400px] w-full object-contain"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => {
                    setFile(null)
                    setPreview(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {file && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-3 w-3" />
                  {file.name} · {(file.size / 1024).toFixed(0)} KB
                </p>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="upload-title">{t("upload.photoTitle")}</Label>
            <Input
              id="upload-title"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("upload.photoTitlePlaceholder")}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="upload-desc">{t("upload.description")}</Label>
            <Textarea
              id="upload-desc"
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("upload.descriptionPlaceholder")}
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="upload-tags">{t("upload.tags")}</Label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              <AnimatePresence>
                {tags.map((tag) => (
                  <motion.div
                    key={tag}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                  >
                    <Badge variant="secondary" className="gap-1 pr-1">
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-rose-500"
                        aria-label={`Remove ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="relative">
              <Input
                id="upload-tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={onTagKey}
                placeholder={t("upload.tagsPlaceholder")}
              />
              {tagInput.trim() && tagSuggestions && tagSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-md border border-border bg-popover shadow-lg overflow-hidden">
                  {tagSuggestions.slice(0, 6).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => addTag(s.name)}
                      className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                    >
                      <span>#{s.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {t("upload.tagCount", { count: String(s.count) })}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={close}>
              {t("upload.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!preview || createMut.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
            >
              {createMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {t("upload.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
