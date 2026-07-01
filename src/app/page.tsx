"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FeedView } from "@/components/feed-view"
import { PhotoDetailView } from "@/components/photo-detail-view"
import { UploadModal } from "@/components/upload-modal"
import { ProfileView } from "@/components/profile-view"
import { SearchView } from "@/components/search-view"
import { TagView } from "@/components/tag-view"
import { AboutView } from "@/components/about-view"
import { AuthModal } from "@/components/auth-modal"
import { useAppStore } from "@/lib/store"

export default function Home() {
  const view = useAppStore((s) => s.view)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={view.name + (view.name === "photo" ? (view as { photoId: string }).photoId : view.name === "profile" ? (view as { userId: string }).userId : view.name === "tag" ? (view as { tagName: string }).tagName : view.name === "search" ? (view as { query: string }).query : "")}
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
