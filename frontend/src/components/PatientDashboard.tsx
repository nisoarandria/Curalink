import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import CalendarView from "./CalendarView"
import { PatientRecordView } from "./PatientMedicalRecord"
import type { PatientRecord } from "./PatientMedicalRecord"
import { useAuth } from "@/hooks/useAuth"
import { logoutRequest } from "@/services/axiosInstance"
import {
  fetchServices,
  fetchMedecinsByService,
  fetchMedecinDisponibilites,
  fetchServiceDisponibilites,
  createRendezVous,
  type ServiceOption,
  type MedecinOption,
  type MedecinDisponibilite,
  type ServiceDisponibilite,
} from "@/services/appointmentApi"

type Step = 1 | 2 | 3
type Parcours = "medecin" | "creneau" | null

const today = new Date().toISOString().slice(0, 10)

const mockPatient: PatientRecord = {
  id: "pat-002",
  nom: "Rakoto",
  prenom: "Mamy",
  sexe: "M",
  dateNaissance: "1980-08-02",
  numeroDossier: "DM-2026-205",
  contact: "+261 34 00 000 02",
  adresse: "Fianarantsoa",
  antecedents: [
    { id: "ant-1", label: "Diabète type 2" },
    { id: "ant-2", label: "Hypertension légère" },
    { id: "ant-3", label: "Allergie à la pénicilline" },
    { id: "ant-4", label: "Asthme" },
    { id: "ant-5", label: "Opération de l'appendicite en 2010" }
  ],
  constantes: [
    { id: "v-1", date: "2026-04-19", tension: "12/8", glycemie: "1.45", poids: "78", imc: "27.0" },
    { id: "v-2", date: "2026-03-15", tension: "13/8", glycemie: "1.50", poids: "79", imc: "27.3" },
    { id: "v-3", date: "2026-02-10", tension: "13/9", glycemie: "1.60", poids: "80", imc: "27.7" },
    { id: "v-4", date: "2026-01-05", tension: "14/9", glycemie: "1.70", poids: "81", imc: "28.0" },
    { id: "v-5", date: "2025-12-01", tension: "14/9", glycemie: "1.65", poids: "82", imc: "28.4" }
  ],
  historiqueConsultations: [
    { id: "c-1", date: "2026-04-19", motif: "Bilan trimestriel", diagnostic: "Diabète équilibré partiellement" },
    { id: "c-2", date: "2026-03-15", motif: "Fatigue persistante", diagnostic: "Carence légère en vitamines" },
    { id: "c-3", date: "2026-02-10", motif: "Renouvellement ordonnance", diagnostic: "Diabète type 2" },
    { id: "c-4", date: "2025-10-20", motif: "Maux de tête", diagnostic: "Migraine de tension" },
    { id: "c-5", date: "2025-06-11", motif: "Bilan annuel", diagnostic: "RAS" }
  ],
}

