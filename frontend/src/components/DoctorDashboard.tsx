import { useMemo, useState } from "react"
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
import CalendarView from "./CalendarView"
import { PatientRecordView } from "./PatientMedicalRecord"
import type { PatientRecord, VitalSign } from "./PatientMedicalRecord"

type AppointmentStatus = "confirme" | "en_cours" | "termine"

type Appointment = {
  id: string
  date: string
  heure: string
  motif: string
  status: AppointmentStatus
  patient: PatientRecord
}

type Availability = {
  id: string
  date: string
  debut: string
  fin: string
}

type PrescriptionLine = {
  id: string
  medicament: string
  dosage: string
  forme: string
  posologie: string
  duree: string
  modeAdministration: string
  instructions: string
}

const today = new Date().toISOString().slice(0, 10)

const initialAppointments: Appointment[] = [
  {
    id: "rdv-001",
    date: today,
    heure: "09:00",
    motif: "Fatigue persistante",
    status: "confirme",
    patient: {
      id: "pat-001",
      nom: "Ravo",
      prenom: "Aina",
      sexe: "F",
      dateNaissance: "1992-03-14",
      numeroDossier: "DM-2026-101",
      contact: "+261 34 00 000 01",
      adresse: "Antananarivo",
      antecedents: [{ id: "ant-1", label: "Hypertension artérielle" }],
      constantes: [
        { date: "2026-04-18", tension: "13/8", glycemie: "0.98", poids: "62", imc: "23.4" },
      ],
      historiqueConsultations: [
        { date: "2026-04-18", motif: "Céphalées", diagnostic: "Migraine sans aura" },
      ],
    },
  },
  {
    id: "rdv-002",
    date: today,
    heure: "11:30",
    motif: "Suivi diabète",
    status: "confirme",
    patient: {
      id: "pat-002",
      nom: "Rakoto",
      prenom: "Mamy",
      sexe: "M",
      dateNaissance: "1980-08-02",
      numeroDossier: "DM-2026-205",
      contact: "+261 34 00 000 02",
      adresse: "Fianarantsoa",
      antecedents: [{ id: "ant-2", label: "Diabète type 2" }],
      constantes: [
        { date: "2026-04-19", tension: "12/8", glycemie: "1.45", poids: "78", imc: "27.0" },
      ],
      historiqueConsultations: [
        { date: "2026-04-19", motif: "Bilan trimestriel", diagnostic: "Diabète équilibré partiellement" },
      ],
    },
  },
]

