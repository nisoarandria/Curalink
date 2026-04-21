import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
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

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // TODO: logique d'authentification
    await new Promise((r) => setTimeout(r, 1000))
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold">Connexion</CardTitle>
          <CardDescription>
            Entrez vos identifiants pour accéder à votre compte
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                
                  <a href="#"
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  Oublié ?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full mt-4" disabled={loading}>
              {loading ? "Connexion…" : "Se connecter"}
            </Button>
            <div className="flex w-full flex-wrap justify-center gap-2">
              <Link to="/medecin">
                <Button type="button" variant="outline" size="sm">
                  Accès médecin
                </Button>
              </Link>
              <Link to="/patient">
                <Button type="button" variant="outline" size="sm">
                  Accès patient
                </Button>
              </Link>
              <Link to="/nutritionniste">
                <Button type="button" variant="outline" size="sm">
                  Accès nutritionniste
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Pas encore de compte ?{" "}
              
               <Link to="/register/patient"
                className="text-foreground underline underline-offset-4 hover:text-primary"
              >
                S'inscrire</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}