import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type Question = {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  correct_answer: string;
  marks: number;
  order_index: number;
};

type Evaluation = {
  id?: string;
  marks_obtained: number;
  ai_explanation: string;
};

const StudentEvaluatedPaperPage = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [exam, setExam] = useState<Record<string, any> | null>(null);
  const [submission, setSubmission] = useState<Record<string, any> | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!examId || !user) return;

      const { data: subData } = await supabase
        .from("submissions")
        .select("*, exams(title, subject, total_marks)")
        .eq("exam_id", examId)
        .eq("student_id", user.id)
        .single();
        
      if (!subData) {
        navigate("/student/exams");
        return;
      }
      setSubmission(subData);
      setExam(subData.exams);

      const { data: qData } = await supabase
        .from("questions")
        .select("*")
        .eq("exam_id", examId)
        .order("order_index");
      setQuestions((qData || []) as Question[]);

      const { data: evalData } = await supabase
        .from("evaluations")
        .select("*")
        .eq("submission_id", subData.id);
        
      const evalMap: Record<string, Evaluation> = {};
      (evalData || []).forEach((e: Record<string, unknown>) => {
        evalMap[e.question_id as string] = { ...(e as any) };
      });
      setEvaluations(evalMap);
      
      setLoading(false);
    };
    load();
  }, [examId, user, navigate]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back to Scorecards
      </Button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Evaluated Paper</h1>
          <p className="text-muted-foreground">{exam?.title as string} • {exam?.subject as string}</p>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, i) => {
          const evalData = evaluations[q.id];
          const studentAnswer = submission?.answers?.[q.id];
          
          return (
            <motion.div key={q.id} className="glass-card p-6 border transition-all">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase text-muted-foreground">
                  Question {i + 1} ({q.question_type === 'true_false' ? 'msq' : q.question_type === 'long_answer' ? 'theory' : q.question_type})
                </span>
                <div className="flex items-center gap-2">
                  {evalData && (
                    <Badge className="bg-success/10 text-success border-success/20">
                       Score: {evalData.marks_obtained} / {q.marks}
                    </Badge>
                  )}
                  {!evalData && (
                    <span className="text-sm font-semibold text-muted-foreground">{q.marks} Marks Max</span>
                  )}
                </div>
              </div>
              <p className="text-base font-medium">{q.question_text}</p>
              
              <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20 text-primary-foreground">
                <p className="text-xs font-semibold text-primary/80 mb-1">Your Answer:</p>
                <p className="text-sm text-foreground font-medium">
                   {Array.isArray(studentAnswer) ? studentAnswer.join(", ") : (studentAnswer || <span className="text-muted-foreground italic">No Answer Provided</span>)}
                </p>
              </div>
              
              <div className="mt-3 p-4 rounded-xl bg-card border">
                 <p className="text-xs font-semibold text-muted-foreground mb-1">Correct Answer Key:</p>
                 <p className="text-sm font-medium">{q.correct_answer || "N/A"}</p>
              </div>

              {evalData ? (
                <div className="mt-5 p-4 rounded-xl bg-muted/30 border">
                  <h4 className="flex items-center gap-2 text-sm font-semibold mb-2">
                     <CheckCircle2 className="h-4 w-4 text-success" />
                     Feedback & Explanation
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                     {evalData.ai_explanation}
                  </p>
                </div>
              ) : (
                 <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning-foreground text-sm font-medium">
                    This question is still pending evaluation.
                 </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
export default StudentEvaluatedPaperPage;
