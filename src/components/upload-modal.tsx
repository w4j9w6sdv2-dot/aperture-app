"use client"

import { useState, useRef, useCallback } from "react"
import { UploadCloud, X, ImageIcon, Loader2, Check, Camera, MapPin, FileText } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useAppStore } from "@/lib/store"
import {
  useCreatePhoto,
  useSearchTags,
  useCurrentUser,
  useCategories,
  type License,
} from "@/lib/api"
import { fileToResizedDataUrl, cn } from "@/lib/utils"
import { useT } from "@/lib/i18n"
import { toast } from "sonner"

const LICENSE_OPTIONS: { value: License; labelKey: string }[] = [
  { value: "all-rights", labelKey: "license.allRights" },
  { value: "cc-by-nc", labelKey: "license.ccByNc" },
  { value: "cc-by", labelKey: "license.ccBy" },
  { value: "cc0", labelKey: "license.cc0" },
]

export function UploadModal() {
  const open = useAppStore((s) => s.view.name === "upload")
  const setView = useAppStore((s) => s.setView)
  const openAuth = useAppStore((s) => s.openAuth)
  const { data: currentUser } = useCurrentUser()
  const { data: categories } = useCategories()

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [processing, setProcessing] = useState(false)

  // New fields
  const [categoryId, setCategoryId] = useState<string>("")
  const [location, setLocation] = useState("")
  const [license, setLicense] = useState<License>("all-rights")
  const [watermarked, setWatermarked] = useState(false)
  const [exifOpen, setExifOpen] = useState(false)
  const [exif, setExif] = useState({
    camera: "",
    lens: "",
    focalLength: "",
    aperture: "",
    shutterSpeed: "",
    iso: "",
    takenAt: "",
  })

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
    setCategoryId("")
    setLocation("")
    setLicense("all-rights")
    setWatermarked(false)
    setExif({
      camera: "",
      lens: "",
      focalLength: "",
      aperture: "",
      shutterSpeed: "",
      iso: "",
      takenAt: "",
    })
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

  const hasExifData = Object.values(exif).some((v) => v.trim() !== "")

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
        categoryId: categoryId || null,
        location: location.trim() || null,
        license,
        watermarked,
        exif: hasExifData
          ? {
              camera: exif.camera.trim() || null,
              lens: exif.lens.trim() || null,
              focalLength: exif.focalLength.trim() || null,
              aperture: exif.aperture.trim() || null,
              shutterSpeed: exif.shutterSpeed.trim() || null,
              iso: exif.iso.trim() || null,
              takenAt: exif.takenAt ? new Date(exif.takenAt).toISOString() : null,
            }
          : null,
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

          {/* Category + Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="upload-category">{t("upload.category")}</Label>
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v === "__none" ? "" : v)}>
                <SelectTrigger id="upload-category">
                  <SelectValue placeholder={t("upload.categoryPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">{t("upload.noCategory")}</SelectItem>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon && <span className="mr-1.5">{c.icon}</span>}
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="upload-location" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {t("upload.location")}
              </Label>
              <Input
                id="upload-location"
                maxLength={200}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("upload.locationPlaceholder")}
              />
            </div>
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

          {/* License + Watermark */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="upload-license">{t("upload.license")}</Label>
              <Select value={license} onValueChange={(v) => setLicense(v as License)}>
                <SelectTrigger id="upload-license">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="upload-watermark" className="flex items-center justify-between">
                <span>{t("upload.watermark")}</span>
                <div className="flex items-center gap-2">
                  <Switch
                    id="upload-watermark"
                    checked={watermarked}
                    onCheckedChange={setWatermarked}
                  />
                </div>
              </Label>
              <p className="text-[11px] text-muted-foreground">
                {watermarked ? "✓" : "—"}
              </p>
            </div>
          </div>

          {/* EXIF collapsible */}
          <Collapsible open={exifOpen} onOpenChange={setExifOpen} className="rounded-lg border border-border/60 bg-muted/20">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium hover:bg-muted/40 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-rose-500" />
                  {t("upload.exif")}
                  {hasExifData && (
                    <Badge variant="secondary" className="text-[10px]">
                      {Object.values(exif).filter((v) => v.trim()).length}
                    </Badge>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {exifOpen ? t("common.close") : t("common.edit")}
                </span>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 pb-3 pt-1">
              <p className="text-[11px] text-muted-foreground mb-2.5 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {t("upload.exifHint")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="exif-camera" className="text-[11px]">{t("upload.exifCamera")}</Label>
                  <Input
                    id="exif-camera"
                    value={exif.camera}
                    onChange={(e) => setExif((p) => ({ ...p, camera: e.target.value }))}
                    placeholder="Canon EOS R5"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="exif-lens" className="text-[11px]">{t("upload.exifLens")}</Label>
                  <Input
                    id="exif-lens"
                    value={exif.lens}
                    onChange={(e) => setExif((p) => ({ ...p, lens: e.target.value }))}
                    placeholder="RF 24-70 f/2.8L"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="exif-focal" className="text-[11px]">{t("upload.exifFocal")}</Label>
                  <Input
                    id="exif-focal"
                    value={exif.focalLength}
                    onChange={(e) => setExif((p) => ({ ...p, focalLength: e.target.value }))}
                    placeholder="35mm"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="exif-aperture" className="text-[11px]">{t("upload.exifAperture")}</Label>
                  <Input
                    id="exif-aperture"
                    value={exif.aperture}
                    onChange={(e) => setExif((p) => ({ ...p, aperture: e.target.value }))}
                    placeholder="2.8"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="exif-shutter" className="text-[11px]">{t("upload.exifShutter")}</Label>
                  <Input
                    id="exif-shutter"
                    value={exif.shutterSpeed}
                    onChange={(e) => setExif((p) => ({ ...p, shutterSpeed: e.target.value }))}
                    placeholder="1/250"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="exif-iso" className="text-[11px]">{t("upload.exifIso")}</Label>
                  <Input
                    id="exif-iso"
                    value={exif.iso}
                    onChange={(e) => setExif((p) => ({ ...p, iso: e.target.value }))}
                    placeholder="400"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="exif-taken" className="text-[11px]">{t("upload.exifTakenAt")}</Label>
                  <Input
                    id="exif-taken"
                    type="datetime-local"
                    value={exif.takenAt}
                    onChange={(e) => setExif((p) => ({ ...p, takenAt: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

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
