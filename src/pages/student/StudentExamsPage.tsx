import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, Play, CheckCircle2, XCircle } from "lucide-react";

type ExamRow = {
  id: string;
  title: string;
  subject: string;
  class_name: string;
  duration_minutes: number;
  total_marks: number;
  status: string;
  scheduled_at: string | null;
};

type SubmissionRow = {
  exam_id: string;
  status: string;
};

const StudentExamsPage = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data: examData } = await supabase
        .from("exams")
        .select("*")
        .in("status", ["scheduled", "active", "completed"])
        .order("created_at", { ascending: false });

      setExams((examData || []) as ExamRow[]);

      const { data: subData } = await supabase
        .from("submissions")
        .select("exam_id, status")
        .eq("student_id", user.id);

      const subMap: Record<string, string> = {};
      (subData || []).forEach((s: SubmissionRow) => { subMap[s.exam_id] = s.status; });
      setSubmissions(subMap);
      setLoading(false);
    };
    load();
  }, [user]);

  const statusBadge = (examStatus: string, subStatus?: string) => {
    if (subStatus === "submitted") return <Badge className="bg-success/10 text-success border-success/20">Submitted</Badge>;
    if (subStatus === "terminated") return <Badge variant="destructive">Terminated</Badge>;
    if (subStatus === "in_progress") return <Badge className="bg-warning/10 text-warning border-warning/20">In Progress</Badge>;
    if (examStatus === "active") return <Badge className="bg-primary/10 text-primary border-primary/20">Active</Badge>;
    if (examStatus === "scheduled") return <Badge className="bg-muted text-muted-foreground">Scheduled</Badge>;
    return <Badge variant="outline">Completed</Badge>;
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-foreground">My Exams</h1>
        <p className="mt-1 text-muted-foreground">View and take your scheduled exams.</p>
      </motion.div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {exams.length === 0 ? (
          <div className="col-span-full glass-card flex items-center justify-center p-12">
            <p className="text-sm text-muted-foreground">No exams available yet.</p>
          </div>
        ) : (
          exams.map((exam, i) => {
            const subStatus = submissions[exam.id];
            const canTake = exam.status === "active" && (!subStatus || subStatus === "in_progress");
            return (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-charcoal/10">
                    <FileText className="h-5 w-5 text-charcoal" />
                  </div>
                  {statusBadge(exam.status, subStatus)}
                </div>
                <h3 className="font-semibold text-foreground">{exam.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{exam.subject} • {exam.class_name}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{exam.duration_minutes} min</span>
                  <span>{exam.total_marks} marks</span>
                </div>
                <div className="mt-auto pt-4">
                  {canTake ? (
                    <Link to={`/student/exam/${exam.id}`}>
                      <Button size="sm" className="w-full gap-1.5 bg-charcoal text-charcoal-foreground hover:bg-charcoal/90">
                        <Play className="h-3.5 w-3.5" />
                        {subStatus === "in_progress" ? "Continue Exam" : "Start Exam"}
                      </Button>
                    </Link>
                  ) : subStatus === "submitted" ? (
                    <div className="flex items-center gap-1.5 text-xs text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Completed
                    </div>
                  ) : subStatus === "terminated" ? (
                    <div className="flex items-center gap-1.5 text-xs text-destructive">
                      <XCircle className="h-3.5 w-3.5" />
                      Terminated
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not yet available</p>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentExamsPage;
