import { useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { AddButton } from "@/components/ui/add-button";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { SearchBar } from "@/components/ui/search-bar";
import { Logo } from "@/components/ui/logo";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { Modal } from "@/components/ui/modal";
import { PageLoader } from "@/components/ui/page-loader";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Add01Icon,
  Analytics02Icon,
  Hospital01Icon,
  Icon,
  Logout01Icon,
  Upload01Icon,
  UserGroupIcon,
  UserIcon,
} from "@/components/ui/icon";
import { useAuth } from "@/hooks/useAuth";
import {
  createStaff,
  type CreateStaffPayload,
} from "@/services/appointmentApi";
import {
  apiClient,
  apiClientMultipart,
  logoutRequest,
} from "@/services/axiosInstance";

type TabKey = "overview" | "staff" | "services";

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
};

type StaffItem = {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role?: string;
  telephone?: string;
  adresseCabinet?: string;
  numeroInscription?: string | null;
  service?: {
    id: number;
    nom: string;
  } | null;
  isFirstConnexion?: boolean;
};

type ServiceItem = {
  id: number;
  nom: string;
  description?: string;
  illustrationUrl?: string;
};

type StaffRole = "MEDECIN" | "NUTRITIONNISTE";

type CreateStaffForm = {
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  adresseCabinet: string;
  role: StaffRole;
  numeroInscription: string;
  serviceId: string;
};

type ServiceForm = {
  id?: number;
  nom: string;
  description: string;
  illustration: File | null;
  currentIllustrationUrl?: string;
};

function normalizeRoleLabel(role?: string): string {
  if (!role) return "Staff";
  if (role === "MEDECIN") return "Médecin";
  if (role === "NUTRITIONNISTE") return "Nutritionniste";
  if (role === "ADMIN") return "Administrateur";
  return role;
}

