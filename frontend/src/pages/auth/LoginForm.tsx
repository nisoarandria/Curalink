import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { PageLoader } from "@/components/ui/page-loader"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getDefaultPathByRole } from "@/lib/auth"
import { useAuth } from "@/hooks/useAuth"
import {
  AlertCircleIcon,
  Icon,
  Login01Icon,
  SpinnerIcon,
  ViewIcon,
  ViewOffIcon,
} from "@/components/ui/icon"

export default function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const env = import.meta.env as Record<string, string | undefined>
      const baseUrl = env.VITE_BACKEND_URL ?? env.BACKEND_URL ?? "http://localhost:8080/api"

      const response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setError(data?.message ?? "Email ou mot de passe invalide.")
        return
      }

      const role: string | undefined = data?.user?.userType ?? data?.role ?? data?.user?.role
      login({
        accessToken: data?.accessToken ?? data?.token,
        tokenType: data?.tokenType,
        expiresAt: data?.expiresAt,
        user: data?.user,
      })
      navigate(getDefaultPathByRole(role))
    } catch {
      setError("Impossible de se connecter au serveur. Vérifie que le backend est démarré.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <PageLoader
      show={loading}
      message="Connexion en cours"
      description="Préparation de votre espace personnel…"
    />
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50/80 p-4 font-sans text-foreground">
      {/* Decorative elements to match the hero section of the home page */}
      <div className="absolute top-10 left-10 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl"></div>
      <div className="absolute bottom-10 right-10 -z-10 h-72 w-72 rounded-full bg-secondary/10 blur-3xl"></div>

      <Logo href="/" size="sm" className="absolute top-8 left-8" />

      <div className="w-full max-w-md z-10">
          <Card className="w-full shadow-lg border-border/50">
            <CardHeader className="space-y-2 pb-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
                <Icon icon={Login01Icon} className="size-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">Content de vous revoir</CardTitle>
              <CardDescription className="text-base">
                Connectez-vous à votre espace personnel
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse e-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2 pb-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mot de passe</Label>
                    <a href="#" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                      Mot de passe oublié ?
                    </a>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <Icon icon={ViewOffIcon} className="size-[18px]" />
                      ) : (
                        <Icon icon={ViewIcon} className="size-[18px]" />
                      )}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive mt-4">
                    <Icon icon={AlertCircleIcon} className="size-4" />
                    {error}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-4 pb-8 pt-0">
                <Button type="submit" size="lg" className="w-full text-base font-semibold" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <SpinnerIcon className="size-5" />
                      Connexion en cours…
                    </span>
                  ) : "Se connecter"}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  Pas encore de compte ?{" "}
                  <Link to="/register/patient" className="font-semibold text-primary hover:underline underline-offset-4">
                    Créer un compte patient
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
      </div>
    </div>
    </>
  )
}