export default function PatientDashboard() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [activeTab, setActiveTab] = useState<"rdv" | "chatbot" | "dossier" | "planning" | "ordonnances">("rdv")
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [symptoms, setSymptoms] = useState("")
  const [aiAnswer, setAiAnswer] = useState("")

  // ── RDV wizard state ───────────────────────────────────────────────
  const [step, setStep] = useState<Step>(1)
  const [parcours, setParcours] = useState<Parcours>(null)

  // Step 1 — services
  const [services, setServices] = useState<ServiceOption[]>([])
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null)
  const [loadingServices, setLoadingServices] = useState(false)

  // Step 2A — par médecin
  const [medecins, setMedecins] = useState<MedecinOption[]>([])
  const [selectedMedecin, setSelectedMedecin] = useState<MedecinOption | null>(null)
  const [medecinSlots, setMedecinSlots] = useState<MedecinDisponibilite[]>([])
  const [selectedSlot, setSelectedSlot] = useState<MedecinDisponibilite | null>(null)
  const [loadingMedecins, setLoadingMedecins] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Step 2B — créneau rapide
  const [quickDate, setQuickDate] = useState(today)
  const [quickSlots, setQuickSlots] = useState<ServiceDisponibilite[]>([])
  const [selectedQuickSlot, setSelectedQuickSlot] = useState<ServiceDisponibilite | null>(null)
  const [loadingQuickSlots, setLoadingQuickSlots] = useState(false)

  // Step 3 — confirmation
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  // ── Charger les services au montage ────────────────────────────────
  useEffect(() => {
    setLoadingServices(true)
    fetchServices()
      .then(setServices)
      .catch(() => setErrorMessage("Impossible de charger les services."))
      .finally(() => setLoadingServices(false))
  }, [])

  // ── Step 1 → Step 2 : choisir un service ──────────────────────────
  const handleSelectService = (svc: ServiceOption) => {
    setSelectedService(svc)
    setParcours(null)
    setSelectedMedecin(null)
    setMedecinSlots([])
    setSelectedSlot(null)
    setSelectedQuickSlot(null)
    setQuickSlots([])
    setSuccessMessage("")
    setErrorMessage("")
    setStep(2)
  }

  // ── Parcours A : charger les médecins du service ───────────────────
  const handleChooseParcoursMedecin = useCallback(async () => {
    if (!selectedService) return
    setParcours("medecin")
    setLoadingMedecins(true)
    try {
      const data = await fetchMedecinsByService(selectedService.id)
      setMedecins(data)
    } catch {
      setErrorMessage("Impossible de charger les médecins.")
    } finally {
      setLoadingMedecins(false)
    }
  }, [selectedService])

  // ── Parcours A : charger les dispos d'un médecin ───────────────────
  const handleSelectMedecin = useCallback(async (med: MedecinOption) => {
    setSelectedMedecin(med)
    setSelectedSlot(null)
    setLoadingSlots(true)
    try {
      const data = await fetchMedecinDisponibilites(med.id)
      setMedecinSlots(data)
    } catch {
      setErrorMessage("Impossible de charger les disponibilités.")
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  // ── Parcours B : charger les créneaux rapides ──────────────────────
  const handleChooseParcoursRapide = () => {
    setParcours("creneau")
    setSelectedQuickSlot(null)
    setQuickSlots([])
  }

  const handleSearchQuickSlots = useCallback(async () => {
    if (!selectedService) return
    setLoadingQuickSlots(true)
    setSelectedQuickSlot(null)
    try {
      const data = await fetchServiceDisponibilites(selectedService.id, quickDate)
      setQuickSlots(data)
    } catch {
      setErrorMessage("Impossible de charger les créneaux.")
    } finally {
      setLoadingQuickSlots(false)
    }
  }, [selectedService, quickDate])

  // ── Step 3 : confirmer le RDV ──────────────────────────────────────
  const handleConfirm = async () => {
    if (!selectedService) return
    setSubmitting(true)
    setErrorMessage("")

    let dateHeure: string
    let medecinId: number

    // heure peut être "08:00" ou "08:00:00" — on normalise en HH:mm:ss
    const normalizeHeure = (h: string) => (h.split(":").length === 2 ? `${h}:00` : h)

    if (parcours === "medecin" && selectedMedecin && selectedSlot) {
      dateHeure = `${selectedSlot.date}T${normalizeHeure(selectedSlot.heure)}`
      medecinId = selectedMedecin.id
    } else if (parcours === "creneau" && selectedQuickSlot) {
      dateHeure = `${quickDate}T${normalizeHeure(selectedQuickSlot.heure)}`
      medecinId = selectedQuickSlot.medecinId
    } else {
      setSubmitting(false)
      return
    }

    try {
      await createRendezVous({
        dateHeure,
        serviceId: selectedService.id,
        medecinId,
      })
      setSuccessMessage("Votre demande de rendez-vous a bien été envoyée !")
      setStep(1)
      setParcours(null)
      setSelectedService(null)
      setSelectedMedecin(null)
      setSelectedSlot(null)
      setSelectedQuickSlot(null)
    } catch {
      setErrorMessage("Erreur lors de la création du rendez-vous.")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────
  const resetWizard = () => {
    setStep(1)
    setParcours(null)
    setSelectedService(null)
    setSelectedMedecin(null)
    setMedecinSlots([])
    setSelectedSlot(null)
    setSelectedQuickSlot(null)
    setQuickSlots([])
    setErrorMessage("")
    setSuccessMessage("")
  }

  const submitAi = () => {
    if (!symptoms.trim()) return
    setAiAnswer(
      "Recommandation IA: une consultation de Médecine générale est conseillée. Vous pouvez prendre rendez-vous ci-dessous."
    )
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logoutRequest()
    } catch {
      // Même en cas d'erreur réseau/API, on nettoie la session côté client.
    } finally {
      logout()
      navigate("/login", { replace: true })
      setIsLoggingOut(false)
    }
  }

  // Résumé pour l'étape 3
  const summaryServiceNom = selectedService?.nom ?? ""
  const summaryMedecinNom =
    parcours === "medecin"
      ? selectedMedecin?.nom ?? ""
      : selectedQuickSlot?.medecinNom ?? ""
  const summaryDate =
    parcours === "medecin" ? selectedSlot?.date ?? "" : quickDate
  const summaryHeure =
    parcours === "medecin"
      ? selectedSlot?.heure ?? ""
      : selectedQuickSlot?.heure ?? ""

  return (
    <div className="min-h-screen bg-muted/20 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Espace patient</CardTitle>
            <CardDescription>Orientation IA, rendez-vous, dossier médical, planning et ordonnances.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant={activeTab === "rdv" ? "default" : "outline"} onClick={() => setActiveTab("rdv")}>
              Prise de rendez-vous
            </Button>
            <Button
              variant={activeTab === "chatbot" ? "default" : "outline"}
              onClick={() => setActiveTab("chatbot")}
            >
              Chatbot IA
            </Button>
            <Button variant={activeTab === "dossier" ? "default" : "outline"} onClick={() => setActiveTab("dossier")}>
              Dossier médical
            </Button>
            <Button
              variant={activeTab === "planning" ? "default" : "outline"}
              onClick={() => setActiveTab("planning")}
            >
              Planning
            </Button>
            <Button
              variant={activeTab === "ordonnances" ? "default" : "outline"}
              onClick={() => setActiveTab("ordonnances")}
            >
              Ordonnances
            </Button>
            <Button variant="destructive" className="ml-auto" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
            </Button>
          </CardContent>
        </Card>

        {activeTab === "rdv" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Prise de rendez-vous</CardTitle>
                  <CardDescription>Étape {step} sur 3</CardDescription>
                </div>
                {step > 1 && (
                  <Button variant="ghost" size="sm" onClick={resetWizard}>
                    Recommencer
                  </Button>
                )}
              </div>
              {/* Barre de progression */}
              <div className="flex gap-1 pt-2">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      s <= step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages */}
              {successMessage && (
                <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  {errorMessage}
                  <Button variant="ghost" size="sm" className="ml-2" onClick={() => setErrorMessage("")}>
                    Fermer
                  </Button>
                </div>
              )}

              {/* ── ÉTAPE 1 : Choisir un service ──────────────────────── */}
              {step === 1 && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Choisissez un service</Label>
                  {loadingServices ? (
                    <p className="text-sm text-muted-foreground">Chargement des services...</p>
                  ) : services.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun service disponible.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {services.map((svc) => (
                        <button
                          key={svc.id}
                          onClick={() => handleSelectService(svc)}
                          className={`rounded-xl border p-4 text-left transition-all hover:border-primary hover:shadow-md ${
                            selectedService?.id === svc.id
                              ? "border-primary bg-primary/5 shadow-md"
                              : "bg-background"
                          }`}
                        >
                          <span className="font-medium">{svc.nom}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── ÉTAPE 2 : Choix du parcours ───────────────────────── */}
              {step === 2 && selectedService && (
                <div className="space-y-4">
                  <div className="rounded-md bg-muted/30 px-3 py-2 text-sm">
                    Service sélectionné : <span className="font-semibold">{selectedService.nom}</span>
                  </div>

                  {/* Choix du parcours */}
                  {!parcours && (
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Comment souhaitez-vous choisir ?</Label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          onClick={handleChooseParcoursMedecin}
                          className="rounded-xl border bg-background p-5 text-left transition-all hover:border-primary hover:shadow-md"
                        >
                          <p className="font-medium">Par médecin</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Choisir un médecin puis voir ses disponibilités
                          </p>
                        </button>
                        <button
                          onClick={handleChooseParcoursRapide}
                          className="rounded-xl border bg-background p-5 text-left transition-all hover:border-primary hover:shadow-md"
                        >
                          <p className="font-medium">Par créneau rapide</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Choisir une date et voir les médecins disponibles
                          </p>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Parcours A : par médecin ─────────────────────── */}
                  {parcours === "medecin" && (
                    <div className="space-y-4">
                      {loadingMedecins ? (
                        <p className="text-sm text-muted-foreground">Chargement des médecins...</p>
                      ) : (
                        <>
                          {/* Liste des médecins */}
                          {!selectedMedecin && (
                            <div className="space-y-3">
                              <Label className="text-base font-semibold">Choisissez un médecin</Label>
                              {medecins.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Aucun médecin disponible pour ce service.</p>
                              ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                  {medecins.map((med) => (
                                    <button
                                      key={med.id}
                                      onClick={() => handleSelectMedecin(med)}
                                      className="rounded-xl border bg-background p-4 text-left transition-all hover:border-primary hover:shadow-md"
                                    >
                                      <p className="font-medium">{med.nom}</p>
                                      <p className="text-sm text-muted-foreground">{med.specialite}</p>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Créneaux du médecin sélectionné */}
                          {selectedMedecin && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Label className="text-base font-semibold">
                                  Disponibilités de {selectedMedecin.nom}
                                </Label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMedecin(null)
                                    setMedecinSlots([])
                                    setSelectedSlot(null)
                                  }}
                                >
                                  Changer
                                </Button>
                              </div>
                              {loadingSlots ? (
                                <p className="text-sm text-muted-foreground">Chargement des créneaux...</p>
                              ) : medecinSlots.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Aucun créneau disponible.</p>
                              ) : (
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                  {medecinSlots.map((slot, i) => (
                                    <button
                                      key={`${slot.date}-${slot.heure}-${i}`}
                                      onClick={() => {
                                        setSelectedSlot(slot)
                                        setStep(3)
                                      }}
                                      className={`rounded-lg border px-4 py-3 text-left text-sm transition-all hover:border-primary ${
                                        selectedSlot === slot ? "border-primary bg-primary/5" : "bg-background"
                                      }`}
                                    >
                                      <p className="font-medium">{slot.date}</p>
                                      <p className="text-muted-foreground">{slot.heure}</p>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* ── Parcours B : créneau rapide ──────────────────── */}
                  {parcours === "creneau" && (
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Choisissez une date</Label>
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <Input
                            type="date"
                            value={quickDate}
                            min={today}
                            onChange={(e) => setQuickDate(e.target.value)}
                          />
                        </div>
                        <Button onClick={handleSearchQuickSlots} disabled={loadingQuickSlots}>
                          {loadingQuickSlots ? "Recherche..." : "Rechercher"}
                        </Button>
                      </div>

                      {quickSlots.length > 0 && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">
                            {quickSlots.length} créneau{quickSlots.length > 1 ? "x" : ""} disponible{quickSlots.length > 1 ? "s" : ""} le {quickDate}
                          </Label>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {quickSlots.map((slot, i) => (
                              <button
                                key={`${slot.medecinId}-${slot.heure}-${i}`}
                                onClick={() => {
                                  setSelectedQuickSlot(slot)
                                  setStep(3)
                                }}
                                className={`rounded-lg border px-4 py-3 text-left text-sm transition-all hover:border-primary ${
                                  selectedQuickSlot === slot ? "border-primary bg-primary/5" : "bg-background"
                                }`}
                              >
                                <p className="font-medium">{slot.heure}</p>
                                <p className="text-muted-foreground">{slot.medecinNom}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {!loadingQuickSlots && quickSlots.length === 0 && quickDate && parcours === "creneau" && (
                        <p className="text-sm text-muted-foreground">
                          Cliquez sur "Rechercher" pour voir les créneaux disponibles.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Bouton retour */}
                  <Button variant="outline" onClick={() => { setStep(1); setParcours(null) }}>
                    Retour
                  </Button>
                </div>
              )}

              {/* ── ÉTAPE 3 : Confirmation ────────────────────────────── */}
              {step === 3 && (
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Récapitulatif de votre rendez-vous</Label>
                  <div className="rounded-xl border bg-muted/20 p-5 space-y-2">
                    <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Service :</span>{" "}
                        <span className="font-medium">{summaryServiceNom}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Médecin :</span>{" "}
                        <span className="font-medium">{summaryMedecinNom}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date :</span>{" "}
                        <span className="font-medium">{summaryDate}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Heure :</span>{" "}
                        <span className="font-medium">{summaryHeure}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      Retour
                    </Button>
                    <Button onClick={handleConfirm} disabled={submitting}>
                      {submitting ? "Envoi en cours..." : "Confirmer la demande"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "chatbot" && (
          <Card>
            <CardHeader>
              <CardTitle>Chatbot IA</CardTitle>
              <CardDescription>Saisir les symptômes puis générer une recommandation de service.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Décrivez vos symptômes..."
              />
              <Button onClick={submitAi}>Envoyer</Button>
              {aiAnswer && (
                <Card>
                  <CardContent className="space-y-3 pt-6">
                    <p className="text-sm">{aiAnswer}</p>
                    <Button onClick={() => setActiveTab("rdv")}>Prendre rendez-vous</Button>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "dossier" && (
          <PatientRecordView patient={mockPatient} />
        )}

        {activeTab === "planning" && (
          <Card>
            <CardHeader>
              <CardTitle>Planning</CardTitle>
              <CardDescription>Vos rendez-vous à venir</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">À implémenter — liste des rendez-vous via l'API.</p>
            </CardContent>
          </Card>
        )}

        {activeTab === "ordonnances" && (
          <Card>
            <CardHeader>
              <CardTitle>Ordonnances</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border p-3 text-sm">
                Ordonnance du 2026-04-19 - Dr Rabearivelo - Metformine 500mg
              </div>
              <CardFooter className="px-0 pb-0">
                <Button variant="outline">Télécharger</Button>
              </CardFooter>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
