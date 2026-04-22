import { useMemo, useState } from "react"
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

type Service = "Médecine générale" | "Dermatologie" | "Cardiologie" | "Nutrition"
type Step = 1 | 2 | 3

type Appointment = {
  id: string
  date: string
  heure: string
  service: Service
  medecin: string
  statut: "demande" | "confirmé"
}

const doctorsByService: Record<Service, string[]> = {
  "Médecine générale": ["Dr Rasoanaivo", "Dr Rakotondrazaka"],
  Dermatologie: ["Dr Andriamparany"],
  Cardiologie: ["Dr Rabearivelo"],
  Nutrition: ["Dr Rasolofoniaina"],
}

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
  const [step, setStep] = useState<Step>(1)
  const [service, setService] = useState<Service>("Médecine générale")
  const [date, setDate] = useState(today)
  const [doctor, setDoctor] = useState("")
  const [quickSlot, setQuickSlot] = useState("09:00")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [symptoms, setSymptoms] = useState("")
  const [aiAnswer, setAiAnswer] = useState("")

  const availableDoctors = useMemo(() => doctorsByService[service], [service])

  const submitAi = () => {
    if (!symptoms.trim()) return
    setAiAnswer(
      "Recommandation IA: une consultation de Médecine générale est conseillée. Vous pouvez prendre rendez-vous ci-dessous."
    )
  }

  const createAppointment = () => {
    const chosenDoctor = doctor || availableDoctors[0]
    if (!chosenDoctor) return
    setAppointments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        date,
        heure: quickSlot,
        service,
        medecin: chosenDoctor,
        statut: "confirmé",
      },
    ])
    setStep(1)
    setDoctor("")
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
              <CardTitle>Prise de rendez-vous (3 étapes)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {step === 1 && (
                <div className="space-y-3">
                  <Label>Étape 1 - Choisir un service</Label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={service}
                    onChange={(e) => setService(e.target.value as Service)}
                  >
                    {Object.keys(doctorsByService).map((svc) => (
                      <option key={svc} value={svc}>
                        {svc}
                      </option>
                    ))}
                  </select>
                  <Button onClick={() => setStep(2)}>Continuer</Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <Label>Étape 2 - Choisir médecin et créneau</Label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={doctor}
                    onChange={(e) => setDoctor(e.target.value)}
                  >
                    <option value="">Premier médecin disponible</option>
                    {availableDoctors.map((doc) => (
                      <option key={doc} value={doc}>
                        {doc}
                      </option>
                    ))}
                  </select>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    <Input type="time" value={quickSlot} onChange={(e) => setQuickSlot(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Retour
                    </Button>
                    <Button onClick={() => setStep(3)}>Continuer</Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <Label>Étape 3 - Confirmer la demande</Label>
                  <p className="text-sm text-muted-foreground">
                    Service: {service} | Médecin: {doctor || "Premier disponible"} | {date} à {quickSlot}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      Retour
                    </Button>
                    <Button onClick={createAppointment}>Confirmer</Button>
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
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CalendarView
                events={appointments.map(rdv => ({
                  id: rdv.id,
                  date: rdv.date,
                  time: rdv.heure,
                  title: `${rdv.service} - ${rdv.medecin}`,
                  colorClass: "bg-primary text-primary-foreground border border-primary/20",
                }))}
                onDateClick={(d) => setDate(d)}
                selectedDate={date}
              />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Détails du {date}</CardTitle>
                <CardDescription>Vos rendez-vous pour cette date</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {appointments
                  .filter((rdv) => rdv.date === date)
                  .map((rdv) => (
                    <div key={rdv.id} className="rounded-md border p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-lg">{rdv.heure}</span>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          {rdv.statut}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">{rdv.service}</p>
                        <p>{rdv.medecin}</p>
                      </div>
                    </div>
                  ))}
                {appointments.filter((rdv) => rdv.date === date).length === 0 && (
                  <div className="flex flex-col items-center justify-center space-y-3 rounded-lg border border-dashed p-8 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                    </div>
                    <p className="text-sm text-muted-foreground">Aucun rendez-vous planifié à cette date.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
