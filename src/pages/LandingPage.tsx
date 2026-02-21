import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Shield, Brain, BarChart3, FileCheck, Eye, BookOpen,
  ArrowRight, GraduationCap, Sparkles, Zap, Users, Award,
  CheckCircle2, Play
} from "lucide-react";
import WordRotation from "@/components/landing/WordRotation";
import FloatingIcons from "@/components/landing/FloatingIcons";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Evaluation",
    desc: "Automated, transparent marking with detailed explanations for every answer.",
    accent: "from-primary/20 to-primary/5",
  },
  {
    icon: Shield,
    title: "Anti-Cheating System",
    desc: "Webcam, audio, tab-switch, and face detection monitoring during exams.",
    accent: "from-destructive/20 to-destructive/5",
  },
  {
    icon: Eye,
    title: "Full Transparency",
    desc: "Students see AI marking rationale and can raise grievances if needed.",
    accent: "from-success/20 to-success/5",
  },
  {
    icon: FileCheck,
    title: "Grievance Workflow",
    desc: "Structured pipeline: Pending → Approved → Rechecked → Resolved.",
    accent: "from-warning/20 to-warning/5",
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    desc: "Performance trends, strengths, weaknesses, and improvement graphs.",
    accent: "from-primary/20 to-primary/5",
  },
  {
    icon: GraduationCap,
    title: "SGPA/CGPA Scorecards",
    desc: "Downloadable PDF scorecards with comprehensive grade calculations.",
    accent: "from-charcoal/15 to-charcoal/5",
  },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const LandingPage = () => {
  const { user, role } = useAuth();
  const dashLink = user ? (role === "teacher" ? "/teacher" : "/student") : "/auth";

  return (
    <div className="min-h-screen">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-background">
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "80px 80px"
        }} />
        {/* Floating icons */}
        <FloatingIcons />

        <div className="relative z-10 px-4 pt-24 pb-28 sm:pt-32 sm:pb-36">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5"
            >
              <Award className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                AI-Powered Examination Platform
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              className="text-4xl font-black leading-[1.15] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <span className="block">
                Your <WordRotation />
              </span>
              <span className="text-muted-foreground">Examination</span> System
            </motion.h1>

            <motion.p
              className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Experience best-in-class modern, lightweight, and AI-enabled examination
              with real-time monitoring and transparent evaluation.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link to={dashLink}>
                <Button
                  size="lg"
                  className="gap-2 bg-charcoal text-charcoal-foreground hover:bg-charcoal/90 shadow-xl shadow-charcoal/10 text-sm font-semibold px-8 rounded-xl h-12"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/docs">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 border-border text-foreground hover:bg-muted rounded-xl h-12"
                >
                  <BookOpen className="h-4 w-4" />
                  Documentation
                </Button>
              </Link>
            </motion.div>

            {/* User avatars */}
            <motion.div
              className="mt-10 flex items-center justify-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex -space-x-2">
                {[
                  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=40&h=40&fit=crop&crop=faces&q=80",
                  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=40&h=40&fit=crop&crop=faces&q=80",
                  "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=40&h=40&fit=crop&crop=faces&q=80",
                  "https://images.unsplash.com/photo-1619895862022-09114b41f16f?w=40&h=40&fit=crop&crop=faces&q=80",
                ].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="User"
                    className="h-8 w-8 rounded-full border-2 border-background object-cover"
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">and 500+ students trust us!</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== BENTO GRID (MasterG style with images + cards) ===== */}
      <section className="relative px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            className="grid gap-4 grid-cols-1 sm:grid-cols-3 auto-rows-[280px]"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {/* Large image card */}
            <motion.div
              variants={fadeUp}
              className="relative sm:col-span-1 sm:row-span-2 rounded-3xl overflow-hidden group"
            >
              <img
                src="https://images.unsplash.com/photo-1573894999291-f440466112cc?w=600&h=800&fit=crop&q=80"
                alt="Students learning"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/20 backdrop-blur-sm border border-success/30 px-3 py-1 text-xs font-medium text-success-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  Live Monitoring
                </span>
                <h3 className="mt-3 text-xl font-bold text-white">Real-Time Exam Proctoring</h3>
                <p className="mt-1 text-sm text-white/70">Webcam & tab-switch detection for fair exams.</p>
              </div>
            </motion.div>

            {/* User trust card */}
            <motion.div
              variants={fadeUp}
              className="relative rounded-3xl border border-border bg-card p-6 flex flex-col justify-between overflow-hidden group hover:shadow-xl transition-shadow"
            >
              <div>
                <div className="flex -space-x-2 mb-4">
                  {[
                    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=60&h=60&fit=crop&crop=faces&q=80",
                    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=60&h=60&fit=crop&crop=faces&q=80",
                    "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=60&h=60&fit=crop&crop=faces&q=80",
                    "https://images.unsplash.com/photo-1619895862022-09114b41f16f?w=60&h=60&fit=crop&crop=faces&q=80",
                  ].map((src, i) => (
                    <img key={i} src={src} alt="User" className="h-10 w-10 rounded-full border-2 border-card object-cover" />
                  ))}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-bold text-muted-foreground">
                    +500
                  </div>
                </div>
                <h3 className="text-lg font-bold text-foreground">Transform Your Exams with AI</h3>
              </div>
              <Link to="/auth" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                Try AI Question Generator →
              </Link>
            </motion.div>

            {/* AI evaluation card */}
            <motion.div
              variants={fadeUp}
              className="relative rounded-3xl overflow-hidden group"
            >
              <img
                src="https://images.unsplash.com/photo-1597743622436-c6b5661731e0?w=600&h=400&fit=crop&q=80"
                alt="Classroom"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-charcoal/10" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-lg font-bold text-white">AI-Powered Evaluation</h3>
                <p className="mt-1 text-sm text-white/70">Every answer graded with transparent rationale.</p>
              </div>
            </motion.div>

            {/* Feature highlight card */}
            <motion.div
              variants={fadeUp}
              className="relative rounded-3xl bg-charcoal p-6 flex flex-col justify-between sm:col-span-2 overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-hero-glow/10 blur-3xl rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-hero-glow" />
                  <span className="text-xs font-semibold text-hero-muted uppercase tracking-widest">AI-Powered Study Material Generator</span>
                </div>
                <h3 className="text-2xl font-bold text-charcoal-foreground">
                  Upload exams, get AI-evaluated results instantly.
                </h3>
                <p className="mt-2 text-sm text-charcoal-foreground/60 max-w-lg">
                  Generate quizzes, summaries, and comprehensive scorecards with SGPA/CGPA tracking across all subjects.
                </p>
              </div>
              <div className="relative z-10 mt-4 flex gap-3">
                <Link to="/auth">
                  <Button size="sm" className="bg-hero-fg text-hero-bg hover:bg-hero-fg/90 rounded-xl gap-1.5">
                    <Play className="h-3.5 w-3.5" />
                    Try Now
                  </Button>
                </Link>
                <Link to="/docs">
                  <Button size="sm" variant="outline" className="border-white/15 text-charcoal-foreground hover:bg-white/10 rounded-xl">
                    Learn More
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURE CARDS ===== */}
      <section className="relative px-4 py-20 sm:py-28">
        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Everything You Need
            </motion.div>
            <h2 className="text-3xl sm:text-5xl font-bold text-foreground">
              A complete examination
              <br />
              <span className="text-primary">ecosystem</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              Built for fairness, transparency, and academic integrity at every step.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  variants={fadeUp}
                  className="group relative rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative z-10">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-charcoal/10 group-hover:bg-charcoal group-hover:text-charcoal-foreground transition-all duration-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="px-4 py-20 sm:py-28 bg-muted/30">
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-5xl font-bold text-foreground">
              How It <span className="text-primary">Works</span>
            </h2>
            <p className="mt-3 text-muted-foreground">Simple workflow for teachers and students.</p>
          </motion.div>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create & Schedule",
                desc: "Teachers create exams with AI-generated questions and schedule them for classes.",
                icon: FileCheck,
              },
              {
                step: "02",
                title: "Monitor & Evaluate",
                desc: "Anti-cheating monitoring runs during exams. AI evaluates answers with full transparency.",
                icon: Shield,
              },
              {
                step: "03",
                title: "Review & Improve",
                desc: "Students view evaluations, file grievances if needed, and track performance analytics.",
                icon: BarChart3,
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="relative text-center"
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-charcoal text-charcoal-foreground shadow-lg">
                    <Icon className="h-7 w-7" />
                  </div>
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">Step {item.step}</span>
                  <h3 className="mt-2 text-xl font-bold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  {i < 2 && (
                    <div className="hidden sm:block absolute top-8 -right-4 w-8">
                      <ArrowRight className="h-5 w-5 text-blue-gray" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CHECKLIST / TRUST SECTION ===== */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Why Choose <span className="text-primary">FairGrade AI</span>?
            </h2>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "100% transparent AI evaluation with explanations",
              "Real-time webcam & tab-switch monitoring",
              "Structured grievance workflow for fair outcomes",
              "SGPA/CGPA scorecards with PDF download",
              "AI-powered question generation from curriculum",
              "Class-level analytics and performance trends",
              "Role-based access for teachers & students",
              "Secure, proctored exam environment",
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
              >
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-foreground">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="px-4 py-20">
        <motion.div
          className="mx-auto max-w-3xl rounded-3xl bg-charcoal p-8 text-center sm:p-14 shadow-2xl relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-40 bg-hero-glow/15 blur-3xl rounded-full" />
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-4xl font-bold text-charcoal-foreground">
              Ready to transform your
              <br />
              examination process?
            </h2>
            <p className="mt-3 text-charcoal-foreground/60 max-w-md mx-auto">
              Join educators and students using transparent AI evaluation today.
            </p>
            <Link to="/auth">
              <Button
                size="lg"
                className="mt-8 bg-hero-fg text-hero-bg hover:bg-hero-fg/90 px-10 shadow-xl rounded-xl h-12"
              >
                Create Your Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            FairGrade AI Exam System
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/docs" className="hover:text-foreground transition-colors">Documentation</Link>
            <Link to="/docs#privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/docs#anti-cheating" className="hover:text-foreground transition-colors">Anti-Cheating</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
