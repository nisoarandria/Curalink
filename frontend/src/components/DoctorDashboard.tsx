import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
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
import CalendarView from "./CalendarView";
import { PatientRecordView } from "./PatientMedicalRecord";
import type { PatientRecord, VitalSign } from "./PatientMedicalRecord";
import MedecinDisponibilitesPage from "@/components/medecin/MedecinDisponibilitesPage";
import { useAuth } from "@/hooks/useAuth";
import {
  apiClient,
  apiClientMultipart,
  logoutRequest,
} from "@/services/axiosInstance";

type Appointment = {
  id: string;
  patientId: number;
  date: string;
  heure: string;
  motif: string;
  serviceNom?: string;
  adresseCabinet?: string;
  status: RendezVousApiStatus;
  patient: PatientRecord;
};

type Availability = {
  id: string;
  date: string;
  debut: string;
  fin: string;
};

type PrescriptionLine = {
  id: string;
  medicament: string;
  dosage: string;
  forme: string;
  formeAutre: string;
  posologie: string;
  posologieAutre: string;
  duree: string;
  modeAdministration: string;
  modeAdministrationAutre: string;
  instructions: string;
};

const today = new Date().toISOString().slice(0, 10);
const AUTRE_OPTION = "__AUTRE__";

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
] as const;

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
] as const;

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
] as const;

const initialAppointments: Appointment[] = [
];

type RendezVousApiStatus =
  | "EN_ATTENTE"
  | "PROPOSE"
  | "CONFIRME"
  | "REFUSE"
  | "ANNULE"
  | "TERMINE"
  | "ABSENT";

type RendezVousResponse = {
  id: number;
  dateHeure: string;
  status: RendezVousApiStatus;
  serviceNom?: string;
  patientId: number;
  patientNomComplet: string;
  adresseCabinet?: string;
};

type PageResponse<T> = {
  content: T[];
};

type PatientDetailResponse = {
  id: number;
  nom: string;
  prenom: string;
  telephone?: string;
  adresse?: string;
  dateNaissance?: string;
  sexe?: string;
};

type AntecedentResponse = {
  id: number;
  description: string;
};

type ConsultationResponse = {
  id: number;
  rendezVousId?: number;
  motif: string;
  diagnostic: string;
  date: string;
};

type ConstanteResponse = {
  id: number;
  date: string;
  glycemie: number;
  tension: string;
  poids: number;
  imc: number;
};

const splitFullName = (fullName: string) => {
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
  if (nameParts.length <= 1) {
    return { nom: nameParts[0] ?? "Patient", prenom: "" };
  }
  return {
    nom: nameParts[0],
    prenom: nameParts.slice(1).join(" "),
  };
};

const mapRendezVousToAppointment = (rdv: RendezVousResponse): Appointment => {
  const dateObj = new Date(rdv.dateHeure);
  const date = Number.isNaN(dateObj.getTime())
    ? today
    : dateObj.toISOString().slice(0, 10);
  const heure =
    Number.isNaN(dateObj.getTime()) || !rdv.dateHeure.includes("T")
      ? "00:00"
      : rdv.dateHeure.split("T")[1]?.slice(0, 5) ?? "00:00";
  const { nom, prenom } = splitFullName(rdv.patientNomComplet);

  return {
    id: String(rdv.id),
    patientId: rdv.patientId,
    date,
    heure,
    motif: rdv.serviceNom || "Consultation",
    serviceNom: rdv.serviceNom,
    adresseCabinet: rdv.adresseCabinet,
    status: rdv.status,
    patient: {
      id: String(rdv.patientId),
      nom,
      prenom,
      sexe: "F",
      dateNaissance: "-",
      numeroDossier: `PAT-${rdv.patientId}`,
      contact: "-",
      adresse: "-",
      antecedents: [],
      constantes: [],
      historiqueConsultations: [],
    },
  };
};

