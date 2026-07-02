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
import { ProfileView } from "@/components/profile-view"
import { SearchView } from "@/components/search-view"
import { CategoryView } from "@/components/category-view"
import { CollectionsView } from "@/components/collections-view"
import { CollectionDetailView } from "@/components/collection-detail-view"
import { ContestsView } from "@/components/contests-view"
import { ContestDetailView } from "@/components/contest-detail-view"
import { NSFWGate } from "@/components/nsfw-gate"
import { Button } from "@/components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import { useT } from "@/lib/i18n"

type View =
  | { name: "home" }
  | { name: "photo"; photoId: string }
  | { name: "profile"; userId: string }
  | { name: "search"; query: string }
  | { name: "category"; slug: string }
  | { name: "collections" }
  | { name: "collection"; collectionId: string }
  | { name: "contests" }
  | { name: "contest"; contestId: string }

export default function Home() {
  const t = useT()
  const { data: session } = useSession()
  const qc = useQueryClient()
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [view, setView] = useState<View>({ name: "home" })
  const [searchQuery, setSearchQuery] = useState("")
  const [nsfwGateOpen, setNsfwGateOpen] = useState(false)
  const [pendingCategorySlug, setPendingCategorySlug] = useState<string | null>(null)

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

  const openProfile = (userId: string) => {
    setView({ name: "profile", userId })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const openSearch = (query: string) => {
    setSearchQuery(query)
    setView({ name: "search", query })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const openCategory = (slug: string) => {
    setView({ name: "category", slug })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const openCollections = () => {
    setView({ name: "collections" })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const openCollection = (collectionId: string) => {
    setView({ name: "collection", collectionId })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const openContests = () => {
    setView({ name: "contests" })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const openContest = (contestId: string) => {
    setView({ name: "contest", contestId })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const openAdultGate = () => {
    setNsfwGateOpen(true)
  }

  const handleNsfwEnabled = () => {
    qc.invalidateQueries({ queryKey: ["categories"] })
    qc.invalidateQueries({ queryKey: ["photos"] })
    if (pendingCategorySlug) {
      setView({ name: "category", slug: pendingCategorySlug })
      setPendingCategorySlug(null)
    }
  }

  const goHome = () => {
    setView({ name: "home" })
    setSearchQuery("")
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        onAuthOpen={openAuth}
        onUploadOpen={() => setUploadOpen(true)}
        onProfileClick={() => session?.user?.id && openProfile(session.user.id)}
        onSearch={openSearch}
        onCategoryClick={openCategory}
        onHomeClick={goHome}
        onCollectionsClick={openCollections}
        onContestsClick={openContests}
      />

      <main className="flex-1 w-full">
        {view.name === "photo" ? (
          <PhotoDetailView
            photoId={view.photoId}
            onBack={goHome}
            onAuthOpen={openAuth}
            onAuthorClick={openProfile}
          />
        ) : view.name === "profile" ? (
          <ProfileView
            userId={view.userId}
            onBack={goHome}
            onPhotoClick={openPhoto}
          />
        ) : view.name === "search" ? (
          <SearchView
            query={searchQuery}
            onQueryChange={(q) => {
              setSearchQuery(q)
              if (q.trim()) {
                setView({ name: "search", query: q })
              } else {
                goHome()
              }
            }}
            onPhotoClick={openPhoto}
            onAuthorClick={openProfile}
          />
        ) : view.name === "category" ? (
          <CategoryView
            slug={view.slug}
            onBack={goHome}
            onPhotoClick={openPhoto}
            onAuthorClick={openProfile}
            onAdultGate={openAdultGate}
          />
        ) : view.name === "collections" ? (
          <CollectionsView onCollectionClick={openCollection} />
        ) : view.name === "collection" ? (
          <CollectionDetailView
            collectionId={view.collectionId}
            onBack={openCollections}
            onPhotoClick={openPhoto}
            onAuthorClick={openProfile}
          />
        ) : view.name === "contests" ? (
          <ContestsView onContestClick={openContest} />
        ) : view.name === "contest" ? (
          <ContestDetailView
            contestId={view.contestId}
            onBack={openContests}
            onPhotoClick={openPhoto}
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
            <FeedView onPhotoClick={openPhoto} onAuthorClick={openProfile} />

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

      <NSFWGate
        open={nsfwGateOpen}
        onClose={() => setNsfwGateOpen(false)}
        onEnabled={handleNsfwEnabled}
      />
    </div>
  )
}
