import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { createStaff, type CreateStaffPayload } from "@/services/appointmentApi";
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
  nom: string;
  prenom: string;
  role?: string;
  telephone?: string;
  adresseCabinet?: string;
  numeroInscription?: string;
  serviceNom?: string;
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

  useEffect(() => {
    const loadOverviewData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [staffRes, patientRes, serviceRes] =
          await Promise.all([
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
    field: keyof Omit<ServiceForm, "illustration">,
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
        await apiClientMultipart.put(`/admin/services/${serviceForm.id}`, formData);
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

  const handleDeleteService = async (service: ServiceItem) => {
    if (!window.confirm(`Supprimer le service "${service.nom}" ?`)) return;
    setIsDeletingServiceId(service.id);
    setServiceError(null);
    setServiceSuccess(null);
    try {
      await apiClient.delete(`/admin/services/${service.id}`);
      setServiceSuccess("Service supprimé avec succès.");
      setServiceLoadTick((prev) => prev + 1);
    } catch {
      setServiceError("Impossible de supprimer ce service.");
    } finally {
      setIsDeletingServiceId(null);
    }
  };

  const dashboardCards = [
    {
      title: "Staff médical",
      value: totalStaff,
      subtitle: "Médecins + nutritionnistes",
      icon: (
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
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      title: "Patients",
      value: totalPatients,
      subtitle: "Comptes enregistrés",
      icon: (
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
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      title: "Services",
      value: totalServices,
      subtitle: "Catalogue clinique",
      icon: (
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
          <path d="M12 2v20" />
          <path d="M2 12h20" />
        </svg>
      ),
    },
  ];

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
              Espace Administrateur
            </p>
          </div>
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
              { id: "overview", label: "Vue globale" },
              { id: "staff", label: "Staff médical" },
              { id: "services", label: "Services" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabKey)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all relative ${
                  activeTab === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {activeTab === item.id && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full"></span>
                )}
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
            {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between bg-[#F5F6FA]/85 backdrop-blur-md px-6 md:px-10">
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
                  <Input
                    value={staffQuery}
                    onChange={(e) => setStaffQuery(e.target.value)}
                    placeholder="Rechercher un membre du staff..."
                    className="md:w-[320px]"
                  />
                  <Button onClick={openCreateStaffModal}>Ajouter un staff</Button>
                </div>
              </div>

              {createStaffSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
                  {createStaffSuccess}
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full min-w-[680px] text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Nom</th>
                      <th className="px-4 py-3">Rôle</th>
                      <th className="px-4 py-3">Téléphone</th>
                      <th className="px-4 py-3">Service</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.length === 0 ? (
                      <tr>
                        <td
                          className="px-4 py-6 text-muted-foreground"
                          colSpan={4}
                        >
                          Aucun membre du staff trouvé.
                        </td>
                      </tr>
                    ) : (
                      staffList.map((item) => (
                        <tr key={item.id} className="border-t border-border/50">
                          <td className="px-4 py-3 font-semibold">
                            {item.prenom} {item.nom}
                          </td>
                          <td className="px-4 py-3">
                            {normalizeRoleLabel(item.role)}
                          </td>
                          <td className="px-4 py-3">{item.telephone || "-"}</td>
                          <td className="px-4 py-3">
                            {item.serviceNom || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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
                  <Input
                    value={serviceQuery}
                    onChange={(e) => setServiceQuery(e.target.value)}
                    placeholder="Rechercher un service..."
                    className="md:w-[320px]"
                  />
                  <Button onClick={openCreateServiceModal}>Ajouter service</Button>
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

              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full min-w-[860px] text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Illustration</th>
                      <th className="px-4 py-3">Nom service</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServices.length === 0 ? (
                      <tr>
                        <td className="px-4 py-6 text-muted-foreground" colSpan={4}>
                          Aucun service trouvé.
                        </td>
                      </tr>
                    ) : (
                      filteredServices.map((service) => (
                        <tr key={service.id} className="border-t border-border/50">
                          <td className="px-4 py-3">
                            {service.illustrationUrl ? (
                              <img
                                src={service.illustrationUrl}
                                alt={service.nom}
                                className="h-12 w-16 rounded-md border border-border/40 object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-16 items-center justify-center rounded-md border border-dashed border-border text-[10px] text-muted-foreground">
                                Sans image
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-semibold">{service.nom}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            <p className="line-clamp-2">
                              {service.description || "Aucune description."}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditServiceModal(service)}
                              >
                                Modifier
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-rose-200 text-rose-700 hover:bg-rose-50"
                                onClick={() => handleDeleteService(service)}
                                disabled={isDeletingServiceId === service.id}
                              >
                                {isDeletingServiceId === service.id
                                  ? "Suppression..."
                                  : "Supprimer"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

        </div>
      </main>

      {isCreateStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border/60 bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-border/60 px-5 py-4">
              <div>
                <h3 className="text-lg font-extrabold tracking-tight">
                  Ajouter un membre du staff
                </h3>
                <p className="text-xs text-muted-foreground">
                  Choisis le type de staff puis renseigne les informations
                  obligatoires.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={closeCreateStaffModal}>
                Fermer
              </Button>
            </div>

            <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
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
                  onChange={(e) => handleCreateStaffChange("email", e.target.value)}
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
                  onChange={(e) => handleCreateStaffChange("nom", e.target.value)}
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
                        handleCreateStaffChange("numeroInscription", e.target.value)
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

            <div className="space-y-3 border-t border-border/60 px-5 py-4">
              {createStaffError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
                  {createStaffError}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={closeCreateStaffModal}
                  disabled={isCreatingStaff}
                >
                  Annuler
                </Button>
                <Button onClick={handleCreateStaff} disabled={isCreatingStaff}>
                  {isCreatingStaff ? "Création..." : "Créer le staff"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border/60 bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-border/60 px-5 py-4">
              <div>
                <h3 className="text-lg font-extrabold tracking-tight">
                  {serviceForm.id ? "Modifier service" : "Ajouter service"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {serviceForm.id
                    ? "Mets à jour les informations du service."
                    : "Crée un nouveau service avec son illustration."}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={closeServiceModal}>
                Fermer
              </Button>
            </div>

            <div className="grid gap-4 px-5 py-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Nom service (obligatoire)
                </label>
                <Input
                  value={serviceForm.nom}
                  onChange={(e) => handleServiceFormChange("nom", e.target.value)}
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
                  Illustration {!serviceForm.id ? "(obligatoire)" : "(optionnel)"}
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
              </div>
            </div>

            <div className="space-y-3 border-t border-border/60 px-5 py-4">
              {serviceError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
                  {serviceError}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={closeServiceModal}
                  disabled={isSavingService}
                >
                  Annuler
                </Button>
                <Button onClick={handleSaveService} disabled={isSavingService}>
                  {isSavingService ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
