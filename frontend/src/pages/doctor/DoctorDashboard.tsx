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
import { DataLoader } from "@/components/ui/data-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { Logo } from "@/components/ui/logo";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { Modal } from "@/components/ui/modal";
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
import CalendarView, {
  type CalendarEvent,
} from "../../components/CalendarView";
import DisponibiliteForm from "@/components/medecin/DisponibiliteForm";
import DisponibilitesTable from "@/components/medecin/DisponibilitesTable";
import { RdvStatusBadge } from "@/components/rendezvous/RdvStatusBadge";
import { PatientRecordView } from "../patient/PatientMedicalRecord";
import type { PatientRecord, VitalSign } from "../patient/PatientMedicalRecord";
import { useAuth } from "@/hooks/useAuth";
import { logoutRequest } from "@/services/axiosInstance";
import {
  confirmerRendezVous,
  fetchMedecinRendezVous,
  proposerNouveauCreneau,
  proposerRendezVous,
  terminerRendezVous,
  type MedecinRendezVousResponse,
  type RendezVousStatus,
} from "@/services/appointmentApi";
import {
  buildPatientRecord,
  createConsultation,
  createOrdonnance,
  createPatientAntecedent,
  createPatientConstante,
  fetchMedecinPatientDetail,
  fetchPatientAntecedents,
  fetchPatientConsultations,
  fetchPatientConstantes,
  mapAntecedentToMedicalHistory,
  mapConstanteToVitalSign,
} from "@/services/medecinPatientApi";
import {
  createDisponibilite,
  deleteDisponibilite,
  fetchMesDisponibilites,
  getDisponibiliteApiErrorMessage,
  updateDisponibilite,
} from "@/services/disponibilitesApi";
import type {
  DisponibiliteDetailResponse,
  JourSemaine,
  UpsertDisponibiliteRequest,
} from "@/types/disponibilites";
import {
  Appointment01Icon,
  Calendar01Icon,
  Clock01Icon,
  Icon,
  Logout01Icon,
} from "@/components/ui/icon";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getNotificationDate } from "@/lib/notificationNavigation";

