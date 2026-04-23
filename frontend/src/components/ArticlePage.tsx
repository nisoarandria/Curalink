import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/axiosInstance";

type ArticleDetails = {
  id: number;
  titre: string;
  contenu: string;
  datePublication: string;
  couvertureUrl?: string | null;
  rubrique?: {
    id: number;
    titre: string;
    pathologie: string;
    description?: string;
  };
  auteurId?: number;
};

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value?.slice(0, 10) ?? "";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function estimateReadMinutes(html: string): number {
  const text =
    new DOMParser()
      .parseFromString(html ?? "", "text/html")
      .body.textContent?.replace(/\s+/g, " ")
      .trim() ?? "";
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

export default function ArticlePage() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();

  const [article, setArticle] = useState<ArticleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!articleId) {
      setError("Article introuvable");
      setLoading(false);
      return;
    }

    const fetchArticle = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await apiClient.get<ArticleDetails>(
          `/nutrition/articles/${articleId}`,
        );
        setArticle(data ?? null);
      } catch {
        setArticle(null);
        setError("Impossible de charger cet article.");
      } finally {
        setLoading(false);
      }
    };

    void fetchArticle();
  }, [articleId]);

  const readMinutes = useMemo(
    () => estimateReadMinutes(article?.contenu ?? ""),
    [article?.contenu],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4 bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <p className="text-sm font-semibold text-muted-foreground">
          Chargement de l'article...
        </p>
      </div>
    );
  }

  if (!article || error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4 bg-background">
        <h1 className="text-2xl font-bold">{error ?? "Article introuvable"}</h1>
        <Button onClick={() => navigate(-1)}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      {/* Header simple */}
      <header className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
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
                <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">Curalink</span>
          </div>
          <Link to="/">
            <Button variant="outline">Accueil</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl min-w-0 flex-1 space-y-8 px-5 py-6 sm:px-8 md:px-10 lg:py-12">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
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
            className="mr-1"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Retour
        </button>

        <article className="min-w-0 space-y-6">
          {article.couvertureUrl && (
            <div className="overflow-hidden rounded-2xl border border-border/50">
              <img
                src={article.couvertureUrl}
                alt={article.titre}
                className="h-64 w-full object-cover md:h-80"
              />
            </div>
          )}
          <div className="space-y-4">
            <div className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              {article.rubrique?.titre ?? "Pathologie"}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl leading-tight">
              {article.titre}
            </h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground border-b pb-6">
              <span className="flex items-center gap-1">
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
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
                Publié le {formatDate(article.datePublication)}
              </span>
              <span className="flex items-center gap-1">
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
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {readMinutes} min de lecture
              </span>
            </div>
          </div>

          <div
            className="article-reader-content prose prose-slate prose-lg dark:prose-invert max-w-full min-w-0 text-foreground"
            dangerouslySetInnerHTML={{
              __html: article.contenu || "<p>Aucun contenu.</p>",
            }}
          />
        </article>
      </main>
      <style>{`
        .article-reader-content {
          max-width: 100%;
          overflow-x: hidden;
          word-wrap: break-word;
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        .article-reader-content p,
        .article-reader-content li,
        .article-reader-content blockquote,
        .article-reader-content div[class*="ql-"] {
          white-space: normal !important;
        }
        .article-reader-content img,
        .article-reader-content video,
        .article-reader-content iframe {
          max-width: 100%;
          height: auto;
        }
        .article-reader-content pre,
        .article-reader-content code {
          white-space: pre-wrap;
          word-break: break-word;
          max-width: 100%;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
}
