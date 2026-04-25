
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Header from "./layout/Header"
import Footer from "./layout/Footer"



import { motion } from "framer-motion"


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
      <Header />
      <main className="flex-1">
        
        
        {/* Hero Section */}

        <section className="relative overflow-hidden border-b py-10 md:py-16 lg:py-20">

{/* 🖼️ BACKGROUND IMAGE */}
<div className="absolute inset-0 z-0">
  <img
    src="https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&w=1400&q=80"
    className="w-full h-full object-cover object-center scale-105"
  />
</div>

{/* 🌊 OVERLAY */}
<div className="absolute inset-0 z-0 bg-gradient-to-br from-black/70 via-blue-950/70 to-black/60" />

{/* ✨ GLOW EFFECTS */}
<div className="absolute inset-0 z-0 overflow-hidden">
  <div className="absolute -top-32 -left-32 h-[400px] w-[400px] rounded-full bg-blue-400/20 blur-3xl animate-pulse" />
  <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-indigo-400/20 blur-3xl animate-pulse" />
</div>

{/* CONTENT */}
<div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-4 md:grid-cols-2 md:px-8 items-center">

  {/* LEFT */}
  <motion.div
    initial={{ opacity: 0, x: -40 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.6 }}
    className="flex flex-col justify-center space-y-6"
  >

    {/* BADGE */}
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs text-white backdrop-blur border border-white/20"
    >
      <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse mr-2"></span>
      Plateforme médicale intelligente
    </motion.div>

    {/* TITLE */}
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight"
    >
      Votre santé connectée,{" "}
      <span className="text-blue-300 relative">
        plus humaine.
        <span className="absolute left-0 -bottom-1 h-[3px] w-full bg-blue-300/40 blur-sm"></span>
      </span>
    </motion.h1>

    {/* TEXT */}
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="text-gray-300 max-w-[600px] text-base md:text-lg leading-relaxed"
    >
      Curalink révolutionne le parcours de soins avec une orientation intelligente, un dossier médical partagé et une prise de rendez-vous fluide.
    </motion.p>

    {/* BUTTONS */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="flex flex-col sm:flex-row gap-3"
    >

      <Link to="/patient">
        <button className="px-5 py-2.5 rounded-xl font-semibold text-white 
        bg-gradient-to-r from-blue-500 to-indigo-500 
        shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 
        transition-all hover:scale-105">
          Démarrer mon orientation
        </button>
      </Link>

      <Link to="/login">
        <button className="px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white backdrop-blur hover:bg-white/20 transition hover:scale-105">
          Espace professionnel
        </button>
      </Link>

    </motion.div>

  </motion.div>

  {/* RIGHT IMAGE */}
  <motion.div
    initial={{ opacity: 0, x: 40 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.6 }}
    className="relative mx-auto w-full max-w-[380px] md:max-w-[420px]"
  >

    {/* glow */}
    <div className="absolute -inset-10 bg-blue-500/10 blur-3xl rounded-[3rem]" />

    {/* image */}
    <motion.div
      whileHover={{ scale: 1.03, rotate: 1 }}
      className="relative overflow-hidden rounded-[2.5rem] shadow-2xl border border-white/10"
    >
      <img
        src="https://i.pinimg.com/736x/ca/53/81/ca53814849485f13e1b8b111787cbd46.jpg"
        className="w-full max-h-[520px] object-contain bg-white/5"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10" />
    </motion.div>

  </motion.div>

</div>

{/* MOBILE CTA */}
<div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] md:hidden z-50">
  <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-xl shadow-xl hover:scale-105 transition">
   Commencer maintenant
  </button>
</div>

</section>

{/* Services Section */}


