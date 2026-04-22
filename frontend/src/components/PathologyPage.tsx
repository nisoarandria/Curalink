import { Link, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Mock data pour les pathologies
const pathologiesData: Record<string, { title: string, description: string }> = {
  "diabete": {
    title: "Diabète",
    description: "Le diabète est une maladie chronique qui se déclare lorsque le pancréas ne produit pas suffisamment d'insuline, ou lorsque l'organisme n'est pas capable d'utiliser efficacement l'insuline qu'il produit. Une alimentation adaptée est primordiale pour maintenir une glycémie stable."
  },
  "hypertension": {
    title: "Hypertension",
    description: "L'hypertension artérielle se caractérise par une pression anormalement forte du sang sur la paroi des artères. Réduire la consommation de sel et adopter un régime riche en fruits et légumes est essentiel."
  },
  "cancer": {
    title: "Cancer",
    description: "La nutrition joue un rôle de soutien important pendant et après les traitements contre le cancer, aidant à maintenir l'énergie et la masse musculaire."
  },
  "osteoporose": {
    title: "Ostéoporose",
    description: "Une maladie caractérisée par une fragilité excessive du squelette, due à une diminution de la masse osseuse. Le calcium et la vitamine D sont vos meilleurs alliés."
  },
  "anemie": {
    title: "Anémie",
    description: "L'anémie est souvent liée à une carence en fer, vitamine B12 ou B9. L'alimentation peut corriger ou prévenir ces carences."
  },
  "obesite": {
    title: "Obésité",
    description: "L'obésité est une accumulation anormale ou excessive de graisse corporelle qui peut nuire à la santé. Une prise en charge nutritionnelle globale est recommandée."
  },
  "grossesse": {
    title: "Grossesse",
    description: "La grossesse est une période nécessitant des besoins nutritionnels accrus pour assurer le bon développement du fœtus et la santé de la mère."
  }
}

// Mock data pour les articles
const mockArticles = [
  {
    id: "art-1",
    pathologySlug: "diabete",
    title: "Les glucides : bons ou mauvais pour le diabète ?",
    readTime: "5 min",
    date: "2026-04-18"
  },
  {
    id: "art-2",
    pathologySlug: "diabete",
    title: "Idées de petits-déjeuners à faible indice glycémique",
    readTime: "3 min",
    date: "2026-04-10"
  },
  {
    id: "art-3",
    pathologySlug: "hypertension",
    title: "Le régime DASH expliqué simplement",
    readTime: "6 min",
    date: "2026-04-05"
  },
  {
    id: "art-4",
    pathologySlug: "obesite",
    title: "Comprendre le métabolisme basal",
    readTime: "4 min",
    date: "2026-03-22"
  }
]

export default function PathologyPage() {
  const { pathology } = useParams<{ pathology: string }>()
  
  const currentPathology = pathology && pathologiesData[pathology] 
    ? pathologiesData[pathology] 
    : { title: "Pathologie inconnue", description: "Cette pathologie n'a pas encore de description." }

  const relatedArticles = mockArticles.filter(art => art.pathologySlug === pathology)

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
          <Link to="/" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m15 18-6-6 6-6"/></svg>
            Retour
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            {currentPathology.title}
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {currentPathology.description}
          </p>
        </div>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">Articles récents sur ce sujet</h2>
          
          {relatedArticles.length === 0 ? (
            <p className="text-muted-foreground">Aucun article publié pour le moment dans cette rubrique.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedArticles.map((article) => (
                <Link to={`/nutrition/article/${article.id}`} key={article.id}>
                  <Card className="h-full transition-shadow hover:shadow-md hover:border-primary/50">
                    <CardHeader>
                      <CardTitle className="text-xl">{article.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 pt-2 text-xs">
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {article.readTime}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                          {article.date}
                        </span>
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}