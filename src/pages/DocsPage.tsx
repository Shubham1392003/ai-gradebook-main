import { motion } from "framer-motion";
import {
  BookOpen, Brain, Shield, FileCheck, Eye, Lock, AlertTriangle,
  ArrowRight, CheckCircle2
} from "lucide-react";

const sections = [
  {
    id: "exams",
    icon: BookOpen,
    title: "How Exams Work",
    content: [
      "Teachers create exams using AI-assisted question generation or manual entry.",
      "Exams support MCQ, short answer, long answer, and true/false question types.",
      "Students receive scheduled exams and complete them within a timed window.",
      "Anti-cheating monitoring runs throughout the exam duration.",
      "Upon submission, AI evaluates answers and provides detailed marking rationale.",
    ],
  },
  {
    id: "ai-evaluation",
    icon: Brain,
    title: "AI Evaluation Transparency",
    content: [
      "Every answer is evaluated using advanced AI models with consistent criteria.",
      "Each evaluation includes a detailed explanation of how marks were awarded.",
      "Teachers review AI evaluations and can override marks with their own remarks.",
      "Students can view the AI's reasoning for each question's grading.",
      "This transparency ensures fairness and builds trust in automated evaluation.",
    ],
  },
  {
    id: "anti-cheating",
    icon: Shield,
    title: "Anti-Cheating Policy",
    content: [
      "Webcam monitoring detects face presence and multiple-person scenarios.",
      "Microphone monitoring flags unusual audio activity during exams.",
      "Tab switching and window blur events are tracked and logged.",
      "Inactivity detection identifies suspicious periods of no interaction.",
      "Evidence (screenshots, recordings, logs) is stored securely for teacher review.",
      "After a configurable number of warnings (default: 3), the exam is automatically terminated.",
    ],
  },
  {
    id: "grievances",
    icon: FileCheck,
    title: "Grievance Workflow",
    content: [
      "Students can file a grievance if they believe their marks are incorrect.",
      "Grievance status follows: Pending → Approved → Rechecked → Resolved.",
      "Teachers review the grievance, access the original answer and AI evaluation.",
      "If approved, the teacher manually rechecks the paper and updates marks.",
      "Students are notified of the outcome and can view updated evaluations.",
    ],
  },
  {
    id: "privacy",
    icon: Lock,
    title: "Privacy Policy",
    content: [
      "All personal data is encrypted in transit and at rest.",
      "Webcam and audio recordings are used solely for exam integrity monitoring.",
      "Evidence data is only accessible to the assigned teacher.",
      "Students can request data deletion after the retention period.",
      "We comply with data protection regulations and academic privacy standards.",
    ],
  },
  {
    id: "data-usage",
    icon: Eye,
    title: "Data Usage",
    content: [
      "Exam data is used to generate performance analytics and improvement trends.",
      "AI models process answers for evaluation but do not store personal information.",
      "Analytics data is anonymized and aggregated for class-level insights.",
      "No data is shared with third parties without explicit consent.",
      "All data handling follows strict security and access control policies.",
    ],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const DocsPage = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Documentation</h1>
        <p className="mt-3 text-muted-foreground">
          Everything you need to know about the Transparent AI Examination System.
        </p>

        {/* Table of contents */}
        <div className="mt-6 glass-card p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground uppercase tracking-wide">Contents</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <ArrowRight className="h-3 w-3" />
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="space-y-12">
        {sections.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.section
              key={s.id}
              id={s.id}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-charcoal/10">
                  <Icon className="h-5 w-5 text-charcoal" />
                </div>
                <h2 className="text-xl font-bold text-foreground">{s.title}</h2>
              </div>
              <div className="glass-card p-6">
                <ul className="space-y-3">
                  {s.content.map((item, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-foreground/80 leading-relaxed">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.section>
          );
        })}
      </div>
    </div>
  );
};

export default DocsPage;