type Appointment = {
  id: string;
  date: string;
  heure: string;
  motif: string;
  apiStatus: RendezVousStatus;
  patientId: number;
  medecinId: number;
  patient: PatientRecord;
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

const JOUR_BY_INDEX: Record<number, JourSemaine> = {
  0: "DIM",
  1: "LUN",
  2: "MAR",
  3: "MER",
  4: "JEU",
  5: "VEN",
  6: "SAM",
};

function formatHeure(heure: string) {
  return heure.slice(0, 5);
}

function splitNomComplet(nomComplet: string) {
  const parts = nomComplet.trim().split(/\s+/);
  if (parts.length === 1) return { prenom: parts[0], nom: "" };
  return { prenom: parts[0], nom: parts.slice(1).join(" ") };
}

function createPatientStub(
  rdv: MedecinRendezVousResponse,
  patientRecord?: PatientRecord,
): PatientRecord {
  if (patientRecord) return patientRecord;
  const { prenom, nom } = splitNomComplet(rdv.patientNomComplet);
  return {
    id: String(rdv.patientId),
    nom,
    prenom,
    sexe: "M",
    dateNaissance: "",
    numeroDossier: `PAT-${rdv.patientId}`,
    contact: "",
    adresse: "",
    antecedents: [],
    constantes: [],
    historiqueConsultations: [],
  };
}

function mapMedecinRendezVousToAppointment(
  rdv: MedecinRendezVousResponse,
  patientRecord?: PatientRecord,
): Appointment {
  const [date, timePart] = rdv.dateHeure.split("T");
  return {
    id: String(rdv.id),
    date,
    heure: formatHeure(timePart ?? ""),
    motif: rdv.serviceNom,
    apiStatus: rdv.status,
    patientId: rdv.patientId,
    medecinId: rdv.medecinId,
    patient: createPatientStub(rdv, patientRecord),
  };
}

function getRdvEventColor(status: RendezVousStatus) {
  switch (status) {
    case "TERMINE":
      return "bg-muted/80 text-muted-foreground border-transparent";
    case "CONFIRME":
      return "bg-primary text-primary-foreground border-primary/20";
    case "EN_ATTENTE":
      return "bg-yellow-100 text-yellow-900 border-yellow-200";
    case "PROPOSE":
      return "bg-blue-100 text-blue-900 border-blue-200";
    case "ABSENT":
      return "bg-orange-100 text-orange-900 border-orange-200";
    case "REFUSE":
    case "ANNULE":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-primary text-primary-foreground border-primary/20";
  }
}

function disponibiliteAppliesToDate(
  item: DisponibiliteDetailResponse,
  date: string,
) {
  if (item.date) return item.date === date;
  if (item.dateDebut && item.dateFin && item.joursSemaine?.length) {
    if (date < item.dateDebut || date > item.dateFin) return false;
    const dayIndex = new Date(`${date}T12:00:00`).getDay();
    return item.joursSemaine.includes(JOUR_BY_INDEX[dayIndex]);
  }
  return false;
}

function disponibiliteToCalendarEvents(
  item: DisponibiliteDetailResponse,
): CalendarEvent[] {
  const timeLabel = `${formatHeure(item.heureDebut)} - ${formatHeure(item.heureFin)}`;
  const colorClass =
    "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-900";

  if (item.date) {
    return [
      {
        id: `disp-${item.id}`,
        date: item.date,
        time: timeLabel,
        title: "Plage disponible",
        colorClass,
      },
    ];
  }

  if (item.dateDebut) {
    return [
      {
        id: `disp-${item.id}`,
        date: item.dateDebut,
        time: timeLabel,
        title: `Récurrent (${item.joursSemaine?.join(", ") ?? ""})`,
        colorClass,
      },
    ];
  }

  return [];
}

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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);
  const [isPlanningDetailsModalOpen, setIsPlanningDetailsModalOpen] =
    useState(false);
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
  const [consultationStep, setConsultationStep] = useState<1 | 2>(1);
  const [activeConsultationId, setActiveConsultationId] = useState<
    number | null
  >(null);
  const [isEndingConsultation, setIsEndingConsultation] = useState(false);

  const [consultationDate, setConsultationDate] = useState(today);
  const [consultationMotif, setConsultationMotif] = useState("");
  const [consultationDiagnostic, setConsultationDiagnostic] = useState("");

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

  const [disponibilites, setDisponibilites] = useState<
    DisponibiliteDetailResponse[]
  >([]);
  const [isLoadingDisponibilites, setIsLoadingDisponibilites] = useState(true);
  const [isSubmittingDisponibilite, setIsSubmittingDisponibilite] =
    useState(false);
  const [editingDisponibilite, setEditingDisponibilite] =
    useState<DisponibiliteDetailResponse | null>(null);
  const [disponibiliteToDelete, setDisponibiliteToDelete] =
    useState<DisponibiliteDetailResponse | null>(null);
  const [disponibiliteToast, setDisponibiliteToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [patientRecords, setPatientRecords] = useState<
    Record<string, PatientRecord>
  >({});
  const patientRecordsRef = useRef(patientRecords);
  patientRecordsRef.current = patientRecords;
  const [isLoadingPatientRecord, setIsLoadingPatientRecord] = useState(false);
  const [patientRecordError, setPatientRecordError] = useState<string | null>(
    null,
  );

  const [rdvToManage, setRdvToManage] = useState<Appointment | null>(null);
  const [proposedSlotDate, setProposedSlotDate] = useState(today);
  const [proposedSlotTime, setProposedSlotTime] = useState("09:00");
  const [isSubmittingRdvAction, setIsSubmittingRdvAction] = useState(false);
  const [rdvActionError, setRdvActionError] = useState<string | null>(null);

  const filteredAppointments = useMemo(
    () => appointments.filter((rdv) => rdv.date === selectedDate),
    [appointments, selectedDate],
  );

  const sortedDisponibilites = useMemo(
    () =>
      [...disponibilites].sort((a, b) => {
        const aDate = a.dateDebut ?? a.date ?? "";
        const bDate = b.dateDebut ?? b.date ?? "";
        const dateCompare = aDate.localeCompare(bDate);
        if (dateCompare !== 0) return dateCompare;
        return a.heureDebut.localeCompare(b.heureDebut);
      }),
    [disponibilites],
  );

  const disponibilitesForSelectedDate = useMemo(
    () =>
      disponibilites.filter((item) =>
        disponibiliteAppliesToDate(item, selectedDate),
      ),
    [disponibilites, selectedDate],
  );

  const calendarEvents = useMemo(
    () => [
      ...appointments.map((rdv) => ({
        id: rdv.id,
        date: rdv.date,
        time: rdv.heure,
        title: `Consultation - ${rdv.patient.prenom} ${rdv.patient.nom}`,
        colorClass: getRdvEventColor(rdv.apiStatus),
      })),
      ...disponibilites.flatMap(disponibiliteToCalendarEvents),
    ],
    [appointments, disponibilites],
  );

  const showDisponibiliteToast = (
    message: string,
    type: "success" | "error",
  ) => {
    setDisponibiliteToast({ message, type });
    window.setTimeout(() => setDisponibiliteToast(null), 3500);
  };

  const loadDisponibilites = useCallback(async () => {
    setIsLoadingDisponibilites(true);
    try {
      const data = await fetchMesDisponibilites();
      setDisponibilites(data);
    } catch (error) {
      showDisponibiliteToast(
        getDisponibiliteApiErrorMessage(error),
        "error",
      );
    } finally {
      setIsLoadingDisponibilites(false);
    }
  }, []);

  useEffect(() => {
    void loadDisponibilites();
  }, [loadDisponibilites]);

  const reloadAppointments = useCallback(async () => {
    setIsLoadingAppointments(true);
    setAppointmentsError(null);
    try {
      const month = new Date(`${selectedDate}T12:00:00`).getMonth() + 1;
      const params =
        activeView === "planning"
          ? { month, size: 100 }
          : { date: selectedDate, size: 100 };
      const data = await fetchMedecinRendezVous(params);
      setAppointments(
        data.content.map((rdv) =>
          mapMedecinRendezVousToAppointment(
            rdv,
            patientRecordsRef.current[String(rdv.patientId)],
          ),
        ),
      );
    } catch {
      setAppointmentsError(
        "Impossible de charger les rendez-vous. Veuillez réessayer.",
      );
      setAppointments([]);
    } finally {
      setIsLoadingAppointments(false);
    }
  }, [activeView, selectedDate]);

  useEffect(() => {
    void reloadAppointments();
  }, [reloadAppointments]);

  const handleDisponibiliteSubmit = async (
    payload: UpsertDisponibiliteRequest,
  ) => {
    setIsSubmittingDisponibilite(true);
    try {
      if (editingDisponibilite) {
        await updateDisponibilite(editingDisponibilite.id, payload);
        showDisponibiliteToast("Disponibilité mise à jour avec succès.", "success");
      } else {
        await createDisponibilite(payload);
        showDisponibiliteToast("Disponibilité créée avec succès.", "success");
      }
      setEditingDisponibilite(null);
      await loadDisponibilites();
    } catch (error) {
      const message = getDisponibiliteApiErrorMessage(error);
      showDisponibiliteToast(message, "error");
      throw new Error(message);
    } finally {
      setIsSubmittingDisponibilite(false);
    }
  };

  const deleteDisponibiliteConfirmed = async () => {
    if (!disponibiliteToDelete) return;
    setIsSubmittingDisponibilite(true);
    try {
      await deleteDisponibilite(disponibiliteToDelete.id);
      showDisponibiliteToast("Disponibilité supprimée.", "success");
      if (editingDisponibilite?.id === disponibiliteToDelete.id) {
        setEditingDisponibilite(null);
      }
      setDisponibiliteToDelete(null);
      await loadDisponibilites();
    } catch (error) {
      showDisponibiliteToast(getDisponibiliteApiErrorMessage(error), "error");
    } finally {
      setIsSubmittingDisponibilite(false);
    }
  };

  const selectedAppointment =
    appointments.find((rdv) => rdv.id === selectedAppointmentId) ?? null;

  const updateAppointmentFromApi = (
    response: MedecinRendezVousResponse,
    patientRecord?: PatientRecord,
  ) => {
    const updated = mapMedecinRendezVousToAppointment(
      response,
      patientRecord ?? patientRecords[String(response.patientId)],
    );
    setAppointments((prev) =>
      prev.map((rdv) => (rdv.id === updated.id ? updated : rdv)),
    );
    setRdvToManage((prev) => (prev?.id === updated.id ? updated : prev));
  };

  const patchPatientRecord = (
    patientId: number,
    updater: (record: PatientRecord) => PatientRecord,
  ) => {
    const current =
      patientRecordsRef.current[String(patientId)] ??
      appointments.find((rdv) => rdv.patientId === patientId)?.patient;
    if (!current) return;

    const updated = updater(current);
    patientRecordsRef.current = {
      ...patientRecordsRef.current,
      [String(patientId)]: updated,
    };

    setPatientRecords((prev) => ({
      ...prev,
      [String(patientId)]: updated,
    }));
    setAppointments((prev) =>
      prev.map((rdv) =>
        rdv.patientId === patientId ? { ...rdv, patient: updated } : rdv,
      ),
    );
  };

  const loadPatientRecord = async (patientId: number) => {
    setIsLoadingPatientRecord(true);
    setPatientRecordError(null);
    try {
      const [summary, antecedents, constantes, consultations] =
        await Promise.all([
          fetchMedecinPatientDetail(patientId),
          fetchPatientAntecedents(patientId),
          fetchPatientConstantes(patientId),
          fetchPatientConsultations(patientId),
        ]);
      const record = buildPatientRecord(
        summary,
        antecedents,
        constantes,
        consultations,
      );
      setPatientRecords((prev) => ({ ...prev, [String(patientId)]: record }));
      setAppointments((prev) =>
        prev.map((rdv) =>
          rdv.patientId === patientId ? { ...rdv, patient: record } : rdv,
        ),
      );
      return record;
    } catch {
      setPatientRecordError(
        "Impossible de charger le dossier patient. Veuillez réessayer.",
      );
      return null;
    } finally {
      setIsLoadingPatientRecord(false);
    }
  };

  const openPatientRecord = (id: string) => {
    const rdv = appointments.find((item) => item.id === id);
    setSelectedAppointmentId(id);
    setIsDiagnosisModalOpen(false);
    if (rdv) void loadPatientRecord(rdv.patientId);
  };

  const openRdvManagement = (id: string) => {
    const rdv = appointments.find((item) => item.id === id);
    if (!rdv) return;
    setRdvToManage(rdv);
    setProposedSlotDate(rdv.date);
    setProposedSlotTime(rdv.heure);
    setRdvActionError(null);
  };

  const closeRdvManagement = () => {
    setRdvToManage(null);
    setRdvActionError(null);
  };

  const handleProposerRdv = async () => {
    if (!rdvToManage) return;
    setIsSubmittingRdvAction(true);
    setRdvActionError(null);
    try {
      const response = await proposerRendezVous(Number(rdvToManage.id));
      updateAppointmentFromApi(response);
      await reloadAppointments();
    } catch {
      setRdvActionError("Impossible de valider ce créneau.");
    } finally {
      setIsSubmittingRdvAction(false);
    }
  };

  const handleProposerNouveauCreneau = async () => {
    if (!rdvToManage || !proposedSlotDate || !proposedSlotTime) return;
    setIsSubmittingRdvAction(true);
    setRdvActionError(null);
    try {
      const dateHeure = `${proposedSlotDate}T${proposedSlotTime}:00`;
      const response = await proposerNouveauCreneau(
        Number(rdvToManage.id),
        dateHeure,
      );
      updateAppointmentFromApi(response);
      await reloadAppointments();
    } catch {
      setRdvActionError("Impossible de proposer ce nouveau créneau.");
    } finally {
      setIsSubmittingRdvAction(false);
    }
  };

  const handleConfirmerRdv = async () => {
    if (!rdvToManage) return;
    setIsSubmittingRdvAction(true);
    setRdvActionError(null);
    try {
      const response = await confirmerRendezVous(Number(rdvToManage.id));
      updateAppointmentFromApi(response as MedecinRendezVousResponse);
      await reloadAppointments();
      closeRdvManagement();
    } catch {
      setRdvActionError("Impossible de confirmer ce rendez-vous.");
    } finally {
      setIsSubmittingRdvAction(false);
    }
  };

  const openConsultation = (id: string) => {
    const rdv = appointments.find((item) => item.id === id);
    if (!rdv || rdv.apiStatus !== "CONFIRME") return;
    setSelectedAppointmentId(id);
    setConsultationStep(1);
    setActiveConsultationId(null);
    setConsultationDate(today);
    setConsultationMotif(rdv.motif);
    setConsultationDiagnostic("");
    clearSignatureCanvas();
    setIsDiagnosisModalOpen(true);
    void loadPatientRecord(rdv.patientId);
  };

  const addAntecedent = async () => {
    if (!selectedAppointment || !antecedentInput.trim()) return;
    setPatientRecordError(null);
    try {
      const created = await createPatientAntecedent(
        selectedAppointment.patientId,
        antecedentInput.trim(),
      );
      setAntecedentInput("");
      patchPatientRecord(selectedAppointment.patientId, (record) => ({
        ...record,
        antecedents: [
          ...record.antecedents,
          mapAntecedentToMedicalHistory(created),
        ],
      }));
    } catch {
      setPatientRecordError("Impossible d'ajouter l'antécédent.");
    }
  };

  const addVitalSign = async () => {
    if (
      !selectedAppointment ||
      !newVital.tension ||
      !newVital.glycemie ||
      !newVital.poids ||
      !newVital.imc
    )
      return;
    setPatientRecordError(null);
    try {
      const created = await createPatientConstante(
        selectedAppointment.patientId,
        {
          date: newVital.date,
          tension: newVital.tension,
          glycemie: Number(newVital.glycemie),
          poids: Number(newVital.poids),
          imc: Number(newVital.imc),
        },
      );
      setNewVital({ date: today, tension: "", glycemie: "", poids: "", imc: "" });
      patchPatientRecord(selectedAppointment.patientId, (record) => ({
        ...record,
        constantes: [...record.constantes, mapConstanteToVitalSign(created)],
      }));
    } catch {
      setPatientRecordError("Impossible d'enregistrer les constantes.");
    }
  };

  const saveClinicalStep = async () => {
    if (
      !selectedAppointment ||
      !consultationMotif.trim() ||
      !consultationDiagnostic.trim() ||
      !user?.id
    )
      return;
    try {
      const created = await createConsultation({
        rendezVousId: Number(selectedAppointment.id),
        patientId: selectedAppointment.patientId,
        medecinId: Number(user.id),
        motif: consultationMotif.trim(),
        diagnostic: consultationDiagnostic.trim(),
        date: consultationDate,
      });
      setActiveConsultationId(created.id);
      await loadPatientRecord(selectedAppointment.patientId);
      setConsultationStep(2);
    } catch {
      setPatientRecordError("Impossible d'enregistrer la consultation.");
    }
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

  const buildPrescriptionPdfDoc = () => {
    if (!selectedAppointment) return null;

    const validLines = getValidPrescriptionLines();
    if (validLines.length === 0) return null;

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("ORDONNANCE MEDICALE", pageWidth / 2, 18, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Dr ${displayName}`, 14, 30);
    doc.text("N° RPPS: 00000000000", 14, 36);
    doc.text("Cabinet: Antananarivo", 14, 42);
    doc.text(`Date: ${consultationDate}`, pageWidth - 14, 30, {
      align: "right",
    });

    doc.setLineWidth(0.4);
    doc.line(14, 48, pageWidth - 14, 48);

    doc.setFont("helvetica", "bold");
    doc.text("Patient", 14, 58);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${selectedAppointment.patient.prenom} ${selectedAppointment.patient.nom} | ${selectedAppointment.patient.sexe} | Ne(e) le ${selectedAppointment.patient.dateNaissance}`,
      14,
      64,
    );
    doc.text(`Dossier: ${selectedAppointment.patient.numeroDossier}`, 14, 70);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("R/", 14, 84);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    let y = 94;
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

    return doc;
  };

  const getPrescriptionPdfBlob = () => {
    const doc = buildPrescriptionPdfDoc();
    if (!doc) return null;
    return doc.output("blob") as Blob;
  };

  const generatePrescriptionPdf = () => {
    if (!selectedAppointment) return;
    const doc = buildPrescriptionPdfDoc();
    if (!doc) return;
    doc.save(
      `ordonnance-${selectedAppointment.patient.id}-${consultationDate}.pdf`,
    );
  };

  const persistPrescriptionPdf = async () => {
    if (!activeConsultationId) return;
    const pdfBlob = getPrescriptionPdfBlob();
    if (!pdfBlob) return;
    await createOrdonnance(
      activeConsultationId,
      pdfBlob,
      `ordonnance-${activeConsultationId}-${consultationDate}.pdf`,
    );
  };

  const endConsultation = async () => {
    if (!selectedAppointment) return;
    setIsEndingConsultation(true);
    setPatientRecordError(null);
    try {
      if (getValidPrescriptionLines().length > 0) {
        await persistPrescriptionPdf();
      }
      await terminerRendezVous(Number(selectedAppointment.id));
      await reloadAppointments();
    } catch {
      setPatientRecordError(
        "Impossible de terminer la consultation. Vérifiez l'ordonnance et réessayez.",
      );
      setIsEndingConsultation(false);
      return;
    }
    setSelectedAppointmentId(null);
    setIsDiagnosisModalOpen(false);
    setConsultationStep(1);
    setActiveConsultationId(null);
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
    clearSignatureCanvas();
    setIsEndingConsultation(false);
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
    <div className="flex h-screen overflow-hidden bg-slate-50/80 text-foreground font-sans">
      <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-border/40 bg-white md:sticky md:top-0 md:flex">
        <div className="flex h-20 items-center px-6">
          <Logo size="md" subtitle="Espace Médecin" />
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
                <Icon icon={Appointment01Icon} className="size-[18px]" />
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
                <Icon icon={Calendar01Icon} className="size-[18px]" />
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
                <Icon icon={Clock01Icon} className="size-[18px]" />
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
              <Icon icon={Logout01Icon} className="size-4" />
            </div>
            {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-border/40 bg-white/80 backdrop-blur-md px-6 md:px-10">
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
            <NotificationBell
              enabled={Boolean(user)}
              onNotificationClick={(item) => {
                setActiveView("rendezvous");
                setSelectedDate(getNotificationDate(item));
              }}
            />
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
                      Sélectionnez un rendez-vous pour ouvrir le dossier
                      patient.
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
                      {isLoadingAppointments && (
                        <DataLoader
                          message="Chargement des rendez-vous"
                          description="Récupération de votre agenda…"
                          size="md"
                        />
                      )}

                      {appointmentsError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {appointmentsError}
                        </div>
                      )}

                      {!isLoadingAppointments &&
                        !appointmentsError &&
                        filteredAppointments.length === 0 && (
                        <EmptyState
                          variant="plain"
                          size="sm"
                          title="Aucun rendez-vous"
                          description="Aucun rendez-vous n'est planifié pour cette date."
                        />
                      )}

                      {!isLoadingAppointments &&
                        filteredAppointments.map((rdv) => (
                        <div
                          key={rdv.id}
                          className="flex flex-col gap-3 rounded-xl border border-border/60 bg-white p-4 shadow-sm transition-colors hover:border-primary/40 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-bold">
                              {rdv.heure} - {rdv.patient.prenom}{" "}
                              {rdv.patient.nom}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Motif: {rdv.motif}
                            </p>
                            <RdvStatusBadge status={rdv.apiStatus} />
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {(rdv.apiStatus === "EN_ATTENTE" ||
                              rdv.apiStatus === "PROPOSE") && (
                              <Button
                                variant="outline"
                                className="rounded-full"
                                onClick={() => openRdvManagement(rdv.id)}
                              >
                                Gérer
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              className="rounded-full"
                              onClick={() => openPatientRecord(rdv.id)}
                            >
                              Voir
                            </Button>
                          </div>
                        </div>
                      ))}
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
                        disabled={selectedAppointment.apiStatus !== "CONFIRME"}
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
                        Rendez-vous du {selectedAppointment.date} à{" "}
                        {selectedAppointment.heure} - Motif:{" "}
                        {selectedAppointment.motif}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {patientRecordError && (
                      <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {patientRecordError}
                      </div>
                    )}
                    {isLoadingPatientRecord ? (
                      <DataLoader
                        message="Chargement du dossier"
                        description="Récupération des informations patient…"
                        size="md"
                      />
                    ) : (
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
                              placeholder="Tension"
                              value={newVital.tension}
                              onChange={(e) =>
                                setNewVital((prev) => ({
                                  ...prev,
                                  tension: e.target.value,
                                }))
                              }
                            />
                            <Input
                              placeholder="Glycémie"
                              value={newVital.glycemie}
                              onChange={(e) =>
                                setNewVital((prev) => ({
                                  ...prev,
                                  glycemie: e.target.value,
                                }))
                              }
                            />
                            <Input
                              placeholder="Poids"
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
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {selectedAppointment && (
            <Modal
              open={isDiagnosisModalOpen}
              onClose={() => {
                setIsDiagnosisModalOpen(false);
              }}
              title={`Diagnostic - ${selectedAppointment.patient.prenom} ${selectedAppointment.patient.nom}`}
              description={`Rendez-vous du ${selectedAppointment.date} à ${selectedAppointment.heure}`}
              size="xl"
              hideFooter
              contentClassName="px-6 py-5"
            >
              <div className="mb-6 flex items-center gap-2">
                <div
                  className={`h-2.5 rounded-full transition-all ${consultationStep === 1 ? "w-12 bg-primary" : "w-4 bg-primary/40"}`}
                />
                <div
                  className={`h-2.5 rounded-full transition-all ${consultationStep === 2 ? "w-12 bg-primary" : "w-4 bg-primary/40"}`}
                />
              </div>

              {consultationStep === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Saisie clinique</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label>Date de consultation</Label>
                      <Input
                        type="date"
                        value={consultationDate}
                        onChange={(e) => setConsultationDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Motif</Label>
                      <Input
                        value={consultationMotif}
                        onChange={(e) => setConsultationMotif(e.target.value)}
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
                          {line.forme === AUTRE_OPTION && (
                            <Input
                              className="md:col-span-2"
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
                          )}
                          {line.posologie === AUTRE_OPTION && (
                            <Input
                              className="md:col-span-2"
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
                          )}
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
                          {line.modeAdministration === AUTRE_OPTION && (
                            <Input
                              className="md:col-span-2"
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
                          )}
                          <div className="md:col-span-2">
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
                      <Button variant="outline" onClick={addPrescriptionLine}>
                        Ajouter une ligne
                      </Button>

                      <div className="space-y-3 rounded-md border p-3">
                        <p className="text-sm font-medium">
                          Signature du médecin
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Dessinez votre signature dans le pad ou importez une
                          image de signature.
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
                    <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setConsultationStep(1)}
                        disabled={isEndingConsultation}
                      >
                        Retour
                      </Button>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <Button
                          variant="outline"
                          onClick={generatePrescriptionPdf}
                          disabled={
                            isEndingConsultation ||
                            getValidPrescriptionLines().length === 0
                          }
                        >
                          Télécharger l'ordonnance PDF
                        </Button>
                        <Button
                          onClick={endConsultation}
                          disabled={isEndingConsultation}
                        >
                          {isEndingConsultation
                            ? "Finalisation…"
                            : "Terminer la consultation"}
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
                          <p>N° RPPS: 00000000000</p>
                          <p>Cabinet: Antananarivo</p>
                          <p className="mt-2">Date: {consultationDate}</p>
                        </div>
                        <hr className="my-4" />
                        <p className="text-sm">
                          <span className="font-semibold">Patient:</span>{" "}
                          {selectedAppointment.patient.prenom}{" "}
                          {selectedAppointment.patient.nom}
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">Dossier:</span>{" "}
                          {selectedAppointment.patient.numeroDossier}
                        </p>
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
                                  <p>Posologie: {getFinalPosologie(line)}</p>
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

            </Modal>
          )}

          {activeView === "disponibilites" && (
            <div className="space-y-6">
              {disponibiliteToast && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    disponibiliteToast.type === "success"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {disponibiliteToast.message}
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <DisponibiliteForm
                  editingItem={editingDisponibilite}
                  onSubmit={handleDisponibiliteSubmit}
                  onCancelEdit={() => setEditingDisponibilite(null)}
                  isSubmitting={isSubmittingDisponibilite}
                />
                <DisponibilitesTable
                  items={sortedDisponibilites}
                  isLoading={isLoadingDisponibilites}
                  onEdit={setEditingDisponibilite}
                  onDelete={setDisponibiliteToDelete}
                  disableActions={isSubmittingDisponibilite}
                />
              </div>
            </div>
          )}

          {activeView === "planning" && (
            <Card className="rounded-2xl border-border/60 p-2 shadow-sm md:p-4">
              <CalendarView
                events={calendarEvents.map((event) =>
                  event.id.startsWith("disp-")
                    ? event
                    : {
                        ...event,
                        onClick: () => openRdvManagement(event.id),
                      },
                )}
                onDateClick={(d) => {
                  setSelectedDate(d);
                  setIsPlanningDetailsModalOpen(true);
                }}
                requireEventsForDateClick
                selectedDate={selectedDate}
              />
            </Card>
          )}

          <Modal
            open={isPlanningDetailsModalOpen}
            onClose={() => setIsPlanningDetailsModalOpen(false)}
            title={`Détails du ${selectedDate}`}
            description="Vos rendez-vous et disponibilités prévus"
            size="lg"
            hideFooter
            contentClassName="max-h-[70vh] space-y-6 px-6 py-5"
          >
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <Icon icon={Calendar01Icon} className="size-4 text-primary" />
                Rendez-vous
              </h4>
              {filteredAppointments.length === 0 && (
                <EmptyState
                  variant="plain"
                  size="sm"
                  title="Aucun rendez-vous"
                  description="Aucun rendez-vous pour cette journée."
                />
              )}
              {filteredAppointments.map((rdv) => (
                <div
                  key={rdv.id}
                  className="rounded-md border border-l-4 border-l-primary bg-card p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{rdv.heure}</span>
                    <RdvStatusBadge status={rdv.apiStatus} />
                  </div>
                  <p className="mt-1 font-medium">
                    {rdv.patient.prenom} {rdv.patient.nom}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Motif: {rdv.motif}
                  </p>
                  {(rdv.apiStatus === "EN_ATTENTE" ||
                    rdv.apiStatus === "PROPOSE") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 rounded-full"
                      onClick={() => openRdvManagement(rdv.id)}
                    >
                      Valider ou proposer un créneau
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <Icon
                  icon={Clock01Icon}
                  className="size-4 text-green-600 dark:text-green-400"
                />
                Disponibilités
              </h4>
              {disponibilitesForSelectedDate.length === 0 && (
                <EmptyState
                  variant="plain"
                  size="sm"
                  title="Aucune disponibilité"
                  description="Aucune plage horaire pour cette date."
                />
              )}
              {disponibilitesForSelectedDate.map((disp) => (
                  <div
                    key={disp.id}
                    className="rounded-md border border-l-4 border-l-green-500 bg-green-50 p-3 text-sm text-green-800 shadow-sm dark:bg-green-950/20 dark:border-green-900 dark:border-l-green-500 dark:text-green-300"
                  >
                    Plage libre :{" "}
                    <span className="font-semibold">
                      {formatHeure(disp.heureDebut)}
                    </span>{" "}
                    à{" "}
                    <span className="font-semibold">
                      {formatHeure(disp.heureFin)}
                    </span>
                  </div>
                ))}
            </div>
          </Modal>

          <Modal
            open={!!rdvToManage}
            onClose={closeRdvManagement}
            title="Gestion du rendez-vous"
            description={
              rdvToManage
                ? `${rdvToManage.patient.prenom} ${rdvToManage.patient.nom} — ${rdvToManage.date} à ${rdvToManage.heure}`
                : undefined
            }
            size="md"
            hideFooter
            contentClassName="space-y-5 px-6 py-5"
          >
            {rdvToManage && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Statut :</span>
                  <RdvStatusBadge status={rdvToManage.apiStatus} />
                </div>

                {rdvActionError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {rdvActionError}
                  </div>
                )}

                {rdvToManage.apiStatus === "EN_ATTENTE" && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Le patient a demandé ce créneau. Vous pouvez l&apos;accepter
                      ou proposer une autre date.
                    </p>
                    <Button
                      className="w-full rounded-full"
                      onClick={handleProposerRdv}
                      disabled={isSubmittingRdvAction}
                    >
                      Valider ce créneau
                    </Button>
                    <div className="space-y-3 rounded-xl border border-border/60 p-4">
                      <p className="text-sm font-semibold">
                        Proposer un autre créneau
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="proposed-date">Date</Label>
                          <Input
                            id="proposed-date"
                            type="date"
                            value={proposedSlotDate}
                            onChange={(e) => setProposedSlotDate(e.target.value)}
                            disabled={isSubmittingRdvAction}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="proposed-time">Heure</Label>
                          <Input
                            id="proposed-time"
                            type="time"
                            value={proposedSlotTime}
                            onChange={(e) => setProposedSlotTime(e.target.value)}
                            disabled={isSubmittingRdvAction}
                          />
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full rounded-full"
                        onClick={handleProposerNouveauCreneau}
                        disabled={isSubmittingRdvAction}
                      >
                        Proposer ce nouveau créneau
                      </Button>
                    </div>
                  </div>
                )}

                {rdvToManage.apiStatus === "PROPOSE" && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Un créneau a été proposé. Confirmez-le définitivement ou
                      proposez une autre date.
                    </p>
                    <Button
                      className="w-full rounded-full"
                      onClick={handleConfirmerRdv}
                      disabled={isSubmittingRdvAction}
                    >
                      Confirmer le rendez-vous
                    </Button>
                    <div className="space-y-3 rounded-xl border border-border/60 p-4">
                      <p className="text-sm font-semibold">
                        Modifier le créneau proposé
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="proposed-date-update">Date</Label>
                          <Input
                            id="proposed-date-update"
                            type="date"
                            value={proposedSlotDate}
                            onChange={(e) => setProposedSlotDate(e.target.value)}
                            disabled={isSubmittingRdvAction}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="proposed-time-update">Heure</Label>
                          <Input
                            id="proposed-time-update"
                            type="time"
                            value={proposedSlotTime}
                            onChange={(e) => setProposedSlotTime(e.target.value)}
                            disabled={isSubmittingRdvAction}
                          />
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full rounded-full"
                        onClick={handleProposerNouveauCreneau}
                        disabled={isSubmittingRdvAction}
                      >
                        Proposer ce nouveau créneau
                      </Button>
                    </div>
                  </div>
                )}

                {rdvToManage.apiStatus !== "EN_ATTENTE" &&
                  rdvToManage.apiStatus !== "PROPOSE" && (
                    <p className="text-sm text-muted-foreground">
                      Ce rendez-vous ne nécessite plus de validation de créneau.
                    </p>
                  )}
              </>
            )}
          </Modal>

          <ConfirmationModal
            open={!!disponibiliteToDelete}
            onClose={() => setDisponibiliteToDelete(null)}
            onConfirm={deleteDisponibiliteConfirmed}
            title="Confirmer la suppression"
            description="Voulez-vous vraiment supprimer cette disponibilité ?"
            confirmLabel="Supprimer"
            loading={isSubmittingDisponibilite}
          />
        </div>
      </main>
    </div>
  );
}
