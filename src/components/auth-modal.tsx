"use client"

import { useState } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Loader2, Aperture } from "lucide-react"
import { useT } from "@/lib/i18n"
import { toast } from "sonner"

interface AuthModalProps {
  open: boolean
  mode: "login" | "signup"
  onClose: () => void
  onModeChange: (mode: "login" | "signup") => void
}

export function AuthModal({ open, mode, onClose, onModeChange }: AuthModalProps) {
  const t = useT()
  const { data: session } = useSession()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setUsername("")
    setEmail("")
    setPassword("")
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === "signup") {
        // Register
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || t("common.error"))
          setLoading(false)
          return
        }
        // Auto-login after signup
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })
        if (result?.error) {
          setError(t("auth.invalidCredentials"))
          setLoading(false)
          return
        }
        toast.success(t("toast.welcome"))
        handleClose()
      } else {
        // Login
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })
        if (result?.error) {
          setError(t("auth.invalidCredentials"))
          setLoading(false)
          return
        }
        toast.success(t("toast.welcome"))
        handleClose()
      }
    } catch (err) {
      setError(t("common.error"))
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-xl bg-[#E60023] flex items-center justify-center shadow-lg shadow-red-900/30">
              <Aperture className="h-6 w-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            {mode === "login" ? t("auth.loginTitle") : t("auth.signupTitle")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {mode === "login" ? t("auth.loginSubtitle") : t("auth.signupSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="username">{t("auth.username")}</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("auth.usernamePlaceholder")}
                required
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_]+"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.passwordPlaceholder")}
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-sm text-[#E60023] text-center bg-[#E60023]/10 rounded-md py-2 px-3">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E60023] hover:bg-[#AD081B] text-white border-[#E60023]"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === "login" ? t("auth.loginSubmit") : t("auth.signupSubmit")}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              {t("auth.toggleToSignup").split("Don't have an account?")[0] || t("auth.toggleToSignup").split("Non hai un account?")[0]}{" "}
              <button
                onClick={() => {
                  resetForm()
                  onModeChange("signup")
                }}
                className="text-[#E60023] hover:underline font-medium"
              >
                {mode === "login" ? t("header.signup") : t("header.login")}
              </button>
            </>
          ) : (
            <>
              {t("auth.toggleToLogin").split("Already have an account?")[0] || t("auth.toggleToLogin").split("Hai già un account?")[0]}{" "}
              <button
                onClick={() => {
                  resetForm()
                  onModeChange("login")
                }}
                className="text-[#E60023] hover:underline font-medium"
              >
                {mode === "login" ? t("header.signup") : t("header.login")}
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
