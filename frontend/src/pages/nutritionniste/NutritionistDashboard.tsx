import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ActionButton } from "@/components/ui/action-button";
import { AddButton } from "@/components/ui/add-button";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { DataLoader } from "@/components/ui/data-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { Logo } from "@/components/ui/logo";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { apiClient, logoutRequest } from "@/services/axiosInstance";
import avatarDefault from "@/assets/avatar.webp";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Baby01Icon,
  BloodIcon,
  BloodPressureIcon,
  Bookmark01Icon,
  BookOpen01Icon,
  Bone01Icon,
  Calendar01Icon,
  ClipboardIcon,
  Clock01Icon,
  FlashIcon,
  HeartAddIcon,
  Home01Icon,
  Icon,
  Idea01Icon,
  InformationCircleIcon,
  Logout01Icon,
  Notification01Icon,
  WeightScale01Icon,
} from "@/components/ui/icon";

type ApiArticle = {
  id: number;
  titre: string;
  contenu: string;
  datePublication: string;
  couvertureUrl?: string;
  rubrique?: { id: number; titre: string; pathologie?: string };
  auteurNom?: string;
};

type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80";

function stripHtml(html: string): string {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

function formatArticleDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function estimateReadMinutes(html: string): number {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

type RubriqueApiItem = {
  id: number;
  titre: string;
  description?: string;
  pathologie?: string;
};

type RubriqueCountItem = {
  rubriqueId: number;
  nomRubrique: string;
  nombreArticles: number;
};
type CategoryCard = {
  id: number;
  name: string;
  count: number;
  pathologie?: string;
  image: string;
  accent: string;
  icon: ReactNode;
};

type CategoryVisual = {
  image: string;
  accent: string;
  icon: ReactNode;
};

const normalizeRubriqueName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  diabete: {
    image:
      "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=400&q=80",
    accent: "from-red-500/80 to-red-600/80",
    icon: <Icon icon={BloodPressureIcon} className="size-[18px]" />,
  },
  hypertension: {
    image:
      "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?auto=format&fit=crop&w=400&q=80",
    accent: "from-rose-500/80 to-pink-600/80",
    icon: <Icon icon={HeartAddIcon} className="size-[18px]" />,
  },
  cancer: {
    image:
      "https://images.unsplash.com/photo-1579165466991-467135ad3110?auto=format&fit=crop&w=400&q=80",
    accent: "from-purple-500/80 to-violet-600/80",
    icon: <Icon icon={ClipboardIcon} className="size-[18px]" />,
  },
  acancer: {
    image:
      "https://images.unsplash.com/photo-1579165466991-467135ad3110?auto=format&fit=crop&w=400&q=80",
    accent: "from-purple-500/80 to-violet-600/80",
    icon: <Icon icon={ClipboardIcon} className="size-[18px]" />,
  },
  osteoporose: {
    image:
      "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=400&q=80",
    accent: "from-slate-500/80 to-slate-700/80",
    icon: <Icon icon={Bone01Icon} className="size-[18px]" />,
  },
  anemie: {
    image:
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=400&q=80",
    accent: "from-red-500/80 to-rose-600/80",
    icon: <Icon icon={BloodIcon} className="size-[18px]" />,
  },
  obesite: {
    image:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=80",
    accent: "from-orange-500/80 to-amber-600/80",
    icon: <Icon icon={WeightScale01Icon} className="size-[18px]" />,
  },
  grossesse: {
    image:
      "https://images.unsplash.com/photo-1531983412531-1f49a365ffed?auto=format&fit=crop&w=400&q=80",
    accent: "from-pink-500/80 to-rose-500/80",
    icon: <Icon icon={Baby01Icon} className="size-[18px]" />,
  },
};

const LIST_PAGE_SIZE = 4;
const HOME_PAGE_SIZE = 5;

export default function NutritionistDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState<"accueil" | "articles">("accueil");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [homeArticles, setHomeArticles] = useState<ApiArticle[]>([]);
  const [listArticles, setListArticles] = useState<ApiArticle[]>([]);
  const [listPage, setListPage] = useState(0);
  const [listTotalPages, setListTotalPages] = useState(0);
  const [listTotalElements, setListTotalElements] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rubriques, setRubriques] = useState<RubriqueApiItem[]>([]);
  const [rubriqueCounts, setRubriqueCounts] = useState<RubriqueCountItem[]>([]);
  const [loadingRubriques, setLoadingRubriques] = useState(true);
  const [selectedRubrique, setSelectedRubrique] = useState(
    "Toutes les catégories",
  );
  const latestScrollRef = useRef<HTMLDivElement | null>(null);
  const displayName =
    [user?.prenom, user?.nom].filter(Boolean).join(" ").trim() ||
    user?.nom ||
    user?.email ||
    "Utilisateur";
  const roleLabel =
    user?.userType === "MEDECIN"
      ? "Médecin"
      : user?.userType === "PATIENT"
        ? "Patient"
        : user?.userType === "NUTRITIONNISTE"
          ? "Nutritionniste"
          : "Utilisateur";

  const scrollLatest = (direction: "left" | "right") => {
    const node = latestScrollRef.current;
    if (!node) return;
    const amount = node.clientWidth * 0.8;
    node.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const publishedTotal = useMemo(() => {
    if (rubriqueCounts.length > 0) {
      return rubriqueCounts.reduce((sum, item) => sum + item.nombreArticles, 0);
    }
    return listTotalElements;
  }, [rubriqueCounts, listTotalElements]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    setListPage(0);
  }, [selectedRubrique, debouncedSearch]);

  useEffect(() => {
    const nutritionnisteId = user?.id;
    if (nutritionnisteId == null || nutritionnisteId === "") return;

    const fetchHome = async () => {
      try {
        const { data } = await apiClient.get<PageResponse<ApiArticle>>(
          `/nutrition/nutritionnistes/${encodeURIComponent(String(nutritionnisteId))}/articles`,
          { params: { page: 0, size: HOME_PAGE_SIZE } },
        );
        setHomeArticles(data?.content ?? []);
      } catch {
        setHomeArticles([]);
      }
    };

    void fetchHome();
  }, [user?.id]);

  useEffect(() => {
    if (activeTab !== "articles") return;
    const nutritionnisteId = user?.id;
    if (nutritionnisteId == null || nutritionnisteId === "") {
      setListError("Identifiant utilisateur introuvable. Reconnectez-vous.");
      setListArticles([]);
      return;
    }

    const pathologieParam =
      selectedRubrique === "Toutes les catégories"
        ? undefined
        : rubriques.find((r) => r.titre === selectedRubrique)?.pathologie;

    const fetchList = async () => {
      setListLoading(true);
      setListError(null);
      try {
        const { data } = await apiClient.get<PageResponse<ApiArticle>>(
          `/nutrition/nutritionnistes/${encodeURIComponent(String(nutritionnisteId))}/articles`,
          {
            params: {
              page: listPage,
              size: LIST_PAGE_SIZE,
              ...(debouncedSearch ? { q: debouncedSearch } : {}),
              ...(pathologieParam ? { pathologie: pathologieParam } : {}),
            },
          },
        );
        setListArticles(data?.content ?? []);
        setListTotalPages(data?.totalPages ?? 0);
        setListTotalElements(data?.totalElements ?? 0);
      } catch {
        setListArticles([]);
        setListTotalPages(0);
        setListTotalElements(0);
        setListError("Impossible de charger vos articles.");
      } finally {
        setListLoading(false);
      }
    };

    void fetchList();
  }, [
    activeTab,
    user?.id,
    listPage,
    debouncedSearch,
    selectedRubrique,
    rubriques,
  ]);

  useEffect(() => {
    const fetchRubriques = async () => {
      try {
        const { data } = await apiClient.get<RubriqueApiItem[]>(
          "/nutrition/rubriques",
        );
        setRubriques(data ?? []);
      } catch {
        setRubriques([]);
      } finally {
        setLoadingRubriques(false);
      }
    };

    void fetchRubriques();
  }, []);

  useEffect(() => {
    const fetchRubriqueCounts = async () => {
      try {
        const { data } = await apiClient.get<RubriqueCountItem[]>(
          "/nutrition/rubriques/article-count",
        );
        setRubriqueCounts(data ?? []);
      } catch {
        setRubriqueCounts([]);
      }
    };

    void fetchRubriqueCounts();
  }, []);

  const categoryCards: CategoryCard[] = useMemo(() => {
    if (rubriqueCounts.length > 0) {
      return rubriqueCounts.map((item) => {
        const rubriqueMatch =
          rubriques.find((r) => r.id === item.rubriqueId) ??
          rubriques.find(
            (r) =>
              normalizeRubriqueName(r.titre) ===
              normalizeRubriqueName(item.nomRubrique),
          );
        const key = normalizeRubriqueName(item.nomRubrique);
        const visual = CATEGORY_VISUALS[key] ?? {
          image:
            "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=80",
          accent: "from-slate-500/80 to-slate-700/80",
          icon: <Icon icon={BookOpen01Icon} className="size-[18px]" />,
        };
        return {
          id: item.rubriqueId,
          name: item.nomRubrique,
          count: item.nombreArticles,
          pathologie: rubriqueMatch?.pathologie,
          ...visual,
        };
      });
    }

    return [
      { id: 1, name: "Diabète", count: 0, ...CATEGORY_VISUALS.diabete },
      {
        id: 2,
        name: "Hypertension",
        count: 0,
        ...CATEGORY_VISUALS.hypertension,
      },
      { id: 3, name: "Cancer", count: 0, ...CATEGORY_VISUALS.cancer },
      { id: 4, name: "Ostéoporose", count: 0, ...CATEGORY_VISUALS.osteoporose },
      { id: 5, name: "Anémie", count: 0, ...CATEGORY_VISUALS.anemie },
      { id: 6, name: "Obésité", count: 0, ...CATEGORY_VISUALS.obesite },
      { id: 7, name: "Grossesse", count: 0, ...CATEGORY_VISUALS.grossesse },
    ];
  }, [rubriqueCounts, rubriques]);

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
      {/* Sidebar (desktop) */}
      <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-border/40 bg-white md:sticky md:top-0 md:flex">
        <div className="flex h-20 items-center px-6">
          <Logo size="md" subtitle="Espace Nutritionniste" />
        </div>

        {/* Profile Card */}
        <div className="mx-4 mt-2 mb-4 rounded-2xl bg-linear-to-br from-primary to-primary/80 p-4 text-primary-foreground shadow-lg shadow-primary/20">
          <div className="flex items-center gap-3">
            <img
              src={avatarDefault}
              alt="Profile"
              className="h-11 w-11 rounded-full object-cover border-2 border-white/30"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{displayName}</p>
              <p className="text-[11px] font-medium text-white/80 truncate">
                {roleLabel}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-bold">
            <span className="text-white/80">Articles</span>
            <span className="bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-0.5">
              {publishedTotal} publiés
            </span>
          </div>
        </div>

        {/* Bouton principal */}
        <div className="px-4 pb-4">
          <AddButton
            onClick={() => navigate("/nutritionniste/articles/new")}
            className="h-11 w-full rounded-xl font-bold shadow-md"
          >
            Nouvel article
          </AddButton>
        </div>

        <div className="flex-1 px-4">
          <nav className="space-y-1">
            <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Navigation
            </p>

            <button
              onClick={() => setActiveTab("accueil")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all relative overflow-hidden group ${activeTab === "accueil" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              {activeTab === "accueil" && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full"></span>
              )}
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${activeTab === "accueil" ? "bg-primary text-primary-foreground" : "bg-muted/50 group-hover:bg-muted"}`}
              >
                <Icon icon={Home01Icon} className="size-[18px]" />
              </div>
              <span className="flex-1 text-left">Tableau de bord</span>
            </button>

            <button
              onClick={() => setActiveTab("articles")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all relative overflow-hidden group ${activeTab === "articles" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              {activeTab === "articles" && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full"></span>
              )}
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${activeTab === "articles" ? "bg-primary text-primary-foreground" : "bg-muted/50 group-hover:bg-muted"}`}
              >
                <Icon icon={BookOpen01Icon} className="size-[18px]" />
              </div>
              <span className="flex-1 text-left">Mes articles</span>
              <span
                className={`ml-auto text-[10px] font-bold rounded-full px-2 py-0.5 ${activeTab === "articles" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {publishedTotal}
              </span>
            </button>
          </nav>

          {/* Box d'aide */}
          <div className="mt-8 rounded-2xl bg-muted/50 p-4 border border-border/60">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
              <Icon icon={InformationCircleIcon} className="size-5" />
            </div>
            <p className="text-sm font-bold leading-tight mb-1">
              Besoin d'aide ?
            </p>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Consultez notre guide pour rédiger des articles de qualité.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 rounded-lg bg-white text-xs font-semibold"
            >
              Voir le guide
            </Button>
          </div>
        </div>

        {/* Logout button */}
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

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-border/40 bg-white/80 backdrop-blur-md px-6 md:px-10">
          <div>
            <h1 className="text-xl font-black tracking-tight">
              {activeTab === "accueil"
                ? `Bonjour, ${displayName}`
                : "Bibliothèque d'articles"}
            </h1>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">
              {activeTab === "accueil"
                ? "Voici un aperçu de vos publications du jour"
                : "Gérez et éditez vos publications nutritionnelles."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "articles" && (
              <SearchBar
                placeholder="Rechercher des articles…"
                value={searchInput}
                onValueChange={setSearchInput}
                size="lg"
                containerClassName="hidden md:block w-[280px]"
                className="rounded-full border-0 bg-white shadow-sm focus-visible:ring-primary/20"
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white shadow-sm h-11 w-11 relative"
            >
              <Icon icon={Notification01Icon} className="size-5" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
            </Button>
          </div>
        </header>

        <div className="p-6 md:p-10 space-y-12 max-w-[1400px] mx-auto">
          {activeTab === "accueil" && (
            <div className="space-y-10 animate-in fade-in duration-500">
              {/* Catégories de pathologies */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">
                      Catégories de pathologies
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground mt-1">
                      Explorez vos articles par thématique
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-full bg-white font-semibold gap-2 h-10 border-muted-foreground/20"
                  >
                    Voir tout
                    <Icon icon={ArrowRight01Icon} className="size-3.5" strokeWidth={2.5} />
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                  {categoryCards.map((cat) => (
                    <div
                      key={cat.id}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        navigate(
                          `/nutrition/${cat.pathologie ?? normalizeRubriqueName(cat.name)}`,
                          { state: { from: location.pathname + location.search } },
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          navigate(
                            `/nutrition/${cat.pathologie ?? normalizeRubriqueName(cat.name)}`,
                            { state: { from: location.pathname + location.search } },
                          );
                        }
                      }}
                      className="relative cursor-pointer group overflow-hidden rounded-3xl aspect-3/4 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_30px_-8px_rgba(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-1"
                    >
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div
                        className={`absolute inset-0 bg-linear-to-t ${cat.accent} mix-blend-multiply`}
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute top-3 left-3 h-9 w-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                        {cat.icon}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <p className="font-black text-base tracking-tight drop-shadow-md">
                          {cat.name}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-[11px] font-bold text-white/80 uppercase tracking-wider">
                            {cat.count} articles
                          </p>
                          <div className="h-6 w-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                            <Icon icon={ArrowRight01Icon} className="size-3" strokeWidth={3} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                {/* À la une (Featured) */}
                {homeArticles.length > 0 && (
                  <div className="xl:col-span-1">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-black tracking-tight">
                          Tendance cette semaine
                        </h3>
                        <p className="text-xs font-medium text-muted-foreground mt-0.5">
                          L'article le plus vu
                        </p>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                        <Icon icon={Idea01Icon} className="size-4" />
                      </div>
                    </div>
                    <Card
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        navigate(`/nutrition/article/${homeArticles[0].id}`)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          navigate(`/nutrition/article/${homeArticles[0].id}`);
                      }}
                      className="overflow-hidden border-0 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.15)] group cursor-pointer relative h-[440px] rounded-3xl"
                    >
                      <img
                        src={homeArticles[0].couvertureUrl || FALLBACK_COVER}
                        alt={homeArticles[0].titre}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/40 to-black/10" />

                      <div className="absolute top-5 left-5 right-5 flex items-start justify-between">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white border border-white/20">
                          <Icon icon={FlashIcon} className="size-3" strokeWidth={2.5} />
                          {homeArticles[0].rubrique?.titre ?? "—"}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="h-9 w-9 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-foreground transition-all"
                        >
                          <Icon icon={Bookmark01Icon} className="size-4" />
                        </button>
                      </div>

                      <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                        <h4 className="text-2xl font-black leading-tight mb-2 drop-shadow-md">
                          {homeArticles[0].titre}
                        </h4>
                        <p className="text-sm text-white/80 line-clamp-2 font-medium mb-4 leading-relaxed">
                          {stripHtml(homeArticles[0].contenu)}
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-white/15">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={avatarDefault}
                              className="h-8 w-8 rounded-full border-2 border-white/30"
                              alt="avatar"
                            />
                            <div>
                              <p className="text-xs font-bold">
                                {homeArticles[0].auteurNom ?? displayName}
                              </p>
                              <p className="text-[10px] font-medium text-white/70">
                                {formatArticleDate(
                                  homeArticles[0].datePublication,
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold bg-white/15 backdrop-blur-md rounded-full px-3 py-1.5">
                            <Icon icon={Clock01Icon} className="size-3" />
                            {estimateReadMinutes(homeArticles[0].contenu)} min
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Derniers articles (Horizontal scroll) */}
                <div className="xl:col-span-2 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-black tracking-tight">
                        Derniers articles publiés
                      </h3>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">
                        Publications récentes
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => scrollLatest("left")}
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full border-muted-foreground/20 bg-white hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                      >
                        <Icon icon={ArrowLeft01Icon} className="size-3.5" strokeWidth={2.5} />
                      </Button>
                      <Button
                        onClick={() => scrollLatest("right")}
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full border-muted-foreground/20 bg-white hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                      >
                        <Icon icon={ArrowRight01Icon} className="size-3.5" strokeWidth={2.5} />
                      </Button>
                    </div>
                  </div>
                  <div
                    ref={latestScrollRef}
                    className="flex gap-5 overflow-x-auto pb-4 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x scroll-smooth"
                  >
                    {homeArticles.slice(1).map((article) => (
                      <Card
                        key={article.id}
                        className="flex-none w-[290px] snap-start border-0 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_30px_-8px_rgba(0,0,0,0.15)] transition-all duration-500 overflow-hidden rounded-3xl group cursor-pointer bg-white hover:-translate-y-1"
                        onClick={() =>
                          navigate(`/nutrition/article/${article.id}`)
                        }
                      >
                        <div className="h-48 w-full overflow-hidden relative">
                          <img
                            src={article.couvertureUrl || FALLBACK_COVER}
                            alt={article.titre}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute top-3 left-3 inline-flex items-center rounded-full bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-foreground shadow-sm">
                            {article.rubrique?.titre ?? "—"}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shadow-sm"
                          >
                            <Icon icon={Bookmark01Icon} className="size-3.5" />
                          </button>
                        </div>
                        <CardContent className="p-5">
                          <h4 className="font-black text-base leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors min-h-[48px]">
                            {article.titre}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                            {stripHtml(article.contenu)}
                          </p>
                          <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/50">
                            <div className="flex min-w-0 items-center gap-2">
                              <img
                                src={avatarDefault}
                                className="h-6 w-6 shrink-0 rounded-full"
                                alt="avatar"
                              />
                              <span className="truncate text-[11px] font-bold text-muted-foreground">
                                {article.auteurNom ?? displayName}
                              </span>
                            </div>
                            <div className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-muted/30 px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                              <Icon icon={Clock01Icon} className="size-[11px]" />
                              {estimateReadMinutes(article.contenu)} min
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {homeArticles.length <= 1 && (
                      <div className="flex-none w-[290px] h-[380px] border-2 border-dashed border-muted-foreground/20 rounded-3xl flex flex-col items-center justify-center text-muted-foreground p-6 text-center bg-white/50">
                        <Icon icon={BookOpen01Icon} className="mb-4 size-8 opacity-50" />
                        <p className="text-sm font-semibold">
                          Publiez d'autres articles pour les voir apparaître
                          ici.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "articles" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col gap-4 bg-white p-6 rounded-[24px] shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">
                    Tous vos articles
                  </h2>
                  <p className="text-sm font-medium text-muted-foreground mt-1">
                    Gérez et éditez vos publications nutritionnelles.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end md:w-auto">
                  <SearchBar
                    placeholder="Filtrer par texte…"
                    value={searchInput}
                    onValueChange={setSearchInput}
                    containerClassName="w-full sm:w-[220px] md:hidden"
                    className="rounded-xl bg-muted/40"
                  />
                  <select
                    className="h-10 w-full rounded-xl border bg-background px-4 py-1 text-sm font-semibold text-foreground shadow-sm sm:w-auto"
                    value={selectedRubrique}
                    onChange={(event) => {
                      setSelectedRubrique(event.target.value);
                      setListPage(0);
                    }}
                    disabled={loadingRubriques}
                  >
                    <option value="Toutes les catégories">
                      Toutes les catégories
                    </option>
                    {rubriques.map((rubrique) => (
                      <option key={rubrique.id} value={rubrique.titre}>
                        {rubrique.titre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {listError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                  {listError}
                </div>
              )}

              {listLoading ? (
                <DataLoader
                  layout="row"
                  size="lg"
                  message="Chargement des articles"
                  description="Un instant, nous récupérons votre bibliothèque…"
                  className="w-full"
                />
              ) : listArticles.length === 0 ? (
                <EmptyState
                  title="Aucun article"
                  description={
                    selectedRubrique === "Toutes les catégories" &&
                    !debouncedSearch
                      ? "Vous n'avez pas encore publié d'articles."
                      : `Aucun article ne correspond à votre recherche ou à la catégorie « ${selectedRubrique} ».`
                  }
                  size="lg"
                  action={
                    <AddButton
                      onClick={() => navigate("/nutritionniste/articles/new")}
                      className="rounded-full px-8 font-bold"
                    >
                      Créer un article
                    </AddButton>
                  }
                />
              ) : (
                <>
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                    {listArticles.map((article) => (
                      <Card
                        key={article.id}
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          navigate(`/nutrition/article/${article.id}`)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            navigate(`/nutrition/article/${article.id}`);
                        }}
                        className="overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 border-0 shadow-sm rounded-[20px] bg-white group cursor-pointer"
                      >
                        <div className="h-40 w-full overflow-hidden relative">
                          <img
                            src={article.couvertureUrl || FALLBACK_COVER}
                            alt={article.titre}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm">
                            {article.rubrique?.titre ?? "—"}
                          </div>
                        </div>
                        <CardContent className="flex-1 p-5">
                          <h4 className="line-clamp-2 text-base font-bold leading-snug mb-2 group-hover:text-primary transition-colors">
                            {article.titre}
                          </h4>
                          <p className="line-clamp-2 text-xs font-medium text-muted-foreground/80 mb-4">
                            {stripHtml(article.contenu)}
                          </p>
                          <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <Icon icon={Calendar01Icon} className="mr-1.5 size-3" />
                            {formatArticleDate(article.datePublication)}
                          </div>
                        </CardContent>
                        <div className="border-t p-3 flex items-center justify-between bg-muted/10">
                          <div className="flex min-w-0 items-center gap-2 pl-2">
                            <img
                              src={avatarDefault}
                              className="h-6 w-6 shrink-0 rounded-full"
                              alt="avatar"
                            />
                            <span className="truncate text-[11px] font-bold">
                              {article.auteurNom ?? displayName}
                            </span>
                          </div>
                          <ActionButton
                            action="edit"
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/nutritionniste/articles/${article.id}`,
                              );
                            }}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>

                  {listTotalPages > 1 && (
                    <div className="flex flex-col items-center justify-between gap-3 rounded-[20px] border border-border/60 bg-white px-4 py-3 sm:flex-row sm:px-6">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {listTotalElements} article
                        {listTotalElements > 1 ? "s" : ""} · {LIST_PAGE_SIZE}{" "}
                        par page
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          disabled={listPage <= 0 || listLoading}
                          onClick={() => setListPage((p) => Math.max(0, p - 1))}
                        >
                          Précédent
                        </Button>
                        <span className="min-w-28 text-center text-xs font-bold text-foreground">
                          Page {listPage + 1} / {listTotalPages}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          disabled={
                            listPage >= listTotalPages - 1 || listLoading
                          }
                          onClick={() => setListPage((p) => p + 1)}
                        >
                          Suivant
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
