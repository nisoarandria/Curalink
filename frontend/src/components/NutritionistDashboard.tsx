import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

type Rubrique =
  | "Diabète"
  | "Hypertension"
  | "Cancer"
  | "Ostéoporose"
  | "Anémie"
  | "Obésité"
  | "Grossesse"

type Article = {
  id: string
  rubrique: Rubrique
  titre: string
  contenu: string
  datePublication: string
}

const today = new Date().toISOString().slice(0, 10)

export default function NutritionistDashboard() {
  const [articles, setArticles] = useState<Article[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<Article, "id">>({
    rubrique: "Diabète",
    titre: "",
    contenu: "",
    datePublication: today,
  })

  const saveArticle = () => {
    if (!form.titre.trim() || !form.contenu.trim()) return
    if (editingId) {
      setArticles((prev) => prev.map((a) => (a.id === editingId ? { ...form, id: editingId } : a)))
      setEditingId(null)
    } else {
      setArticles((prev) => [...prev, { ...form, id: crypto.randomUUID() }])
    }
    setForm({ rubrique: "Diabète", titre: "", contenu: "", datePublication: today })
  }

  const editArticle = (article: Article) => {
    setEditingId(article.id)
    setForm({
      rubrique: article.rubrique,
      titre: article.titre,
      contenu: article.contenu,
      datePublication: article.datePublication,
    })
  }

  const deleteArticle = (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id))
    if (editingId === id) {
      setEditingId(null)
      setForm({ rubrique: "Diabète", titre: "", contenu: "", datePublication: today })
    }
  }

  return (
    <div className="min-h-screen bg-muted/20 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Espace nutritionniste</CardTitle>
            <CardDescription>Gestion CRUD des articles nutritionnels par pathologie.</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? "Modifier un article" : "Créer un article"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Rubrique</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={form.rubrique}
                  onChange={(e) => setForm((prev) => ({ ...prev, rubrique: e.target.value as Rubrique }))}
                >
                  {["Diabète", "Hypertension", "Cancer", "Ostéoporose", "Anémie", "Obésité", "Grossesse"].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input value={form.titre} onChange={(e) => setForm((prev) => ({ ...prev, titre: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Contenu</Label>
                <textarea
                  className="min-h-36 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={form.contenu}
                  onChange={(e) => setForm((prev) => ({ ...prev, contenu: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Date de publication</Label>
                <Input
                  type="date"
                  value={form.datePublication}
                  onChange={(e) => setForm((prev) => ({ ...prev, datePublication: e.target.value }))}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveArticle}>{editingId ? "Mettre à jour" : "Publier"}</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Liste des articles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {articles.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun article publié pour le moment.</p>
              )}
              {articles.map((article) => (
                <div key={article.id} className="space-y-2 rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">
                    {article.rubrique} - {article.datePublication}
                  </p>
                  <p className="font-medium">{article.titre}</p>
                  <p className="text-sm text-muted-foreground">{article.contenu}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => editArticle(article)}>
                      Modifier
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteArticle(article.id)}>
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
