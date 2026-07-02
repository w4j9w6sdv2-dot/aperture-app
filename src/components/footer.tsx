"use client"

import { Github, Twitter, Instagram } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { Logo } from "@/components/logo"
import { useT } from "@/lib/i18n"

export function Footer() {
  const setView = useAppStore((s) => s.setView)
  const t = useT()

  return (
    <footer className="mt-auto border-t border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Logo size="sm" showWordmark={true} />
            <span className="text-muted-foreground hidden sm:inline">
              — {t("footer.tagline")}
            </span>
          </div>

          <nav className="flex items-center gap-5 text-xs text-muted-foreground">
            <button
              onClick={() => setView({ name: "home" })}
              className="hover:text-foreground transition-colors"
            >
              {t("footer.home")}
            </button>
            <button
              onClick={() => setView({ name: "tag", tagName: "landscape" })}
              className="hover:text-foreground transition-colors"
            >
              {t("footer.popularTags")}
            </button>
            <button
              onClick={() => setView({ name: "about" })}
              className="hover:text-foreground transition-colors"
            >
              {t("footer.about")}
            </button>
          </nav>

          <div className="flex items-center gap-3 text-muted-foreground">
            <a href="https://github.com" target="_blank" rel="noreferrer noopener" aria-label="GitHub" className="hover:text-foreground">
              <Github className="h-4 w-4" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer noopener" aria-label="Twitter" className="hover:text-foreground">
              <Twitter className="h-4 w-4" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer noopener" aria-label="Instagram" className="hover:text-foreground">
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  )
}
