"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MainNav } from "@/components/main-nav"
import { FeedView } from "@/components/feed-view"
import { PhotoDetailView } from "@/components/photo-detail-view"
import { UploadModal } from "@/components/upload-modal"
import { ProfileView } from "@/components/profile-view"
import { SearchView } from "@/components/search-view"
import { TagView } from "@/components/tag-view"
import { AboutView } from "@/components/about-view"
import { ContestsView } from "@/components/contests-view"
import { ContestDetailView } from "@/components/contest-detail-view"
import { CollectionsView } from "@/components/collections-view"
import { CollectionDetailView } from "@/components/collection-detail-view"
import { DashboardView } from "@/components/dashboard-view"
import { EditorPicksView } from "@/components/editor-picks-view"
import { NotificationsView } from "@/components/notifications-view"
import { CategoryView } from "@/components/category-view"
import { AuthModal } from "@/components/auth-modal"
import { useAppStore } from "@/lib/store"

function viewKey(v: ReturnType<typeof useAppStore.getState>["view"]): string {
  switch (v.name) {
    case "photo":
      return `photo:${v.photoId}`
    case "profile":
      return `profile:${v.userId}`
    case "tag":
      return `tag:${v.tagName}`
    case "search":
      return `search:${v.query}`
    case "contest":
      return `contest:${v.contestId}`
    case "collection":
      return `collection:${v.collectionId}`
    case "category":
      return `category:${v.categorySlug}`
    default:
      return v.name
  }
}

export default function Home() {
  const view = useAppStore((s) => s.view)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <MainNav />

      <main className="flex-1 w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewKey(view)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {view.name === "home" && <FeedView />}
              {view.name === "photo" && <PhotoDetailView />}
              {view.name === "profile" && <ProfileView />}
              {view.name === "search" && <SearchView />}
              {view.name === "tag" && <TagView />}
              {view.name === "about" && <AboutView />}
              {view.name === "contests" && <ContestsView />}
              {view.name === "contest" && <ContestDetailView />}
              {view.name === "collections" && <CollectionsView />}
              {view.name === "collection" && <CollectionDetailView />}
              {view.name === "dashboard" && <DashboardView />}
              {view.name === "editor-picks" && <EditorPicksView />}
              {view.name === "notifications" && <NotificationsView />}
              {view.name === "category" && <CategoryView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Footer />

      {/* Modals */}
      <UploadModal />
      <AuthModal />
    </div>
  )
}
