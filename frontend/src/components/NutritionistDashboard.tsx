import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { apiClient, logoutRequest } from "@/services/axiosInstance";
import avatarDefault from "@/assets/avatar.webp";

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
    icon: (
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
        <path d="M12 2v8" />
        <path d="m4.93 10.93 1.41 1.41" />
        <path d="M2 18h2" />
        <path d="M20 18h2" />
        <path d="m19.07 10.93-1.41 1.41" />
        <path d="M22 22H2" />
        <path d="m8 22 4-10 4 10" />
      </svg>
    ),
  },
  hypertension: {
    image:
      "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?auto=format&fit=crop&w=400&q=80",
    accent: "from-rose-500/80 to-pink-600/80",
    icon: (
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
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
      </svg>
    ),
  },
  cancer: {
    image:
      "https://images.unsplash.com/photo-1579165466991-467135ad3110?auto=format&fit=crop&w=400&q=80",
    accent: "from-purple-500/80 to-violet-600/80",
    icon: (
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
        <path d="M7 21a4 4 0 0 1-4-4V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12a4 4 0 0 1-4 4Zm0 0h12a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-5" />
        <path d="M18 7V5a2 2 0 0 0-2-2h-2" />
      </svg>
    ),
  },
  acancer: {
    image:
      "https://images.unsplash.com/photo-1579165466991-467135ad3110?auto=format&fit=crop&w=400&q=80",
    accent: "from-purple-500/80 to-violet-600/80",
    icon: (
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
        <path d="M7 21a4 4 0 0 1-4-4V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12a4 4 0 0 1-4 4Zm0 0h12a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-5" />
        <path d="M18 7V5a2 2 0 0 0-2-2h-2" />
      </svg>
    ),
  },
  osteoporose: {
    image:
      "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=400&q=80",
    accent: "from-slate-500/80 to-slate-700/80",
    icon: (
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
        <path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z" />
      </svg>
    ),
  },
  anemie: {
    image:
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=400&q=80",
    accent: "from-red-500/80 to-rose-600/80",
    icon: (
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
        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7Z" />
      </svg>
    ),
  },
  obesite: {
    image:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=80",
    accent: "from-orange-500/80 to-amber-600/80",
    icon: (
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
        <path d="M6.5 6.5 17.5 17.5" />
        <path d="m21 21-1-1" />
        <path d="m3 3 1 1" />
        <path d="m18 22 4-4" />
        <path d="m2 6 4-4" />
        <path d="m3 10 7-7" />
        <path d="m14 21 7-7" />
      </svg>
    ),
  },
  grossesse: {
    image:
      "https://images.unsplash.com/photo-1531983412531-1f49a365ffed?auto=format&fit=crop&w=400&q=80",
    accent: "from-pink-500/80 to-rose-500/80",
    icon: (
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
        <circle cx="12" cy="8" r="5" />
        <path d="M20 21a8 8 0 0 0-16 0" />
      </svg>
    ),
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
          icon: (
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
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          ),
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
    <div className="flex min-h-screen bg-[#F5F6FA] text-foreground font-sans">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-72 flex-col bg-white md:flex shrink-0 border-r border-border/40">
        {/* Logo */}
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
              Espace Nutritionniste
            </p>
          </div>
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
          <Button
            onClick={() => navigate("/nutritionniste/articles/new")}
            className="w-full gap-2 rounded-xl h-11 shadow-md font-bold group"
          >
            <svg
              className="transition-transform group-hover:rotate-90 duration-300"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" x2="12" y1="5" y2="19" />
              <line x1="5" x2="19" y1="12" y2="12" />
            </svg>
            Nouvel article
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
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
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
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
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
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
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
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

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <header className="flex h-20 items-center justify-between bg-[#F5F6FA]/80 backdrop-blur-md px-6 md:px-10 sticky top-0 z-20">
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
              <div className="relative hidden md:block">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <Input
                  placeholder="Rechercher des articles…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 w-[280px] h-11 bg-white border-0 shadow-sm rounded-full focus-visible:ring-2 focus-visible:ring-primary/20 text-sm font-medium"
                />
              </div>
            )}
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
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
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
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M5 12h14" />
                              <path d="m12 5 7 7-7 7" />
                            </svg>
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
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                          <path d="M9 18h6" />
                          <path d="M10 22h4" />
                        </svg>
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
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>
                          {homeArticles[0].rubrique?.titre ?? "—"}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="h-9 w-9 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-foreground transition-all"
                        >
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
                            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                          </svg>
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
                            <svg
                              width="12"
                              height="12"
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
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                      </Button>
                      <Button
                        onClick={() => scrollLatest("right")}
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full border-muted-foreground/20 bg-white hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
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
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                            </svg>
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
                              <svg
                                width="11"
                                height="11"
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
                              {estimateReadMinutes(article.contenu)} min
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {homeArticles.length <= 1 && (
                      <div className="flex-none w-[290px] h-[380px] border-2 border-dashed border-muted-foreground/20 rounded-3xl flex flex-col items-center justify-center text-muted-foreground p-6 text-center bg-white/50">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mb-4 opacity-50"
                        >
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
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
                  <Input
                    placeholder="Filtrer par texte…"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="h-10 w-full rounded-xl bg-muted/40 sm:w-[220px] md:hidden"
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
                <div
                  className="space-y-5"
                  role="status"
                  aria-live="polite"
                  aria-busy="true"
                >
                  <div className="flex items-center justify-center gap-4 rounded-[24px] border border-border/50 bg-white px-6 py-7 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)]">
                    <div className="relative h-10 w-10 shrink-0">
                      <span
                        className="absolute inset-0 rounded-full border-2 border-muted/60"
                        aria-hidden
                      />
                      <span
                        className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary border-r-primary/30"
                        aria-hidden
                      />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-bold tracking-tight text-foreground">
                        Chargement des articles
                      </p>
                      <p className="text-xs font-medium text-muted-foreground">
                        Un instant, nous récupérons votre bibliothèque…
                      </p>
                    </div>
                  </div>
                  <div
                    className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4"
                    aria-hidden
                  >
                    {Array.from({ length: LIST_PAGE_SIZE }).map((_, index) => (
                      <Card
                        key={`article-skeleton-${index}`}
                        className="overflow-hidden rounded-[20px] border border-border/30 bg-white shadow-sm"
                      >
                        <div className="h-40 w-full animate-pulse bg-linear-to-br from-muted/40 via-muted/25 to-muted/50" />
                        <CardContent className="space-y-3 p-5">
                          <div className="h-4 w-[88%] animate-pulse rounded-md bg-muted/55" />
                          <div className="h-3 w-full animate-pulse rounded-md bg-muted/35" />
                          <div className="h-3 w-[72%] animate-pulse rounded-md bg-muted/35" />
                          <div className="h-3 w-24 animate-pulse rounded-md bg-muted/25" />
                        </CardContent>
                        <div className="flex items-center justify-between border-t border-border/35 bg-muted/15 p-3">
                          <div className="flex items-center gap-2 pl-1">
                            <div className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-muted/45" />
                            <div className="h-3 w-24 animate-pulse rounded-md bg-muted/35" />
                          </div>
                          <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted/30" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : listArticles.length === 0 ? (
                <div className="rounded-[24px] border-2 border-dashed bg-white/50 p-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-bold">Aucun article</h3>
                  <p className="mb-6 mt-2 text-sm font-medium text-muted-foreground">
                    {selectedRubrique === "Toutes les catégories" &&
                    !debouncedSearch
                      ? "Vous n'avez pas encore publié d'articles."
                      : `Aucun article ne correspond à votre recherche ou à la catégorie « ${selectedRubrique} ».`}
                  </p>
                  <Button
                    onClick={() => navigate("/nutritionniste/articles/new")}
                    className="rounded-full font-bold px-8"
                  >
                    Créer un article
                  </Button>
                </div>
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
                            <svg
                              className="mr-1.5"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/nutritionniste/articles/${article.id}`,
                              );
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </Button>
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
