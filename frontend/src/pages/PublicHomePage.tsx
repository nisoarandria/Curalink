import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { motion } from "framer-motion";
import {
  AiBrain01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar01Icon,
  Icon,
  Pulse01Icon,
  UserGroupIcon,
} from "@/components/ui/icon";
import { fetchServices, type ServiceOption } from "@/services/appointmentApi";

const reasons = [
  {
    title: "Orientation IA Intelligente",
    description:
      "Notre chatbot analyse vos symptômes pour vous orienter vers le bon spécialiste en temps réel.",
    icon: <Icon icon={AiBrain01Icon} className="size-6" />,
  },
  {
    title: "Prise de RDV Rapide",
    description:
      "Planifiez et gérez vos consultations médicales en quelques clics selon les disponibilités.",
    icon: <Icon icon={Calendar01Icon} className="size-6" />,
  },
  {
    title: "Dossier Médical Numérique",
    description:
      "Centralisez vos antécédents, constantes vitales et historiques de consultations de manière sécurisée.",
    icon: <Icon icon={Pulse01Icon} className="size-6" />,
  },
  {
    title: "Suivi Pluridisciplinaire",
    description:
      "Collaborez facilement avec votre médecin et votre nutritionniste au même endroit.",
    icon: <Icon icon={UserGroupIcon} className="size-6" />,
  },
];

const rubriques = [
  "Diabète",
  "Hypertension",
  "Cancer",
  "Ostéoporose",
  "Anémie",
  "Obésité",
  "Grossesse",
];

