import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 px-4 backdrop-blur-md md:px-8">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/></svg>
          </div>
          <span className="text-xl font-bold tracking-tight">Curalink</span>
        </Link>

        <nav className="hidden gap-6 text-sm font-medium md:flex">
          <Link to="/#services" className="text-muted-foreground transition-colors hover:text-foreground">Services</Link>
          <Link to="/#pourquoi-nous" className="text-muted-foreground transition-colors hover:text-foreground">Pourquoi nous choisir</Link>
          <Link to="/#nutrition" className="text-muted-foreground transition-colors hover:text-foreground">Nutrition</Link>
          <Link to="/#apropos" className="text-muted-foreground transition-colors hover:text-foreground">À propos</Link>
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
  )
}
