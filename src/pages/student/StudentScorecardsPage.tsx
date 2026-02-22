import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Award, FileText, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export const StudentScorecardsPage = () => {
  const { user } = useAuth();
  const [scorecards, setScorecards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScorecards = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("scorecards")
        .select(`
          *,
          exams (
            title,
            subject,
            created_at
          )
        `)
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching scorecards:", error);
      } else {
        setScorecards(data || []);
      }
      setLoading(false);
    };

    fetchScorecards();
  }, [user]);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" />
          My Scorecards
        </h1>
        <p className="mt-1 text-muted-foreground">View and download your final exam scorecards.</p>
      </motion.div>

      <div className="mt-8">
        {scorecards.length === 0 ? (
          <motion.div
            className="glass-card flex items-center justify-center p-12"
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground font-medium">No scorecards available yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Your teacher hasn't published any final scores for your exams.</p>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {scorecards.map((scorecard, index) => (
              <motion.div
                key={scorecard.id}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                transition={{ delay: index * 0.1 }}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
              >
                {/* Decorative border top */}
                <div className={`absolute top-0 left-0 w-full h-1 ${scorecard.percentage >= 80 ? 'bg-success' : scorecard.percentage >= 60 ? 'bg-warning' : 'bg-destructive'}`} />

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1" title={scorecard.exams?.title}>
                      {scorecard.exams?.title || "Unknown Exam"}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-1">
                      {scorecard.exams?.subject}
                      {scorecard.exams?.created_at && (
                        <span className="text-xs opacity-75 ml-2">
                          • {new Date(scorecard.exams.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                </div>

                <div className="bg-muted/30 rounded-xl p-4 border border-border/50 mb-5 relative overflow-hidden">
                  <div className="flex justify-between items-end relative z-10">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Marks Obtained</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">{scorecard.total_marks_obtained}</span>
                        <span className="text-sm text-muted-foreground font-semibold">/ {scorecard.total_marks}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Percentage</p>
                      <span className={`text-xl font-bold ${scorecard.percentage >= 80 ? 'text-success' : scorecard.percentage >= 60 ? 'text-warning' : 'text-destructive'}`}>
                        {Number(scorecard.percentage).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                   <Button variant="outline" className="w-full gap-2 cursor-pointer relative" onClick={() => window.print()}>
                     <Download className="h-4 w-4" /> Download
                   </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentScorecardsPage;
