import { Link, useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

// Mock data pour les articles complets
const articlesContent: Record<string, { title: string, pathology: string, pathologySlug: string, readTime: string, date: string, content: string }> = {
  "art-1": {
    title: "Les glucides : bons ou mauvais pour le diabète ?",
    pathology: "Diabète",
    pathologySlug: "diabete",
    readTime: "5 min",
    date: "18 Avril 2026",
    content: "Contrairement aux idées reçues, les personnes atteintes de diabète ne doivent pas supprimer totalement les glucides de leur alimentation. \n\nL'important est de choisir les bons glucides (ceux à faible indice glycémique) et de contrôler les portions. Les céréales complètes, les légumineuses et certains fruits sont d'excellentes sources d'énergie qui n'entraînent pas de pic glycémique soudain. \n\nIl est recommandé d'associer ces glucides avec des fibres ou des protéines pour ralentir encore davantage leur absorption dans le sang."
  },
  "art-2": {
    title: "Idées de petits-déjeuners à faible indice glycémique",
    pathology: "Diabète",
    pathologySlug: "diabete",
    readTime: "3 min",
    date: "10 Avril 2026",
    content: "Le petit-déjeuner est souvent un repas très sucré. Voici 3 alternatives saines : \n\n1. Flocons d'avoine, lait d'amande et quelques oléagineux (noix, amandes). \n2. Œufs brouillés avec une tranche de pain intégral. \n3. Yaourt nature non sucré avec des graines de chia et quelques fruits rouges. \n\nCes options vous permettront de démarrer la journée sans provoquer de pic d'insuline."
  },
  "art-3": {
    title: "Le régime DASH expliqué simplement",
    pathology: "Hypertension",
    pathologySlug: "hypertension",
    readTime: "6 min",
    date: "5 Avril 2026",
    content: "Le régime DASH (Dietary Approaches to Stop Hypertension) est spécifiquement conçu pour réduire la tension artérielle. \n\nIl met l'accent sur les fruits, les légumes, les céréales complètes, les produits laitiers allégés, la volaille, le poisson et les noix. Il recommande de réduire drastiquement l'apport en sodium (sel), les viandes rouges, les sucreries et les boissons sucrées. \n\nDe nombreuses études prouvent son efficacité pour diminuer naturellement l'hypertension sans recourir immédiatement à une augmentation médicamenteuse."
  },
  "art-4": {
    title: "Comprendre le métabolisme basal",
    pathology: "Obésité",
    pathologySlug: "obesite",
    readTime: "4 min",
    date: "22 Mars 2026",
    content: "Le métabolisme basal correspond à l'énergie dont votre corps a besoin au repos pour maintenir ses fonctions vitales (respirer, faire battre le cœur, etc.). \n\nComprendre votre métabolisme basal est la première étape pour perdre du poids durablement. Si vous consommez moins de calories que ce métabolisme, votre corps puisera dans ses réserves. Si vous en consommez plus sans activité physique, l'excédent sera stocké sous forme de graisses."
  }
}

export default function ArticlePage() {
  const { articleId } = useParams<{ articleId: string }>()
  const navigate = useNavigate()
  
  const article = articleId && articlesContent[articleId] 
    ? articlesContent[articleId] 
    : null

  if (!article) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4 bg-background">
        <h1 className="text-2xl font-bold">Article introuvable</h1>
        <Button onClick={() => navigate(-1)}>Retour</Button>
      </div>
    )
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
            <Button variant="outline">Accueil</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 p-4 md:p-8 lg:py-12">
        <Link to={`/nutrition/${article.pathologySlug}`} className="inline-flex items-center text-sm font-medium text-primary hover:underline">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m15 18-6-6 6-6"/></svg>
          Retour à {article.pathology}
        </Link>
        
        <article className="space-y-6">
          <div className="space-y-4">
            <div className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              {article.pathology}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl leading-tight">
              {article.title}
            </h1>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground border-b pb-6">
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                Publié le {article.date}
              </span>
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {article.readTime} de lecture
              </span>
            </div>
          </div>

          <div className="prose prose-slate prose-lg dark:prose-invert max-w-none text-foreground">
            {article.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </article>
      </main>
    </div>
  )
}