"use client"

import { useState } from "react"

import { Loader2, Aperture, Mail, Lock, User as UserIcon } from "lucide-react"
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAppStore } from "@/lib/store"
import { useLogin, useRegister } from "@/lib/api"
import { useT } from "@/lib/i18n"
import { toast } from "sonner"

export function AuthModal() {
  const open = useAppStore((s) => s.authOpen)
  const mode = useAppStore((s) => s.authMode)
  const closeAuth = useAppStore((s) => s.closeAuth)
  const setMode = (m: "login" | "signup") =>
    useAppStore.setState({ authMode: m })

  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [signupForm, setSignupForm] = useState({
    username: "",
    email: "",
    password: "",
  })
  const loginMut = useLogin()
  const registerMut = useRegister()
  const t = useT()

  const onLogin = (e: React.FormEvent) => {
    e.preventDefault()
    loginMut.mutate(loginForm, {
      onSuccess: () => {
        toast.success(t("toast.welcomeBack"))
        closeAuth()
        setLoginForm({ email: "", password: "" })
      },
      onError: (err) => toast.error(err.message),
    })
  }

  const onSignup = (e: React.FormEvent) => {
    e.preventDefault()
    registerMut.mutate(signupForm, {
      onSuccess: async () => {
        // auto-login after signup
        loginMut.mutate(
          { email: signupForm.email, password: signupForm.password },
          {
            onSuccess: () => {
              toast.success(t("toast.welcome"))
              closeAuth()
              setSignupForm({ username: "", email: "", password: "" })
            },
            onError: (err) =>
              toast.error(t("toast.signupFailed", { error: err.message })),
          }
        )
      },
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeAuth()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="brand-gradient h-1.5" />
        <DialogHeader className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-md brand-gradient flex items-center justify-center">
              <Aperture className="h-4 w-4 text-white" />
            </span>
            <DialogTitle className="text-xl">Aperture</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            {t("auth.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "login" | "signup")}
          className="px-6 pb-6"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">{t("header.login")}</TabsTrigger>
            <TabsTrigger value="signup">{t("header.signup")}</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <TabsContent value="login" forceMount>
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  onSubmit={onLogin}
                  className="space-y-3"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email">{t("auth.email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={loginForm.email}
                        onChange={(e) =>
                          setLoginForm((f) => ({ ...f, email: e.target.value }))
                        }
                        className="pl-9"
                        placeholder={t("auth.emailPlaceholder")}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-password">{t("auth.password")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm((f) => ({ ...f, password: e.target.value }))
                        }
                        className="pl-9"
                        placeholder={t("auth.passwordPlaceholder")}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#E60023] hover:bg-[#AD081B] text-white"
                    disabled={loginMut.isPending}
                  >
                    {loginMut.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("auth.loginSubmit")
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground pt-2">
                    {t("auth.demoHintText")}
                    <br />
                    <code className="text-rose-400">mara_lens@demo.com</code> · {t("auth.demoPassword")}{" "}
                    <code className="text-rose-400">password123</code>
                  </p>
                </motion.form>
              </TabsContent>
            ) : (
              <TabsContent value="signup" forceMount>
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  onSubmit={onSignup}
                  className="space-y-3"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-username">{t("auth.username")}</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-username"
                        type="text"
                        required
                        minLength={3}
                        maxLength={20}
                        pattern="[a-zA-Z0-9_]+"
                        value={signupForm.username}
                        onChange={(e) =>
                          setSignupForm((f) => ({ ...f, username: e.target.value }))
                        }
                        className="pl-9"
                        placeholder={t("auth.usernamePlaceholder")}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email">{t("auth.email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={signupForm.email}
                        onChange={(e) =>
                          setSignupForm((f) => ({ ...f, email: e.target.value }))
                        }
                        className="pl-9"
                        placeholder={t("auth.emailPlaceholder")}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password">{t("auth.password")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={6}
                        value={signupForm.password}
                        onChange={(e) =>
                          setSignupForm((f) => ({ ...f, password: e.target.value }))
                        }
                        className="pl-9"
                        placeholder={t("auth.passwordMinLength")}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#E60023] hover:bg-[#AD081B] text-white"
                    disabled={registerMut.isPending || loginMut.isPending}
                  >
                    {registerMut.isPending || loginMut.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("auth.signupSubmit")
                    )}
                  </Button>
                </motion.form>
              </TabsContent>
            )}
          </AnimatePresence>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
