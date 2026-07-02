"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, X, Loader2, ImagePlus, Plus, Tag as TagIcon, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useQuery } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useT } from "@/lib/i18n"
import { toast } from "sonner"

interface UploadModalProps {
  open: boolean
  onClose: () => void
  onUploaded?: () => void
}

interface TagSuggestion {
  id: string
  name: string
  count: number
}

export function UploadModal({ open, onClose, onUploaded }: UploadModalProps) {
  const t = useT()
  const [imageUrl, setImageUrl] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([])
  const [categoryId, setCategoryId] = useState<string>("")
  const [isAdult, setIsAdult] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch categories (only non-adult unless user opted in)
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories")
      if (!res.ok) throw new Error("Failed")
      return res.json() as Promise<{ items: { id: string; name: string; slug: string; icon: string | null; isAdult: boolean }[] }>
    },
  })

  // Reset form on close
  useEffect(() => {
    if (!open) {
      setImageUrl("")
      setTitle("")
      setDescription("")
      setTags([])
      setTagInput("")
      setTagSuggestions([])
      setCategoryId("")
      setIsAdult(false)
      setLoading(false)
      setIsDragOver(false)
    }
  }, [open])

  // Tag autocomplete
  useEffect(() => {
    if (!tagInput.trim()) {
      setTagSuggestions([])
      return
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tags/search?q=${encodeURIComponent(tagInput.trim())}`)
        if (res.ok) {
          const data = await res.json()
          setTagSuggestions(data.items || [])
        }
      } catch {}
    }, 200)
    return () => clearTimeout(timeout)
  }, [tagInput])

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(t("upload.error"))
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error(t("upload.error"))
      return
    }
    // Convert to base64 data URL with downscale to max 1600px
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const maxSize = 1600
        let { width, height } = img
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        } else if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        ctx?.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
        setImageUrl(dataUrl)
        // Auto-fill title with filename if empty
        if (!title) {
          const name = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")
          setTitle(name.charAt(0).toUpperCase() + name.slice(1))
        }
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleAddTag = (tagName?: string) => {
    const name = (tagName ?? tagInput).toLowerCase().trim()
    if (!name) return
    if (tags.includes(name)) {
      setTagInput("")
      setTagSuggestions([])
      return
    }
    if (name.length > 30) return
    setTags([...tags, name])
    setTagInput("")
    setTagSuggestions([])
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      handleAddTag()
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageUrl) {
      toast.error(t("upload.noFile"))
      return
    }
    if (!title.trim()) {
      toast.error(t("upload.titleRequired"))
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          imageUrl,
          tags,
          categoryId: categoryId || null,
          isAdult,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || t("upload.error"))
      }

      toast.success(t("upload.success"))
      onUploaded?.()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("upload.error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("upload.title")}</DialogTitle>
          <DialogDescription>{t("upload.tagsHint")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image preview / dropzone */}
          {imageUrl ? (
            <div className="relative rounded-lg overflow-hidden border border-border/60">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full max-h-64 object-contain bg-muted/40"
              />
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? "border-[#E60023] bg-[#E60023]/5"
                  : "border-border/60 hover:border-foreground/30"
              }`}
            >
              <ImagePlus className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">{t("upload.dropHere")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("upload.orClick")}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                }}
                className="hidden"
              />
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">{t("upload.photoTitle")}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("upload.photoTitlePlaceholder")}
              required
              maxLength={120}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">{t("upload.description")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("upload.descriptionPlaceholder")}
              maxLength={2000}
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="tags">{t("upload.tags")}</Label>
            <div className="flex flex-wrap gap-1.5 mb-2 min-h-[0px]">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1 pr-1.5 bg-[#E60023]/10 text-[#E60023] hover:bg-[#E60023]/20"
                >
                  <TagIcon className="h-3 w-3" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-0.5 hover:bg-[#E60023]/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="relative">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={t("upload.tagsPlaceholder")}
              />
              {tagSuggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {tagSuggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleAddTag(s.name)}
                      className="w-full text-left px-3 py-2 hover:bg-accent flex items-center justify-between gap-2"
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        {s.name}
                      </span>
                      <span className="text-xs text-muted-foreground">{s.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{t("upload.tagsHint")}</p>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="category">{t("upload.category")}</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category">
                <SelectValue placeholder={t("upload.selectCategory")} />
              </SelectTrigger>
              <SelectContent>
                {categoriesData?.items.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}{cat.isAdult ? " (18+)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Adult content toggle */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/60 bg-card/40">
            <div className="flex items-start gap-2.5">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${isAdult ? "bg-[#E60023]/10" : "bg-muted"}`}>
                <AlertTriangle className={`h-4 w-4 ${isAdult ? "text-[#E60023]" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-sm font-medium">{t("upload.isAdult")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("nsfw.description")}</p>
              </div>
            </div>
            <Switch
              checked={isAdult}
              onCheckedChange={setIsAdult}
              className="data-[state=checked]:bg-[#E60023]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              {t("upload.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading || !imageUrl || !title.trim()}
              className="flex-1 bg-[#E60023] hover:bg-[#AD081B] text-white border-[#E60023]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("upload.uploading")}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {t("upload.submit")}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
