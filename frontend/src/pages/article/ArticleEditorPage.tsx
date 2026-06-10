import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { Button } from "@/components/ui/button";
import { DataLoader } from "@/components/ui/data-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { Logo } from "@/components/ui/logo";
import { PageLoader } from "@/components/ui/page-loader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft01Icon,
  BookOpen01Icon,
  Clock01Icon,
  Delete01Icon,
  File01Icon,
  FloppyDiskIcon,
  Icon,
  Image01Icon,
  PencilEdit01Icon,
  ViewIcon,
} from "@/components/ui/icon";
import avatarDefault from "@/assets/avatar.webp";
import { apiClient, apiClientMultipart } from "@/services/axiosInstance";

type RubriqueItem = {
  id: number;
  titre: string;
  description?: string;
  pathologie?: string;
};

type ArticleDetailResponse = {
  id: number;
  titre: string;
  contenu: string;
  datePublication?: string;
  couvertureUrl?: string;
  rubrique?: {
    id: number;
    titre?: string;
    pathologie?: string;
    description?: string;
  };
};

const today = new Date().toISOString().slice(0, 10);
type Notice = {
  type: "success" | "error" | "info";
  message: string;
};

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function dataUrlToFile(dataUrl: string, fileName: string): File | null {
  const parts = dataUrl.split(",");
  if (parts.length < 2) return null;
  const mimeMatch = parts[0].match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] ?? "image/jpeg";
  const binaryString = atob(parts[1]);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const extension = mimeType.split("/")[1] ?? "jpg";
  return new File([bytes], `${fileName}.${extension}`, { type: mimeType });
}

async function convertImageSrcToBase64(src: string): Promise<string> {
  if (!src || src.startsWith("data:")) return src;
  try {
    const response = await fetch(src);
    if (!response.ok) return src;
    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch {
    return src;
  }
}

async function normalizeArticleHtml(html: string): Promise<string> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const images = Array.from(doc.querySelectorAll("img"));

  await Promise.all(
    images.map(async (img) => {
      const src = (img.getAttribute("src") ?? "").trim();
      if (!src) return;
      const base64 = await convertImageSrcToBase64(src);
      img.setAttribute("src", base64);
      const existingStyle = img.getAttribute("style") ?? "";
      img.setAttribute(
        "style",
        `width: 100%; height: auto; display: block; ${existingStyle}`.trim(),
      );
    }),
  );

  return doc.body.innerHTML;
}

async function buildCoverFile(image: string): Promise<File | null> {
  if (!image.trim()) return null;
  if (image.startsWith("data:")) {
    return dataUrlToFile(image, `couverture-${Date.now()}`);
  }
  try {
    const response = await fetch(image);
    if (!response.ok) return null;
    const blob = await response.blob();
    const extension = blob.type.split("/")[1] ?? "jpg";
    return new File([blob], `couverture-${Date.now()}.${extension}`, {
      type: blob.type || "image/jpeg",
    });
  } catch {
    return null;
  }
}

