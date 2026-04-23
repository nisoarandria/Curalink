import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/services/axiosInstance"

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
        const { data } = await apiClient.get<PageResponse<ApiArticleItem>>(
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
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/></svg>
            </div>
            <span className="text-xl font-bold tracking-tight">Curalink</span>
          </div>
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
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m15 18-6-6 6-6"/></svg>
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
            <div className="rounded-xl border border-border/60 bg-card p-8 text-center text-sm font-medium text-muted-foreground">
              Chargement des articles...
            </div>
          ) : articles.length === 0 ? (
            <p className="text-muted-foreground">Aucun article publié pour le moment dans cette rubrique.</p>
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
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {estimateReadMinutes(article.contenu)} min
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
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