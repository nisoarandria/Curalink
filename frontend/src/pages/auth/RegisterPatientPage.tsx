import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { PageLoader } from "@/components/ui/page-loader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircleIcon,
  Icon,
  SpinnerIcon,
  UserAdd01Icon,
  ViewIcon,
  ViewOffIcon,
} from "@/components/ui/icon";
import { useAuth } from "@/hooks/useAuth";
import {
  completePatientRegistration,
  getPatientRegistrationErrorMessage,
} from "@/services/patientRegistrationApi";

export default function RegisterPatientPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const navigate = useNavigate();
  const { login } = useAuth();

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
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "password" || name === "confirmPassword") {
      setPasswordError(null);
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
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
      return;
    }
    setStep(2);
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!formData.password || formData.password !== formData.confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const session = await completePatientRegistration(formData);
      login({
        accessToken: session.accessToken,
        tokenType: session.tokenType,
        expiresAt: session.expiresAt,
        user: session.user,
      });
      navigate("/patient");
    } catch (error) {
      setSubmitError(getPatientRegistrationErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <PageLoader
      show={loading}
      message="Création de votre compte"
      description="Préparation de votre espace patient…"
    />
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50/80 p-4 font-sans text-foreground">
      {/* Decorative elements to match the hero section */}
      <div className="absolute top-10 left-10 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl"></div>
      <div className="absolute bottom-10 right-10 -z-10 h-72 w-72 rounded-full bg-secondary/10 blur-3xl"></div>

      <Logo href="/" size="sm" className="absolute top-8 left-8" />

      <Card className="w-full max-w-lg z-10 shadow-lg border-border/50">
        <CardHeader className="space-y-2 pb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
            <Icon icon={UserAdd01Icon} className="size-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Inscription Patient
          </CardTitle>
          <CardDescription className="text-base">
            Créez votre dossier médical numérique en quelques étapes
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Stepper design */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div
              className={`h-2.5 rounded-full transition-all duration-300 ${step === 1 ? "w-12 bg-primary" : "w-4 bg-primary/40"}`}
            />
            <div
              className={`h-2.5 rounded-full transition-all duration-300 ${step === 2 ? "w-12 bg-primary" : "w-4 bg-muted"}`}
            />
          </div>

          <form
            id="register-form"
            onSubmit={step === 1 ? handleNext : handleSubmit}
          >
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
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                      className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <Icon icon={ViewOffIcon} className="size-[18px]" />
                      ) : (
                        <Icon icon={ViewIcon} className="size-[18px]" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    8 caractères minimum, avec majuscule, minuscule, chiffre et
                    caractère spécial.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={
                        showConfirmPassword
                          ? "Masquer la confirmation"
                          : "Afficher la confirmation"
                      }
                      className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? (
                        <Icon icon={ViewOffIcon} className="size-[18px]" />
                      ) : (
                        <Icon icon={ViewIcon} className="size-[18px]" />
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                  )}
                </div>

                {submitError && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <Icon icon={AlertCircleIcon} className="mt-0.5 size-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="shrink-0 text-base font-semibold"
                    onClick={() => setStep(1)}
                    disabled={loading}
                  >
                    Retour
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 text-base font-semibold"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <SpinnerIcon className="size-5" />
                        Création en cours...
                      </span>
                    ) : (
                      "Terminer l'inscription"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pb-8 pt-0">
          {step === 1 && (
            <Button
              type="submit"
              form="register-form"
              className="w-full text-base font-semibold"
              size="lg"
              disabled={loading}
            >
              Suivant
            </Button>
          )}

          <div className="text-center text-sm text-muted-foreground mt-2">
            Vous avez déjà un compte ?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline underline-offset-4">
              Se connecter
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
    </>
  );
}