export default function ArticleEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id && id !== "new");

  const [rubriques, setRubriques] = useState<RubriqueItem[]>([]);
  const [rubriqueId, setRubriqueId] = useState<number | null>(null);
  const [loadingRubriques, setLoadingRubriques] = useState(true);
  const [titre, setTitre] = useState("");
  const [datePublication, setDatePublication] = useState(today);
  const [image, setImage] = useState("");
  const [contenu, setContenu] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);

  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ align: [] }],
        ["blockquote", "code-block"],
        ["link", "image", "video"],
        ["clean"],
      ],
      clipboard: { matchVisual: false },
    }),
    [],
  );

  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "indent",
    "align",
    "blockquote",
    "code-block",
    "link",
    "image",
    "video",
  ];

  const wordCount = useMemo(() => {
    const doc = new DOMParser().parseFromString(contenu || "", "text/html");
    const plain = (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
    if (!plain) return 0;
    return plain.split(/\s+/).length;
  }, [contenu]);

  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  const selectedRubrique = rubriques.find((item) => item.id === rubriqueId);
  const selectedRubriqueTitle = selectedRubrique?.titre ?? "Rubrique";
  const selectedRubriqueDescription = selectedRubrique?.description?.trim() ?? "";

  useEffect(() => {
    const fetchRubriques = async () => {
      try {
        const { data } = await apiClient.get<RubriqueItem[]>(
          "/nutrition/rubriques",
        );
        setRubriques(data ?? []);
        if ((data ?? []).length > 0) {
          setRubriqueId(data[0].id);
        }
      } catch {
        setRubriques([]);
      } finally {
        setLoadingRubriques(false);
      }
    };

    void fetchRubriques();
  }, []);

  useEffect(() => {
    if (!isEditing || !id) return;

    const fetchArticleById = async () => {
      setLoadingArticle(true);
      try {
        const { data } = await apiClient.get<ArticleDetailResponse>(
          `/nutrition/articles/${id}`,
        );

        setTitre(data?.titre ?? "");
        setContenu(data?.contenu ?? "");
        setImage(data?.couvertureUrl ?? "");

        const publicationDay = (data?.datePublication ?? "").slice(0, 10);
        if (publicationDay) {
          setDatePublication(publicationDay);
        }

        if (typeof data?.rubrique?.id === "number") {
          setRubriqueId(data.rubrique.id);
        }
      } catch {
        setNotice({
          type: "error",
          message: "Impossible de charger l'article pour l'édition.",
        });
      } finally {
        setLoadingArticle(false);
      }
    };

    void fetchArticleById();
  }, [id, isEditing]);

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!titre.trim() || !contenu.trim()) {
      setNotice({
        type: "error",
        message: "Veuillez renseigner un titre et un contenu avant de continuer.",
      });
      return;
    }
    if (!rubriqueId) {
      setNotice({
        type: "error",
        message: "Veuillez sélectionner une rubrique.",
      });
      return;
    }

    setSaving(true);
    try {
      const contenuHtml = await normalizeArticleHtml(contenu);
      const coverFile = await buildCoverFile(image);
      const publicationDateTime = `${datePublication}T10:30:00`;

      const formData = new FormData();
      formData.append("titre", titre.trim());
      formData.append("contenu", contenuHtml);
      formData.append("rubriqueId", String(rubriqueId));
      formData.append("datePublication", publicationDateTime);
      if (coverFile) {
        formData.append("couverture", coverFile);
      }

      if (isEditing && id) {
        await apiClientMultipart.put(`/nutrition/articles/${id}`, formData);
      } else {
        await apiClientMultipart.post("/nutrition/articles", formData);
      }
      setNotice({
        type: "success",
        message: isEditing
          ? "Article mis a jour avec succes."
          : "Article enregistre avec succes.",
      });
      navigate("/nutritionniste");
    } catch {
      setNotice({
        type: "error",
        message:
          "Impossible de creer l'article pour le moment. Verifiez la connexion ou les donnees saisies.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <PageLoader
      show={loadingArticle}
      message="Chargement de l'article"
      description="Préparation de l'éditeur en cours…"
    />
    <div className="min-h-screen bg-slate-50/80 text-foreground font-sans">
      <header className="sticky top-0 z-30 border-b border-border/40 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 md:px-10">
          <div className="flex items-center gap-4">
            <Logo size="sm" showText={false} />
            <Link
              to="/nutritionniste"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-white text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icon icon={ArrowLeft01Icon} className="size-4" strokeWidth={2.5} />
            </Link>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {isEditing ? "Édition" : "Nouveau article"}
              </p>
              <h1 className="text-xl font-black tracking-tight">
                {isEditing ? "Modifier l'article" : "Rédiger un nouvel article"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="hidden h-10 gap-2 rounded-full border-muted-foreground/20 bg-white font-semibold md:inline-flex"
              onClick={() => setPreviewMode((v) => !v)}
            >
              <Icon icon={ViewIcon} className="size-3.5" />
              {previewMode ? "Mode édition" : "Aperçu"}
            </Button>
            <Button
              variant="outline"
              className="h-10 gap-2 rounded-full border-muted-foreground/20 bg-white font-semibold"
              onClick={handleSave}
              disabled={saving || loadingArticle}
            >
              <Icon icon={FloppyDiskIcon} className="size-3.5" />
              {saving ? "Enregistrement..." : loadingArticle ? "Chargement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-8 md:px-10">
        {notice && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
              notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : notice.type === "error"
                  ? "border-red-200 bg-red-50 text-red-900"
                  : "border-primary/20 bg-primary/5 text-primary"
            }`}
          >
            <span className="mt-0.5 text-base leading-none">
              {notice.type === "success" ? "✓" : notice.type === "error" ? "!" : "i"}
            </span>
            <div className="flex-1">{notice.message}</div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-xs font-semibold opacity-70 transition-opacity hover:opacity-100"
            >
              Fermer
            </button>
          </div>
        )}
        {!loadingArticle && (
          !previewMode ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Main editor area */}
            <div className="space-y-6">
              {/* Cover image */}
              <Card className="overflow-hidden rounded-3xl border-0 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)]">
                <div className="relative h-64 w-full overflow-hidden bg-linear-to-br from-primary/10 to-primary/5">
                  {image ? (
                    <>
                      <img
                        src={image}
                        alt="Couverture"
                        className="h-full w-full object-cover"
                      />
                      <button
                        onClick={() => setImage("")}
                        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-red-500"
                      >
                        <Icon icon={Delete01Icon} className="size-3.5" strokeWidth={2.5} />
                      </button>
                    </>
                  ) : (
                    <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 text-muted-foreground transition-colors hover:bg-primary/5">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                        <Icon icon={Image01Icon} className="size-6 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground">
                          Ajouter une image de couverture
                        </p>
                        <p className="mt-1 text-xs">
                          PNG, JPG ou WEBP (max. 5 Mo)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>
              </Card>

              {/* Document editor : titre + contenu unifiés */}
              <Card className="overflow-hidden rounded-3xl border-0 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)]">
                <div className="px-8 pt-8 pb-5">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {selectedRubriqueTitle}
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {datePublication} · {readTime} min de lecture
                    </span>
                  </div>

                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      <Icon icon={PencilEdit01Icon} className="size-3" strokeWidth={2.5} />
                      Titre de l'article
                    </span>
                    <div className="group relative rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 transition-all hover:border-primary/40 hover:bg-white focus-within:border-primary focus-within:border-solid focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgb(var(--primary-rgb,99_102_241)/0.08)]">
                      <input
                        type="text"
                        value={titre}
                        onChange={(e) => setTitre(e.target.value)}
                        placeholder="Cliquez ici pour écrire votre titre..."
                        className="w-full bg-transparent px-5 py-4 text-xl font-black leading-tight tracking-tight outline-hidden placeholder:font-semibold placeholder:text-muted-foreground/50 md:text-2xl"
                      />
                      {titre && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          {titre.trim().split(/\s+/).length} mots
                        </span>
                      )}
                    </div>
                  </label>

                  <p className="mt-2 pl-1 text-xs text-muted-foreground">
                    Conseil : un bon titre fait 6 à 12 mots et indique
                    clairement le bénéfice pour le lecteur.
                  </p>
                </div>
                <div className="border-t border-border/50" />
                <div className="bg-muted/20 px-8 py-2">
                  <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    <Icon icon={File01Icon} className="size-3" strokeWidth={2.5} />
                    Contenu de l'article
                  </span>
                </div>
                {selectedRubriqueDescription && (
                  <div className="border-t border-border/50 bg-white px-8 py-4 text-sm text-muted-foreground">
                    {selectedRubriqueDescription}
                  </div>
                )}
                <div className="quill-wrapper">
                  <ReactQuill
                    theme="snow"
                    value={contenu}
                    onChange={setContenu}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Rédigez le contenu de votre article ici..."
                  />
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              <Card className="rounded-3xl border-0 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)]">
                <CardContent className="space-y-5 p-6">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                      Paramètres de publication
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Pathologie</Label>
                    {loadingRubriques ? (
                      <DataLoader
                        variant="plain"
                        size="sm"
                        layout="row"
                        message="Chargement des rubriques"
                      />
                    ) : rubriques.length === 0 ? (
                      <EmptyState
                        variant="plain"
                        size="sm"
                        title="Aucune rubrique"
                        description="Aucune pathologie n'est disponible pour le moment."
                      />
                    ) : (
                      <select
                        className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-hidden focus-visible:ring-2 focus-visible:ring-primary/20"
                        value={rubriqueId ?? ""}
                        onChange={(e) => setRubriqueId(Number(e.target.value))}
                      >
                        {rubriques.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.titre}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold">
                      Date de publication
                    </Label>
                    <Input
                      type="date"
                      className="h-11 rounded-xl font-semibold"
                      value={datePublication}
                      onChange={(e) => setDatePublication(e.target.value)}
                    />
                  </div>

                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)]">
                <CardContent className="p-6">
                  <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Statistiques
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                          <Icon icon={BookOpen01Icon} className="size-3.5" />
                        </div>
                        <span className="text-xs font-bold">Mots</span>
                      </div>
                      <span className="text-sm font-black">{wordCount}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                          <Icon icon={Clock01Icon} className="size-3.5" />
                        </div>
                        <span className="text-xs font-bold">Lecture</span>
                      </div>
                      <span className="text-sm font-black">
                        ~{readTime} min
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 bg-linear-to-br from-primary/10 to-primary/5 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)]">
                <CardContent className="p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                    <Icon icon={PencilEdit01Icon} className="size-[18px]" />
                  </div>
                  <p className="text-sm font-black">Astuce rédaction</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Un bon article de nutrition est clair, cite des sources
                    fiables et propose des conseils concrets. Pensez à ajouter
                    des titres de section pour faciliter la lecture.
                  </p>
                </CardContent>
              </Card>

            </aside>
          </div>
          ) : (
          // Preview mode — marges symétriques + retour à la ligne forcé sur le HTML Quill
          <article className="mx-auto w-full max-w-3xl min-w-0 px-5 sm:px-8">
            <Card className="overflow-hidden rounded-3xl border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]">
              {image && (
                <div className="h-80 w-full overflow-hidden">
                  <img
                    src={image}
                    alt={titre}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="box-border min-w-0 px-6 py-8 sm:px-10 sm:py-12 md:px-12 md:py-14">
                <div className="mb-4 inline-flex max-w-full items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                  {selectedRubriqueTitle}
                </div>
                {selectedRubriqueDescription && (
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    {selectedRubriqueDescription}
                  </p>
                )}
                <h1 className="wrap-anywhere text-4xl font-black leading-tight tracking-tight md:text-5xl">
                  {titre || "Titre de l'article"}
                </h1>
                <div className="mt-5 flex min-w-0 flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex min-w-0 items-center gap-2">
                    <img
                      src={avatarDefault}
                      alt="auteur"
                      className="h-9 w-9 shrink-0 rounded-full"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">
                        Dr. Ratsimba
                      </p>
                      <p className="text-[11px] wrap-anywhere">
                        {datePublication} · {readTime} min de lecture
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className="article-preview-content prose prose-slate mt-10 max-w-full min-w-0 text-foreground prose-headings:font-black prose-a:text-primary prose-p:leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html:
                      contenu ||
                      "<p class='text-muted-foreground italic'>Aucun contenu pour le moment.</p>",
                  }}
                />
              </div>
            </Card>
          </article>
          )
        )}
      </div>

      {/* Quill custom overrides */}
      <style>{`
        /* Aperçu article : même marge gauche/droite + paragraphes qui reviennent à la ligne */
        .article-preview-content {
          max-width: 100%;
          overflow-x: hidden;
          word-wrap: break-word;
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        .article-preview-content p,
        .article-preview-content li,
        .article-preview-content blockquote,
        .article-preview-content div[class*="ql-"] {
          white-space: normal !important;
        }
        .article-preview-content img,
        .article-preview-content video,
        .article-preview-content iframe {
          max-width: 100%;
          height: auto;
        }
        .article-preview-content pre,
        .article-preview-content code {
          white-space: pre-wrap;
          word-break: break-word;
          max-width: 100%;
          overflow-x: auto;
        }
        .quill-wrapper .ql-toolbar.ql-snow {
          border: none;
          border-bottom: 1px solid rgb(226 232 240);
          padding: 10px 32px;
          background: #FAFAFB;
        }
        .quill-wrapper .ql-container.ql-snow {
          border: none;
          font-family: inherit;
          font-size: 15px;
          min-height: 480px;
        }
        .quill-wrapper .ql-editor {
          padding: 28px 32px 48px;
          line-height: 1.7;
          min-height: 480px;
          color: hsl(var(--foreground));
        }
        .quill-wrapper .ql-editor.ql-blank::before {
          font-style: normal;
          color: hsl(var(--muted-foreground) / 0.5);
          left: 32px;
          right: 32px;
          font-size: 15px;
        }
        .quill-wrapper .ql-editor p { margin-bottom: 0.75rem; }
        .quill-wrapper .ql-editor h1 { font-size: 1.5rem; font-weight: 800; margin: 1.5rem 0 0.75rem; line-height: 1.25; }
        .quill-wrapper .ql-editor h2 { font-size: 1.25rem; font-weight: 800; margin: 1.25rem 0 0.5rem; line-height: 1.3; }
        .quill-wrapper .ql-editor h3 { font-size: 1.05rem; font-weight: 700; margin: 1rem 0 0.5rem; line-height: 1.35; }
        .quill-wrapper .ql-editor ul,
        .quill-wrapper .ql-editor ol { margin-bottom: 0.75rem; }
        .quill-wrapper .ql-editor blockquote {
          border-left: 3px solid hsl(var(--primary));
          padding-left: 1rem;
          color: hsl(var(--muted-foreground));
          font-style: italic;
          margin: 1rem 0;
        }
      `}</style>
    </div>
    </>
  );
}