export default function DoctorDashboard() {
  const [activeView, setActiveView] = useState<"rendezvous" | "disponibilites" | "planning">("rendezvous")
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [consultationStep, setConsultationStep] = useState<1 | 2 | 3>(1)

  const [consultationDate, setConsultationDate] = useState(today)
  const [consultationMotif, setConsultationMotif] = useState("")
  const [consultationDiagnostic, setConsultationDiagnostic] = useState("")

  const [antecedentInput, setAntecedentInput] = useState("")
  const [newVital, setNewVital] = useState<VitalSign>({
    date: today,
    tension: "",
    glycemie: "",
    poids: "",
    imc: "",
  })

  const [prescriptionLines, setPrescriptionLines] = useState<PrescriptionLine[]>([
    {
      id: crypto.randomUUID(),
      medicament: "",
      dosage: "",
      forme: "",
      posologie: "",
      duree: "",
      modeAdministration: "",
      instructions: "",
    },
  ])

  const [availabilities, setAvailabilities] = useState<Availability[]>([
    { id: "disp-1", date: today, debut: "14:00", fin: "17:00" },
  ])
  const [availabilityDraft, setAvailabilityDraft] = useState<Availability>({
    id: "",
    date: today,
    debut: "",
    fin: "",
  })
  const [editingAvailabilityId, setEditingAvailabilityId] = useState<string | null>(null)

  const filteredAppointments = useMemo(
    () => appointments.filter((rdv) => rdv.date === selectedDate),
    [appointments, selectedDate]
  )

  const selectedAppointment = appointments.find((rdv) => rdv.id === selectedAppointmentId) ?? null

  const markAppointmentStatus = (id: string, status: AppointmentStatus) => {
    setAppointments((prev) => prev.map((rdv) => (rdv.id === id ? { ...rdv, status } : rdv)))
  }

  const openConsultation = (id: string) => {
    setSelectedAppointmentId(id)
    setConsultationStep(1)
    setConsultationDate(today)
    setConsultationMotif("")
    setConsultationDiagnostic("")
    markAppointmentStatus(id, "en_cours")
  }

  const addAntecedent = () => {
    if (!selectedAppointment || !antecedentInput.trim()) return
    const value = antecedentInput.trim()
    setAppointments((prev) =>
      prev.map((rdv) =>
        rdv.id === selectedAppointment.id
          ? {
              ...rdv,
              patient: {
                ...rdv.patient,
                antecedents: [...rdv.patient.antecedents, { id: crypto.randomUUID(), label: value }],
              },
            }
          : rdv
      )
    )
    setAntecedentInput("")
  }

  const addVitalSign = () => {
    if (!selectedAppointment || !newVital.tension || !newVital.glycemie || !newVital.poids || !newVital.imc) return
    setAppointments((prev) =>
      prev.map((rdv) =>
        rdv.id === selectedAppointment.id
          ? {
              ...rdv,
              patient: {
                ...rdv.patient,
                constantes: [...rdv.patient.constantes, newVital],
              },
            }
          : rdv
      )
    )
    setNewVital({ date: today, tension: "", glycemie: "", poids: "", imc: "" })
  }

  const saveClinicalStep = () => {
    if (!selectedAppointment || !consultationMotif.trim() || !consultationDiagnostic.trim()) return
    setAppointments((prev) =>
      prev.map((rdv) =>
        rdv.id === selectedAppointment.id
          ? {
              ...rdv,
              patient: {
                ...rdv.patient,
                historiqueConsultations: [
                  ...rdv.patient.historiqueConsultations,
                  {
                    date: consultationDate,
                    motif: consultationMotif.trim(),
                    diagnostic: consultationDiagnostic.trim(),
                  },
                ],
              },
            }
          : rdv
      )
    )
    setConsultationStep(2)
  }

  const updatePrescriptionLine = (id: string, key: keyof PrescriptionLine, value: string) => {
    setPrescriptionLines((prev) => prev.map((line) => (line.id === id ? { ...line, [key]: value } : line)))
  }

  const addPrescriptionLine = () => {
    setPrescriptionLines((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        medicament: "",
        dosage: "",
        forme: "",
        posologie: "",
        duree: "",
        modeAdministration: "",
        instructions: "",
      },
    ])
  }

  const generatePrescriptionPdf = () => {
    if (!selectedAppointment) return
    const content = [
      "ORDONNANCE MEDICALE",
      `Patient: ${selectedAppointment.patient.prenom} ${selectedAppointment.patient.nom}`,
      `Date: ${consultationDate}`,
      "",
      ...prescriptionLines.map(
        (line, idx) =>
          `${idx + 1}. ${line.medicament} | ${line.dosage} | ${line.forme} | ${line.posologie} | ${line.duree} | ${line.modeAdministration} | ${line.instructions}`
      ),
    ].join("\n")

    const blob = new Blob([content], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `ordonnance-${selectedAppointment.patient.id}-${consultationDate}.pdf`
    link.click()
    URL.revokeObjectURL(url)
    setConsultationStep(3)
  }

  const endConsultation = () => {
    if (!selectedAppointment) return
    markAppointmentStatus(selectedAppointment.id, "termine")
    setSelectedAppointmentId(null)
    setConsultationStep(1)
    setPrescriptionLines([
      {
        id: crypto.randomUUID(),
        medicament: "",
        dosage: "",
        forme: "",
        posologie: "",
        duree: "",
        modeAdministration: "",
        instructions: "",
      },
    ])
  }

  const saveAvailability = () => {
    if (!availabilityDraft.date || !availabilityDraft.debut || !availabilityDraft.fin) return
    if (editingAvailabilityId) {
      setAvailabilities((prev) =>
        prev.map((disp) => (disp.id === editingAvailabilityId ? { ...availabilityDraft, id: editingAvailabilityId } : disp))
      )
      setEditingAvailabilityId(null)
    } else {
      setAvailabilities((prev) => [...prev, { ...availabilityDraft, id: crypto.randomUUID() }])
    }
    setAvailabilityDraft({ id: "", date: today, debut: "", fin: "" })
  }

  const editAvailability = (availability: Availability) => {
    setEditingAvailabilityId(availability.id)
    setAvailabilityDraft(availability)
  }

  const deleteAvailability = (id: string) => {
    setAvailabilities((prev) => prev.filter((disp) => disp.id !== id))
    if (editingAvailabilityId === id) {
      setEditingAvailabilityId(null)
      setAvailabilityDraft({ id: "", date: today, debut: "", fin: "" })
    }
  }

  return (
    <div className="min-h-screen bg-muted/20 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard médecin</CardTitle>
            <CardDescription>
              Gestion des rendez-vous, consultation médicale, ordonnances, disponibilités et planning.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              variant={activeView === "rendezvous" ? "default" : "outline"}
              onClick={() => setActiveView("rendezvous")}
            >
              Rendez-vous
            </Button>
            <Button
              variant={activeView === "disponibilites" ? "default" : "outline"}
              onClick={() => setActiveView("disponibilites")}
            >
              Disponibilités
            </Button>
            <Button
              variant={activeView === "planning" ? "default" : "outline"}
              onClick={() => setActiveView("planning")}
            >
              Planning
            </Button>
          </CardContent>
        </Card>

        {activeView === "rendezvous" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Liste des rendez-vous</CardTitle>
                <CardDescription>Rendez-vous confirmés (filtrables par date)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rdv-date">Date</Label>
                  <Input id="rdv-date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </div>
                <div className="space-y-3">
                  {filteredAppointments.length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucun rendez-vous sur cette date.</p>
                  )}
                  {filteredAppointments.map((rdv) => (
                    <Card key={rdv.id}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-medium">
                              {rdv.heure} - {rdv.patient.prenom} {rdv.patient.nom}
                            </p>
                            <p className="text-sm text-muted-foreground">Motif: {rdv.motif}</p>
                            <p className="text-sm text-muted-foreground">Statut: {rdv.status}</p>
                          </div>
                          <Button onClick={() => openConsultation(rdv.id)} disabled={rdv.status === "termine"}>
                            Ouvrir la consultation
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workflow consultation</CardTitle>
                <CardDescription>Étapes 1 à 3 selon le CDC</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedAppointment && (
                  <p className="text-sm text-muted-foreground">
                    Sélectionner un rendez-vous pour afficher le dossier patient et démarrer la consultation.
                  </p>
                )}

                {selectedAppointment && (
                  <>
                    <PatientRecordView 
                      patient={selectedAppointment.patient} 
                      antecedentAction={
                        <div className="flex gap-2">
                          <Input
                            placeholder="Nouvel antécédent"
                            value={antecedentInput}
                            onChange={(e) => setAntecedentInput(e.target.value)}
                          />
                          <Button variant="outline" onClick={addAntecedent}>
                            Ajouter
                          </Button>
                        </div>
                      }
                      vitalAction={
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                          <div className="grid w-full gap-2 grid-cols-2 md:grid-cols-5">
                            <Input
                              type="date"
                              value={newVital.date}
                              onChange={(e) => setNewVital((prev) => ({ ...prev, date: e.target.value }))}
                            />
                            <Input
                              placeholder="Tension"
                              value={newVital.tension}
                              onChange={(e) => setNewVital((prev) => ({ ...prev, tension: e.target.value }))}
                            />
                            <Input
                              placeholder="Glycémie"
                              value={newVital.glycemie}
                              onChange={(e) => setNewVital((prev) => ({ ...prev, glycemie: e.target.value }))}
                            />
                            <Input
                              placeholder="Poids"
                              value={newVital.poids}
                              onChange={(e) => setNewVital((prev) => ({ ...prev, poids: e.target.value }))}
                            />
                            <Input
                              placeholder="IMC"
                              value={newVital.imc}
                              onChange={(e) => setNewVital((prev) => ({ ...prev, imc: e.target.value }))}
                            />
                          </div>
                          <Button variant="outline" onClick={addVitalSign} className="w-full sm:w-auto">
                            Ajouter
                          </Button>
                        </div>
                      }
                    />

                    {consultationStep === 1 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Étape 1 - Saisie clinique</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <Label>Date</Label>
                            <Input type="date" value={consultationDate} onChange={(e) => setConsultationDate(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Motif</Label>
                            <Input value={consultationMotif} onChange={(e) => setConsultationMotif(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Diagnostic</Label>
                            <textarea
                              className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                              value={consultationDiagnostic}
                              onChange={(e) => setConsultationDiagnostic(e.target.value)}
                            />
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button onClick={saveClinicalStep}>Enregistrer / Continuer</Button>
                        </CardFooter>
                      </Card>
                    )}

                    {consultationStep === 2 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Étape 2 - Ordonnance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {prescriptionLines.map((line) => (
                            <div key={line.id} className="grid gap-2 rounded-md border p-3 md:grid-cols-2">
                              <Input
                                placeholder="Nom médicament (DCI)"
                                value={line.medicament}
                                onChange={(e) => updatePrescriptionLine(line.id, "medicament", e.target.value)}
                              />
                              <Input
                                placeholder="Dosage"
                                value={line.dosage}
                                onChange={(e) => updatePrescriptionLine(line.id, "dosage", e.target.value)}
                              />
                              <Input
                                placeholder="Forme"
                                value={line.forme}
                                onChange={(e) => updatePrescriptionLine(line.id, "forme", e.target.value)}
                              />
                              <Input
                                placeholder="Posologie"
                                value={line.posologie}
                                onChange={(e) => updatePrescriptionLine(line.id, "posologie", e.target.value)}
                              />
                              <Input
                                placeholder="Durée du traitement"
                                value={line.duree}
                                onChange={(e) => updatePrescriptionLine(line.id, "duree", e.target.value)}
                              />
                              <Input
                                placeholder="Mode d'administration"
                                value={line.modeAdministration}
                                onChange={(e) => updatePrescriptionLine(line.id, "modeAdministration", e.target.value)}
                              />
                              <div className="md:col-span-2">
                                <Input
                                  placeholder="Instructions spécifiques"
                                  value={line.instructions}
                                  onChange={(e) => updatePrescriptionLine(line.id, "instructions", e.target.value)}
                                />
                              </div>
                            </div>
                          ))}
                          <Button variant="outline" onClick={addPrescriptionLine}>
                            Ajouter une ligne
                          </Button>
                        </CardContent>
                        <CardFooter>
                          <Button onClick={generatePrescriptionPdf}>Générer le PDF</Button>
                        </CardFooter>
                      </Card>
                    )}

                    {consultationStep === 3 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Étape 3 - Clôture</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Ordonnance générée. Vous pouvez maintenant terminer la consultation pour mettre le rendez-vous
                            au statut Terminé.
                          </p>
                        </CardContent>
                        <CardFooter>
                          <Button onClick={endConsultation}>Terminer la consultation</Button>
                        </CardFooter>
                      </Card>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeView === "disponibilites" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Gérer disponibilité</CardTitle>
                <CardDescription>Créer, modifier et supprimer des plages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={availabilityDraft.date}
                    onChange={(e) => setAvailabilityDraft((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Début</Label>
                    <Input
                      type="time"
                      value={availabilityDraft.debut}
                      onChange={(e) => setAvailabilityDraft((prev) => ({ ...prev, debut: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fin</Label>
                    <Input
                      type="time"
                      value={availabilityDraft.fin}
                      onChange={(e) => setAvailabilityDraft((prev) => ({ ...prev, fin: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveAvailability}>
                  {editingAvailabilityId ? "Mettre à jour la plage" : "Créer la plage"}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mes disponibilités</CardTitle>
                <CardDescription>Consultation et actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {availabilities.map((disp) => (
                  <div key={disp.id} className="flex items-center justify-between rounded-md border p-3">
                    <p className="text-sm">
                      {disp.date} - {disp.debut} a {disp.fin}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => editAvailability(disp)}>
                        Modifier
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteAvailability(disp.id)}>
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
                {availabilities.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucune disponibilité configurée.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeView === "planning" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CalendarView
                events={[
                  ...appointments.map(rdv => ({
                    id: rdv.id,
                    date: rdv.date,
                    time: rdv.heure,
                    title: `Consultation - ${rdv.patient.prenom} ${rdv.patient.nom}`,
                    colorClass: rdv.status === "termine" ? "bg-muted/80 text-muted-foreground border-transparent" : "bg-primary text-primary-foreground border-primary/20",
                  })),
                  ...availabilities.map(disp => ({
                    id: disp.id,
                    date: disp.date,
                    time: `${disp.debut} - ${disp.fin}`,
                    title: "Plage disponible",
                    colorClass: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-900",
                  }))
                ]}
                onDateClick={(d) => setSelectedDate(d)}
                selectedDate={selectedDate}
              />
            </div>
            
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-xl">Détails du {selectedDate}</CardTitle>
                <CardDescription>Vos rendez-vous et disponibilités prévus</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                    Rendez-vous
                  </h4>
                  {filteredAppointments.length === 0 && (
                    <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                      Aucun rendez-vous
                    </div>
                  )}
                  {filteredAppointments.map((rdv) => (
                    <div key={rdv.id} className="rounded-md border border-l-4 border-l-primary bg-card p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{rdv.heure}</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${rdv.status === 'termine' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                          {rdv.status}
                        </span>
                      </div>
                      <p className="mt-1 font-medium">{rdv.patient.prenom} {rdv.patient.nom}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Motif: {rdv.motif}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Disponibilités
                  </h4>
                  {availabilities.filter(d => d.date === selectedDate).length === 0 && (
                    <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                      Aucune disponibilité configurée
                    </div>
                  )}
                  {availabilities.filter(d => d.date === selectedDate).map((disp) => (
                    <div key={disp.id} className="rounded-md border border-l-4 border-l-green-500 bg-green-50 p-3 text-sm text-green-800 shadow-sm dark:bg-green-950/20 dark:border-green-900 dark:border-l-green-500 dark:text-green-300">
                      Plage libre : <span className="font-semibold">{disp.debut}</span> à <span className="font-semibold">{disp.fin}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
