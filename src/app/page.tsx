"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Aperture, Camera, Sparkles } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AuthModal } from "@/components/auth-modal"
import { Button } from "@/components/ui/button"
import { useT } from "@/lib/i18n"

export default function Home() {
  const t = useT()
  const { data: session } = useSession()
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup")

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAuthOpen={openAuth} />

      <main className="flex-1 w-full flex items-center justify-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          {/* Hero logo */}
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
            Feature 1/12: Authentication
          </p>

          {session?.user ? (
            // Logged in state
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E60023]/10 border border-[#E60023]/20">
                <span className="h-2 w-2 rounded-full bg-[#E60023] animate-pulse" />
                <span className="text-sm font-medium text-[#E60023]">
                  {t("toast.welcome")}, {session.user.name || session.user.username}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {session.user.email}
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-6">
                <Sparkles className="h-3.5 w-3.5" />
                <span>More features coming soon...</span>
              </div>
            </div>
          ) : (
            // Anonymous state — CTA to sign up
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

              {/* Feature preview cards */}
              <div className="grid grid-cols-3 gap-3 mt-12 max-w-md mx-auto">
                {[
                  { icon: Camera, label: "Photos" },
                  { icon: Sparkles, label: "Community" },
                  { icon: Aperture, label: "Stories" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1.5 p-4 rounded-xl border border-border/40 bg-card/40"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onModeChange={setAuthMode}
      />
    </div>
  )
}