/* ──────────────────────────────
   Services Carousel with Chevrons
────────────────────────────────*/
function ServicesCarousel({
  services,
  loading,
}: {
  services: ServiceOption[];
  loading: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const CARD_WIDTH = 300 + 20; // card + gap

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
    return () => el.removeEventListener("scroll", checkScroll);
  }, [services]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === "right" ? CARD_WIDTH * 2 : -CARD_WIDTH * 2,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      {/* LEFT CHEVRON */}
      <button
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
        aria-label="Défiler à gauche"
        className={`
          absolute left-0 top-1/2 -translate-y-1/2 z-10 -translate-x-4
          flex items-center justify-center
          w-11 h-11 rounded-full bg-white shadow-lg border border-slate-100
          text-slate-600 hover:text-primary hover:border-primary hover:shadow-primary/10
          transition-all duration-200
          disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-600 disabled:hover:border-slate-100
        `}
      >
        <Icon icon={ArrowLeft01Icon} className="size-5" strokeWidth={2.5} />
      </button>

      {/* CARDS TRACK */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scroll-smooth pb-4 px-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex-none w-[280px] sm:w-[300px] h-[320px] rounded-2xl bg-slate-100 animate-pulse"
              />
            ))
          : services.map((s, index) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.07 }}
                viewport={{ once: true, amount: 0.2 }}
                className="flex-none w-[280px] sm:w-[300px]"
              >
                <Card
                  className="
              relative overflow-hidden w-full
              bg-white border border-slate-100
              rounded-2xl shadow-sm
              hover:shadow-xl hover:border-primary/20
              transition-all duration-300
              group cursor-pointer
            "
                >
                  {/* Shimmer */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent z-10 pointer-events-none" />

                  {/* IMAGE */}
                  <div className="overflow-hidden h-44">
                    <img
                      src={s.illustrationUrl}
                      alt={s.nom}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110 group-hover:brightness-105"
                    />
                  </div>

                  <CardHeader className="pb-1 pt-4">
                    <CardTitle className="text-base font-semibold text-slate-800 group-hover:text-primary transition-colors">
                      {s.nom}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-5">
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {s.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>

      {/* RIGHT CHEVRON */}
      <button
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
        aria-label="Défiler à droite"
        className={`
          absolute right-0 top-1/2 -translate-y-1/2 z-10 translate-x-4
          flex items-center justify-center
          w-11 h-11 rounded-full bg-white shadow-lg border border-slate-100
          text-slate-600 hover:text-primary hover:border-primary hover:shadow-primary/10
          transition-all duration-200
          disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-600 disabled:hover:border-slate-100
        `}
      >
        <Icon icon={ArrowRight01Icon} className="size-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}

/* ──────────────────────────────
   Main Page
────────────────────────────────*/
export default function PublicHomePage() {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    fetchServices()
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setServicesLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-foreground">
      <Header />
      <main className="flex-1">
        {/* ═══════════════════════════
            HERO SECTION
        ════════════════════════════ */}
        <section className="relative overflow-hidden border-b border-primary/10 bg-linear-to-br from-[#C8DFF0] via-[#E2EEF7] to-[#F0F6FA] pt-16">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(3,105,161,0.18)_0%,_transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(3,105,161,0.14)_0%,_transparent_50%)]" />
          <div className="absolute top-0 right-0 h-[520px] w-[520px] translate-x-[25%] -translate-y-[25%] rounded-full bg-primary/22 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-[420px] w-[420px] -translate-x-[25%] translate-y-[20%] rounded-full bg-primary/16 blur-3xl" />

          <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8 py-10 md:py-14 grid md:grid-cols-2 gap-8 items-center">
            {/* LEFT TEXT */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col gap-5"
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-800 leading-tight">
                Votre santé connectée,{" "}
                <span className="text-primary">plus humaine.</span>
              </h1>

              <p className="text-slate-600 text-xs md:text-sm leading-relaxed max-w-md">
                Curalink révolutionne le parcours de soins avec une orientation
                intelligente, un dossier médical partagé et une prise de
                rendez-vous fluide.
              </p>

              {/* Stats row */}
              <div className="flex gap-6 py-2">
                {[
                  { value: "50+", label: "Spécialistes" },
                  { value: "98%", label: "Satisfaction" },
                  { value: "24/7", label: "Disponible" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-bold text-primary">
                      {stat.value}
                    </div>
                    <div className="text-xs text-slate-500">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/patient">
                  <button className="px-6 py-3 rounded-xl font-semibold text-white bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all hover:scale-[1.03]">
                    Démarrer mon orientation
                  </button>
                </Link>
                <Link to="/login">
                  <button className="px-6 py-3 rounded-xl bg-white/80 border border-primary/20 text-slate-700 font-medium hover:bg-white hover:border-primary transition-all hover:scale-[1.03]">
                    Espace professionnel
                  </button>
                </Link>
              </div>
            </motion.div>

            {/* RIGHT ILLUSTRATION */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative flex justify-center"
            >
              {/* Floating card: RDV */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "easeInOut",
                }}
                className="absolute top-4 -left-4 z-20 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 border border-slate-100"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-lg">
                  📅
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-700">
                    Prochain RDV
                  </div>
                  <div className="text-xs text-slate-400">
                    Dr. Martin • 14h00
                  </div>
                </div>
              </motion.div>

              {/* Floating card: AI */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 3.5,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className="absolute bottom-8 -right-2 z-20 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 border border-slate-100"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-lg">
                  🤖
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-700">
                    Orientation IA
                  </div>
                  <div className="text-xs text-slate-400">
                    Analyse en cours…
                  </div>
                </div>
              </motion.div>

              {/* Main illustration */}
              <div className="relative rounded-3xl overflow-hidden border-4 border-white shadow-2xl max-w-[360px] w-full bg-white">
                <img
                  src="https://static.vecteezy.com/system/resources/previews/007/164/385/non_2x/medical-consultation-with-doctor-and-patient-in-modern-flat-design-style.jpg"
                  className="w-full object-cover"
                  onError={(e) => {
                    // fallback to a medical illustration
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80";
                  }}
                />
              </div>
            </motion.div>
          </div>

          {/* Wave bottom */}
          <div className="relative h-12 overflow-hidden">
            <svg
              viewBox="0 0 1440 48"
              className="absolute bottom-0 w-full"
              preserveAspectRatio="none"
            >
              <path
                d="M0,48 L0,24 C360,0 720,48 1080,24 L1440,0 L1440,48 Z"
                fill="#f8fafc"
              />
            </svg>
          </div>
        </section>

        {/* ═══════════════════════════
            SERVICES SECTION
        ════════════════════════════ */}
        <section id="services" className="bg-slate-50 py-14 md:py-20">
          <div className="mx-auto max-w-7xl px-8 md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
                Services
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
                Nos services médicaux
              </h2>
              <p className="mt-3 text-slate-500 text-sm md:text-base max-w-xl mx-auto">
                Des soins spécialisés adaptés à chaque patient, de la
                consultation à la prise en charge complète.
              </p>
            </motion.div>

            <ServicesCarousel services={services} loading={servicesLoading} />
          </div>
        </section>

        {/* ═══════════════════════════
            UNE PRISE EN CHARGE PENSÉE POUR VOUS
        ════════════════════════════ */}
        <section className="bg-white py-14 md:py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
                Notre engagement
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
                Une prise en charge pensée pour vous
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Consultations expertes",
                  desc: "Accédez à des médecins qualifiés dans plus de 15 spécialités médicales.",
                },
                {
                  title: "Suivi numérique",
                  desc: "Gérez votre dossier médical, vos ordonnances et vos résultats depuis votre téléphone.",
                },
                {
                  title: "Accompagnement continu",
                  desc: "Restez en contact avec votre équipe soignante entre les consultations.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group"
                >
                  <h3 className="text-base font-semibold text-slate-800 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════
            POURQUOI NOUS CHOISIR
        ════════════════════════════ */}
        <section
          id="pourquoi-nous"
          className="relative overflow-hidden bg-slate-100/60 py-16 md:py-24"
        >
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,_#000_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="absolute -top-24 -left-24 h-[280px] w-[280px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-[280px] w-[280px] rounded-full bg-primary/10 blur-3xl" />

          <div className="relative mx-auto max-w-6xl px-6 md:px-10">
            <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="grid gap-10 lg:grid-cols-3 p-8 md:p-12">
                {/* LEFT */}
                <div className="space-y-6 lg:col-span-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">
                    Pourquoi nous
                  </p>
                  <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">
                    Pourquoi nous choisir ?
                  </h2>
                  <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                    Curalink simplifie la relation entre patients et médecins
                    avec une expérience fluide, moderne et sécurisée.
                  </p>
                  <Link to="/patient">
                    <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-primary hover:bg-primary/90 shadow-md transition-all hover:scale-[1.03]">
                      Créer mon dossier
                      <Icon
                        icon={ArrowRight01Icon}
                        className="size-4"
                        strokeWidth={2.5}
                      />
                    </button>
                  </Link>
                  <div className="pt-3">
                    <img
                      src="https://i.pinimg.com/736x/77/86/6b/77866bb0501c5f07d6373bc667d5ee7b.jpg"
                      className="w-[220px] md:w-[260px] object-contain opacity-90 hover:opacity-100 transition rounded-xl"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                    Système médical actif
                  </div>
                </div>

                {/* RIGHT CARDS */}
                <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
                  {reasons.map((reason, index) => (
                    <motion.div
                      key={reason.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.08 }}
                      whileHover={{ scale: 1.03 }}
                      className="group relative rounded-2xl bg-slate-50 border border-slate-100 p-6 hover:shadow-lg hover:border-primary/20 cursor-pointer transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition duration-300" />
                      <div className="relative space-y-3">
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-primary shadow-sm group-hover:bg-primary/10 transition border border-slate-100">
                          {reason.icon}
                        </div>
                        <h3 className="text-base font-semibold text-slate-800 group-hover:text-primary transition">
                          {reason.title}
                        </h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {reason.description}
                        </p>
                        <div className="h-[2px] w-0 bg-primary group-hover:w-full transition-all duration-500" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════
            NUTRITION PAR PATHOLOGIE
        ════════════════════════════ */}
        <section
          id="nutrition"
          className="relative overflow-hidden bg-linear-to-b from-[#D4E6F2] via-[#E4EFF7] to-[#EDF4FA] py-16 md:py-24"
        >
          <div className="absolute -top-24 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-primary/14 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 md:px-8">
            <motion.div
              className="space-y-4 text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Nutrition
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-800">
                La nutrition par pathologie
              </h2>
              <p className="mx-auto max-w-2xl text-base md:text-lg text-slate-500 leading-relaxed">
                Découvrez nos articles rédigés par des nutritionnistes
                professionnels pour mieux vivre avec votre pathologie.
              </p>
            </motion.div>

            {/* TAGS */}
            <motion.div
              className="flex flex-wrap justify-center gap-3 md:gap-4"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.06 } },
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
                      show: { opacity: 1, y: 0, scale: 1 },
                    }}
                    transition={{ duration: 0.4 }}
                  >
                    <Link to={`/nutrition/${slug}`}>
                      <div className="relative group cursor-pointer overflow-hidden rounded-full px-6 py-3 bg-white border border-slate-200 shadow-sm hover:shadow-md hover:scale-110 hover:-translate-y-1 transition-all duration-300">
                        <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition duration-300" />
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
                        <span className="relative z-10 font-medium text-sm text-slate-700 group-hover:text-white transition">
                          {rubrique}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />

      {/* MOBILE STICKY CTA */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] md:hidden z-50">
        <button className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl shadow-xl font-semibold transition-all hover:scale-[1.02]">
          Commencer maintenant
        </button>
      </div>
    </div>
  );
}
