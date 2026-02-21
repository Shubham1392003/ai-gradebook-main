import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import {
  Plus, FileText, Clock, Users, Play, Pause, CheckCircle2, Brain,
  Eye, AlertTriangle, Trash2
} from "lucide-react";

type ExamRow = {
  id: string;
  title: string;
  subject: string;
  class_name: string;
  duration_minutes: number;
  total_marks: number;
  warning_limit: number;
  status: string;
  created_at: string;
};

type SubmissionSummary = {
  exam_id: string;
  total: number;
  terminated: number;
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-primary/10 text-primary",
  active: "bg-success/10 text-success",
  completed: "bg-charcoal/10 text-charcoal",
};

const TeacherExamsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExams = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("exams")
      .select("*")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });
    setExams((data || []) as ExamRow[]);
    setLoading(false);
  };

  useEffect(() => { loadExams(); }, [user]);



  const updateStatus = async (examId: string, newStatus: string) => {
    await supabase.from("exams").update({ status: newStatus }).eq("id", examId);
    loadExams();
    toast({ title: "Status Updated", description: `Exam is now ${newStatus}.` });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exam Management</h1>
          <p className="mt-1 text-muted-foreground">Create, schedule, and manage exams.</p>
        </div>
        <Link to="/teacher/generate">
          <Button className="gap-1.5 bg-charcoal text-charcoal-foreground hover:bg-charcoal/90">
            <Plus className="h-4 w-4" /> Create Exam
          </Button>
        </Link>
      </motion.div>

      <div className="mt-8 space-y-4">
        {exams.length === 0 ? (
          <div className="glass-card flex items-center justify-center p-12">
            <p className="text-sm text-muted-foreground">No exams yet. Create your first one!</p>
          </div>
        ) : (
          exams.map((exam, i) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-charcoal/10 shrink-0">
                    <FileText className="h-5 w-5 text-charcoal" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{exam.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {exam.subject} • {exam.class_name} • {exam.duration_minutes}min • {exam.total_marks} marks
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge className={statusColors[exam.status]}>{exam.status}</Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> {exam.warning_limit} warnings
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {exam.status === "draft" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(exam.id, "scheduled")} className="gap-1.5 text-xs">
                      <Clock className="h-3 w-3" /> Schedule
                    </Button>
                  )}
                  {exam.status === "scheduled" && (
                    <Button size="sm" onClick={() => updateStatus(exam.id, "active")} className="gap-1.5 text-xs bg-success text-success-foreground hover:bg-success/90">
                      <Play className="h-3 w-3" /> Activate
                    </Button>
                  )}
                  {exam.status === "active" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(exam.id, "completed")} className="gap-1.5 text-xs">
                      <CheckCircle2 className="h-3 w-3" /> Complete
                    </Button>
                  )}
                  <Link to={`/teacher/exam/${exam.id}/submissions`}>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                      <Eye className="h-3 w-3" /> Submissions
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeacherExamsPage;