const formatDateFrCompact = (value: string) => {
  if (!value || value === "-") return value || "-";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  const monthIndex = Number(month) - 1;
  const months = [
    "Janvier",
    "Fevrier",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Aout",
    "Septembre",
    "Octobre",
    "Novembre",
    "Decembre",
  ];
  const monthLabel = months[monthIndex];
  if (!monthLabel) return value;
  return `${day} ${monthLabel} ${year}`;
};

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const displayName =
    [user?.prenom, user?.nom].filter(Boolean).join(" ").trim() ||
    user?.nom ||
    user?.email ||
    "Médecin";
  const roleLabel = "Généraliste";
  const [activeView, setActiveView] = useState<
    "rendezvous" | "disponibilites" | "planning"
  >("rendezvous");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [appointments, setAppointments] =
    useState<Appointment[]>(initialAppointments);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);
  const [isPlanningDetailsModalOpen, setIsPlanningDetailsModalOpen] =
    useState(false);
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [appointmentActionLoadingId, setAppointmentActionLoadingId] = useState<
    string | null
  >(null);
  const [appointmentActionError, setAppointmentActionError] = useState<
    string | null
  >(null);
  const [proposerModalRdvId, setProposerModalRdvId] = useState<string | null>(
    null,
  );
  const [proposerDateHeure, setProposerDateHeure] = useState("");
  const [isSubmittingProposer, setIsSubmittingProposer] = useState(false);
  const [patientDetailsLoading, setPatientDetailsLoading] = useState(false);
  const [patientDetailsError, setPatientDetailsError] = useState<string | null>(
    null,
  );
  const [consultationStep, setConsultationStep] = useState<1 | 2 | 3>(1);

  const [consultationDate, setConsultationDate] = useState(today);
  const [consultationMotif, setConsultationMotif] = useState("");
  const [consultationDiagnostic, setConsultationDiagnostic] = useState("");
  const [consultationFlowError, setConsultationFlowError] = useState<
    string | null
  >(null);
  const [isFinalizingConsultation, setIsFinalizingConsultation] = useState(false);

  const [antecedentInput, setAntecedentInput] = useState("");
  const [newVital, setNewVital] = useState<VitalSign>({
    date: today,
    tension: "",
    glycemie: "",
    poids: "",
    imc: "",
  });

  const [prescriptionLines, setPrescriptionLines] = useState<
    PrescriptionLine[]
  >([
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
  ]);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSignatureDrawing, setIsSignatureDrawing] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureSource, setSignatureSource] = useState<
    "pad" | "image" | null
  >(null);
  const [prescriptionPdfBlob, setPrescriptionPdfBlob] = useState<Blob | null>(
    null,
  );
  const [prescriptionPdfFileName, setPrescriptionPdfFileName] =
    useState<string>("");
  const medecinId = Number(user?.id);

  const [availabilities] = useState<Availability[]>([
    { id: "disp-1", date: today, debut: "14:00", fin: "17:00" },
  ]);

  const filteredAppointments = useMemo(
    () => appointments.filter((rdv) => rdv.date === selectedDate),
    [appointments, selectedDate],
  );
  const recentCompletedAppointments = useMemo(() => {
    const now = new Date();
    const lastThreeMonths = new Date(now);
    lastThreeMonths.setMonth(lastThreeMonths.getMonth() - 3);

    return appointments
      .filter((rdv) => {
        if (rdv.status !== "TERMINE") return false;
        const appointmentDate = new Date(`${rdv.date}T00:00:00`);
        return appointmentDate >= lastThreeMonths && appointmentDate <= now;
      })
      .sort(
        (a, b) =>
          new Date(`${b.date}T${b.heure}`).getTime() -
          new Date(`${a.date}T${a.heure}`).getTime(),
      );
  }, [appointments]);
  const upcomingAppointments = useMemo(() => {
    const now = new Date();

    return appointments
      .filter((rdv) => new Date(`${rdv.date}T${rdv.heure}:00`) >= now)
      .sort(
        (a, b) =>
          new Date(`${a.date}T${a.heure}:00`).getTime() -
          new Date(`${b.date}T${b.heure}:00`).getTime(),
      );
  }, [appointments]);

  const selectedAppointment =
    appointments.find((rdv) => rdv.id === selectedAppointmentId) ?? null;

  const loadAppointments = useCallback(async () => {
    if (!Number.isFinite(medecinId)) {
      setAppointments([]);
      return;
    }
    setAppointmentsLoading(true);
    setAppointmentsError(null);
    try {
      const { data } = await apiClient.get<PageResponse<RendezVousResponse>>(
        `/rendezvous/medecins/${medecinId}/rendezvous`,
        {
          params: {
            date: selectedDate,
            page: 0,
            size: 20,
          },
        },
      );
      setAppointments((data.content ?? []).map(mapRendezVousToAppointment));
    } catch {
      setAppointments([]);
      setAppointmentsError("Impossible de charger les rendez-vous.");
    } finally {
      setAppointmentsLoading(false);
    }
  }, [medecinId, selectedDate]);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const markAppointmentStatus = (id: string, status: RendezVousApiStatus) => {
    setAppointments((prev) =>
      prev.map((rdv) => (rdv.id === id ? { ...rdv, status } : rdv)),
    );
  };

  const getStatusActions = (status: RendezVousApiStatus) => {
    if (status === "EN_ATTENTE") {
      return [
        { label: "Valider", action: "confirmer", variant: "outline" as const },
        { label: "Proposer", action: "proposer-creneau", variant: "outline" as const },
      ];
    }
    if (status === "PROPOSE") {
      return [
        { label: "Valider", action: "confirmer", variant: "outline" as const },
        { label: "Proposer", action: "proposer-creneau", variant: "outline" as const },
      ];
    }
    if (status === "CONFIRME") {
      return [
        { label: "Terminer", action: "terminer", variant: "outline" as const },
        { label: "Absent", action: "absent", variant: "outline" as const },
        { label: "Annuler", action: "annuler", variant: "destructive" as const },
      ];
    }
    return [];
  };

  const applyRendezVousAction = async (rdvId: string, action: string) => {
    if (action === "proposer-creneau") {
      setAppointmentActionError(null);
      setProposerModalRdvId(rdvId);
      setProposerDateHeure("");
      return;
    }
    setAppointmentActionLoadingId(rdvId);
    setAppointmentActionError(null);
    try {
      await apiClient.patch(`/rendezvous/${rdvId}/${action}`);
      await loadAppointments();
    } catch (error) {
      const apiError = error as {
        response?: { data?: { error?: string; message?: string } };
      };
      const apiMessage =
        apiError?.response?.data?.error ?? apiError?.response?.data?.message ?? "";
      if (
        apiMessage.toLowerCase().includes("transition de statut invalide") ||
        apiMessage.toLowerCase().includes("transition")
      ) {
        setAppointmentActionError(
          "Transition de statut invalide. La liste a été rechargée avec le statut courant.",
        );
        await loadAppointments();
      } else {
        setAppointmentActionError("Impossible de mettre à jour ce rendez-vous.");
      }
    } finally {
      setAppointmentActionLoadingId(null);
    }
  };

  const submitProposerCreneau = async () => {
    if (!proposerModalRdvId) return;
    if (!proposerDateHeure) {
      setAppointmentActionError(
        "Veuillez renseigner une nouvelle date et heure pour proposer un créneau.",
      );
      return;
    }
    const normalizedDateHeure = proposerDateHeure.length === 16
      ? `${proposerDateHeure}:00`
      : proposerDateHeure;
    setIsSubmittingProposer(true);
    setAppointmentActionError(null);
    try {
      await apiClient.patch(
        `/rendezvous/${proposerModalRdvId}/proposer-creneau`,
        {
          dateHeure: normalizedDateHeure,
        },
      );
      setProposerModalRdvId(null);
      setProposerDateHeure("");
      await loadAppointments();
    } catch {
      setAppointmentActionError("Impossible de proposer ce nouveau créneau.");
    } finally {
      setIsSubmittingProposer(false);
    }
  };

  const openPatientRecord = async (id: string) => {
    const rdv = appointments.find((item) => item.id === id);
    if (!rdv) return;
    setPatientDetailsLoading(true);
    setPatientDetailsError(null);
    try {
      const [patientDetailRes, antecedentsRes, constantesRes, consultationsRes] =
        await Promise.all([
          apiClient.get<PatientDetailResponse>(`/medecins/me/patients/${rdv.patientId}`),
          apiClient.get<AntecedentResponse[]>(
            `/medecins/me/patients/${rdv.patientId}/antecedents`,
          ),
          apiClient.get<ConstanteResponse[]>(
            `/medecins/me/patients/${rdv.patientId}/constantes`,
          ),
          apiClient.get<ConsultationResponse[]>(
            `/medecins/me/patients/${rdv.patientId}/consultations`,
          ),
        ]);

      const patientDetail = patientDetailRes.data;
      const nextPatient: PatientRecord = {
        id: String(patientDetail.id),
        nom: patientDetail.nom,
        prenom: patientDetail.prenom,
        sexe: patientDetail.sexe === "HOMME" ? "M" : "F",
        dateNaissance: patientDetail.dateNaissance ?? "-",
        numeroDossier: `PAT-${patientDetail.id}`,
        contact: patientDetail.telephone ?? "-",
        adresse: patientDetail.adresse ?? "-",
        antecedents: (antecedentsRes.data ?? []).map((ant) => ({
          id: String(ant.id),
          label: ant.description,
        })),
        constantes: (constantesRes.data ?? []).map((cst) => ({
          id: String(cst.id),
          date: cst.date,
          tension: cst.tension,
          glycemie: String(cst.glycemie),
          poids: String(cst.poids),
          imc: String(cst.imc),
        })),
        historiqueConsultations: (consultationsRes.data ?? []).map((consult) => ({
          id: String(consult.id),
          rendezVousId:
            consult.rendezVousId !== undefined
              ? String(consult.rendezVousId)
              : undefined,
          date: consult.date,
          motif: consult.motif,
          diagnostic: consult.diagnostic,
        })),
      };

      setAppointments((prev) =>
        prev.map((item) => (item.id === id ? { ...item, patient: nextPatient } : item)),
      );
      setSelectedAppointmentId(id);
      setIsDiagnosisModalOpen(false);
    } catch {
      setPatientDetailsError("Impossible de charger le dossier patient.");
    } finally {
      setPatientDetailsLoading(false);
    }
  };

  const openConsultation = (id: string) => {
    setSelectedAppointmentId(id);
    setConsultationStep(1);
    setConsultationDate(today);
    setConsultationMotif("");
    setConsultationDiagnostic("");
    setConsultationFlowError(null);
    setPrescriptionPdfBlob(null);
    setPrescriptionPdfFileName("");
    clearSignatureCanvas();
    setIsDiagnosisModalOpen(true);
    markAppointmentStatus(id, "CONFIRME");
  };

  const addAntecedent = async () => {
    if (!selectedAppointment || !antecedentInput.trim()) return;
    const value = antecedentInput.trim();
    try {
      const { data } = await apiClient.post<{ id: number; description: string }>(
        `/patients/${selectedAppointment.patientId}/antecedents`,
        { description: value },
      );
      setAppointments((prev) =>
        prev.map((rdv) =>
          rdv.id === selectedAppointment.id
            ? {
                ...rdv,
                patient: {
                  ...rdv.patient,
                  antecedents: [
                    ...rdv.patient.antecedents,
                    { id: String(data.id), label: data.description },
                  ],
                },
              }
            : rdv,
        ),
      );
      setAntecedentInput("");
    } catch {
      setPatientDetailsError("Échec lors de l'ajout de l'antécédent.");
    }
  };

  const addVitalSign = async () => {
    setPatientDetailsError(null);
    if (
      !selectedAppointment ||
      !newVital.tension ||
      !newVital.glycemie ||
      !newVital.poids ||
      !newVital.imc
    ) {
      setPatientDetailsError(
        "Veuillez remplir tous les champs des constantes avant d'ajouter.",
      );
      return;
    }

    if (!selectedAppointment.patientId) {
      setPatientDetailsError(
        "ID patient introuvable pour cette card.",
      );
      return;
    }

    const glycemie = Number(newVital.glycemie);
    const poids = Number(newVital.poids);
    const imc = Number(newVital.imc);
    if (
      Number.isNaN(glycemie) ||
      Number.isNaN(poids) ||
      Number.isNaN(imc)
    ) {
      setPatientDetailsError(
        "Glycémie, poids et IMC doivent être des valeurs numériques valides.",
      );
      return;
    }

    try {
      const payload = {
        date: newVital.date,
        glycemie,
        tension: newVital.tension,
        poids,
        imc,
      };
      const { data } = await apiClient.post<ConstanteResponse>(
        `/${selectedAppointment.patientId}/constantes`,
        payload,
      );
      setAppointments((prev) =>
        prev.map((rdv) =>
          rdv.id === selectedAppointment.id
            ? {
                ...rdv,
                patient: {
                  ...rdv.patient,
                  constantes: [
                    ...rdv.patient.constantes,
                    {
                      id: String(data.id),
                      date: data.date,
                      tension: data.tension,
                      glycemie: String(data.glycemie),
                      poids: String(data.poids),
                      imc: String(data.imc),
                    },
                  ],
                },
              }
            : rdv,
        ),
      );
      setNewVital({ date: today, tension: "", glycemie: "", poids: "", imc: "" });
    } catch {
      setPatientDetailsError(
        "Échec lors de l'ajout des constantes. Vérifiez que la consultation est valide.",
      );
    }
  };

  const saveClinicalStep = () => {
    if (
      !selectedAppointment ||
      !consultationMotif.trim() ||
      !consultationDiagnostic.trim()
    )
      return;
    setConsultationFlowError(null);
    setPrescriptionPdfBlob(null);
    setPrescriptionPdfFileName("");
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
          : rdv,
      ),
    );
    setConsultationStep(2);
  };

  const updatePrescriptionLine = (
    id: string,
    key: keyof PrescriptionLine,
    value: string,
  ) => {
    setPrescriptionLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, [key]: value } : line)),
    );
  };

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
    ]);
  };

  const getFinalForme = (line: PrescriptionLine) =>
    line.forme === AUTRE_OPTION ? line.formeAutre.trim() : line.forme.trim();
  const getFinalPosologie = (line: PrescriptionLine) =>
    line.posologie === AUTRE_OPTION
      ? line.posologieAutre.trim()
      : line.posologie.trim();
  const getFinalModeAdministration = (line: PrescriptionLine) =>
    line.modeAdministration === AUTRE_OPTION
      ? line.modeAdministrationAutre.trim()
      : line.modeAdministration.trim();

  const clearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl(null);
    setSignatureSource(null);
  };

  const getCanvasCoordinates = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * canvas.width) / rect.width,
      y: ((event.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const handleSignaturePointerDown = (
    event: PointerEvent<HTMLCanvasElement>,
  ) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const point = getCanvasCoordinates(event);
    if (!ctx || !point) return;
    setIsSignatureDrawing(true);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#111827";
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const handleSignaturePointerMove = (
    event: PointerEvent<HTMLCanvasElement>,
  ) => {
    if (!isSignatureDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const point = getCanvasCoordinates(event);
    if (!ctx || !point) return;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const endSignaturePointer = () => {
    if (!isSignatureDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    setIsSignatureDrawing(false);
    setSignatureDataUrl(canvas.toDataURL("image/png"));
    setSignatureSource("pad");
  };

  const handleSignatureImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) return;
      setSignatureDataUrl(result);
      setSignatureSource("image");
      const canvas = signatureCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const getValidPrescriptionLines = () =>
    prescriptionLines.filter(
      (line) =>
        line.medicament.trim() ||
        line.dosage.trim() ||
        getFinalForme(line) ||
        getFinalPosologie(line) ||
        line.duree.trim() ||
        getFinalModeAdministration(line) ||
        line.instructions.trim(),
    );

  const createPrescriptionDocument = () => {
    if (!selectedAppointment) return null;
    const validLines = getValidPrescriptionLines();
    if (validLines.length === 0) return null;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const cabinetAddress = selectedAppointment.adresseCabinet || "Adresse non renseignée";
    const doctorPhone = user?.email || "Téléphone non renseigné";
    const patientSexeLabel =
      selectedAppointment.patient.sexe === "M" ? "Homme" : "Femme";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("ORDONNANCE MEDICALE", pageWidth / 2, 18, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Dr ${displayName}`, 14, 30);
    doc.text(`Specialite: ${roleLabel}`, 14, 36);
    doc.text("N° RPPS: 00000000000", 14, 42);
    doc.text(`Cabinet: ${cabinetAddress}`, 14, 48);
    doc.text(`Contact: ${doctorPhone}`, 14, 54);
    doc.text(`Date: ${formatDateFrCompact(consultationDate)}`, pageWidth - 14, 30, {
      align: "right",
    });

    doc.setLineWidth(0.4);
    doc.line(14, 60, pageWidth - 14, 60);

    doc.setFont("helvetica", "bold");
    doc.text("Patient", 14, 68);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${selectedAppointment.patient.prenom} ${selectedAppointment.patient.nom} | ${patientSexeLabel} | Ne(e) le ${formatDateFrCompact(selectedAppointment.patient.dateNaissance)}`,
      14,
      74,
    );
    doc.text(
      `Motif: ${consultationMotif.trim() || selectedAppointment.motif}`,
      14,
      80,
    );
    if (consultationDiagnostic.trim()) {
      doc.text(`Indication: ${consultationDiagnostic.trim()}`, 14, 86);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("R/", 14, 102);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    let y = 112;
    validLines.forEach((line, index) => {
      const chunks = [
        `${index + 1}. ${line.medicament || "Medicament"} ${line.dosage ? `- ${line.dosage}` : ""} ${getFinalForme(line) ? `(${getFinalForme(line)})` : ""}`,
        getFinalPosologie(line) ? `Posologie: ${getFinalPosologie(line)}` : "",
        line.duree ? `Duree: ${line.duree}` : "",
        getFinalModeAdministration(line)
          ? `Voie: ${getFinalModeAdministration(line)}`
          : "",
        line.instructions ? `Instructions: ${line.instructions}` : "",
      ].filter(Boolean);

      chunks.forEach((chunk) => {
        const split = doc.splitTextToSize(chunk, pageWidth - 36);
        doc.text(split, 18, y);
        y += split.length * 6;
      });
      y += 4;
    });

    doc.setLineWidth(0.2);
    doc.line(14, 270, pageWidth - 14, 270);
    doc.setFontSize(10);
    doc.text("Signature et cachet du medecin", pageWidth - 14, 277, {
      align: "right",
    });
    if (signatureDataUrl) {
      const format = signatureDataUrl.includes("image/jpeg") ? "JPEG" : "PNG";
      doc.addImage(signatureDataUrl, format, pageWidth - 64, 246, 46, 18);
    }

    const fileName = `ordonnance-${selectedAppointment.patient.id}-${consultationDate}.pdf`;
    return { doc, fileName };
  };

  const generatePrescriptionPdf = () => {
    setConsultationFlowError(null);
    const payload = createPrescriptionDocument();
    if (!payload) {
      setConsultationFlowError(
        "Veuillez saisir au moins une ligne d'ordonnance avant de continuer.",
      );
      return;
    }
    const { doc, fileName } = payload;
    const pdfBlob = doc.output("blob");
    setPrescriptionPdfBlob(pdfBlob);
    setPrescriptionPdfFileName(fileName);
    doc.save(
      fileName,
    );
  };

  const endConsultation = async () => {
    if (!selectedAppointment) return;
    setConsultationFlowError(null);
    const rendezVousId = Number(selectedAppointment.id);
    if (!Number.isFinite(rendezVousId) || !Number.isFinite(medecinId)) {
      setConsultationFlowError("Impossible de finaliser : identifiants invalides.");
      return;
    }
    if (!consultationMotif.trim() || !consultationDiagnostic.trim()) {
      setConsultationFlowError(
        "Veuillez renseigner motif et diagnostic avant de terminer la consultation.",
      );
      return;
    }

    let pdfBlobToUpload = prescriptionPdfBlob;
    let pdfFileNameToUpload = prescriptionPdfFileName;
    if (!pdfBlobToUpload) {
      const generated = createPrescriptionDocument();
      if (!generated) {
        setConsultationFlowError(
          "Veuillez saisir au moins une ligne d'ordonnance avant de continuer.",
        );
        return;
      }
      pdfBlobToUpload = generated.doc.output("blob");
      pdfFileNameToUpload = generated.fileName;
      setPrescriptionPdfBlob(pdfBlobToUpload);
      setPrescriptionPdfFileName(pdfFileNameToUpload);
    }

    setIsFinalizingConsultation(true);
    try {
      const consultationFromHistory =
        selectedAppointment.patient.historiqueConsultations.find(
          (consultation) =>
            consultation.rendezVousId === selectedAppointment.id &&
            consultation.id,
        )?.id ?? null;

      let consultationIdToUse =
        consultationFromHistory && !Number.isNaN(Number(consultationFromHistory))
          ? Number(consultationFromHistory)
          : null;

      if (!consultationIdToUse) {
        const { data: createdConsultation } = await apiClient.post<{ id: number }>(
          "/consultations",
          {
            rendezVousId,
            patientId: selectedAppointment.patientId,
            medecinId,
            motif: consultationMotif.trim(),
            diagnostic: consultationDiagnostic.trim(),
            date: consultationDate,
          },
        );
        consultationIdToUse = createdConsultation.id;
      }

      const formData = new FormData();
      formData.append(
        "pdfContent",
        pdfBlobToUpload,
        pdfFileNameToUpload || `ordonnance-${selectedAppointment.id}.pdf`,
      );
      await apiClientMultipart.post(
        `/consultations/${consultationIdToUse}/ordonnance`,
        formData,
      );
      await apiClient.patch(`/rendezvous/${selectedAppointment.id}/terminer`);

      markAppointmentStatus(selectedAppointment.id, "TERMINE");
      setSelectedAppointmentId(null);
      setIsDiagnosisModalOpen(false);
      setConsultationStep(1);
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
      ]);
      setPrescriptionPdfBlob(null);
      setPrescriptionPdfFileName("");
      clearSignatureCanvas();
    } catch {
      setConsultationFlowError(
        "Échec de la finalisation : consultation/ordonnance non enregistrée.",
      );
    } finally {
      setIsFinalizingConsultation(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutRequest();
    } catch {
      // Même en cas d'erreur réseau/API, on nettoie la session côté client.
    } finally {
      logout();
      navigate("/login", { replace: true });
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F6FA] text-foreground font-sans">
      <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-border/40 bg-white md:sticky md:top-0 md:flex">
        <div className="flex h-20 items-center gap-2.5 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z" />
            </svg>
          </div>
          <div>
            <p className="text-xl font-black tracking-tight leading-none">
              Curalink
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
              Espace Médecin
            </p>
          </div>
        </div>

        <div className="mx-4 mt-2 mb-4 rounded-2xl bg-linear-to-br from-primary to-primary/80 p-4 text-primary-foreground shadow-lg shadow-primary/20">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-xl font-bold uppercase backdrop-blur-sm border-2 border-white/30">
              Dr
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">Dr. {displayName}</p>
              <p className="text-[11px] font-medium text-white/80 truncate">
                {roleLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4">
          <nav className="space-y-1">
            <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Navigation
            </p>
            <button
              onClick={() => setActiveView("rendezvous")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all relative overflow-hidden group ${activeView === "rendezvous" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              {activeView === "rendezvous" && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full"></span>
              )}
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${activeView === "rendezvous" ? "bg-primary text-primary-foreground" : "bg-muted/50 group-hover:bg-muted"}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 2v4" />
                  <path d="M8 2v4" />
                  <path d="M3 10h18" />
                  <path d="M10 14h4v4h-4z" />
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                </svg>
              </div>
              <span className="flex-1 text-left">Consultations</span>
              <span
                className={`ml-auto text-[10px] font-bold rounded-full px-2 py-0.5 ${activeView === "rendezvous" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {filteredAppointments.length}
              </span>
            </button>
            <button
              onClick={() => setActiveView("planning")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all relative overflow-hidden group ${activeView === "planning" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              {activeView === "planning" && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full"></span>
              )}
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${activeView === "planning" ? "bg-primary text-primary-foreground" : "bg-muted/50 group-hover:bg-muted"}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                  <path d="M8 14h.01" />
                  <path d="M12 14h.01" />
                  <path d="M16 14h.01" />
                  <path d="M8 18h.01" />
                  <path d="M12 18h.01" />
                  <path d="M16 18h.01" />
                </svg>
              </div>
              <span className="flex-1 text-left">Mon planning</span>
            </button>
            <button
              onClick={() => setActiveView("disponibilites")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all relative overflow-hidden group ${activeView === "disponibilites" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              {activeView === "disponibilites" && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full"></span>
              )}
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${activeView === "disponibilites" ? "bg-primary text-primary-foreground" : "bg-muted/50 group-hover:bg-muted"}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span className="flex-1 text-left">Disponibilités</span>
            </button>
          </nav>
        </div>

        <div className="p-4 mt-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 rounded-xl h-11 text-muted-foreground font-semibold hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
            </div>
            {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="flex h-20 items-center justify-between bg-[#F5F6FA]/80 backdrop-blur-md px-6 md:px-10 sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-black tracking-tight">
              {activeView === "rendezvous" && "Vos Consultations"}
              {activeView === "planning" && "Votre Planning"}
              {activeView === "disponibilites" && "Vos Disponibilités"}
            </h1>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">
              {activeView === "rendezvous" &&
                "Gérez vos rendez-vous et effectuez vos diagnostics."}
              {activeView === "planning" &&
                "Aperçu de votre emploi du temps et de vos patients."}
              {activeView === "disponibilites" &&
                "Configurez vos créneaux libres pour les rendez-vous."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white shadow-sm h-11 w-11 relative"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
            </Button>
          </div>
        </header>

        <div className="p-6 md:p-10 space-y-8 max-w-[1400px] mx-auto">
          {activeView === "rendezvous" && (
            <div className="space-y-6">
              {!selectedAppointment && (
                <Card className="rounded-2xl border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle>Liste des rendez-vous</CardTitle>
                    <CardDescription>
                      Sélectionnez un rendez-vous pour ouvrir le dossier patient.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="max-w-xs space-y-2">
                      <Label htmlFor="rdv-date">Date</Label>
                      <Input
                        id="rdv-date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-3">
                      {appointmentsLoading && (
                        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                          Chargement des rendez-vous...
                        </div>
                      )}
                      {!appointmentsLoading && filteredAppointments.length === 0 && (
                        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                          Aucun rendez-vous sur cette date.
                        </div>
                      )}

                      {!appointmentsLoading &&
                        filteredAppointments.map((rdv) => (
                        <div
                          key={rdv.id}
                          className="flex flex-col gap-3 rounded-xl border border-border/60 bg-white p-4 shadow-sm transition-colors hover:border-primary/40 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-bold">
                              {rdv.heure} - {rdv.patient.prenom} {rdv.patient.nom}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Motif: {rdv.motif}
                            </p>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                rdv.status === "TERMINE"
                                  ? "bg-muted text-muted-foreground"
                                  : rdv.status === "PROPOSE"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-primary/10 text-primary"
                              }`}
                            >
                              {rdv.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {getStatusActions(rdv.status).map((item) => (
                              <Button
                                key={`${rdv.id}-${item.action}`}
                                size="sm"
                                variant={item.variant}
                                disabled={appointmentActionLoadingId === rdv.id}
                                onClick={() => {
                                  void applyRendezVousAction(rdv.id, item.action);
                                }}
                              >
                                {appointmentActionLoadingId === rdv.id
                                  ? "Chargement..."
                                  : item.label}
                              </Button>
                            ))}
                            <Button
                              variant="outline"
                              className="rounded-full"
                              disabled={appointmentActionLoadingId === rdv.id}
                              onClick={() => {
                                void openPatientRecord(rdv.id);
                              }}
                            >
                              Voir
                            </Button>
                          </div>
                        </div>
                      ))}
                      {appointmentActionError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                          {appointmentActionError}
                        </div>
                      )}
                      {appointmentsError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                          {appointmentsError}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 border-t border-border/60 pt-4">
                      <h3 className="text-sm font-semibold">
                        Historique des rendez-vous effectués (3 derniers mois)
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Consultations terminées récemment.
                      </p>
                      <div className="mt-3 space-y-2">
                        {recentCompletedAppointments.length === 0 && (
                          <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                            Aucun rendez-vous terminé sur cette période.
                          </div>
                        )}
                        {recentCompletedAppointments.map((rdv) => (
                          <div
                            key={`history-${rdv.id}`}
                            className="flex flex-col gap-1 rounded-xl border border-border/60 bg-muted/20 p-3 text-sm md:flex-row md:items-center md:justify-between"
                          >
                            <p className="font-medium">
                              {formatDateFrCompact(rdv.date)} à {rdv.heure} -{" "}
                              {rdv.patient.prenom}{" "}
                              {rdv.patient.nom}
                            </p>
                            <p className="text-muted-foreground">
                              Motif: {rdv.motif}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedAppointment && (
                <Card className="rounded-2xl border-border/60 shadow-sm">
                  <CardHeader className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Button
                        variant="ghost"
                        className="px-0 text-primary hover:bg-transparent hover:underline"
                        onClick={() => setSelectedAppointmentId(null)}
                      >
                        ← Retour à la liste
                      </Button>
                      <Button
                        className="rounded-full"
                        onClick={() => openConsultation(selectedAppointment.id)}
                        disabled={selectedAppointment.status === "TERMINE"}
                      >
                        Effectuer le diagnostic
                      </Button>
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        Dossier médical - {selectedAppointment.patient.prenom}{" "}
                        {selectedAppointment.patient.nom}
                      </CardTitle>
                      <CardDescription>
                        Rendez-vous du{" "}
                        {formatDateFrCompact(selectedAppointment.date)} à{" "}
                        {selectedAppointment.heure} - Motif:{" "}
                        {selectedAppointment.motif}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {patientDetailsLoading && (
                      <div className="mb-4 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                        Chargement du dossier patient...
                      </div>
                    )}
                    {patientDetailsError && (
                      <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {patientDetailsError}
                      </div>
                    )}
                    <PatientRecordView
                      patient={selectedAppointment.patient}
                      antecedentAction={
                        <div className="flex flex-col gap-2 sm:flex-row">
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
                              onChange={(e) =>
                                setNewVital((prev) => ({
                                  ...prev,
                                  date: e.target.value,
                                }))
                              }
                            />
                            <Input
                              placeholder="Tension (mmHg)"
                              value={newVital.tension}
                              onChange={(e) =>
                                setNewVital((prev) => ({
                                  ...prev,
                                  tension: e.target.value,
                                }))
                              }
                            />
                            <Input
                              placeholder="Glycémie (g/L)"
                              value={newVital.glycemie}
                              onChange={(e) =>
                                setNewVital((prev) => ({
                                  ...prev,
                                  glycemie: e.target.value,
                                }))
                              }
                            />
                            <Input
                              placeholder="Poids (kg)"
                              value={newVital.poids}
                              onChange={(e) =>
                                setNewVital((prev) => ({
                                  ...prev,
                                  poids: e.target.value,
                                }))
                              }
                            />
                            <Input
                              placeholder="IMC"
                              value={newVital.imc}
                              onChange={(e) =>
                                setNewVital((prev) => ({
                                  ...prev,
                                  imc: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <Button
                            variant="outline"
                            onClick={addVitalSign}
                            className="w-full sm:w-auto"
                          >
                            Ajouter
                          </Button>
                        </div>
                      }
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {isDiagnosisModalOpen && selectedAppointment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-xl border bg-background shadow-xl">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-6 py-4">
                  <div>
                    <h3 className="text-xl font-semibold">
                      Diagnostic - {selectedAppointment.patient.prenom}{" "}
                      {selectedAppointment.patient.nom}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Rendez-vous du{" "}
                      {formatDateFrCompact(selectedAppointment.date)} à{" "}
                      {selectedAppointment.heure}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDiagnosisModalOpen(false);
                      if (selectedAppointment.status !== "TERMINE") {
                        markAppointmentStatus(
                          selectedAppointment.id,
                          "CONFIRME",
                        );
                      }
                    }}
                  >
                    Fermer
                  </Button>
                </div>

                <div className="px-6 py-5">
                  {consultationFlowError && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {consultationFlowError}
                    </div>
                  )}
                  <div className="mb-6 flex items-center gap-2">
                    <div
                      className={`h-2.5 rounded-full transition-all ${consultationStep === 1 ? "w-12 bg-primary" : "w-4 bg-primary/40"}`}
                    />
                    <div
                      className={`h-2.5 rounded-full transition-all ${consultationStep === 2 ? "w-12 bg-primary" : "w-4 bg-primary/40"}`}
                    />
                    <div
                      className={`h-2.5 rounded-full transition-all ${consultationStep === 3 ? "w-12 bg-primary" : "w-4 bg-muted"}`}
                    />
                  </div>

                  {consultationStep === 1 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Saisie clinique
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label>Date de consultation</Label>
                          <Input
                            type="date"
                            value={consultationDate}
                            onChange={(e) =>
                              setConsultationDate(e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Motif</Label>
                          <Input
                            value={consultationMotif}
                            onChange={(e) =>
                              setConsultationMotif(e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Diagnostic</Label>
                          <textarea
                            className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                            value={consultationDiagnostic}
                            onChange={(e) =>
                              setConsultationDiagnostic(e.target.value)
                            }
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
                          <CardTitle className="text-base">
                            Saisie ordonnance
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {prescriptionLines.map((line) => (
                            <div
                              key={line.id}
                              className="grid gap-2 rounded-md border p-3 md:grid-cols-2"
                            >
                              <div className="space-y-1">
                                <Label className="text-xs">Médicament (DCI)</Label>
                                <Input
                                  placeholder="Nom médicament (DCI)"
                                  value={line.medicament}
                                  onChange={(e) =>
                                    updatePrescriptionLine(
                                      line.id,
                                      "medicament",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Dosage</Label>
                                <Input
                                  placeholder="Dosage"
                                  value={line.dosage}
                                  onChange={(e) =>
                                    updatePrescriptionLine(
                                      line.id,
                                      "dosage",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Forme pharmaceutique</Label>
                                <select
                                  className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                  value={line.forme}
                                  onChange={(e) =>
                                    updatePrescriptionLine(
                                      line.id,
                                      "forme",
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option value="">
                                    Choisir une forme pharmaceutique
                                  </option>
                                  {MEDICAMENT_FORMS.map((form) => (
                                    <option key={form} value={form}>
                                      {form}
                                    </option>
                                  ))}
                                  <option value={AUTRE_OPTION}>Autre</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Posologie</Label>
                                <select
                                  className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                  value={line.posologie}
                                  onChange={(e) =>
                                    updatePrescriptionLine(
                                      line.id,
                                      "posologie",
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option value="">Choisir une posologie</option>
                                  {POSOLOGY_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                  <option value={AUTRE_OPTION}>Autre</option>
                                </select>
                              </div>
                              {line.forme === AUTRE_OPTION && (
                                <div className="space-y-1 md:col-span-2">
                                  <Label className="text-xs">
                                    Autre forme pharmaceutique
                                  </Label>
                                  <Input
                                    placeholder="Autre forme pharmaceutique..."
                                    value={line.formeAutre}
                                    onChange={(e) =>
                                      updatePrescriptionLine(
                                        line.id,
                                        "formeAutre",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                              )}
                              {line.posologie === AUTRE_OPTION && (
                                <div className="space-y-1 md:col-span-2">
                                  <Label className="text-xs">Autre posologie</Label>
                                  <Input
                                    placeholder="Autre posologie..."
                                    value={line.posologieAutre}
                                    onChange={(e) =>
                                      updatePrescriptionLine(
                                        line.id,
                                        "posologieAutre",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                              )}
                              <div className="space-y-1">
                                <Label className="text-xs">
                                  Durée du traitement
                                </Label>
                                <Input
                                  placeholder="Durée du traitement"
                                  value={line.duree}
                                  onChange={(e) =>
                                    updatePrescriptionLine(
                                      line.id,
                                      "duree",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">
                                  Mode d'administration
                                </Label>
                                <select
                                  className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                  value={line.modeAdministration}
                                  onChange={(e) =>
                                    updatePrescriptionLine(
                                      line.id,
                                      "modeAdministration",
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option value="">
                                    Choisir un mode d'administration
                                  </option>
                                  {ADMINISTRATION_ROUTES.map((route) => (
                                    <option key={route} value={route}>
                                      {route}
                                    </option>
                                  ))}
                                  <option value={AUTRE_OPTION}>Autre</option>
                                </select>
                              </div>
                              {line.modeAdministration === AUTRE_OPTION && (
                                <div className="space-y-1 md:col-span-2">
                                  <Label className="text-xs">
                                    Autre mode d'administration
                                  </Label>
                                  <Input
                                    placeholder="Autre mode d'administration..."
                                    value={line.modeAdministrationAutre}
                                    onChange={(e) =>
                                      updatePrescriptionLine(
                                        line.id,
                                        "modeAdministrationAutre",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                              )}
                              <div className="md:col-span-2">
                                <Label className="mb-1 block text-xs">
                                  Instructions spécifiques
                                </Label>
                                <Input
                                  placeholder="Instructions spécifiques"
                                  value={line.instructions}
                                  onChange={(e) =>
                                    updatePrescriptionLine(
                                      line.id,
                                      "instructions",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            onClick={addPrescriptionLine}
                          >
                            Ajouter une ligne
                          </Button>

                          <div className="space-y-3 rounded-md border p-3">
                            <p className="text-sm font-medium">
                              Signature du médecin
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Dessinez votre signature dans le pad ou importez
                              une image de signature.
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
                              <Button
                                type="button"
                                variant="outline"
                                onClick={clearSignatureCanvas}
                              >
                                Effacer la signature
                              </Button>
                              <label className="inline-flex cursor-pointer items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
                                Importer une image
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/jpg"
                                  className="hidden"
                                  onChange={handleSignatureImageUpload}
                                />
                              </label>
                              {signatureSource && (
                                <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                                  Source:{" "}
                                  {signatureSource === "pad" ? "Pad" : "Image"}
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="justify-between">
                          <Button
                            variant="outline"
                            onClick={() => setConsultationStep(1)}
                          >
                            Retour
                          </Button>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={generatePrescriptionPdf}>
                              Générer et télécharger le PDF
                            </Button>
                            <Button
                              onClick={() => setConsultationStep(3)}
                              disabled={getValidPrescriptionLines().length === 0}
                            >
                              Continuer
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">
                            Prévisualisation ordonnance
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="min-h-[560px] rounded-md border bg-white p-6 text-black">
                            <p className="text-center text-lg font-bold">
                              ORDONNANCE MEDICALE
                            </p>
                            <div className="mt-5 text-sm">
                              <p>Dr {displayName}</p>
                              <p>Spécialité: {roleLabel}</p>
                              <p>N° RPPS: 00000000000</p>
                              <p>
                                Cabinet:{" "}
                                {selectedAppointment.adresseCabinet ||
                                  "Adresse non renseignée"}
                              </p>
                              <p>Contact: {user?.email || "Non renseigné"}</p>
                              <p className="mt-2">
                                Date: {formatDateFrCompact(consultationDate)}
                              </p>
                            </div>
                            <hr className="my-4" />
                            <p className="text-sm">
                              <span className="font-semibold">Patient:</span>{" "}
                              {selectedAppointment.patient.prenom}{" "}
                              {selectedAppointment.patient.nom}
                            </p>
                            <p className="text-sm">
                              <span className="font-semibold">Naissance:</span>{" "}
                              {formatDateFrCompact(
                                selectedAppointment.patient.dateNaissance,
                              )}
                            </p>
                            <p className="text-sm">
                              <span className="font-semibold">Sexe:</span>{" "}
                              {selectedAppointment.patient.sexe === "M"
                                ? "Homme"
                                : "Femme"}
                            </p>
                            <p className="text-sm">
                              <span className="font-semibold">Motif:</span>{" "}
                              {consultationMotif || selectedAppointment.motif}
                            </p>
                            {consultationDiagnostic && (
                              <p className="text-sm">
                                <span className="font-semibold">
                                  Diagnostic / indication:
                                </span>{" "}
                                {consultationDiagnostic}
                              </p>
                            )}
                            <p className="mt-5 text-xl font-semibold">R/</p>
                            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm">
                              {prescriptionLines
                                .filter(
                                  (line) =>
                                    line.medicament.trim() ||
                                    getFinalPosologie(line) ||
                                    line.instructions.trim(),
                                )
                                .map((line) => (
                                  <li key={line.id}>
                                    <p className="font-semibold">
                                      {line.medicament || "Médicament"}{" "}
                                      {line.dosage ? `- ${line.dosage}` : ""}{" "}
                                      {getFinalForme(line)
                                        ? `(${getFinalForme(line)})`
                                        : ""}
                                    </p>
                                    {getFinalPosologie(line) && (
                                      <p>
                                        Posologie: {getFinalPosologie(line)}
                                      </p>
                                    )}
                                    {line.duree && <p>Durée: {line.duree}</p>}
                                    {getFinalModeAdministration(line) && (
                                      <p>
                                        Voie: {getFinalModeAdministration(line)}
                                      </p>
                                    )}
                                    {line.instructions && (
                                      <p>Instructions: {line.instructions}</p>
                                    )}
                                  </li>
                                ))}
                            </ol>
                            <div className="mt-10 flex justify-end">
                              <div className="w-52 border-t pt-2 text-right text-xs">
                                <p className="mb-2 text-muted-foreground">
                                  Signature et cachet du médecin
                                </p>
                                {signatureDataUrl ? (
                                  <img
                                    src={signatureDataUrl}
                                    alt="Signature du médecin"
                                    className="ml-auto h-16 w-48 object-contain"
                                  />
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
                        <CardTitle className="text-base">
                          Clôture consultation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Vérifiez les informations puis terminez la consultation.
                          La consultation sera créée dans l'API et le PDF de
                          l'ordonnance sera transmis automatiquement.
                        </p>
                      </CardContent>
                      <CardFooter className="justify-end">
                        <Button
                          onClick={() => {
                            void endConsultation();
                          }}
                          disabled={isFinalizingConsultation}
                        >
                          {isFinalizingConsultation
                            ? "Finalisation..."
                            : "Terminer la consultation"}
                        </Button>
                      </CardFooter>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeView === "disponibilites" && (
            <MedecinDisponibilitesPage />
          )}

          {activeView === "planning" && (
            <div className="space-y-6">
              <Card className="rounded-2xl border-border/60 p-2 shadow-sm md:p-4">
                <CalendarView
                  events={[
                    ...appointments.map((rdv) => ({
                      id: rdv.id,
                      date: rdv.date,
                      time: rdv.heure,
                      title: `Consultation - ${rdv.patient.prenom} ${rdv.patient.nom}`,
                      colorClass:
                        rdv.status === "TERMINE"
                          ? "bg-muted/80 text-muted-foreground border-transparent"
                          : "bg-primary text-primary-foreground border-primary/20",
                    })),
                    ...availabilities.map((disp) => ({
                      id: disp.id,
                      date: disp.date,
                      time: `${disp.debut} - ${disp.fin}`,
                      title: "Plage disponible",
                      colorClass:
                        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-900",
                    })),
                  ]}
                  onDateClick={(d) => {
                    setSelectedDate(d);
                    setIsPlanningDetailsModalOpen(true);
                  }}
                  selectedDate={selectedDate}
                />
              </Card>

              <Card className="rounded-2xl border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>Rendez-vous à venir</CardTitle>
                  <CardDescription>
                    Liste de vos prochaines consultations planifiées.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingAppointments.length === 0 && (
                    <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                      Aucun rendez-vous à venir.
                    </div>
                  )}

                  {upcomingAppointments.map((rdv) => (
                    <div
                      key={`upcoming-${rdv.id}`}
                      className="flex flex-col gap-2 rounded-xl border border-border/60 bg-white p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          {formatDateFrCompact(rdv.date)} à {rdv.heure}
                        </p>
                        <p className="text-sm">
                          {rdv.patient.prenom} {rdv.patient.nom}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Motif: {rdv.motif}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {isPlanningDetailsModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-2xl rounded-2xl border bg-background shadow-xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                  <div>
                    <h3 className="text-xl font-semibold">
                      Détails du {formatDateFrCompact(selectedDate)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Vos rendez-vous et disponibilités prévus
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsPlanningDetailsModalOpen(false)}
                  >
                    Fermer
                  </Button>
                </div>

                <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-5">
                  <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary"
                      >
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                        <line x1="16" x2="16" y1="2" y2="6" />
                        <line x1="8" x2="8" y1="2" y2="6" />
                        <line x1="3" x2="21" y1="10" y2="10" />
                        <path d="M8 14h.01" />
                        <path d="M12 14h.01" />
                        <path d="M16 14h.01" />
                        <path d="M8 18h.01" />
                        <path d="M12 18h.01" />
                        <path d="M16 18h.01" />
                      </svg>
                      Rendez-vous
                    </h4>
                    {filteredAppointments.length === 0 && (
                      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                        Aucun rendez-vous
                      </div>
                    )}
                    {filteredAppointments.map((rdv) => (
                      <div
                        key={rdv.id}
                        className="rounded-md border border-l-4 border-l-primary bg-card p-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{rdv.heure}</span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${rdv.status === "TERMINE" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}
                          >
                            {rdv.status}
                          </span>
                        </div>
                        <p className="mt-1 font-medium">
                          {rdv.patient.prenom} {rdv.patient.nom}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-green-600 dark:text-green-400"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      Disponibilités
                    </h4>
                    {availabilities.filter((d) => d.date === selectedDate).length ===
                      0 && (
                      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                        Aucune disponibilité configurée
                      </div>
                    )}
                    {availabilities
                      .filter((d) => d.date === selectedDate)
                      .map((disp) => (
                        <div
                          key={disp.id}
                          className="rounded-md border border-l-4 border-l-green-500 bg-green-50 p-3 text-sm text-green-800 shadow-sm dark:bg-green-950/20 dark:border-green-900 dark:border-l-green-500 dark:text-green-300"
                        >
                          Plage libre :{" "}
                          <span className="font-semibold">{disp.debut}</span> à{" "}
                          <span className="font-semibold">{disp.fin}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {proposerModalRdvId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-2xl border bg-background shadow-xl">
                <div className="border-b px-6 py-4">
                  <h3 className="text-lg font-semibold">Proposer un nouveau créneau</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Renseignez la nouvelle date et heure du rendez-vous.
                  </p>
                </div>
                <div className="space-y-3 px-6 py-4">
                  <Label htmlFor="proposer-date-heure">Nouvelle date et heure</Label>
                  <Input
                    id="proposer-date-heure"
                    type="datetime-local"
                    value={proposerDateHeure}
                    onChange={(e) => setProposerDateHeure(e.target.value)}
                    disabled={isSubmittingProposer}
                  />
                </div>
                <div className="flex justify-end gap-2 border-t px-6 py-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setProposerModalRdvId(null);
                      setProposerDateHeure("");
                    }}
                    disabled={isSubmittingProposer}
                  >
                    Annuler
                  </Button>
                  <Button onClick={() => void submitProposerCreneau()} disabled={isSubmittingProposer}>
                    {isSubmittingProposer ? "Envoi..." : "Valider la proposition"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
