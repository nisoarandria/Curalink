import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Link as ScrollLink } from "react-scroll";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/hooks/useAuth";
import { getDefaultPathByRole } from "@/lib/auth";
import avatarDefault from "@/assets/avatar.webp";

export default function Header() {
  const { isAuthenticated, user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  const displayName =
    [user?.prenom, user?.nom].filter(Boolean).join(" ").trim() ||
    user?.email ||
    "";
  const dashboardPath = getDefaultPathByRole(user?.userType);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`
        fixed top-0 z-50 w-full transition-all duration-300
        ${
          scrolled
            ? "h-14 bg-white shadow-md border-b border-slate-100"
            : "h-16 bg-white/95 border-b border-slate-100"
        }
      `}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 md:px-8">
        <Logo
          href="/"
          size={scrolled ? "sm" : "md"}
          className="group-hover:[&_p]:text-primary"
        />

        {/* NAV */}
        <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
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
              className="cursor-pointer px-4 py-2 rounded-full text-slate-600 transition-all hover:text-primary hover:bg-primary/5"
            >
              {item.label}
            </ScrollLink>
          ))}
        </nav>

        {/* ACTIONS */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <img
                  src={avatarDefault}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover border-2 border-primary/15 shadow-sm"
                />
                <span className="hidden sm:inline text-sm font-semibold text-slate-700 max-w-[140px] truncate">
                  {displayName}
                </span>
              </div>
              <Link to={dashboardPath}>
                <button className="inline-flex items-center px-5 py-2 rounded-full text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-sm hover:shadow-md transition-all hover:scale-[1.03]">
                  Tableau de bord
                </button>
              </Link>
            </div>
          ) : (
            <>
              <Link to="/login">
                <button className="hidden sm:inline-flex items-center px-4 py-2 rounded-full text-sm font-medium text-slate-600 hover:text-primary hover:bg-primary/5 transition-all">
                  Se connecter
                </button>
              </Link>
              <Link to="/patient">
                <button className="inline-flex items-center px-5 py-2 rounded-full text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-sm hover:shadow-md transition-all hover:scale-[1.03]">
                  Prendre RDV
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
