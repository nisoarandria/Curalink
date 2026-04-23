import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="min-h-screen bg-[#F5F6FA] text-foreground font-sans">
      <header className="sticky top-0 z-30 border-b border-border/40 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 md:px-10">
          <div className="flex items-center gap-4">
            <Link
              to="/nutritionniste"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-white text-muted-foreground transition-colors hover:text-foreground"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
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
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {previewMode ? "Mode édition" : "Aperçu"}
            </Button>
            <Button
              variant="outline"
              className="h-10 gap-2 rounded-full border-muted-foreground/20 bg-white font-semibold"
              onClick={handleSave}
              disabled={saving || loadingArticle}
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
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
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
                  : "border-sky-200 bg-sky-50 text-sky-900"
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
        {loadingArticle ? (
          <div className="rounded-[24px] border border-border/60 bg-white p-10 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <p className="mt-3 text-sm font-semibold text-muted-foreground">
              Chargement de l'article...
            </p>
          </div>
        ) : !previewMode ? (
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
                          <path d="M3 6h18" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 text-muted-foreground transition-colors hover:bg-primary/5">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-primary"
                        >
                          <rect
                            width="18"
                            height="18"
                            x="3"
                            y="3"
                            rx="2"
                            ry="2"
                          />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
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
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
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
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" x2="8" y1="13" y2="13" />
                      <line x1="16" x2="8" y1="17" y2="17" />
                    </svg>
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
                    <select
                      className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-hidden focus-visible:ring-2 focus-visible:ring-primary/20"
                      value={rubriqueId ?? ""}
                      onChange={(e) => setRubriqueId(Number(e.target.value))}
                      disabled={loadingRubriques || rubriques.length === 0}
                    >
                      {loadingRubriques && (
                        <option value="">Chargement...</option>
                      )}
                      {!loadingRubriques && rubriques.length === 0 && (
                        <option value="">Aucune rubrique disponible</option>
                      )}
                      {rubriques.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.titre}
                        </option>
                      ))}
                    </select>
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
                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                          </svg>
                        </div>
                        <span className="text-xs font-bold">Mots</span>
                      </div>
                      <span className="text-sm font-black">{wordCount}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
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
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
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
                      <path d="M12 20h9" />
                      <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
                    </svg>
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
  );
}
