import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Link as ScrollLink } from "react-scroll"
import { Button } from "@/components/ui/button"

export default function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`
        fixed top-0 z-50 w-full transition-all duration-300
        border-b border-white/10 backdrop-blur-xl
        ${scrolled ? "h-14 bg-white/80 shadow-md" : "h-20 bg-white/60"}
      `}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 md:px-8">

        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 group">

          <div
            className={`
              flex items-center justify-center shrink-0
              rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-400 shadow-md
              transition-all duration-300
              ${scrolled ? "h-8 w-8" : "h-9 w-9"}
              group-hover:scale-110
            `}
          >

            {/* ✅ SVG FIXÉ */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="#ffffff"   // ✅ fixé (plus de currentColor)
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2z" />
            </svg>

          </div>

          <span
            className={`
              font-bold tracking-tight text-gray-800 transition-all duration-300
              ${scrolled ? "text-lg" : "text-xl"}
              group-hover:text-blue-600
            `}
          >
            Curalink
          </span>

        </Link>

        {/* NAV */}
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          {[
            { to: "services", label: "Services" },
            { to: "pourquoi-nous", label: "Pourquoi nous" },
            { to: "nutrition", label: "Nutrition" },
            { to: "apropos", label: "À propos" },
          ].map((item, i) => (
            <ScrollLink
              key={i}
              to={item.to}
              smooth
              duration={500}
              offset={-70}
              className="cursor-pointer text-gray-600 transition hover:text-blue-600"
            >
              {item.label}
            </ScrollLink>
          ))}
        </nav>

        {/* ACTIONS */}
        <div className="flex items-center gap-3">

          <Link to="/login">
            <Button
              variant="ghost"
              className={`
                hidden sm:inline-flex rounded-full transition-all
                ${scrolled ? "px-3 py-1 text-sm" : "px-4 py-2"}
                hover:bg-blue-50 hover:text-blue-600
              `}
            >
              Se connecter
            </Button>
          </Link>

          <Link to="/patient">
            <Button
              className={`
                rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-md
                transition-all hover:scale-105
                ${scrolled ? "px-4 py-1 text-sm" : "px-5 py-2"}
              `}
            >
              Prendre RDV
            </Button>
          </Link>

        </div>

      </div>
    </header>
  )
}