<section className="px-6 py-14 md:py-20 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white">

  {/* TITLE + GLOW ANIMÉ */}
  <motion.h2
    initial={{ opacity: 0, y: 40, scale: 0.95 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    viewport={{ once: true, amount: 0.4 }}

    className="
      text-2xl md:text-4xl font-bold text-center mb-10

      bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-500
      text-transparent bg-clip-text

      relative
    "
  >
    Nos services médicaux

    {/* glow animé derrière le titre */}
    <span className="
      absolute inset-0 blur-2xl opacity-30
      bg-gradient-to-r from-cyan-400 to-blue-500
      animate-pulse
    " />
  </motion.h2>

  {/* SCROLL */}
  <div className="
    flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory
    pb-6 scrollbar-hide
  ">

    {services.map((s, index) => (
      <motion.div
        key={s.name}

        initial={{ opacity: 0, y: 60, scale: 0.9 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.7,
          delay: index * 0.08,
          ease: "easeOut"
        }}
        viewport={{ once: true, amount: 0.3 }}

        whileHover={{
          y: -10,
          scale: 1.05
        }}

        className="flex-none snap-center"
      >

        <Card
          className="
            relative overflow-hidden

            w-[70vw] sm:w-[42vw] md:w-[28vw]
            max-w-[320px]

            bg-white/80 backdrop-blur-xl
            border border-slate-100

            rounded-2xl

            shadow-sm

            transition-all duration-500

            hover:shadow-[0_25px_70px_rgba(0,0,0,0.15)]

            group
            cursor-pointer
          "
        >

          {/* SHIMMER EFFECT (Stripe style) */}
          <div className="
            absolute inset-0
            -translate-x-full
            group-hover:translate-x-full
            transition-transform duration-1000

            bg-gradient-to-r from-transparent via-white/30 to-transparent
          " />

          {/* IMAGE */}
          <div className="overflow-hidden">
            <img
              src={s.image}
              className="
                h-40 md:h-44 w-full object-cover

                transition duration-700

                group-hover:scale-110
                group-hover:brightness-110
              "
            />
          </div>

          {/* CONTENT */}
          <CardHeader className="pb-2">
            <CardTitle className="
              text-base md:text-lg font-semibold

              text-slate-800

              group-hover:text-cyan-600
              transition-colors duration-300
            ">
              {s.name}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
              {s.description}
            </p>
          </CardContent>

          {/* soft glow dynamique */}
          <div className="
            absolute -inset-10 opacity-0
            group-hover:opacity-100
            transition duration-700

            bg-gradient-to-tr from-cyan-400/20 to-blue-500/20
            blur-3xl
          " />

        </Card>

      </motion.div>
    ))}

  </div>
</section>


{/* Pourquoi nous choisir */}

<section
  id="pourquoi-nous"
  className="relative py-16 md:py-24 overflow-hidden bg-white"
>

  <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle,_#000_1px,transparent_1px)] [background-size:20px_20px]" />

  <div className="absolute -top-24 -left-24 h-[280px] w-[280px] rounded-full bg-blue-100 blur-3xl" />
  <div className="absolute -bottom-24 -right-24 h-[280px] w-[280px] rounded-full bg-indigo-100 blur-3xl" />

  <div className="relative mx-auto max-w-6xl px-6 md:px-10">

    <div className="
      rounded-3xl
      bg-white/70 backdrop-blur-xl
      border border-gray-100
      shadow-[0_20px_60px_rgba(0,0,0,0.08)]
      overflow-hidden
      transition-all duration-300
      hover:shadow-[0_25px_80px_rgba(0,0,0,0.12)]
    ">

      <div className="grid gap-10 lg:grid-cols-3 p-8 md:p-12">

        {/* LEFT */}
        <div className="space-y-6 lg:col-span-1">

          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">
            Pourquoi nous choisir ?
          </h2>

          <p className="text-gray-600 text-sm md:text-base leading-relaxed">
            Curalink simplifie la relation entre patients et médecins avec une expérience fluide, moderne et sécurisée.
          </p>

          {/* BUTTON */}
          <Link to="/patient">
            <Button className="
              bg-gradient-to-r from-cyan-500 to-sky-500
              text-white
              rounded-xl
              px-5 py-5
              text-sm md:text-base
              shadow-md shadow-cyan-200/40
              transition-all duration-300
              hover:scale-[1.05]
              hover:shadow-[0_20px_40px_rgba(34,211,238,0.25)]
            ">
              Créer mon dossier
            </Button>
          </Link>

          {/* IMAGE */}
          <div className="pt-3">
            <img
              src="https://i.pinimg.com/736x/77/86/6b/77866bb0501c5f07d6373bc667d5ee7b.jpg"
              className="w-[220px] md:w-[280px] object-contain opacity-90 hover:opacity-100 transition rounded-xl"
            />
          </div>

          {/* STATUS */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            Système médical actif
          </div>

        </div>

        {/* RIGHT CARDS */}
        <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">

          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              whileHover={{ scale: 1.04 }}
              className="
                group relative rounded-2xl
                bg-white
                border border-gray-100
                shadow-sm
                p-6
                min-h-[150px]
                overflow-hidden

                transition-all duration-300
                hover:shadow-xl
                hover:border-cyan-300
                cursor-pointer
              "
            >
              <div className="
                absolute inset-0
                bg-gradient-to-r from-cyan-400 to-sky-500
                opacity-0 group-hover:opacity-10
                transition duration-500
              " />

              {/*  GLOW EFFECT */}
              <div className="
                absolute inset-0
                opacity-0 group-hover:opacity-100
                transition duration-500
                bg-cyan-400/10 blur-2xl
              " />

              <div className="relative space-y-3">

                <div className="
                  h-10 w-10 flex items-center justify-center rounded-lg
                  bg-blue-50 text-blue-600
                  group-hover:bg-cyan-100
                  transition
                ">
                  {reason.icon}
                </div>

                {/* TITLE */}
                <h3 className="text-base font-semibold text-gray-900 group-hover:text-cyan-600 transition">
                  {reason.title}
                </h3>

                {/* DESCRIPTION */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  {reason.description}
                </p>

                {/* UNDERLINE ANIMATION */}
                <div className="
                  h-[2px] w-0 bg-cyan-500
                  group-hover:w-full
                  transition-all duration-500
                " />

              </div>
            </motion.div>
          ))}

        </div>

      </div>
    </div>
  </div>
</section>
 

 {/* Rubriques Nutritionnelles */}

 <section
  id="nutrition"
  className="relative mx-auto w-full max-w-7xl px-4 py-16 md:px-8 md:py-24"
>
  <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 via-blue-50 to-slate-100" />
  <div className="absolute -top-24 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-blue-300/20 blur-3xl" />

  <motion.div
    className="space-y-5 text-center mb-14"
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7 }}
    viewport={{ once: true }}
  >
    <motion.h2
      className="
        text-3xl md:text-5xl font-bold tracking-tight
        text-transparent bg-clip-text
        bg-gradient-to-r from-slate-800 via-blue-700 to-slate-800
      "
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.6 }}
      viewport={{ once: true }}
    >
      La nutrition par pathologie
    </motion.h2>

    <motion.p
      className="mx-auto max-w-2xl text-base md:text-lg text-slate-600 leading-relaxed"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      viewport={{ once: true }}
    >
      Découvrez nos articles et conseils rédigés par des nutritionnistes professionnels pour mieux vivre avec votre pathologie.
    </motion.p>
  </motion.div>

  {/* TAGS */}
  <motion.div
  className="
    flex flex-wrap justify-center gap-4
    md:gap-5
    overflow-x-auto md:overflow-visible
    pb-3 md:pb-0
    scroll-smooth
  "
  initial="hidden"
  whileInView="show"
  viewport={{ once: true }}
  variants={{
    hidden: {},
    show: {
      transition: { staggerChildren: 0.06 }
    }
  }}
