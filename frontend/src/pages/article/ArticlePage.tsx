import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { PageLoader } from "@/components/ui/page-loader";
import { publicApiClient } from "@/services/axiosInstance";
import {
  ArrowLeft01Icon,
  Calendar01Icon,
  Clock01Icon,
  Icon,
} from "@/components/ui/icon";

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
        const { data } = await publicApiClient.get<ArticleDetails>(
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
      <PageLoader
        message="Chargement de l'article"
        description="Nous préparons le contenu pour vous…"
      />
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
          <Logo href="/" size="sm" />
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
          <Icon icon={ArrowLeft01Icon} className="mr-1 size-4" />
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
                <Icon icon={Calendar01Icon} className="size-4" />
                Publié le {formatDate(article.datePublication)}
              </span>
              <span className="flex items-center gap-1">
                <Icon icon={Clock01Icon} className="size-4" />
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
