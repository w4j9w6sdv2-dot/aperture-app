"use client"

import { motion } from "framer-motion"
import { Aperture, Heart, Globe, Lock, Users, ArrowLeft, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { useT, useI18n } from "@/lib/i18n"

export function AboutView() {
  const setView = useAppStore((s) => s.setView)
  const goBack = useAppStore((s) => s.goBack)
  const openAuth = useAppStore((s) => s.openAuth)
  const t = useT()
  const { locale } = useI18n()

  const values = [
    { icon: Users, title: t("about.value1Title"), desc: t("about.value1Desc") },
    { icon: Lock, title: t("about.value2Title"), desc: t("about.value2Desc") },
    { icon: Globe, title: t("about.value3Title"), desc: t("about.value3Desc") },
    { icon: Heart, title: t("about.value4Title"), desc: t("about.value4Desc") },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Back button */}
      <button
        onClick={() => (useAppStore.getState().history.length > 0 ? goBack() : setView({ name: "home" }))}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{t("photo.back")}</span>
      </button>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl brand-gradient mb-6 shadow-2xl shadow-rose-900/40">
          <Aperture className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">{t("about.title")}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("about.subtitle")}</p>
      </motion.div>

      {/* Story */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-16"
      >
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="h-1 w-8 bg-rose-500 rounded-full" />
          {t("about.storyTitle")}
        </h2>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>{t("about.storyP1")}</p>
          <p>{t("about.storyP2")}</p>
          <p>{t("about.storyP3")}</p>
        </div>
      </motion.section>

      {/* Mission */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-16 p-8 rounded-2xl bg-gradient-to-br from-rose-950/40 via-rose-900/20 to-transparent border border-rose-900/30"
      >
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Heart className="h-6 w-6 text-rose-500" />
          {t("about.missionTitle")}
        </h2>
        <div className="space-y-4 text-foreground/90 leading-relaxed">
          <p>{t("about.missionP1")}</p>
          <p>{t("about.missionP2")}</p>
        </div>
      </motion.section>

      {/* Values */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-16"
      >
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
          <span className="h-1 w-8 bg-rose-500 rounded-full" />
          {t("about.valuesTitle")}
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {values.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
              className="p-5 rounded-xl border border-border/60 bg-card/40 hover:border-rose-900/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Founder */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mb-16"
      >
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
          <span className="h-1 w-8 bg-rose-500 rounded-full" />
          {t("about.founderTitle")}
        </h2>

        <div className="p-6 rounded-2xl border border-border/60 bg-card/40">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar with initial */}
            <div className="h-20 w-20 rounded-full brand-gradient flex items-center justify-center shrink-0 shadow-lg shadow-rose-900/40">
              <span className="text-3xl font-bold text-white">A</span>
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-bold">{t("about.founderName")}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4 leading-relaxed">{t("about.founderBio")}</p>

              <blockquote className="relative pl-5 border-l-2 border-rose-500 italic text-foreground/90">
                <Quote className="absolute -left-2 -top-2 h-4 w-4 text-rose-500/50" />
                <p className="text-base">"{t("about.founderQuote")}"</p>
              </blockquote>
            </div>
          </div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="text-center p-8 sm:p-12 rounded-2xl bg-gradient-to-br from-rose-950/40 via-rose-900/20 to-transparent border border-rose-900/30"
      >
        <h2 className="text-2xl font-bold mb-3">{t("about.ctaTitle")}</h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">{t("about.ctaDesc")}</p>
        <Button
          onClick={() => openAuth("signup")}
          size="lg"
          className="bg-rose-600 hover:bg-rose-700 text-white border-rose-600"
        >
          {t("about.ctaButton")}
        </Button>
      </motion.section>
    </div>
  )
}