export default function AdminDashboard() {
  const { logout, user } = useAuth();
  const displayName =
    [user?.prenom, user?.nom].filter(Boolean).join(" ").trim() || "Admin";

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [staffQuery, setStaffQuery] = useState("");
  const [serviceQuery, setServiceQuery] = useState("");

  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [serviceList, setServiceList] = useState<ServiceItem[]>([]);

  const [totalStaff, setTotalStaff] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);
  const [totalServices, setTotalServices] = useState(0);
  const [staffLoadTick, setStaffLoadTick] = useState(0);
  const [serviceLoadTick, setServiceLoadTick] = useState(0);
  const [isCreateStaffModalOpen, setIsCreateStaffModalOpen] = useState(false);
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  const [createStaffError, setCreateStaffError] = useState<string | null>(null);
  const [createStaffSuccess, setCreateStaffSuccess] = useState<string | null>(
    null,
  );
  const [serviceOptions, setServiceOptions] = useState<ServiceItem[]>([]);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isSavingService, setIsSavingService] = useState(false);
  const [isDeletingServiceId, setIsDeletingServiceId] = useState<number | null>(
    null,
  );
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItem | null>(
    null,
  );
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [serviceSuccess, setServiceSuccess] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceForm>({
    nom: "",
    description: "",
    illustration: null,
  });
  const [createStaffForm, setCreateStaffForm] = useState<CreateStaffForm>({
    email: "",
    nom: "",
    prenom: "",
    telephone: "",
    adresseCabinet: "",
    role: "MEDECIN",
    numeroInscription: "",
    serviceId: "",
  });
  const [selectedStaff, setSelectedStaff] = useState<StaffItem | null>(null);
  const [isStaffDetailModalOpen, setIsStaffDetailModalOpen] = useState(false);

  useEffect(() => {
    const loadOverviewData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [staffRes, patientRes, serviceRes] = await Promise.all([
          apiClient.get<PageResponse<StaffItem>>("/admin/staff", {
            params: { page: 0, size: 8, q: staffQuery || undefined },
          }),
          apiClient.get<PageResponse<unknown>>("/admin/patients", {
            params: { page: 0, size: 1 },
          }),
          apiClient.get<PageResponse<ServiceItem>>("/admin/services", {
            params: { page: 0, size: 200 },
          }),
        ]);

        setStaffList(staffRes.data?.content ?? []);
        setServiceList(serviceRes.data?.content ?? []);
        setTotalStaff(staffRes.data?.totalElements ?? 0);
        setTotalPatients(patientRes.data?.totalElements ?? 0);
        setTotalServices(serviceRes.data?.totalElements ?? 0);
      } catch {
        setError("Impossible de charger les données administrateur.");
      } finally {
        setLoading(false);
      }
    };

    void loadOverviewData();
  }, [staffQuery, staffLoadTick, serviceLoadTick]);

  useEffect(() => {
    if (!isCreateStaffModalOpen) return;
    const loadServiceOptions = async () => {
      try {
        const { data } = await apiClient.get<PageResponse<ServiceItem>>(
          "/admin/services",
          {
            params: { page: 0, size: 200 },
          },
        );
        setServiceOptions(data?.content ?? []);
      } catch {
        setServiceOptions([]);
      }
    };
    void loadServiceOptions();
  }, [isCreateStaffModalOpen]);

  const filteredServices = useMemo(() => {
    const q = serviceQuery.trim().toLowerCase();
    if (!q) return serviceList;
    return serviceList.filter((service) => {
      const name = service.nom?.toLowerCase() ?? "";
      const description = service.description?.toLowerCase() ?? "";
      return name.includes(q) || description.includes(q);
    });
  }, [serviceList, serviceQuery]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutRequest();
    } catch {
      // no-op: clear local session even if API logout fails
    } finally {
      logout();
      setIsLoggingOut(false);
    }
  };

  const resetCreateStaffForm = () => {
    setCreateStaffForm({
      email: "",
      nom: "",
      prenom: "",
      telephone: "",
      adresseCabinet: "",
      role: "MEDECIN",
      numeroInscription: "",
      serviceId: "",
    });
    setCreateStaffError(null);
  };

  const openCreateStaffModal = () => {
    resetCreateStaffForm();
    setCreateStaffSuccess(null);
    setIsCreateStaffModalOpen(true);
  };

  const closeCreateStaffModal = () => {
    setIsCreateStaffModalOpen(false);
    setCreateStaffError(null);
  };

  const handleCreateStaffChange = (
    field: keyof CreateStaffForm,
    value: string,
  ) => {
    setCreateStaffForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateStaff = async () => {
    const {
      email,
      nom,
      prenom,
      telephone,
      adresseCabinet,
      role,
      numeroInscription,
      serviceId,
    } = createStaffForm;

    if (!email || !nom || !prenom || !telephone || !adresseCabinet || !role) {
      setCreateStaffError("Merci de renseigner tous les champs obligatoires.");
      return;
    }

    if (role === "MEDECIN" && (!numeroInscription || !serviceId)) {
      setCreateStaffError(
        "Pour un médecin, le numéro d'inscription et le service sont obligatoires.",
      );
      return;
    }

    setIsCreatingStaff(true);
    setCreateStaffError(null);
    try {
      const payload: CreateStaffPayload = {
        email: email.trim(),
        nom: nom.trim(),
        prenom: prenom.trim(),
        telephone: telephone.trim(),
        adresseCabinet: adresseCabinet.trim(),
        adresse: adresseCabinet.trim(),
        role,
      };

      if (role === "MEDECIN") {
        payload.numeroInscription = numeroInscription.trim();
        payload.serviceId = Number(serviceId);
      }

      await createStaff(payload);
      setIsCreateStaffModalOpen(false);
      setCreateStaffSuccess("Le membre du staff a été créé avec succès.");
      setStaffLoadTick((prev) => prev + 1);
      resetCreateStaffForm();
    } catch {
      setCreateStaffError(
        "Échec de création. Vérifie les informations saisies puis réessaie.",
      );
    } finally {
      setIsCreatingStaff(false);
    }
  };

  const openCreateServiceModal = () => {
    setServiceForm({ nom: "", description: "", illustration: null });
    setServiceError(null);
    setServiceSuccess(null);
    setIsServiceModalOpen(true);
  };

  const openEditServiceModal = (service: ServiceItem) => {
    setServiceForm({
      id: service.id,
      nom: service.nom ?? "",
      description: service.description ?? "",
      illustration: null,
      currentIllustrationUrl: service.illustrationUrl,
    });
    setServiceError(null);
    setServiceSuccess(null);
    setIsServiceModalOpen(true);
  };

  const closeServiceModal = () => {
    if (isSavingService) return;
    setIsServiceModalOpen(false);
    setServiceError(null);
  };

  const handleServiceFormChange = (
    field: keyof Omit<ServiceForm, "illustration" | "currentIllustrationUrl">,
    value: string,
  ) => {
    setServiceForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveService = async () => {
    if (!serviceForm.nom.trim()) {
      setServiceError("Le nom du service est obligatoire.");
      return;
    }
    if (!serviceForm.id && !serviceForm.illustration) {
      setServiceError("L'illustration est obligatoire lors de la création.");
      return;
    }

    setIsSavingService(true);
    setServiceError(null);
    try {
      const formData = new FormData();
      formData.append("nom", serviceForm.nom.trim());
      if (serviceForm.description.trim()) {
        formData.append("description", serviceForm.description.trim());
      }
      if (serviceForm.illustration) {
        formData.append("illustration", serviceForm.illustration);
      }

      if (serviceForm.id) {
        await apiClientMultipart.put(
          `/admin/services/${serviceForm.id}`,
          formData,
        );
        setServiceSuccess("Service mis à jour avec succès.");
      } else {
        await apiClientMultipart.post("/admin/services", formData);
        setServiceSuccess("Service créé avec succès.");
      }
      setIsServiceModalOpen(false);
      setServiceLoadTick((prev) => prev + 1);
    } catch {
      setServiceError("Échec de l'enregistrement du service. Réessaie.");
    } finally {
      setIsSavingService(false);
    }
  };

  const handleDeleteServiceConfirmed = async () => {
    if (!serviceToDelete) return;
    setIsDeletingServiceId(serviceToDelete.id);
    setServiceError(null);
    setServiceSuccess(null);
    try {
      await apiClient.delete(`/admin/services/${serviceToDelete.id}`);
      setServiceSuccess("Service supprimé avec succès.");
      setServiceLoadTick((prev) => prev + 1);
      setServiceToDelete(null);
    } catch {
      setServiceError("Impossible de supprimer ce service.");
    } finally {
      setIsDeletingServiceId(null);
    }
  };

  const openStaffDetailModal = (staff: StaffItem) => {
    setSelectedStaff(staff);
    setIsStaffDetailModalOpen(true);
  };

  const closeStaffDetailModal = () => {
    setIsStaffDetailModalOpen(false);
    setSelectedStaff(null);
  };

  const dashboardCards = [
    {
      title: "Staff médical",
      value: totalStaff,
      subtitle: "Médecins + nutritionnistes",
      icon: <Icon icon={UserGroupIcon} className="size-5" />,
    },
    {
      title: "Patients",
      value: totalPatients,
      subtitle: "Comptes enregistrés",
      icon: <Icon icon={UserIcon} className="size-5" />,
    },
    {
      title: "Services",
      value: totalServices,
      subtitle: "Catalogue clinique",
      icon: <Icon icon={Add01Icon} className="size-5" />,
    },
  ];

  const staffColumns = useMemo<DataTableColumn<StaffItem>[]>(
    () => [
      {
        header: "Nom",
        cell: (item) => (
          <span className="font-semibold">
            {item.prenom} {item.nom}
          </span>
        ),
      },
      {
        header: "Email",
        cell: (item) => (
          <span className="text-muted-foreground">{item.email}</span>
        ),
      },
      {
        header: "Rôle",
        cell: (item) => normalizeRoleLabel(item.role),
      },
      {
        header: "Téléphone",
        cell: (item) => item.telephone || "-",
      },
      {
        header: "Actions",
        cell: (item) => (
          <ActionButton
            action="info"
            onClick={() => openStaffDetailModal(item)}
          />
        ),
      },
    ],
    [],
  );

  const serviceColumns = useMemo<DataTableColumn<ServiceItem>[]>(
    () => [
      {
        header: "Illustration",
        cell: (service) =>
          service.illustrationUrl ? (
            <img
              src={service.illustrationUrl}
              alt={service.nom}
              className="h-12 w-16 rounded-md border border-border/40 object-cover"
            />
          ) : (
            <div className="flex h-12 w-16 items-center justify-center rounded-md border border-dashed border-border text-[10px] text-muted-foreground">
              Sans image
            </div>
          ),
      },
      {
        header: "Nom service",
        cell: (service) => (
          <span className="font-semibold">{service.nom}</span>
        ),
      },
      {
        header: "Description",
        cell: (service) => (
          <p className="line-clamp-2 text-muted-foreground">
            {service.description || "Aucune description."}
          </p>
        ),
      },
      {
        header: "Actions",
        cell: (service) => (
          <div className="flex gap-1.5">
            <ActionButton
              action="edit"
              onClick={() => openEditServiceModal(service)}
            />
            <ActionButton
              action="delete"
              onClick={() => setServiceToDelete(service)}
              loading={isDeletingServiceId === service.id}
            />
          </div>
        ),
      },
    ],
    [isDeletingServiceId],
  );

  return (
    <>
    <PageLoader
      show={loading}
      message="Chargement de l'espace administrateur"
      description="Récupération des données en cours…"
    />
    <div className="flex h-screen overflow-hidden bg-slate-50/80 text-foreground font-sans">
      <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-border/40 bg-white md:sticky md:top-0 md:flex">
        <div className="flex h-20 items-center px-6">
          <Logo size="md" subtitle="Espace Administrateur" />
        </div>

        <div className="mx-4 mt-2 mb-4 rounded-2xl bg-linear-to-br from-primary to-primary/80 p-4 text-primary-foreground shadow-lg shadow-primary/20">
          <p className="text-sm font-bold truncate">{displayName}</p>
          <p className="text-[11px] font-medium text-white/80 truncate">
            ADMIN
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-semibold">
            <div className="rounded-lg bg-white/15 px-2 py-1">
              Staff: {totalStaff}
            </div>
            <div className="rounded-lg bg-white/15 px-2 py-1">
              Services: {totalServices}
            </div>
          </div>
        </div>

        <div className="flex-1 px-4">
          <nav className="space-y-1">
            <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Navigation
            </p>
            {[
              { id: "overview", label: "Vue globale", icon: Analytics02Icon },
              { id: "staff", label: "Staff médical", icon: UserGroupIcon },
              { id: "services", label: "Services", icon: Hospital01Icon },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabKey)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all relative overflow-hidden ${
                  activeTab === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {activeTab === item.id && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full"></span>
                )}
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 group-hover:bg-muted"
                  }`}
                >
                  <Icon icon={item.icon} className="size-[18px]" />
                </div>
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            ))}
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
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between bg-white/80 backdrop-blur-md px-6 md:px-10 border-b border-border/40">
          <div>
            <h1 className="text-xl font-black tracking-tight">
              Dashboard administrateur
            </h1>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">
              Vue centralisée du staff et des services.
            </p>
          </div>
          <div className="hidden gap-2 md:flex">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveTab("staff")}
            >
              Gérer le staff
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveTab("services")}
            >
              Gérer les services
            </Button>
          </div>
        </header>

        <div className="space-y-6 p-6 md:p-10">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
              {error}
            </div>
          )}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardCards.map((card) => (
              <Card key={card.title} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {card.icon}
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="mt-1 text-3xl font-black tracking-tight">
                    {loading ? "..." : card.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {card.subtitle}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>

          {(activeTab === "overview" || activeTab === "staff") && (
            <section className="space-y-3 rounded-2xl border border-border/60 bg-white p-4 md:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">
                    Équipe médicale
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Recherche rapide par nom/email et supervision des profils
                    staff.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                  <SearchBar
                    value={staffQuery}
                    onValueChange={setStaffQuery}
                    placeholder="Rechercher un membre du staff…"
                    containerClassName="md:w-[320px]"
                  />
                  <AddButton onClick={openCreateStaffModal}>
                    Ajouter un staff
                  </AddButton>
                </div>
              </div>

              {createStaffSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
                  {createStaffSuccess}
                </div>
              )}

              <DataTable
                columns={staffColumns}
                data={staffList}
                getRowKey={(item) => item.id}
                minWidth="860px"
                emptyTitle="Aucun membre du staff"
                emptyDescription="Aucun membre ne correspond à votre recherche."
              />
            </section>
          )}

          {(activeTab === "overview" || activeTab === "services") && (
            <section className="space-y-3 rounded-2xl border border-border/60 bg-white p-4 md:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">
                    Services cliniques
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Catalogue des services avec recherche et gestion CRUD.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                  <SearchBar
                    value={serviceQuery}
                    onValueChange={setServiceQuery}
                    placeholder="Rechercher un service…"
                    containerClassName="md:w-[320px]"
                  />
                  <AddButton onClick={openCreateServiceModal}>
                    Ajouter service
                  </AddButton>
                </div>
              </div>

              {serviceSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
                  {serviceSuccess}
                </div>
              )}
              {serviceError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">
                  {serviceError}
                </div>
              )}

              <DataTable
                columns={serviceColumns}
                data={filteredServices}
                getRowKey={(service) => service.id}
                minWidth="860px"
                emptyTitle="Aucun service trouvé"
                emptyDescription="Ajoutez un service ou modifiez votre recherche."
              />
            </section>
          )}
        </div>
      </main>

      <Modal
        open={isCreateStaffModalOpen}
        onClose={closeCreateStaffModal}
        title="Ajouter un membre du staff"
        description="Choisis le type de staff puis renseigne les informations obligatoires."
        onConfirm={handleCreateStaff}
        confirmLabel={isCreatingStaff ? "Création…" : "Créer le staff"}
        confirmDisabled={isCreatingStaff}
        confirmLoading={isCreatingStaff}
        error={
          createStaffError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
              {createStaffError}
            </div>
          ) : undefined
        }
        contentClassName="md:py-4"
      >
        <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Type de staff (obligatoire)
                </label>
                <select
                  value={createStaffForm.role}
                  onChange={(e) =>
                    handleCreateStaffChange("role", e.target.value as StaffRole)
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="MEDECIN">Médecin</option>
                  <option value="NUTRITIONNISTE">Nutritionniste</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Email (obligatoire)
                </label>
                <Input
                  value={createStaffForm.email}
                  onChange={(e) =>
                    handleCreateStaffChange("email", e.target.value)
                  }
                  placeholder="email@curalink.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Téléphone (obligatoire)
                </label>
                <Input
                  value={createStaffForm.telephone}
                  onChange={(e) =>
                    handleCreateStaffChange("telephone", e.target.value)
                  }
                  placeholder="+225 XX XX XX XX XX"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Nom (obligatoire)
                </label>
                <Input
                  value={createStaffForm.nom}
                  onChange={(e) =>
                    handleCreateStaffChange("nom", e.target.value)
                  }
                  placeholder="Nom"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Prénom (obligatoire)
                </label>
                <Input
                  value={createStaffForm.prenom}
                  onChange={(e) =>
                    handleCreateStaffChange("prenom", e.target.value)
                  }
                  placeholder="Prénom"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Adresse cabinet (obligatoire)
                </label>
                <Input
                  value={createStaffForm.adresseCabinet}
                  onChange={(e) =>
                    handleCreateStaffChange("adresseCabinet", e.target.value)
                  }
                  placeholder="Adresse du cabinet"
                />
              </div>

              {createStaffForm.role === "MEDECIN" && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Numéro inscription (obligatoire)
                    </label>
                    <Input
                      value={createStaffForm.numeroInscription}
                      onChange={(e) =>
                        handleCreateStaffChange(
                          "numeroInscription",
                          e.target.value,
                        )
                      }
                      placeholder="Numéro d'inscription"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Service (obligatoire)
                    </label>
                    <select
                      value={createStaffForm.serviceId}
                      onChange={(e) =>
                        handleCreateStaffChange("serviceId", e.target.value)
                      }
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Sélectionner un service</option>
                      {serviceOptions.map((service) => (
                        <option key={service.id} value={String(service.id)}>
                          {service.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
        </div>
      </Modal>

      <Modal
        open={isServiceModalOpen}
        onClose={closeServiceModal}
        title={serviceForm.id ? "Modifier service" : "Ajouter service"}
        description={
          serviceForm.id
            ? "Mets à jour les informations du service."
            : "Crée un nouveau service avec son illustration."
        }
        onConfirm={handleSaveService}
        confirmLabel={isSavingService ? "Enregistrement…" : "Enregistrer"}
        confirmDisabled={isSavingService}
        confirmLoading={isSavingService}
        error={
          serviceError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
              {serviceError}
            </div>
          ) : undefined
        }
      >
        <div className="grid gap-4">
              {/* Illustration actuelle en mode édition */}
              {serviceForm.id && serviceForm.currentIllustrationUrl && (
                <div className="flex flex-col items-center gap-3 rounded-xl bg-muted/30 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Illustration actuelle
                  </p>
                  <div className="relative">
                    <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-primary/20 shadow-lg shadow-primary/10">
                      <img
                        src={serviceForm.currentIllustrationUrl}
                        alt="Illustration actuelle"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                      <Icon icon={Upload01Icon} className="size-3.5" strokeWidth={2.5} />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Choisis un nouveau fichier ci-dessous pour remplacer l'image
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Nom service (obligatoire)
                </label>
                <Input
                  value={serviceForm.nom}
                  onChange={(e) =>
                    handleServiceFormChange("nom", e.target.value)
                  }
                  placeholder="Cardiologie, Nutrition..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Description
                </label>
                <textarea
                  value={serviceForm.description}
                  onChange={(e) =>
                    handleServiceFormChange("description", e.target.value)
                  }
                  placeholder="Description du service"
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Illustration{" "}
                  {!serviceForm.id ? "(obligatoire)" : "(optionnel)"}
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setServiceForm((prev) => ({
                      ...prev,
                      illustration: e.target.files?.[0] ?? null,
                    }))
                  }
                />
                {serviceForm.illustration && (
                  <p className="text-[11px] text-emerald-600 font-medium">
                    Nouveau fichier sélectionné :{" "}
                    {serviceForm.illustration.name}
                  </p>
                )}
              </div>
        </div>
      </Modal>

      <Modal
        open={isStaffDetailModalOpen && !!selectedStaff}
        onClose={closeStaffDetailModal}
        title="Détails du membre du staff"
        description="Informations complètes du profil."
        size="md"
        hideConfirm
        cancelLabel="Fermer"
      >
        {selectedStaff && (
        <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon icon={UserIcon} className="size-6" />
                </div>
                <div>
                  <p className="text-base font-bold">
                    {selectedStaff.prenom} {selectedStaff.nom}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {normalizeRoleLabel(selectedStaff.role)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 rounded-xl bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Email
                  </span>
                  <span className="text-sm font-medium">
                    {selectedStaff.email}
                  </span>
                </div>
                <div className="h-px bg-border/60" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Téléphone
                  </span>
                  <span className="text-sm font-medium">
                    {selectedStaff.telephone || "—"}
                  </span>
                </div>
                <div className="h-px bg-border/60" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Adresse cabinet
                  </span>
                  <span className="text-sm font-medium text-right max-w-[200px]">
                    {selectedStaff.adresseCabinet || "—"}
                  </span>
                </div>
                <div className="h-px bg-border/60" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Statut connexion
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      selectedStaff.isFirstConnexion
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {selectedStaff.isFirstConnexion
                      ? "Première connexion"
                      : "Connexion établie"}
                  </span>
                </div>

                {selectedStaff.numeroInscription && (
                  <>
                    <div className="h-px bg-border/60" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Numéro d'inscription
                      </span>
                      <span className="text-sm font-medium">
                        {selectedStaff.numeroInscription}
                      </span>
                    </div>
                  </>
                )}

                {selectedStaff.service && (
                  <>
                    <div className="h-px bg-border/60" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Service
                      </span>
                      <span className="text-sm font-medium">
                        {selectedStaff.service.nom}
                      </span>
                    </div>
                  </>
                )}
              </div>
        </div>
        )}
      </Modal>

      <ConfirmationModal
        open={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        onConfirm={handleDeleteServiceConfirmed}
        title="Confirmer la suppression"
        description={
          serviceToDelete
            ? `Voulez-vous vraiment supprimer le service « ${serviceToDelete.nom} » ?`
            : undefined
        }
        confirmLabel="Supprimer"
        loading={isDeletingServiceId !== null}
      />
    </div>
    </>
  );
}
