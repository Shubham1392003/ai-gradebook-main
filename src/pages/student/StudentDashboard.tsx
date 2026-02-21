import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, BarChart3, Shield, GraduationCap, BookOpen,
  TrendingUp, Award, Clock, ArrowRight, ChevronDown, ChevronUp
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CLASS_OPTIONS } from "@/lib/constants";
import localforage from "localforage";
import { Search, FileCheck } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({ upcoming: 0, completed: 0, avgScore: "--", grievances: 0 });
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [savingClass, setSavingClass] = useState(false);

  // Offline Evaluation States
  const [offlineResults, setOfflineResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedEvals, setExpandedEvals] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string | number) => {
    setExpandedEvals(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const fetchOfflineEvals = async () => {
      if (!user) return;
      const offlineClass = user.user_metadata?.class_name;
      const offlineRegId = user.user_metadata?.reg_number;
      
      if (!offlineClass || !offlineRegId) {
        setHasSearched(true);
        return;
      }

      try {
        const keys = await localforage.keys();
        const evalKeys = keys.filter(k => k.startsWith("offline_evaluations_"));
        let foundEvals: any[] = [];
        for (const key of evalKeys) {
          const evals: any[] = await localforage.getItem(key) || [];
          const matching = evals.filter(e => e.class_name === offlineClass && e.registration_id === offlineRegId);
          foundEvals = [...foundEvals, ...matching];
        }
        // sort by newest
        foundEvals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setOfflineResults(foundEvals);
        setHasSearched(true);
      } catch (err: any) {
        console.error(err);
        toast({ title: "Evaluation Sync Error", description: err.message, variant: "destructive" });
      }
    };
    fetchOfflineEvals();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [{ count: upCount }, { count: compCount }, { count: grvCount }] = await Promise.all([
        supabase.from("submissions").select("*", { count: "exact", head: true }).eq("student_id", user.id).eq("status", "in_progress"),
        supabase.from("submissions").select("*", { count: "exact", head: true }).eq("student_id", user.id).eq("status", "submitted"),
        supabase.from("grievances").select("*", { count: "exact", head: true }).eq("student_id", user.id).neq("status", "resolved"),
      ]);
      setStats({
        upcoming: upCount || 0,
        completed: compCount || 0,
        avgScore: "--",
        grievances: grvCount || 0,
      });
    };
    fetchStats();
  }, [user]);

  const handleUpdateClass = async () => {
    if (!newClassName.trim() || !user) return;
    setSavingClass(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { class_name: newClassName.trim() }
      });
      if (error) throw error;
      toast({ title: "Class Updated", description: `You are now in ${newClassName.trim()}.` });
      user.user_metadata.class_name = newClassName.trim();
      setIsClassDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Failed to update class", description: error.message, variant: "destructive" });
    } finally {
      setSavingClass(false);
    }
  };

  const studentClass = user?.user_metadata?.class_name || "Unassigned Class";

  const statCards = [
    { label: "In Progress", value: stats.upcoming.toString(), icon: Clock, color: "bg-primary" },
    { label: "Completed", value: stats.completed.toString(), icon: FileText, color: "bg-success" },
    { label: "Avg. Score", value: stats.avgScore, icon: BarChart3, color: "bg-charcoal" },
    { label: "Active Grievances", value: stats.grievances.toString(), icon: Shield, color: "bg-warning" },
  ];

  const quickActions = [
    { label: "My Exams", icon: BookOpen, to: "/student/exams", desc: "View and take scheduled exams" },
    { label: "Scorecards", icon: Award, to: "/student/scorecards", desc: "Download SGPA/CGPA reports" },
    { label: "Grievances", icon: Shield, to: "/student/grievances", desc: "Appeal evaluation results" },
    { label: "Analytics", icon: TrendingUp, to: "/student/analytics", desc: "Your performance trends" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, <span className="text-primary">{user?.user_metadata?.full_name || "Student"}</span>
          </h1>
          <p className="mt-1 text-muted-foreground flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            {studentClass}
            <button
              onClick={() => {
                setNewClassName(user?.user_metadata?.class_name || "");
                setIsClassDialogOpen(true);
              }}
              className="text-primary text-xs hover:underline"
            >
              (Edit)
            </button>
          </p>
        </div>
      </motion.div>

      {/* Stats */}
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

      {/* Quick actions */}
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

      {/* Offline Paper Evaluation */}
      <motion.div
        className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm"
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center gap-2 mb-6 border-b pb-4">
          <FileCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Offline Paper Evaluation Results</h2>
        </div>
        
        {(!user?.user_metadata?.class_name || !user?.user_metadata?.reg_number) && hasSearched ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground bg-warning/10 rounded-xl border border-warning/20">
            <p className="text-sm text-center mb-2">Please update your Student Profile with your Class and Registration ID to see your offline evaluation results.</p>
          </div>
        ) : null}

        {hasSearched && offlineResults.length === 0 && (
          <div className="flex items-center justify-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            <p className="text-sm">No offline evaluation records found for this student.</p>
          </div>
        )}

        {offlineResults.length > 0 && (
          <div className="grid gap-6">
             {offlineResults.map((evalRecord, index) => {
               const recordId = evalRecord.id || index;
               const isExpanded = expandedEvals[recordId];
               return (
               <div key={recordId} className="border border-border rounded-xl p-5 bg-card/50 shadow-sm transition-all">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-border/50">
                     <div>
                       <p className="text-sm font-semibold text-foreground">Exam Result • <span className="text-muted-foreground font-normal">{new Date(evalRecord.created_at).toLocaleDateString()}</span></p>
                     </div>
                     <div className="flex items-center gap-3">
                       <div className="bg-success text-success-foreground px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                          {evalRecord.total_marks_obtained} / {evalRecord.max_marks} Marks
                       </div>
                       <Button variant="ghost" size="sm" onClick={() => toggleExpand(recordId)}>
                         {isExpanded ? "Hide Details" : "View Feedback"}
                         {isExpanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                       </Button>
                     </div>
                  </div>
                  
                  {isExpanded && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="grid gap-3 overflow-hidden">
                    <h4 className="text-sm font-semibold mb-2">Detailed AI Feedback</h4>
                    {evalRecord.evaluation_results.map((res: any, idx: number) => (
                      <div key={idx} className="bg-muted/30 border border-border/50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-xs font-bold text-muted-foreground uppercase">Q{idx + 1}</span>
                           <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded">
                             {res.marks_obtained} marks
                           </span>
                        </div>
                        <p className="text-sm font-medium text-foreground mb-2">{res.question_text}</p>
                        <p className="text-xs bg-card border rounded p-3 text-muted-foreground leading-relaxed">
                          <strong className="text-foreground">Feedback:</strong> {res.ai_explanation}
                        </p>
                      </div>
                    ))}
                  </motion.div>
                  )}
               </div>
             )})}
          </div>
        )}
      </motion.div>
      <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Your Class</DialogTitle>
            <DialogDescription>
              Enter the exact class name provided by your teacher (e.g. 10th Grade, Section A).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="class-name">Class Name</Label>
              <Select value={newClassName} onValueChange={setNewClassName}>
                <SelectTrigger id="class-name">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_OPTIONS.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClassDialogOpen(false)} disabled={savingClass}>
              Cancel
            </Button>
            <Button onClick={handleUpdateClass} disabled={savingClass || !newClassName.trim()}>
              {savingClass ? "Saving..." : "Save Class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDashboard;