>
  {rubriques.map((rubrique) => {
    const slug = rubrique
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ /g, "-");

    return (
      <motion.div
        key={rubrique}
        variants={{
          hidden: { opacity: 0, y: 18, scale: 0.95 },
          show: { opacity: 1, y: 0, scale: 1 }
        }}
        transition={{ duration: 0.4 }}
        className="flex-shrink-0 md:flex-shrink"
      >
        <Link to={`/nutrition/${slug}`}>
        <div
  tabIndex={0}
  className="
    relative group cursor-pointer overflow-hidden
    rounded-full px-6 py-3

    bg-white/80 backdrop-blur
    border border-slate-200
    shadow-sm

    transition-all duration-300

    hover:scale-110
    hover:-translate-y-1
    hover:shadow-xl

    focus:scale-110
    focus:ring-2 focus:ring-cyan-300
  "
>

  <div className="
    absolute inset-0
    bg-gradient-to-r from-cyan-400 to-sky-500
    opacity-0 group-hover:opacity-100
    transition duration-500
  " />

  <div className="
    absolute inset-0
    opacity-0 group-hover:opacity-100
    transition duration-300

    bg-radial-gradient(circle at var(--x, 50%) var(--y, 50%),
      rgba(255,255,255,0.35),
      transparent 40%
    )
  " />

  <div className="
    absolute inset-0 -translate-x-full
    group-hover:translate-x-full
    transition-transform duration-700
    bg-gradient-to-r from-transparent via-white/40 to-transparent
    skew-x-12
  " />

  <span className="
    relative z-10 font-medium
    text-slate-700 group-hover:text-white
    transition
  ">
    {rubrique}
  </span>

          </div>
        </Link>
      </motion.div>
    );
  })}
</motion.div>
</section>


      </main>
      <Footer />
    </div>
  )
}