import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const services = [
  {
    name: "Médecine générale",
    description: "Consultation initiale, suivi régulier et orientation vers les spécialistes adaptés à vos besoins.",
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Dermatologie",
    description: "Prise en charge spécialisée des pathologies de la peau, des cheveux et des ongles.",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Cardiologie",
    description: "Suivi cardiovasculaire, prévention et traitement des maladies du cœur en toute sécurité.",
    image: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Pédiatrie",
    description: "Suivi du développement, vaccinations et soins dédiés aux nourrissons et enfants.",
    image: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Ophtalmologie",
    description: "Dépistage, diagnostic et traitement des troubles de la vision et maladies de l'œil.",
    image: "https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Gynécologie",
    description: "Accompagnement de la santé féminine, suivi de grossesse et prévention.",
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Nutrition",
    description: "Accompagnement nutritionnel personnalisé avec des plans adaptés à votre pathologie.",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80",
  },
]

const reasons = [
  {
    title: "Orientation IA Intelligente",
    description: "Notre chatbot analyse vos symptômes pour vous orienter vers le bon spécialiste en temps réel.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    )
  },
  {
    title: "Prise de RDV Rapide",
    description: "Planifiez et gérez vos consultations médicales en quelques clics selon les disponibilités.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
    )
  },
  {
    title: "Dossier Médical Numérique",
    description: "Centralisez vos antécédents, constantes vitales et historiques de consultations de manière sécurisée.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
    )
  },
  {
    title: "Suivi Pluridisciplinaire",
    description: "Collaborez facilement avec votre médecin et votre nutritionniste au même endroit.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    )
  },
]

const rubriques = [
  "Diabète",
  "Hypertension",
  "Cancer",
  "Ostéoporose",
  "Anémie",
  "Obésité",
  "Grossesse",
]

