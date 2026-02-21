import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, User, AlertTriangle, Shield, Eye, Clock, CheckCircle2, XCircle, BrainCircuit
} from "lucide-react";

type SubmissionRow = {
  id: string;
  student_id: string;
  status: string;
  warning_count: number;
  is_terminated: boolean;
  started_at: string;
  submitted_at: string | null;
};

type ProfileMap = Record<string, { full_name: string; email: string }>;

const TeacherSubmissionsPage = () => {
  const { examId } = useParams<{ examId: string }>();
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!examId) return;
      const { data: subs } = await supabase
        .from("submissions")
        .select("*")
        .eq("exam_id", examId)
        .order("started_at", { ascending: false });

      const submissions = (subs || []) as SubmissionRow[];
      setSubmissions(submissions);

      // Fetch profiles
      const studentIds = [...new Set(submissions.map((s) => s.student_id))];
      if (studentIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", studentIds);
        const map: ProfileMap = {};
        (profs || []).forEach((p: any) => { map[p.user_id] = p; });
        setProfiles(map);
      }
      setLoading(false);
    };
    load();
  }, [examId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Link to="/teacher/exams">
          <Button variant="ghost" size="sm" className="mb-4 gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Exams
          </Button>
        </Link>

        <h1 className="text-2xl font-bold text-foreground">Student Submissions</h1>
        <p className="mt-1 text-muted-foreground">{submissions.length} submissions for this exam</p>

        <div className="mt-8 space-y-3">
          {submissions.length === 0 ? (
            <div className="glass-card flex items-center justify-center p-12">
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
            </div>
          ) : (
            submissions.map((sub, i) => {
              const profile = profiles[sub.student_id];
              return (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-charcoal/10">
                      <User className="h-5 w-5 text-charcoal" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{profile?.full_name || "Unknown Student"}</p>
                      <p className="text-xs text-muted-foreground">{profile?.email || sub.student_id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className={
                      sub.is_terminated ? "bg-destructive/10 text-destructive" :
                      sub.status === "submitted" ? "bg-success/10 text-success" :
                      "bg-warning/10 text-warning"
                    }>
                      {sub.is_terminated ? <><XCircle className="h-3 w-3 mr-1" />Terminated</> :
                       sub.status === "submitted" ? <><CheckCircle2 className="h-3 w-3 mr-1" />Submitted</> :
                       <><Clock className="h-3 w-3 mr-1" />In Progress</>}
                    </Badge>
                    {sub.warning_count > 0 && (
                      <span className="flex items-center gap-1 text-xs text-destructive font-medium">
                        <AlertTriangle className="h-3 w-3" />
                        {sub.warning_count} warnings
                      </span>
                    )}
                    <Link to={`/teacher/evidence/${sub.id}`}>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                        <Eye className="h-3 w-3" /> View Evidence
                      </Button>
                    </Link>
                    <Link to={`/teacher/evaluate/${sub.id}`}>
                      <Button size="sm" className="gap-1.5 text-xs bg-charcoal text-white hover:bg-charcoal/90">
                         <BrainCircuit className="h-3 w-3" /> Evaluate
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TeacherSubmissionsPage;
