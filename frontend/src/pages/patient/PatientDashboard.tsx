import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DataLoader } from "@/components/ui/data-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { Logo } from "@/components/ui/logo";
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
  Appointment01Icon,
  BotIcon,
  Calendar01Icon,
  ClipboardIcon,
  File01Icon,
  Icon,
  Logout01Icon,
  SentIcon,
} from "@/components/ui/icon";
import CalendarView from "../../components/CalendarView";
import { PatientRecordView } from "./PatientMedicalRecord";
import type { PatientRecord } from "./PatientMedicalRecord";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getNotificationDate } from "@/lib/notificationNavigation";
import { logoutRequest } from "@/services/axiosInstance";
import type { NotificationItem } from "@/services/notificationApi";
import {
  buildMyPatientRecord,
  downloadMyOrdonnancePdf,
  fetchMyAntecedents,
  fetchMyConsultations,
  fetchMyConstantes,
  fetchMyOrdonnances,
  fetchMyPatientProfile,
  type PatientOrdonnanceResponse,
  type PatientProfileResponse,
} from "@/services/patientPortalApi";
import {
  fetchServices,
  fetchMedecinsByService,
  fetchMedecinDisponibilites,
  fetchServiceDisponibilites,
  createRendezVous,
  fetchMyRendezVous,
  annulerRendezVous,
  confirmerRendezVous,
  refuserRendezVous,
  sendChatMessage,
  type ServiceOption,
  type MedecinOption,
  type MedecinDisponibilite,
  type ServiceDisponibilite,
  type RendezVousResponse,
  type RendezVousStatus,
} from "@/services/appointmentApi";

type Step = 1 | 2 | 3;
type Parcours = "medecin" | "creneau" | null;

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const today = new Date().toISOString().slice(0, 10);

const STATUS_CONFIG: Record<
  RendezVousStatus,
  { label: string; className: string }
> = {
  EN_ATTENTE: {
    label: "En attente",
    className: "bg-yellow-100 text-yellow-800",
  },
  PROPOSE: { label: "Proposé", className: "bg-blue-100 text-blue-800" },
  CONFIRME: { label: "Confirmé", className: "bg-green-100 text-green-800" },
  REFUSE: { label: "Refusé", className: "bg-red-100 text-red-800" },
  ANNULE: { label: "Annulé", className: "bg-gray-100 text-gray-800" },
  TERMINE: { label: "Terminé", className: "bg-purple-100 text-purple-800" },
  ABSENT: { label: "Absent", className: "bg-orange-100 text-orange-800" },
};

function getPatientInitials(prenom?: string, nom?: string) {
  const first = prenom?.charAt(0) ?? "";
  const last = nom?.charAt(0) ?? "";
  return (first + last).toUpperCase() || "PA";
}