export default function PublicHomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      {/* Header Sticky */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 px-4 backdrop-blur-md md:px-8">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/></svg>
            </div>
            <span className="text-xl font-bold tracking-tight">Curalink</span>
          </div>

          <nav className="hidden gap-6 text-sm font-medium md:flex">
            <a href="#services" className="text-muted-foreground transition-colors hover:text-foreground">Services</a>
            <a href="#pourquoi-nous" className="text-muted-foreground transition-colors hover:text-foreground">Pourquoi nous choisir</a>
            <a href="#nutrition" className="text-muted-foreground transition-colors hover:text-foreground">Nutrition</a>
            <a href="#apropos" className="text-muted-foreground transition-colors hover:text-foreground">À propos</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="hidden sm:inline-flex">Se connecter</Button>
            </Link>
            <Link to="/patient">
              <Button>Prendre RDV</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b bg-muted/30">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-2 md:px-8 md:py-12 lg:gap-10">
            <div className="flex flex-col justify-center space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                  Nouvelle plateforme médicale
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                  Votre santé connectée, <span className="text-primary">plus humaine.</span>
                </h1>
                <p className="max-w-[600px] text-lg leading-relaxed text-muted-foreground">
                  Curalink révolutionne le parcours de soins. Profitez d'une orientation intelligente, d'un dossier médical partagé et d'une prise de rendez-vous fluide avec vos professionnels de santé.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/patient">
                  <Button size="lg" className="w-full sm:w-auto">
                    Démarrer mon orientation
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="w-full bg-background sm:w-auto">
                    Espace professionnel
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[320px] md:max-w-[400px] lg:max-w-[450px]">
              <div className="aspect-square overflow-hidden rounded-2xl md:aspect-4/3 lg:aspect-square">
                <img
                  src="https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&w=1200&q=80"
                  alt="Équipe médicale"
                  className="h-full w-full object-cover object-center shadow-xl"
                />
              </div>
              {/* Decorative abstract elements */}
              <div className="absolute -bottom-6 -left-6 -z-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl"></div>
              <div className="absolute -right-6 -top-6 -z-10 h-48 w-48 rounded-full bg-secondary blur-3xl"></div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="mx-auto w-full max-w-7xl space-y-10 px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-3xl space-y-3 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Nos services médicaux</h2>
            <p className="text-lg text-muted-foreground">
              Accédez à une expertise variée en quelques clics. Des spécialistes qualifiés à votre écoute.
            </p>
          </div>
          
          <div className="relative w-full overflow-hidden">
            <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-8 pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {services.map((service) => (
                <Card key={service.name} className="w-[85vw] sm:w-[45vw] md:w-[35vw] lg:w-[25vw] flex-none snap-center overflow-hidden transition-shadow hover:shadow-lg">
                  <div className="aspect-4/3 overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  <CardHeader className="p-5">
                    <CardTitle className="text-xl">{service.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 pt-0">
                    <p className="text-sm leading-relaxed text-muted-foreground">{service.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Indicateur visuel pour faire comprendre que c'est scrollable (fade sur le bord droit) */}
            <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-12 bg-linear-to-l from-background to-transparent lg:w-24"></div>
          </div>
        </section>

        {/* Pourquoi nous choisir */}
        <section id="pourquoi-nous" className="border-y bg-muted/30 py-16 md:py-24">
          <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="space-y-5 lg:col-span-1">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Pourquoi nous choisir ?</h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Curalink a été pensé pour simplifier le lien entre les patients et les médecins, offrant une interface intuitive et des fonctionnalités complètes.
                </p>
                <Link to="/patient">
                  <Button variant="default" className="mt-4">Créer mon dossier</Button>
                </Link>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:col-span-2 lg:gap-8">
                {reasons.map((reason) => (
                  <div key={reason.title} className="flex flex-col space-y-3 rounded-xl bg-background p-6 shadow-sm border transition-colors hover:border-primary/50">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      {reason.icon}
                    </div>
                    <h3 className="text-xl font-semibold">{reason.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{reason.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Rubriques Nutritionnelles */}
        <section id="nutrition" className="mx-auto w-full max-w-7xl space-y-10 px-4 py-16 md:px-8 md:py-24">
          <div className="space-y-3 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">La nutrition par pathologie</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Découvrez nos articles et conseils rédigés par des nutritionnistes professionnels pour mieux vivre avec votre pathologie.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            {rubriques.map((rubrique) => {
              // Création d'un slug simple (ex: Diabète -> diabete)
              const slug = rubrique.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-');
              return (
                <Link to={`/nutrition/${slug}`} key={rubrique}>
                  <div className="group cursor-pointer rounded-full border bg-card px-6 py-3 transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md">
                    <span className="font-medium">{rubrique}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer id="apropos" className="border-t bg-card text-card-foreground">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 lg:py-16">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/></svg>
                </div>
                <span className="text-xl font-bold">Curalink</span>
              </div>
              <p className="text-sm text-muted-foreground">
                La plateforme santé de référence pour une prise en charge rapide, fluide et pluridisciplinaire à Madagascar.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">Navigation</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#services" className="hover:text-primary transition-colors">Services</a></li>
                <li><a href="#pourquoi-nous" className="hover:text-primary transition-colors">Pourquoi nous choisir</a></li>
                <li><a href="#nutrition" className="hover:text-primary transition-colors">Articles nutritionnels</a></li>
                <li><Link to="/patient" className="hover:text-primary transition-colors">Espace Patient</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">Professionnels</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link to="/medecin" className="hover:text-primary transition-colors">Portail Médecin</Link></li>
                <li><Link to="/nutritionniste" className="hover:text-primary transition-colors">Portail Nutritionniste</Link></li>
                <li><Link to="/login" className="hover:text-primary transition-colors">Se connecter</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors">Nous rejoindre</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">Contact</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <span>+261 34 00 000 00</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <span>contact@curalink.health</span>
                </li>
                <li className="flex items-center gap-3 pt-2">
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5 0.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                  </a>
                </li>
              </ul>
            </div>

          </div>
          
          <div className="mt-12 flex flex-col items-center justify-between border-t pt-8 text-sm text-muted-foreground sm:flex-row">
            <p>© 2026 Curalink. Tous droits réservés.</p>
            <div className="mt-4 flex gap-4 sm:mt-0">
              <a href="#" className="hover:text-primary transition-colors">Mentions légales</a>
              <a href="#" className="hover:text-primary transition-colors">Politique de confidentialité</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
