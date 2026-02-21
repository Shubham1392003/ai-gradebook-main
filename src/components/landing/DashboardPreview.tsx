import { motion } from "framer-motion";
import {
  LayoutDashboard, Brain, FileText, BarChart3, Shield, Users,
  CheckCircle2, TrendingUp
} from "lucide-react";

const DashboardPreview = () => (
  <motion.div
    className="relative mx-auto mt-16 max-w-5xl px-4"
    initial={{ opacity: 0, y: 60 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay: 0.6 }}
  >
    {/* Browser chrome */}
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-400/60" />
          <div className="h-3 w-3 rounded-full bg-yellow-400/60" />
          <div className="h-3 w-3 rounded-full bg-green-400/60" />
        </div>
        <div className="ml-4 flex-1 rounded-md bg-white/5 px-3 py-1 text-xs text-hero-muted font-mono">
          fairgrade-ai.app/teacher/dashboard
        </div>
      </div>

      {/* Dashboard content */}
      <div className="flex min-h-[320px] sm:min-h-[380px]">
        {/* Sidebar */}
        <div className="hidden sm:flex w-48 flex-col border-r border-white/10 bg-white/[0.02] p-3 gap-1">
          {[
            { icon: LayoutDashboard, label: "Dashboard", active: true },
            { icon: FileText, label: "Exams" },
            { icon: Brain, label: "AI Evaluate" },
            { icon: Shield, label: "Grievances" },
            { icon: BarChart3, label: "Analytics" },
            { icon: Users, label: "Students" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                  item.active
                    ? "bg-white/10 text-hero-fg"
                    : "text-hero-muted hover:bg-white/5"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </div>
            );
          })}
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 sm:p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-hero-fg">Welcome back, Professor</h3>
            <p className="text-xs text-hero-muted">What would you like to do today?</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Total Exams", value: "24", color: "text-blue-gray" },
              { label: "Students", value: "186", color: "text-hero-fg" },
              { label: "Evaluated", value: "92%", color: "text-green-400" },
              { label: "Grievances", value: "3", color: "text-yellow-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-white/5 border border-white/5 p-3">
                <p className="text-[10px] text-hero-muted">{s.label}</p>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Action cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: Brain, label: "Create Exam with AI", desc: "Generate questions" },
              { icon: CheckCircle2, label: "Grade Submissions", desc: "AI + Manual review" },
              { icon: TrendingUp, label: "View Analytics", desc: "Class performance" },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="rounded-lg bg-white/5 border border-white/5 p-3 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Icon className="h-4 w-4 text-blue-gray mb-2" />
                  <p className="text-xs font-medium text-hero-fg">{card.label}</p>
                  <p className="text-[10px] text-hero-muted mt-0.5">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>

    {/* Glow underneath */}
    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-hero-glow/20 blur-3xl rounded-full" />
  </motion.div>
);

export default DashboardPreview;
