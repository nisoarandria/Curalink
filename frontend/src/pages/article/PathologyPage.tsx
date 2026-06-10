import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { DataLoader } from "@/components/ui/data-loader"
import { EmptyState } from "@/components/ui/empty-state"
import { Logo } from "@/components/ui/logo"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { publicApiClient } from "@/services/axiosInstance"
import {
  ArrowLeft01Icon,
  Calendar01Icon,
  Clock01Icon,
  Icon,
} from "@/components/ui/icon"

type ApiArticleItem = {
  id: number
  titre: string
  contenu: string
  datePublication: string
  couvertureUrl?: string | null
  rubrique?: {
    id: number
    titre: string
    pathologie: string
    description?: string
  }
}

type PageResponse<T> = {
  description?: string
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

const PATHOLOGY_ALIASES: Record<string, string> = {
  diabete: "DIABETE",
  hypertension: "HYPERTENSION",
  cancer: "CANCER",
  acancer: "CANCER",
  osteoporose: "OSTEOPOROSE",
  anemie: "ANEMIE",
  obesite: "OBESITE",
  grossesse: "GROSSESSE",
}

const PAGE_SIZE = 10

function normalizePathologyParam(value: string): string {
  const cleaned = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "")
  return PATHOLOGY_ALIASES[cleaned] ?? value.toUpperCase()
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html ?? "", "text/html")
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim()
}

function estimateReadMinutes(html: string): number {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

function formatDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value?.slice(0, 10) ?? ""
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function PathologyPage() {
  const { pathology } = useParams<{ pathology: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const normalizedPathology = useMemo(
    () => normalizePathologyParam(pathology ?? ""),
    [pathology],
  )

  const [articles, setArticles] = useState<ApiArticleItem[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [apiDescription, setApiDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPage(0)
  }, [normalizedPathology])

  useEffect(() => {
    if (!normalizedPathology) return
    const fetchByPathology = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await publicApiClient.get<PageResponse<ApiArticleItem>>(
          "/nutrition/articles",
          {
            params: {
              page,
              size: PAGE_SIZE,
              pathologie: normalizedPathology,
            },
          },
        )
        setArticles(data?.content ?? [])
        setTotalPages(data?.totalPages ?? 0)
        setTotalElements(data?.totalElements ?? 0)
        setApiDescription(data?.description ?? "")
      } catch {
        setArticles([])
        setTotalPages(0)
        setTotalElements(0)
        setApiDescription("")
        setError("Impossible de charger les articles pour cette pathologie.")
      } finally {
        setLoading(false)
      }
    }
    void fetchByPathology()
  }, [normalizedPathology, page])

  const pathologyTitle =
    articles[0]?.rubrique?.titre ??
    (normalizedPathology ? normalizedPathology.charAt(0) + normalizedPathology.slice(1).toLowerCase() : "Pathologie")
  const pathologyDescription =
    apiDescription ||
    articles[0]?.rubrique?.description ||
    "Aucune description disponible pour cette pathologie."
  const fromPath = (location.state as { from?: string } | null)?.from

  const handleBack = () => {
    if (fromPath) {
      navigate(fromPath)
      return
    }

    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate("/nutritionniste")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      {/* Header simple */}
      <header className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between p-4">
          <Logo href="/" size="sm" />
          <Link to="/">
            <Button variant="outline">Retour à l'accueil</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 space-y-10 p-4 md:p-8">
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            <Icon icon={ArrowLeft01Icon} className="mr-1 size-4" />
            Retour
          </button>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            {pathologyTitle}
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {pathologyDescription}
          </p>
        </div>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">Articles récents sur ce sujet</h2>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              {error}
            </div>
          )}

          {loading ? (
            <DataLoader
              message="Chargement des articles"
              description="Exploration de la rubrique en cours…"
              size="lg"
            />
          ) : articles.length === 0 ? (
            <EmptyState
              title="Aucun article publié"
              description="Aucun article n'est disponible pour le moment dans cette rubrique."
              size="md"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {articles.map((article) => (
                <Link
                  to={`/nutrition/article/${article.id}`}
                  key={article.id}
                  state={{ from: location.pathname + location.search }}
                >
                  <Card className="h-full transition-shadow hover:shadow-md hover:border-primary/50">
                    <CardHeader>
                      <CardTitle className="text-xl">{article.titre}</CardTitle>
                      <CardDescription className="flex items-center gap-2 pt-2 text-xs">
                        <span className="flex items-center gap-1">
                          <Icon icon={Clock01Icon} className="size-[14px]" />
                          {estimateReadMinutes(article.contenu)} min
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Icon icon={Calendar01Icon} className="size-[14px]" />
                          {formatDate(article.datePublication)}
                        </span>
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 sm:flex-row sm:px-6">
              <p className="text-xs font-semibold text-muted-foreground">
                {totalElements} article{totalElements > 1 ? "s" : ""} · {PAGE_SIZE} par page
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={page <= 0 || loading}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Précédent
                </Button>
                <span className="min-w-28 text-center text-xs font-bold text-foreground">
                  Page {page + 1} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={page >= totalPages - 1 || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}