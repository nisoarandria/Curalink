import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function RegisterPatientPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const navigate = useNavigate()

  // État du formulaire
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    adresse: "",
    sexe: "M",
    dateNaissance: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    // Validation basique de l'étape 1
    if (
      !formData.nom ||
      !formData.prenom ||
      !formData.telephone ||
      !formData.adresse ||
      !formData.sexe ||
      !formData.dateNaissance ||
      !formData.email
    ) {
      return
    }
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation basique de l'étape 2
    if (!formData.password || formData.password !== formData.confirmPassword) {
      alert("Les mots de passe ne correspondent pas.")
      return
    }

    setLoading(true)
    // Simulation d'appel API
    await new Promise((r) => setTimeout(r, 1000))
    setLoading(false)
    
    // Redirection vers le dashboard patient après inscription
    navigate("/patient")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Inscription Patient</CardTitle>
          <CardDescription>
            Créez votre dossier médical numérique en quelques étapes
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Stepper design */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className={`h-2.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-12 bg-primary' : 'w-4 bg-primary/40'}`} />
            <div className={`h-2.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-12 bg-primary' : 'w-4 bg-muted'}`} />
          </div>

          <form id="register-form" onSubmit={step === 1 ? handleNext : handleSubmit}>
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input
                      id="nom"
                      name="nom"
                      placeholder="Votre nom"
                      value={formData.nom}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input
                      id="prenom"
                      name="prenom"
                      placeholder="Votre prénom"
                      value={formData.prenom}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sexe">Sexe</Label>
                    <select
                      id="sexe"
                      name="sexe"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.sexe}
                      onChange={handleChange}
                      required
                    >
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateNaissance">Date de naissance</Label>
                    <Input
                      id="dateNaissance"
                      name="dateNaissance"
                      type="date"
                      value={formData.dateNaissance}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    name="telephone"
                    type="tel"
                    placeholder="+261 34 00 000 00"
                    value={formData.telephone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adresse">Adresse complète</Label>
                  <Input
                    id="adresse"
                    name="adresse"
                    placeholder="Lot, Quartier, Ville"
                    value={formData.adresse}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Adresse e-mail</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <div className="flex w-full justify-between gap-4">
            {step === 2 && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Retour
              </Button>
            )}
            <Button
              type="submit"
              form="register-form"
              className="w-full"
              disabled={loading}
            >
              {loading
                ? "Création en cours..."
                : step === 1
                ? "Suivant"
                : "Terminer l'inscription"}
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}