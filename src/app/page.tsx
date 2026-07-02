"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Aperture, Sparkles } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AuthModal } from "@/components/auth-modal"
import { UploadModal } from "@/components/upload-modal"
import { FeedView } from "@/components/feed-view"
import { PhotoDetailView } from "@/components/photo-detail-view"
import { Button } from "@/components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import { useT } from "@/lib/i18n"

type View = { name: "home" } | { name: "photo"; photoId: string }

export default function Home() {
  const t = useT()
  const { data: session } = useSession()
  const qc = useQueryClient()
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [view, setView] = useState<View>({ name: "home" })

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  const handleUploaded = () => {
    qc.invalidateQueries({ queryKey: ["photos", "feed"] })
  }

  const openPhoto = (photoId: string) => {
    setView({ name: "photo", photoId })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const goHome = () => setView({ name: "home" })

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        onAuthOpen={openAuth}
        onUploadOpen={() => setUploadOpen(true)}
      />

      <main className="flex-1 w-full">
        {view.name === "photo" ? (
          <PhotoDetailView
            photoId={view.photoId}
            onBack={goHome}
            onAuthOpen={openAuth}
          />
        ) : (
          <>
            {/* Hero section (compact) — only when not logged in */}
            {!session?.user && (
              <section className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-20 text-center">
                <div className="flex justify-center mb-6">
                  <div className="h-20 w-20 rounded-2xl bg-[#E60023] flex items-center justify-center shadow-2xl shadow-red-900/30">
                    <Aperture className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-4">
                  Aperture
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-2">
                  {t("footer.tagline")}
                </p>
                <p className="text-sm text-muted-foreground/70 mb-10">
                  Features 1-4/12: Authentication · Upload · Feed · Like + Comments
                </p>

                <div className="space-y-6">
                  <p className="text-base text-muted-foreground max-w-md mx-auto">
                    {t("auth.signupSubtitle")}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                      size="lg"
                      onClick={() => openAuth("signup")}
                      className="bg-[#E60023] hover:bg-[#AD081B] text-white border-[#E60023] rounded-full px-8"
                    >
                      {t("about.ctaButton")}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => openAuth("login")}
                      className="border-border/60 hover:border-foreground/40 rounded-full px-8"
                    >
                      {t("header.login")}
                    </Button>
                  </div>
                </div>
              </section>
            )}

            {/* Feed — always visible */}
            <FeedView onPhotoClick={openPhoto} />

            {/* Compact welcome strip when logged in */}
            {session?.user && (
              <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-8 -mt-4">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>
                    Welcome back, {session.user.name || session.user.username} — features 5-12 coming soon
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onModeChange={setAuthMode}
      />

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploaded}
      />
    </div>
  )
}
