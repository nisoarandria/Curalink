import { Link } from "react-router-dom"

export default function Footer() {
  return (
    <footer
      id="apropos"
      className="
        relative overflow-hidden
        border-t border-white/10
        text-white

        bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950
      "
    >

      {/* 🌊 WAVE BACKGROUND ANIMATION (CSS ONLY) */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[200%] h-[200%] opacity-20 animate-[wave_12s_linear_infinite] bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 blur-3xl" />
        <div className="absolute w-[200%] h-[200%] opacity-10 animate-[wave_18s_linear_infinite_reverse] bg-gradient-to-r from-indigo-500/10 via-cyan-500/10 to-blue-500/10 blur-3xl" />
      </div>

      {/* GLASS LAYER */}
      <div className="absolute inset-0 backdrop-blur-3xl bg-white/5" />

      {/* GLOW ORBS */}
      <div className="absolute inset-0">
        <div className="absolute -top-24 left-1/4 h-[320px] w-[320px] bg-cyan-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-1/4 h-[320px] w-[320px] bg-blue-500/10 blur-3xl rounded-full" />
      </div>

      {/* CONTENT */}
      <div className="relative mx-auto w-full max-w-7xl px-4 py-14 md:px-8 lg:py-20">

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">

          {/* BRAND */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="
                h-9 w-9 flex items-center justify-center
                rounded-xl
                bg-gradient-to-r from-cyan-500 to-blue-600
                shadow-lg shadow-cyan-500/20
                group-hover:scale-110
                transition
              ">
                +
              </div>
              <span className="text-xl font-bold group-hover:text-cyan-400 transition">
                Curalink
              </span>
            </Link>

            <p className="text-sm text-white/60 leading-relaxed">
              Plateforme santé moderne pour une prise en charge rapide et intelligente.
            </p>
          </div>

          {/* NAV */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/80">
              Navigation
            </h4>

            <ul className="space-y-3 text-sm">
              {[
                ["Services", "/#services"],
                ["Pourquoi nous", "/#pourquoi-nous"],
                ["Nutrition", "/#nutrition"],
                ["Patient", "/patient"]
              ].map(([label, link]) => (
                <li key={label}>
                  <Link
                    to={link}
                    className="
                      text-white/60
                      hover:text-cyan-400
                      transition
                      hover:translate-x-1
                      inline-block
                    "
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* PRO */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/80">
              Professionnels
            </h4>

            <ul className="space-y-3 text-sm">
              {[
                ["Médecin", "/medecin"],
                ["Nutritionniste", "/nutritionniste"],
                ["Connexion", "/login"]
              ].map(([label, link]) => (
                <li key={label}>
                  <Link
                    to={link}
                    className="
                      text-white/60
                      hover:text-blue-400
                      transition
                      hover:translate-x-1
                      inline-block
                    "
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CONTACT + MAGNETIC ICONS */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/80">
              Contact
            </h4>

            <div className="text-sm text-white/60 space-y-2">
              <p>📞 +261 34 00 000 00</p>
              <p>✉️ contact@curalink.health</p>
            </div>

            {/* MAGNETIC ICONS (CSS ONLY) */}
            <div className="flex gap-3 pt-2">

              {["F", "L", "T"].map((icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="
                    relative
                    h-10 w-10 flex items-center justify-center

                    rounded-full

                    bg-white/5
                    border border-white/10

                    text-white/70

                    transition-all duration-300

                    hover:scale-125
                    hover:-translate-y-1
                    hover:bg-gradient-to-r
                    hover:from-cyan-500
                    hover:to-blue-500
                    hover:text-white

                    hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]
                  "
                >
                  {icon}
                </a>
              ))}

            </div>
          </div>

        </div>

        {/* BOTTOM */}
        <div className="
          mt-14 pt-6
          border-t border-white/10
          flex flex-col sm:flex-row justify-between
          text-xs text-white/50
        ">
          <p>© 2026 Curalink. Tous droits réservés.</p>

          <div className="flex gap-4 mt-3 sm:mt-0">
            <a className="hover:text-cyan-400 transition">Mentions légales</a>
            <a className="hover:text-blue-400 transition">Confidentialité</a>
          </div>
        </div>

      </div>

      {/* CSS ANIMATION KEYFRAMES (no hook) */}
      <style>{`
        @keyframes wave {
          0% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(-25%) translateY(10px); }
          100% { transform: translateX(0) translateY(0); }
        }
      `}</style>

    </footer>
  )
}