function RdvStatusBadge({ status }: { status: RendezVousStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "rdv" | "chatbot" | "dossier" | "planning" | "ordonnances"
  >("rdv");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ── Chat IA state ──────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "<p>Bonjour ! Je suis votre assistant médical IA. Décrivez vos symptômes ou posez-moi une question sur votre santé, et je vous donnerai des conseils d'orientation.</p>",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── RDV wizard state ───────────────────────────────────────────────
  const [step, setStep] = useState<Step>(1);
  const [parcours, setParcours] = useState<Parcours>(null);

  // Step 1 — services
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(
    null,
  );
  const [loadingServices, setLoadingServices] = useState(false);

  // Step 2A — par médecin
  const [medecins, setMedecins] = useState<MedecinOption[]>([]);
  const [selectedMedecin, setSelectedMedecin] = useState<MedecinOption | null>(
    null,
  );
  const [medecinSlots, setMedecinSlots] = useState<MedecinDisponibilite[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<MedecinDisponibilite | null>(
    null,
  );
  const [loadingMedecins, setLoadingMedecins] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Step 2B — créneau rapide
  const [quickDate, setQuickDate] = useState(today);
  const [quickSlots, setQuickSlots] = useState<ServiceDisponibilite[]>([]);
  const [selectedQuickSlot, setSelectedQuickSlot] =
    useState<ServiceDisponibilite | null>(null);
  const [loadingQuickSlots, setLoadingQuickSlots] = useState(false);

  // Step 3 — confirmation
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ── Mes RDV state ──────────────────────────────────────────────────
  const [mesRdv, setMesRdv] = useState<RendezVousResponse[]>([]);
  const [loadingRdv, setLoadingRdv] = useState(false);
  const [rdvActionLoading, setRdvActionLoading] = useState<number | null>(null);
  const [planningSelectedDate, setPlanningSelectedDate] = useState(today);

  const [patientProfile, setPatientProfile] =
    useState<PatientProfileResponse | null>(null);
  const [patientRecord, setPatientRecord] = useState<PatientRecord | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [dossierError, setDossierError] = useState<string | null>(null);

  const [ordonnances, setOrdonnances] = useState<PatientOrdonnanceResponse[]>(
    [],
  );
  const [loadingOrdonnances, setLoadingOrdonnances] = useState(false);
  const [ordonnancesError, setOrdonnancesError] = useState<string | null>(null);
  const [ordonnanceSearch, setOrdonnanceSearch] = useState("");
  const [ordonnanceDate, setOrdonnanceDate] = useState("");
  const [downloadingOrdonnanceId, setDownloadingOrdonnanceId] = useState<
    number | null
  >(null);

  const displayName =
    patientProfile
      ? `${patientProfile.prenom} ${patientProfile.nom}`.trim()
      : [user?.prenom, user?.nom].filter(Boolean).join(" ").trim() ||
        user?.email ||
        "Patient";
  const profileInitials = getPatientInitials(
    patientProfile?.prenom ?? user?.prenom,
    patientProfile?.nom ?? user?.nom,
  );

  // ── Charger les services au montage ────────────────────────────────
  useEffect(() => {
    setLoadingServices(true);
    fetchServices()
      .then(setServices)
      .catch(() => setErrorMessage("Impossible de charger les services."))
      .finally(() => setLoadingServices(false));
  }, []);

  useEffect(() => {
    fetchMyPatientProfile()
      .then(setPatientProfile)
      .catch(() => {
        // Le profil auth reste affiché en secours.
      });
  }, []);

  // ── Charger mes RDV quand on affiche l'onglet planning ─────────────
  const loadMesRdv = useCallback(async () => {
    setLoadingRdv(true);
    try {
      const res = await fetchMyRendezVous({ page: 0, size: 100 });
      setMesRdv(res.content);
    } catch {
      setErrorMessage("Impossible de charger vos rendez-vous.");
    } finally {
      setLoadingRdv(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "planning") {
      loadMesRdv();
    }
  }, [activeTab, loadMesRdv]);

  const loadMyDossier = useCallback(async () => {
    setLoadingDossier(true);
    setDossierError(null);
    try {
      const [profile, antecedents, constantes, consultations] =
        await Promise.all([
          patientProfile
            ? Promise.resolve(patientProfile)
            : fetchMyPatientProfile(),
          fetchMyAntecedents(),
          fetchMyConstantes(),
          fetchMyConsultations(),
        ]);
      if (!patientProfile) setPatientProfile(profile);
      setPatientRecord(
        buildMyPatientRecord(profile, antecedents, constantes, consultations),
      );
    } catch {
      setDossierError("Impossible de charger votre dossier médical.");
    } finally {
      setLoadingDossier(false);
    }
  }, [patientProfile]);

  const loadMyOrdonnances = async () => {
    setLoadingOrdonnances(true);
    setOrdonnancesError(null);
    try {
      const res = await fetchMyOrdonnances({
        page: 0,
        size: 50,
        q: ordonnanceSearch.trim() || undefined,
        date: ordonnanceDate || undefined,
      });
      setOrdonnances(res.content);
    } catch {
      setOrdonnancesError("Impossible de charger vos ordonnances.");
    } finally {
      setLoadingOrdonnances(false);
    }
  };

  useEffect(() => {
    if (activeTab === "dossier") {
      void loadMyDossier();
    }
  }, [activeTab, loadMyDossier]);

  useEffect(() => {
    if (activeTab === "ordonnances") {
      void loadMyOrdonnances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleNotificationClick = (item: NotificationItem) => {
    setActiveTab("planning");
    setPlanningSelectedDate(getNotificationDate(item));
  };

  const handleDownloadOrdonnance = async (ordonnance: PatientOrdonnanceResponse) => {
    setDownloadingOrdonnanceId(ordonnance.id);
    try {
      const blob = await downloadMyOrdonnancePdf(ordonnance.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ordonnance-${ordonnance.consultationDate}-dr-${ordonnance.medecinNomComplet.replace(/\s+/g, "-")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setOrdonnancesError("Impossible de télécharger cette ordonnance.");
    } finally {
      setDownloadingOrdonnanceId(null);
    }
  };

  // ── Actions sur les RDV ────────────────────────────────────────────
  const handleRdvAction = async (
    id: number,
    action: "annuler" | "confirmer" | "refuser",
  ) => {
    setRdvActionLoading(id);
    try {
      if (action === "annuler") await annulerRendezVous(id);
      else if (action === "confirmer") await confirmerRendezVous(id);
      else if (action === "refuser") await refuserRendezVous(id);
      await loadMesRdv();
    } catch {
      setErrorMessage("Erreur lors de l'action sur le rendez-vous.");
    } finally {
      setRdvActionLoading(null);
    }
  };

  // ── Step 1 → Step 2 : choisir un service ──────────────────────────
  const handleSelectService = (svc: ServiceOption) => {
    setSelectedService(svc);
    setParcours(null);
    setSelectedMedecin(null);
    setMedecinSlots([]);
    setSelectedSlot(null);
    setSelectedQuickSlot(null);
    setQuickSlots([]);
    setSuccessMessage("");
    setErrorMessage("");
    setStep(2);
  };

  // ── Parcours A : charger les médecins du service ───────────────────
  const handleChooseParcoursMedecin = useCallback(async () => {
    if (!selectedService) return;
    setParcours("medecin");
    setLoadingMedecins(true);
    try {
      const data = await fetchMedecinsByService(selectedService.id);
      setMedecins(data);
    } catch {
      setErrorMessage("Impossible de charger les médecins.");
    } finally {
      setLoadingMedecins(false);
    }
  }, [selectedService]);

  // ── Parcours A : charger les dispos d'un médecin ───────────────────
  const handleSelectMedecin = useCallback(async (med: MedecinOption) => {
    setSelectedMedecin(med);
    setSelectedSlot(null);
    setLoadingSlots(true);
    try {
      const data = await fetchMedecinDisponibilites(med.id);
      setMedecinSlots(data);
    } catch {
      setErrorMessage("Impossible de charger les disponibilités.");
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  // ── Parcours B : charger les créneaux rapides ──────────────────────
  const handleChooseParcoursRapide = () => {
    setParcours("creneau");
    setSelectedQuickSlot(null);
    setQuickSlots([]);
  };

  const handleSearchQuickSlots = useCallback(async () => {
    if (!selectedService) return;
    setLoadingQuickSlots(true);
    setSelectedQuickSlot(null);
    try {
      const data = await fetchServiceDisponibilites(
        selectedService.id,
        quickDate,
      );
      setQuickSlots(data);
    } catch {
      setErrorMessage("Impossible de charger les créneaux.");
    } finally {
      setLoadingQuickSlots(false);
    }
  }, [selectedService, quickDate]);

  // ── Step 3 : confirmer le RDV ──────────────────────────────────────
  const handleConfirm = async () => {
    if (!selectedService) return;
    setSubmitting(true);
    setErrorMessage("");

    let dateHeure: string;
    let medecinId: number;

    // heure peut être "08:00" ou "08:00:00" — on normalise en HH:mm:ss
    const normalizeHeure = (h: string) =>
      h.split(":").length === 2 ? `${h}:00` : h;

    if (parcours === "medecin" && selectedMedecin && selectedSlot) {
      dateHeure = `${selectedSlot.date}T${normalizeHeure(selectedSlot.heure)}`;
      medecinId = selectedMedecin.id;
    } else if (parcours === "creneau" && selectedQuickSlot) {
      dateHeure = `${quickDate}T${normalizeHeure(selectedQuickSlot.heure)}`;
      medecinId = selectedQuickSlot.medecinId;
    } else {
      setSubmitting(false);
      return;
    }

    try {
      await createRendezVous({
        dateHeure,
        serviceId: selectedService.id,
        medecinId,
      });
      setSuccessMessage("Votre demande de rendez-vous a bien été envoyée !");
      setStep(1);
      setParcours(null);
      setSelectedService(null);
      setSelectedMedecin(null);
      setSelectedSlot(null);
      setSelectedQuickSlot(null);
    } catch {
      setErrorMessage("Erreur lors de la création du rendez-vous.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────
  const resetWizard = () => {
    setStep(1);
    setParcours(null);
    setSelectedService(null);
    setSelectedMedecin(null);
    setMedecinSlots([]);
    setSelectedSlot(null);
    setSelectedQuickSlot(null);
    setQuickSlots([]);
    setErrorMessage("");
    setSuccessMessage("");
  };

  // ── Auto-scroll du chat ──────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const handleSendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const html = await sendChatMessage(text);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: html,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "<p>Désolé, une erreur est survenue. Veuillez réessayer.</p>",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
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

  // Résumé pour l'étape 3
  const summaryServiceNom = selectedService?.nom ?? "";
  const summaryMedecinNom =
    parcours === "medecin"
      ? (selectedMedecin?.nom ?? "")
      : (selectedQuickSlot?.medecinNom ?? "");
  const summaryDate =
    parcours === "medecin" ? (selectedSlot?.date ?? "") : quickDate;
  const summaryHeure =
    parcours === "medecin"
      ? (selectedSlot?.heure ?? "")
      : (selectedQuickSlot?.heure ?? "");

  return (
    <div className="min-h-screen bg-slate-50/80 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Logo size="md" subtitle="Espace Patient" />
          <NotificationBell
            enabled={Boolean(user)}
            onNotificationClick={handleNotificationClick}
          />
        </div>

        <div className="rounded-2xl bg-linear-to-br from-primary to-primary/80 p-4 text-primary-foreground shadow-lg shadow-primary/20">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-bold uppercase backdrop-blur-sm border-2 border-white/30">
              {profileInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold truncate">{displayName}</p>
              <p className="text-xs font-medium text-white/80 truncate">
                {patientProfile?.email ?? user?.email ?? "Compte patient"}
              </p>
              {patientProfile && (
                <p className="mt-1 text-[11px] text-white/70">
                  Dossier PAT-{patientProfile.id}
                  {patientProfile.telephone
                    ? ` · ${patientProfile.telephone}`
                    : ""}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="hidden shrink-0 rounded-full text-white hover:bg-white/15 hover:text-white sm:inline-flex"
              onClick={() => setActiveTab("dossier")}
            >
              Mon dossier
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Bienvenue, {patientProfile?.prenom ?? user?.prenom ?? "cher patient"}
            </CardTitle>
            <CardDescription>
              Orientation IA, rendez-vous, dossier médical, planning et
              ordonnances.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              variant={activeTab === "rdv" ? "default" : "outline"}
              onClick={() => setActiveTab("rdv")}
              className="gap-2"
            >
              <Icon icon={Appointment01Icon} className="size-4" />
              Prise de rendez-vous
            </Button>
            <Button
              variant={activeTab === "chatbot" ? "default" : "outline"}
              onClick={() => setActiveTab("chatbot")}
              className="gap-2"
            >
              <Icon icon={BotIcon} className="size-4" />
              Chatbot IA
            </Button>
            <Button
              variant={activeTab === "dossier" ? "default" : "outline"}
              onClick={() => setActiveTab("dossier")}
              className="gap-2"
            >
              <Icon icon={File01Icon} className="size-4" />
              Dossier médical
            </Button>
            <Button
              variant={activeTab === "planning" ? "default" : "outline"}
              onClick={() => setActiveTab("planning")}
              className="gap-2"
            >
              <Icon icon={Calendar01Icon} className="size-4" />
              Planning
            </Button>
            <Button
              variant={activeTab === "ordonnances" ? "default" : "outline"}
              onClick={() => setActiveTab("ordonnances")}
              className="gap-2"
            >
              <Icon icon={ClipboardIcon} className="size-4" />
              Ordonnances
            </Button>
            <Button
              variant="destructive"
              className="ml-auto gap-2"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <Icon icon={Logout01Icon} className="size-4" />
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={() => setErrorMessage("")}
                  >
                    Fermer
                  </Button>
                </div>
              )}

              {/* ── ÉTAPE 1 : Choisir un service ──────────────────────── */}
              {step === 1 && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">
                    Choisissez un service
                  </Label>
                  {loadingServices ? (
                    <DataLoader
                      variant="plain"
                      size="sm"
                      message="Chargement des services"
                    />
                  ) : services.length === 0 ? (
                    <EmptyState
                      variant="plain"
                      size="sm"
                      title="Aucun service disponible"
                      description="Aucun service n'est proposé pour le moment."
                    />
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
                    Service sélectionné :{" "}
                    <span className="font-semibold">{selectedService.nom}</span>
                  </div>

                  {/* Choix du parcours */}
                  {!parcours && (
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">
                        Comment souhaitez-vous choisir ?
                      </Label>
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
                        <DataLoader
                          variant="plain"
                          size="sm"
                          message="Chargement des médecins"
                        />
                      ) : (
                        <>
                          {/* Liste des médecins */}
                          {!selectedMedecin && (
                            <div className="space-y-3">
                              <Label className="text-base font-semibold">
                                Choisissez un médecin
                              </Label>
                              {medecins.length === 0 ? (
                                <EmptyState
                                  variant="plain"
                                  size="sm"
                                  title="Aucun médecin disponible"
                                  description="Aucun praticien n'est disponible pour ce service."
                                />
                              ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                  {medecins.map((med) => (
                                    <button
                                      key={med.id}
                                      onClick={() => handleSelectMedecin(med)}
                                      className="rounded-xl border bg-background p-4 text-left transition-all hover:border-primary hover:shadow-md"
                                    >
                                      <p className="font-medium">{med.nom}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {med.specialite}
                                      </p>
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
                                    setSelectedMedecin(null);
                                    setMedecinSlots([]);
                                    setSelectedSlot(null);
                                  }}
                                >
                                  Changer
                                </Button>
                              </div>
                              {loadingSlots ? (
                                <DataLoader
                                  variant="plain"
                                  size="sm"
                                  message="Chargement des créneaux"
                                />
                              ) : medecinSlots.length === 0 ? (
                                <EmptyState
                                  variant="plain"
                                  size="sm"
                                  title="Aucun créneau disponible"
                                  description="Ce médecin n'a pas de disponibilité pour le moment."
                                />
                              ) : (
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                  {medecinSlots.map((slot, i) => (
                                    <button
                                      key={`${slot.date}-${slot.heure}-${i}`}
                                      onClick={() => {
                                        setSelectedSlot(slot);
                                        setStep(3);
                                      }}
                                      className={`rounded-lg border px-4 py-3 text-left text-sm transition-all hover:border-primary ${
                                        selectedSlot === slot
                                          ? "border-primary bg-primary/5"
                                          : "bg-background"
                                      }`}
                                    >
                                      <p className="font-medium">{slot.date}</p>
                                      <p className="text-muted-foreground">
                                        {slot.heure}
                                      </p>
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
                      <Label className="text-base font-semibold">
                        Choisissez une date
                      </Label>
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <Input
                            type="date"
                            value={quickDate}
                            min={today}
                            onChange={(e) => setQuickDate(e.target.value)}
                          />
                        </div>
                        <Button
                          onClick={handleSearchQuickSlots}
                          disabled={loadingQuickSlots}
                        >
                          Rechercher
                        </Button>
                      </div>

                      {loadingQuickSlots && (
                        <DataLoader
                          variant="plain"
                          size="sm"
                          message="Recherche des créneaux"
                          description={`Analyse des disponibilités pour le ${quickDate}…`}
                        />
                      )}

                      {quickSlots.length > 0 && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">
                            {quickSlots.length} créneau
                            {quickSlots.length > 1 ? "x" : ""} disponible
                            {quickSlots.length > 1 ? "s" : ""} le {quickDate}
                          </Label>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {quickSlots.map((slot, i) => (
                              <button
                                key={`${slot.medecinId}-${slot.heure}-${i}`}
                                onClick={() => {
                                  setSelectedQuickSlot(slot);
                                  setStep(3);
                                }}
                                className={`rounded-lg border px-4 py-3 text-left text-sm transition-all hover:border-primary ${
                                  selectedQuickSlot === slot
                                    ? "border-primary bg-primary/5"
                                    : "bg-background"
                                }`}
                              >
                                <p className="font-medium">{slot.heure}</p>
                                <p className="text-muted-foreground">
                                  {slot.medecinNom}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {!loadingQuickSlots &&
                        quickSlots.length === 0 &&
                        quickDate &&
                        parcours === "creneau" && (
                          <EmptyState
                            variant="plain"
                            size="sm"
                            title="Aucun créneau trouvé"
                            description="Aucune disponibilité pour cette date. Essayez une autre journée."
                          />
                        )}
                    </div>
                  )}

                  {/* Bouton retour */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep(1);
                      setParcours(null);
                    }}
                  >
                    Retour
                  </Button>
                </div>
              )}

              {/* ── ÉTAPE 3 : Confirmation ────────────────────────────── */}
              {step === 3 && (
                <div className="space-y-4">
                  <Label className="text-base font-semibold">
                    Récapitulatif de votre rendez-vous
                  </Label>
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
                      {submitting
                        ? "Envoi en cours..."
                        : "Confirmer la demande"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "chatbot" && (
          <Card
            className="flex flex-col"
            style={{ height: "calc(100vh - 220px)" }}
          >
            <CardHeader className="shrink-0 border-b">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Icon icon={BotIcon} className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Assistant Médical IA</CardTitle>
                  <CardDescription>
                    Posez vos questions de santé en temps réel
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            {/* Zone de messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div
                        className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5"
                        dangerouslySetInnerHTML={{ __html: msg.content }}
                      />
                    )}
                    <p
                      className={`mt-1 text-[10px] ${msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}
                    >
                      {msg.timestamp.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Indicateur de chargement */}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2">
                    <DataLoader
                      variant="inline"
                      size="sm"
                      layout="row"
                      message="L'assistant réfléchit"
                      className="py-0"
                    />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </CardContent>

            {/* Zone de saisie */}
            <CardFooter className="shrink-0 border-t p-4">
              <div className="flex w-full gap-2">
                <textarea
                  className="min-h-[44px] max-h-32 flex-1 resize-none rounded-xl border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Décrivez vos symptômes ou posez une question..."
                  rows={1}
                  disabled={chatLoading}
                />
                <Button
                  onClick={handleSendChat}
                  disabled={chatLoading || !chatInput.trim()}
                  size="icon"
                  className="h-11 w-11 shrink-0 rounded-xl"
                >
                  <Icon icon={SentIcon} className="size-[18px]" />
                </Button>
              </div>
              <p className="mt-2 w-full text-center text-[11px] text-muted-foreground">
                Appuyez sur Entrée pour envoyer, Maj+Entrée pour un retour à la
                ligne
              </p>
            </CardFooter>
          </Card>
        )}

        {activeTab === "dossier" && (
          <Card>
            <CardHeader>
              <CardTitle>Dossier médical</CardTitle>
              <CardDescription>
                Vos informations personnelles et historique médical.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dossierError && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {dossierError}
                </div>
              )}
              {loadingDossier ? (
                <DataLoader
                  message="Chargement du dossier"
                  description="Récupération de vos informations médicales…"
                  size="md"
                />
              ) : patientRecord ? (
                <PatientRecordView patient={patientRecord} />
              ) : (
                <EmptyState
                  variant="plain"
                  size="sm"
                  title="Dossier indisponible"
                  description="Vos informations médicales n'ont pas pu être chargées."
                />
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "planning" &&
          (() => {
            const calendarEvents = mesRdv.map((rdv) => {
              const dt = new Date(rdv.dateHeure);
              const dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
              const heureStr = dt.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const colorByStatus: Record<string, string> = {
                EN_ATTENTE:
                  "bg-yellow-100 text-yellow-800 border border-yellow-200",
                PROPOSE: "bg-blue-100 text-blue-800 border border-blue-200",
                CONFIRME: "bg-green-100 text-green-800 border border-green-200",
                ANNULE: "bg-gray-100 text-gray-500 border border-gray-200",
                REFUSE: "bg-red-100 text-red-800 border border-red-200",
                TERMINE:
                  "bg-purple-100 text-purple-800 border border-purple-200",
                ABSENT:
                  "bg-orange-100 text-orange-800 border border-orange-200",
              };
              return {
                id: String(rdv.id),
                date: dateStr,
                time: heureStr,
                title: `${rdv.serviceNom} - ${rdv.medecinNomComplet}`,
                colorClass:
                  colorByStatus[rdv.status] ??
                  "bg-primary/10 text-primary border border-primary/20",
                onClick: () => setPlanningSelectedDate(dateStr),
              };
            });

            const rdvsForDate = mesRdv.filter((rdv) => {
              const dt = new Date(rdv.dateHeure);
              const dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
              return dateStr === planningSelectedDate;
            });

            const upcomingRdv = mesRdv
              .filter((rdv) => {
                const dt = new Date(rdv.dateHeure);
                return (
                  dt >= new Date() &&
                  (rdv.status === "EN_ATTENTE" ||
                    rdv.status === "PROPOSE" ||
                    rdv.status === "CONFIRME")
                );
              })
              .sort(
                (a, b) =>
                  new Date(a.dateHeure).getTime() -
                  new Date(b.dateHeure).getTime(),
              );

            const selectedDateLabel = (() => {
              const [y, m, d] = planningSelectedDate.split("-").map(Number);
              return new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              });
            })();

            return (
              <div className="space-y-6">
                {loadingRdv ? (
                  <DataLoader
                    message="Chargement de vos rendez-vous"
                    description="Mise à jour de votre planning…"
                    size="md"
                  />
                ) : (
                  <>
                    {/* Calendrier + détails du jour */}
                    <div className="grid gap-6 lg:grid-cols-3">
                      <div className="lg:col-span-2">
                        <CalendarView
                          events={calendarEvents}
                          onDateClick={(d) => setPlanningSelectedDate(d)}
                          selectedDate={planningSelectedDate}
                        />
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">
                            {selectedDateLabel}
                          </CardTitle>
                          <CardDescription>
                            {rdvsForDate.length} rendez-vous
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {rdvsForDate.length === 0 ? (
                            <EmptyState
                              variant="plain"
                              size="sm"
                              title="Aucun rendez-vous"
                              description="Vous n'avez pas de rendez-vous prévu ce jour."
                            />
                          ) : (
                            rdvsForDate.map((rdv) => {
                              const dt = new Date(rdv.dateHeure);
                              const heureStr = dt.toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              });
                              return (
                                <div
                                  key={rdv.id}
                                  className="rounded-lg border p-3 space-y-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold">
                                      {heureStr}
                                    </span>
                                    <RdvStatusBadge status={rdv.status} />
                                  </div>
                                  <p className="text-sm font-medium">
                                    {rdv.serviceNom}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {rdv.medecinNomComplet}
                                  </p>
                                  <div className="flex gap-2 pt-1">
                                    {rdv.status === "PROPOSE" && (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            handleRdvAction(rdv.id, "confirmer")
                                          }
                                          disabled={rdvActionLoading === rdv.id}
                                        >
                                          Confirmer
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleRdvAction(rdv.id, "refuser")
                                          }
                                          disabled={rdvActionLoading === rdv.id}
                                        >
                                          Refuser
                                        </Button>
                                      </>
                                    )}
                                    {(rdv.status === "EN_ATTENTE" ||
                                      rdv.status === "CONFIRME") && (
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() =>
                                          handleRdvAction(rdv.id, "annuler")
                                        }
                                        disabled={rdvActionLoading === rdv.id}
                                      >
                                        Annuler
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Liste des RDV à venir */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Rendez-vous à venir</CardTitle>
                        <CardDescription>
                          {upcomingRdv.length} rendez-vous en attente ou
                          confirmés
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {upcomingRdv.length === 0 ? (
                          <EmptyState
                            variant="plain"
                            size="sm"
                            title="Aucun rendez-vous à venir"
                            description="Vos prochains rendez-vous apparaîtront ici."
                          />
                        ) : (
                          <div className="divide-y">
                            {upcomingRdv.map((rdv) => {
                              const dt = new Date(rdv.dateHeure);
                              const dateStr = dt.toLocaleDateString("fr-FR", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              });
                              const heureStr = dt.toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              });
                              return (
                                <div
                                  key={rdv.id}
                                  className="flex items-center justify-between gap-4 py-3"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="text-center min-w-[60px]">
                                      <p className="text-sm font-semibold">
                                        {dateStr}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {heureStr}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">
                                        {rdv.serviceNom}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {rdv.medecinNomComplet}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <RdvStatusBadge status={rdv.status} />
                                    {(rdv.status === "EN_ATTENTE" ||
                                      rdv.status === "CONFIRME") && (
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() =>
                                          handleRdvAction(rdv.id, "annuler")
                                        }
                                        disabled={rdvActionLoading === rdv.id}
                                      >
                                        Annuler
                                      </Button>
                                    )}
                                    {rdv.status === "PROPOSE" && (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            handleRdvAction(rdv.id, "confirmer")
                                          }
                                          disabled={rdvActionLoading === rdv.id}
                                        >
                                          Confirmer
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleRdvAction(rdv.id, "refuser")
                                          }
                                          disabled={rdvActionLoading === rdv.id}
                                        >
                                          Refuser
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            );
          })()}

        {activeTab === "ordonnances" && (
          <Card>
            <CardHeader>
              <CardTitle>Ordonnances</CardTitle>
              <CardDescription>
                Consultez et téléchargez vos ordonnances médicales.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                <Input
                  placeholder="Rechercher un médecin…"
                  value={ordonnanceSearch}
                  onChange={(e) => setOrdonnanceSearch(e.target.value)}
                />
                <Input
                  type="date"
                  value={ordonnanceDate}
                  onChange={(e) => setOrdonnanceDate(e.target.value)}
                  className="md:w-44"
                />
                <Button
                  variant="outline"
                  onClick={() => void loadMyOrdonnances()}
                  disabled={loadingOrdonnances}
                >
                  Filtrer
                </Button>
              </div>

              {ordonnancesError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {ordonnancesError}
                </div>
              )}

              {loadingOrdonnances ? (
                <DataLoader
                  message="Chargement des ordonnances"
                  description="Récupération de vos prescriptions…"
                  size="md"
                />
              ) : ordonnances.length === 0 ? (
                <EmptyState
                  variant="plain"
                  size="sm"
                  title="Aucune ordonnance"
                  description="Vos ordonnances apparaîtront ici après consultation."
                />
              ) : (
                <div className="space-y-3">
                  {ordonnances.map((ordonnance) => (
                    <div
                      key={ordonnance.id}
                      className="flex flex-col gap-3 rounded-xl border border-border/60 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-bold">
                          Consultation du{" "}
                          {new Date(
                            `${ordonnance.consultationDate}T12:00:00`,
                          ).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Dr {ordonnance.medecinNomComplet}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Émise le{" "}
                          {new Date(ordonnance.createdAt).toLocaleString(
                            "fr-FR",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={() => void handleDownloadOrdonnance(ordonnance)}
                        disabled={downloadingOrdonnanceId === ordonnance.id}
                      >
                        {downloadingOrdonnanceId === ordonnance.id
                          ? "Téléchargement…"
                          : "Télécharger le PDF"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
