"use client"

import { Aperture, Github, Twitter, Instagram } from "lucide-react"
import { useAppStore } from "@/lib/store"

export function Footer() {
  const setView = useAppStore((s) => s.setView)

  return (
    <footer className="mt-auto border-t border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="h-6 w-6 rounded brand-gradient flex items-center justify-center">
              <Aperture className="h-3 w-3 text-white" />
            </span>
            <span className="font-semibold">Aperture</span>
            <span className="text-muted-foreground hidden sm:inline">
              — Where photographers come alive
            </span>
          </div>

          <nav className="flex items-center gap-5 text-xs text-muted-foreground">
            <button
              onClick={() => setView({ name: "home" })}
              className="hover:text-foreground transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => setView({ name: "tag", tagName: "landscape" })}
              className="hover:text-foreground transition-colors"
            >
              Popular tags
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-foreground transition-colors"
            >
              About
            </a>
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
          © 2026 Aperture · Where photographers come alive.
        </div>
      </div>
    </footer>
  )
}
