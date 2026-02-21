import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, Users, BarChart3, Shield, PlusCircle, ClipboardCheck,
  AlertTriangle, TrendingUp, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ exams: 0, submissions: 0, grievances: 0, avgScore: "--" });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [{ count: examCount }, { count: subCount }, { count: grvCount }] = await Promise.all([
        supabase.from("exams").select("*", { count: "exact", head: true }).eq("teacher_id", user.id),
        supabase.from("submissions").select("*, exams!inner(teacher_id)", { count: "exact", head: true }).eq("exams.teacher_id", user.id),
        supabase.from("grievances").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      setStats({
        exams: examCount || 0,
        submissions: subCount || 0,
        grievances: grvCount || 0,
        avgScore: "--",
      });
    };
    fetchStats();
  }, [user]);

  const statCards = [
    { label: "Total Exams", value: stats.exams.toString(), icon: FileText, color: "bg-charcoal" },
    { label: "Submissions", value: stats.submissions.toString(), icon: Users, color: "bg-primary" },
    { label: "Pending Grievances", value: stats.grievances.toString(), icon: Shield, color: "bg-warning" },
    { label: "Avg. Score", value: stats.avgScore, icon: BarChart3, color: "bg-success" },
  ];

  const quickActions = [
    { label: "Create Exam", icon: PlusCircle, to: "/teacher/exams", desc: "AI-powered question generation" },
    { label: "Evaluate", icon: ClipboardCheck, to: "/teacher/exams", desc: "Review and grade submissions" },
    { label: "Grievances", icon: AlertTriangle, to: "/teacher/grievances", desc: "Handle student appeals" },
    { label: "Analytics", icon: TrendingUp, to: "/teacher/analytics", desc: "Class performance insights" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, <span className="text-primary">Teacher</span>
        </h1>
        <p className="mt-1 text-muted-foreground">Manage your exams, evaluations, and student performance.</p>
      </motion.div>

      {/* Stats - MasterG style with colored icon backgrounds */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ delay: i * 0.08 }}
              className="group rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-3xl font-bold text-foreground">{s.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${s.color} text-white shadow-sm`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick actions - MasterG bento style */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.div
                key={a.label}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                transition={{ delay: 0.3 + i * 0.08 }}
              >
                <Link to={a.to}>
                  <div className="group rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 cursor-pointer">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-charcoal/10 group-hover:bg-charcoal group-hover:text-charcoal-foreground transition-all">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-foreground">{a.label}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{a.desc}</p>
                    <ArrowRight className="mt-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Recent activity */}
      <motion.div
        className="mt-8 rounded-2xl border border-border bg-card p-6"
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.6 }}
      >
        <h2 className="mb-4 text-lg font-semibold text-foreground">Recent Activity</h2>
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <p className="text-sm">No recent activity yet. Create your first exam to get started!</p>
        </div>
      </motion.div>
    </div>
  );
};

export default TeacherDashboard;
