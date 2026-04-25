import { useMemo, useRef, useState, type ChangeEvent, type PointerEvent } from "react"
import { useNavigate } from "react-router-dom"
import { jsPDF } from "jspdf"
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
import { useAuth } from "@/hooks/useAuth"
import { logoutRequest } from "@/services/axiosInstance"
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
  formeAutre: string
  posologie: string
  posologieAutre: string
  duree: string
  modeAdministration: string
  modeAdministrationAutre: string
  instructions: string
}
const today = new Date().toISOString().slice(0, 10)
const AUTRE_OPTION = "__AUTRE__"
const MEDICAMENT_FORMS = [
  "Comprimé",
  "Gélule (capsule)",
  "Poudre",
  "Granulés",
  "Pastille / comprimé à sucer",
  "Sirop",
  "Solution buvable",
  "Suspension buvable",
  "Gouttes",
  "Crème",
  "Pommade",
  "Gel",
  "Pâte",
  "Solution injectable",
  "Suspension injectable",
  "Suppositoire",
  "Ovule",
  "Patch",
  "Spray",
  "Collyre",
  "Inhalateur",
] as const
const POSOLOGY_OPTIONS = [
  "1 comprimé 1 fois par jour",
  "1 comprimé 2 fois par jour (matin et soir)",
  "1 comprimé 3 fois par jour",
  "2 gélules toutes les 8 heures",
  "10 ml de sirop 3 fois par jour",
  "1 injection par jour pendant 5 jours",
  "1 application de crème 2 fois par jour",
  "1 goutte dans chaque œil matin et soir",
  "1 comprimé si douleur (max 3 par jour)",
  "1 prise avant les repas",
  "1 prise après les repas",
  "Traitement pendant 7 jours",
] as const
const ADMINISTRATION_ROUTES = [
  "Avaler (voie orale)",
  "Boire (voie orale)",
  "Application locale (voie cutanée)",
  "Patch (voie cutanée)",
  "Intraveineuse",
  "Intramusculaire",
  "Sous-cutanée",
  "Inhalation",
  "Spray nasal",
  "Gouttes nasales",
  "Collyre (voie oculaire)",
  "Gouttes auriculaires",
  "Suppositoire (voie rectale)",
  "Ovule (voie vaginale)",
  "Crème vaginale",
] as const
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
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [activeView, setActiveView] = useState<"rendezvous" | "disponibilites" | "planning">("rendezvous")
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false)
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
      formeAutre: "",
      posologie: "",
      posologieAutre: "",
      duree: "",
      modeAdministration: "",
      modeAdministrationAutre: "",
      instructions: "",
    },
  ])
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isSignatureDrawing, setIsSignatureDrawing] = useState(false)
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const [signatureSource, setSignatureSource] = useState<"pad" | "image" | null>(null)
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
    clearSignatureCanvas()
    setIsDiagnosisModalOpen(true)
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
        formeAutre: "",
        posologie: "",
        posologieAutre: "",
        duree: "",
        modeAdministration: "",
        modeAdministrationAutre: "",
        instructions: "",
      },
    ])
  }
  const getFinalForme = (line: PrescriptionLine) =>
    line.forme === AUTRE_OPTION ? line.formeAutre.trim() : line.forme.trim()
  const getFinalPosologie = (line: PrescriptionLine) =>
    line.posologie === AUTRE_OPTION ? line.posologieAutre.trim() : line.posologie.trim()
  const getFinalModeAdministration = (line: PrescriptionLine) =>
    line.modeAdministration === AUTRE_OPTION ? line.modeAdministrationAutre.trim() : line.modeAdministration.trim()
  const clearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignatureDataUrl(null)
    setSignatureSource(null)
  }
  const getCanvasCoordinates = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) * canvas.width) / rect.width,
      y: ((event.clientY - rect.top) * canvas.height) / rect.height,
    }
  }
  const handleSignaturePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const point = getCanvasCoordinates(event)
    if (!ctx || !point) return
    setIsSignatureDrawing(true)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.lineWidth = 2
    ctx.strokeStyle = "#111827"
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
  }
  const handleSignaturePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isSignatureDrawing) return
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const point = getCanvasCoordinates(event)
    if (!ctx || !point) return
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
  }
  const endSignaturePointer = () => {
    if (!isSignatureDrawing) return
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    setIsSignatureDrawing(false)
    setSignatureDataUrl(canvas.toDataURL("image/png"))
    setSignatureSource("pad")
  }
  const handleSignatureImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null
      if (!result) return
      setSignatureDataUrl(result)
      setSignatureSource("image")
      const canvas = signatureCanvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    reader.readAsDataURL(file)
    event.target.value = ""
  }
  const generatePrescriptionPdf = () => {
    if (!selectedAppointment) return
    const validLines = prescriptionLines.filter(
      (line) =>
        line.medicament.trim() ||
        line.dosage.trim() ||
        getFinalForme(line) ||
        getFinalPosologie(line) ||
        line.duree.trim() ||
        getFinalModeAdministration(line) ||
        line.instructions.trim()
    )
    if (validLines.length === 0) return
    const doc = new jsPDF({ unit: "mm", format: "a4" })
    const pageWidth = doc.internal.pageSize.getWidth()
    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.text("ORDONNANCE MEDICALE", pageWidth / 2, 18, { align: "center" })
    doc.setFont("helvetica", "normal")
    doc.setFontSize(11)
    doc.text("Dr Curalink", 14, 30)
    doc.text("N° RPPS: 00000000000", 14, 36)
    doc.text("Cabinet: Antananarivo", 14, 42)
    doc.text(`Date: ${consultationDate}`, pageWidth - 14, 30, { align: "right" })
    doc.setLineWidth(0.4)
    doc.line(14, 48, pageWidth - 14, 48)
    doc.setFont("helvetica", "bold")
    doc.text("Patient", 14, 58)
    doc.setFont("helvetica", "normal")
    doc.text(
      `${selectedAppointment.patient.prenom} ${selectedAppointment.patient.nom} | ${selectedAppointment.patient.sexe} | Ne(e) le ${selectedAppointment.patient.dateNaissance}`,
      14,
      64
    )
    doc.text(`Dossier: ${selectedAppointment.patient.numeroDossier}`, 14, 70)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(20)
    doc.text("R/", 14, 84)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(11)
    let y = 94
    validLines.forEach((line, index) => {
      const chunks = [
        `${index + 1}. ${line.medicament || "Medicament"} ${line.dosage ? `- ${line.dosage}` : ""} ${getFinalForme(line) ? `(${getFinalForme(line)})` : ""}`,
        getFinalPosologie(line) ? `Posologie: ${getFinalPosologie(line)}` : "",
        line.duree ? `Duree: ${line.duree}` : "",
        getFinalModeAdministration(line) ? `Voie: ${getFinalModeAdministration(line)}` : "",
        line.instructions ? `Instructions: ${line.instructions}` : "",
      ].filter(Boolean)
      chunks.forEach((chunk) => {
        const split = doc.splitTextToSize(chunk, pageWidth - 36)
        doc.text(split, 18, y)
        y += split.length * 6
      })
      y += 4
    })
    doc.setLineWidth(0.2)
    doc.line(14, 270, pageWidth - 14, 270)
    doc.setFontSize(10)
    doc.text("Signature et cachet du medecin", pageWidth - 14, 277, { align: "right" })
    if (signatureDataUrl) {
      const format = signatureDataUrl.includes("image/jpeg") ? "JPEG" : "PNG"
      doc.addImage(signatureDataUrl, format, pageWidth - 64, 246, 46, 18)
    }
    doc.save(`ordonnance-${selectedAppointment.patient.id}-${consultationDate}.pdf`)
    setConsultationStep(3)
  }
  const endConsultation = () => {
    if (!selectedAppointment) return
    markAppointmentStatus(selectedAppointment.id, "termine")
    setSelectedAppointmentId(null)
    setIsDiagnosisModalOpen(false)
    setConsultationStep(1)
    setPrescriptionLines([
      {
        id: crypto.randomUUID(),
        medicament: "",
        dosage: "",
        forme: "",
        formeAutre: "",
        posologie: "",
        posologieAutre: "",
        duree: "",
        modeAdministration: "",
        modeAdministrationAutre: "",
        instructions: "",
      },
    ])
    clearSignatureCanvas()
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
            <Button variant="destructive" className="ml-auto" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
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
                            Effectuer le diagnostic
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
                <CardDescription>Dossier patient et diagnostic en modal avec stepper</CardDescription>
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
                    <Button onClick={() => setIsDiagnosisModalOpen(true)}>Effectuer le diagnostic</Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        {isDiagnosisModalOpen && selectedAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-xl border bg-background shadow-xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-6 py-4">
                <div>
                  <h3 className="text-xl font-semibold">Diagnostic - {selectedAppointment.patient.prenom} {selectedAppointment.patient.nom}</h3>
                  <p className="text-sm text-muted-foreground">Rendez-vous du {selectedAppointment.date} à {selectedAppointment.heure}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDiagnosisModalOpen(false)
                    if (selectedAppointment.status !== "termine") {
                      markAppointmentStatus(selectedAppointment.id, "confirme")
                    }
                  }}
                >
                  Fermer
                </Button>
              </div>
              <div className="px-6 py-5">
                <div className="mb-6 flex items-center gap-2">
                  <div className={`h-2.5 rounded-full transition-all ${consultationStep === 1 ? "w-12 bg-primary" : "w-4 bg-primary/40"}`} />
                  <div className={`h-2.5 rounded-full transition-all ${consultationStep === 2 ? "w-12 bg-primary" : "w-4 bg-primary/40"}`} />
                  <div className={`h-2.5 rounded-full transition-all ${consultationStep === 3 ? "w-12 bg-primary" : "w-4 bg-muted"}`} />
                </div>
                {consultationStep === 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Saisie clinique</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label>Date de consultation</Label>
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
                    <CardFooter className="justify-end">
                      <Button onClick={saveClinicalStep}>Continuer</Button>
                    </CardFooter>
                  </Card>
                )}
                {consultationStep === 2 && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Saisie ordonnance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {prescriptionLines.map((line) => (
                          <div key={line.id} className="grid gap-2 rounded-md border p-3 md:grid-cols-2">
                            <Input placeholder="Nom médicament (DCI)" value={line.medicament} onChange={(e) => updatePrescriptionLine(line.id, "medicament", e.target.value)} />
                            <Input placeholder="Dosage" value={line.dosage} onChange={(e) => updatePrescriptionLine(line.id, "dosage", e.target.value)} />
                            <select
                              className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                              value={line.forme}
                              onChange={(e) => updatePrescriptionLine(line.id, "forme", e.target.value)}
                            >
                              <option value="">Choisir une forme pharmaceutique</option>
                              {MEDICAMENT_FORMS.map((form) => (
                                <option key={form} value={form}>
                                  {form}
                                </option>
                              ))}
                              <option value={AUTRE_OPTION}>Autre</option>
                            </select>
                            <select
                              className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                              value={line.posologie}
                              onChange={(e) => updatePrescriptionLine(line.id, "posologie", e.target.value)}
                            >
                              <option value="">Choisir une posologie</option>
                              {POSOLOGY_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                              <option value={AUTRE_OPTION}>Autre</option>
                            </select>
                            {line.forme === AUTRE_OPTION && (
                              <Input
                                className="md:col-span-2"
                                placeholder="Autre forme pharmaceutique..."
                                value={line.formeAutre}
                                onChange={(e) => updatePrescriptionLine(line.id, "formeAutre", e.target.value)}
                              />
                            )}
                            {line.posologie === AUTRE_OPTION && (
                              <Input
                                className="md:col-span-2"
                                placeholder="Autre posologie..."
                                value={line.posologieAutre}
                                onChange={(e) => updatePrescriptionLine(line.id, "posologieAutre", e.target.value)}
                              />
                            )}
                            <Input placeholder="Durée du traitement" value={line.duree} onChange={(e) => updatePrescriptionLine(line.id, "duree", e.target.value)} />
                            <select
                              className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                              value={line.modeAdministration}
                              onChange={(e) => updatePrescriptionLine(line.id, "modeAdministration", e.target.value)}
                            >
                              <option value="">Choisir un mode d'administration</option>
                              {ADMINISTRATION_ROUTES.map((route) => (
                                <option key={route} value={route}>
                                  {route}
                                </option>
                              ))}
                              <option value={AUTRE_OPTION}>Autre</option>
                            </select>
                            {line.modeAdministration === AUTRE_OPTION && (
                              <Input
                                className="md:col-span-2"
                                placeholder="Autre mode d'administration..."
                                value={line.modeAdministrationAutre}
                                onChange={(e) => updatePrescriptionLine(line.id, "modeAdministrationAutre", e.target.value)}
                              />
                            )}
                            <div className="md:col-span-2">
                              <Input placeholder="Instructions spécifiques" value={line.instructions} onChange={(e) => updatePrescriptionLine(line.id, "instructions", e.target.value)} />
                            </div>
                          </div>
                        ))}
                        <Button variant="outline" onClick={addPrescriptionLine}>Ajouter une ligne</Button>
                        <div className="space-y-3 rounded-md border p-3">
                          <p className="text-sm font-medium">Signature du médecin</p>
                          <p className="text-xs text-muted-foreground">
                            Dessinez votre signature dans le pad ou importez une image de signature.
                          </p>
                          <canvas
                            ref={signatureCanvasRef}
                            width={600}
                            height={180}
                            className="h-36 w-full rounded-md border bg-white touch-none"
                            onPointerDown={handleSignaturePointerDown}
                            onPointerMove={handleSignaturePointerMove}
                            onPointerUp={endSignaturePointer}
                            onPointerLeave={endSignaturePointer}
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" onClick={clearSignatureCanvas}>
                              Effacer la signature
                            </Button>
                            <label className="inline-flex cursor-pointer items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
                              Importer une image
                              <input type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={handleSignatureImageUpload} />
                            </label>
                            {signatureSource && (
                              <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                                Source: {signatureSource === "pad" ? "Pad" : "Image"}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="justify-between">
                        <Button variant="outline" onClick={() => setConsultationStep(1)}>Retour</Button>
                        <Button onClick={generatePrescriptionPdf}>Télécharger l'ordonnance PDF</Button>
                      </CardFooter>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Prévisualisation ordonnance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="min-h-[560px] rounded-md border bg-white p-6 text-black">
                          <p className="text-center text-lg font-bold">ORDONNANCE MEDICALE</p>
                          <div className="mt-5 text-sm">
                            <p>Dr Curalink</p>
                            <p>N° RPPS: 00000000000</p>
                            <p>Cabinet: Antananarivo</p>
                            <p className="mt-2">Date: {consultationDate}</p>
                          </div>
                          <hr className="my-4" />
                          <p className="text-sm"><span className="font-semibold">Patient:</span> {selectedAppointment.patient.prenom} {selectedAppointment.patient.nom}</p>
                          <p className="text-sm"><span className="font-semibold">Dossier:</span> {selectedAppointment.patient.numeroDossier}</p>
                          <p className="mt-5 text-xl font-semibold">R/</p>
                          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm">
                            {prescriptionLines
                              .filter((line) => line.medicament.trim() || getFinalPosologie(line) || line.instructions.trim())
                              .map((line) => (
                                <li key={line.id}>
                                  <p className="font-semibold">{line.medicament || "Médicament"} {line.dosage ? `- ${line.dosage}` : ""} {getFinalForme(line) ? `(${getFinalForme(line)})` : ""}</p>
                                  {getFinalPosologie(line) && <p>Posologie: {getFinalPosologie(line)}</p>}
                                  {line.duree && <p>Durée: {line.duree}</p>}
                                  {getFinalModeAdministration(line) && <p>Voie: {getFinalModeAdministration(line)}</p>}
                                  {line.instructions && <p>Instructions: {line.instructions}</p>}
                                </li>
                              ))}
                          </ol>
                          <div className="mt-10 flex justify-end">
                            <div className="w-52 border-t pt-2 text-right text-xs">
                              <p className="mb-2 text-muted-foreground">Signature et cachet du médecin</p>
                              {signatureDataUrl ? (
                                <img src={signatureDataUrl} alt="Signature du médecin" className="ml-auto h-16 w-48 object-contain" />
                              ) : (
                                <div className="ml-auto flex h-16 w-48 items-center justify-center border border-dashed text-[11px] text-muted-foreground">
                                  Aucune signature
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                {consultationStep === 3 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Clôture consultation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Ordonnance générée et téléchargée. Vous pouvez terminer la consultation.
                      </p>
                    </CardContent>
                    <CardFooter className="justify-end">
                      <Button onClick={endConsultation}>Terminer la consultation</Button>
                    </CardFooter>
                  </Card>
                )}
              </div>
            </div>
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