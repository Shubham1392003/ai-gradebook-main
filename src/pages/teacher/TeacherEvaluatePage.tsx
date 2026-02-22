import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BrainCircuit, CheckCircle2, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { evaluateSubmissionWithGemini } from "@/lib/gemini";

type Question = {
  id: string;
  question_text: string;
  question_type: string;
  options: any;
  correct_answer: string;
  marks: number;
  order_index: number;
};

type Evaluation = {
  id?: string;
  marks_obtained: number;
  ai_explanation: string;
  is_ai_evaluated: boolean;
};

const TeacherEvaluatePage = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [submission, setSubmission] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({});
  const [loading, setLoading] = useState(true);
  const [evaluatingAll, setEvaluatingAll] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!submissionId) return;

      const { data: subData } = await supabase
        .from("submissions")
        .select("*, exams(id, title, total_marks)")
        .eq("id", submissionId)
        .single();
        
      if (!subData) {
        navigate("/teacher/exams");
        return;
      }
      setSubmission(subData);

      const { data: qData } = await supabase
        .from("questions")
        .select("*")
        .eq("exam_id", subData.exam_id)
        .order("order_index");
      setQuestions((qData || []) as Question[]);

      const { data: evalData } = await supabase
        .from("evaluations")
        .select("*")
        .eq("submission_id", submissionId);
        
      const evalMap: Record<string, Evaluation> = {};
      (evalData || []).forEach((e) => {
        evalMap[e.question_id] = { ...e };
      });
      setEvaluations(evalMap);
      
      setLoading(false);
    };
    load();
  }, [submissionId, navigate]);

  const handleEvaluateOne = async (q: Question, silent = false): Promise<boolean> => {
    try {
      const studentAnswer = submission.answers?.[q.id] || "No Answer Available";
      const result = await evaluateSubmissionWithGemini(
        q.question_text,
        q.correct_answer || "N/A",
        Array.isArray(studentAnswer) ? JSON.stringify(studentAnswer) : studentAnswer,
        q.marks,
        q.question_type === 'true_false' ? 'msq' : q.question_type === 'long_answer' ? 'theory' : q.question_type
      );
      
      const newEval = {
        submission_id: submissionId,
        question_id: q.id,
        marks_obtained: result.marks_obtained,
        ai_explanation: result.ai_explanation,
        is_ai_evaluated: true
      };

      const { data, error } = evaluations[q.id] 
        ? await supabase.from("evaluations").update(newEval).eq("id", evaluations[q.id].id).select().single()
        : await supabase.from("evaluations").insert(newEval).select().single();

      if (error) throw error;

      setEvaluations(prev => ({ ...prev, [q.id]: data }));
      if (!silent) toast({ title: "Evaluation Complete", description: "The answer was successfully assessed." });
      return true;
    } catch (err: any) {
      if (!silent) toast({ title: "Evaluation Error", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const handleEvaluateAll = async () => {
    setEvaluatingAll(true);
    let successCount = 0;
    let evaluatedThisRun = 0;
    try {
      const pendingQuestions = questions.filter(q => !evaluations[q.id]);

      if (pendingQuestions.length === 0) {
        toast({ title: "No Action Needed", description: "All questions are already evaluated." });
        return;
      }

      toast({ title: "Bulk Evaluation Started", description: "Evaluating questions one by one. This will take some time to prevent API rate limits..." });

      for (const q of pendingQuestions) {
        if (evaluatedThisRun > 0) {
          // Wait 4 seconds between API calls to prevent Gemini 15 RPM Free Tier Limits
          await new Promise(resolve => setTimeout(resolve, 4000));
        }

        const success = await handleEvaluateOne(q, true);
        if (success) successCount++;
        evaluatedThisRun++;
      }

      if (successCount > 0) {
        toast({ title: "Bulk Evaluation Complete", description: `Evaluated ${successCount} questions successfully.` });
      } else {
        toast({ title: "Evaluation Stopped", description: "Encountered persistent API errors. Try again later.", variant: "destructive" });
      }
    } finally {
      setEvaluatingAll(false);
    }
  };

  const handleUpdateMarks = async (q: Question, newMarks: number) => {
    try {
      if (newMarks < 0 || newMarks > q.marks) {
         toast({ title: "Invalid Marks", description: `Marks must be between 0 and ${q.marks}`, variant: "destructive" });
         return;
      }
      const evalData = evaluations[q.id];
      if (!evalData || !evalData.id) return;
      
      const { data, error } = await supabase.from("evaluations").update({ marks_obtained: newMarks, is_teacher_reviewed: true }).eq("id", evalData.id).select().single();
      if (error) throw error;
      setEvaluations(prev => ({ ...prev, [q.id]: data }));
      toast({ title: "Score Updated", description: "Manual override saved successfully." });
    } catch (err: any) {
      toast({ title: "Update Error", description: err.message, variant: "destructive" });
    }
  };

  const syncTotalToScorecard = async () => {
     try {
       let totalObtained = 0;
       Object.values(evaluations).forEach(e => { totalObtained += Number(e.marks_obtained); });
       const totalMarks = submission.exams.total_marks;
       const percentage = (totalObtained / totalMarks) * 100;

       const { error } = await supabase.from("scorecards").upsert({
         student_id: submission.student_id,
         exam_id: submission.exam_id,
         total_marks_obtained: totalObtained,
         total_marks: totalMarks,
         percentage,
       }, { onConflict: "student_id, exam_id" });

       if (error) throw error;
       toast({ title: "Scorecard Synced", description: "Final scores have been published." });
     } catch (err: any) {
       toast({ title: "Sync Failed", description: err.message || "Failed to save final score.", variant: "destructive" });
     }
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Evaluate Submission</h1>
          <p className="text-muted-foreground">{submission.exams?.title} • AI Assistance</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleEvaluateAll} disabled={evaluatingAll} variant="secondary" className="gap-2">
            {evaluatingAll ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <BrainCircuit className="h-4 w-4" />}
            {evaluatingAll ? "Evaluating..." : "Evaluate All"}
          </Button>
          <Button onClick={syncTotalToScorecard} variant="outline" className="gap-2 bg-success text-success-foreground hover:bg-success/90 border-0">
            <CheckCircle2 className="h-4 w-4" /> Save Final Scorecard
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, i) => {
          const evalData = evaluations[q.id];
          const studentAnswer = submission.answers?.[q.id];
          
          return (
            <motion.div key={q.id} className="glass-card p-6 border">
              <div className="flex justify-between">
                <span className="text-xs font-bold uppercase text-muted-foreground mb-1 block">
                  Question {i + 1} ({q.question_type === 'true_false' ? 'msq' : q.question_type === 'long_answer' ? 'theory' : q.question_type})
                </span>
                <span className="text-sm font-semibold">{q.marks} Marks</span>
              </div>
              <p className="text-base font-medium">{q.question_text}</p>
              
              <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs font-semibold text-primary/80 mb-1">Student's Answer:</p>
                <p className="text-sm">
                   {Array.isArray(studentAnswer) ? studentAnswer.join(", ") : (studentAnswer || <span className="text-muted-foreground italic">No Answer</span>)}
                </p>
              </div>
              
              <div className="mt-3 p-3 rounded-lg bg-card border">
                 <p className="text-xs font-semibold text-muted-foreground mb-1">Correct / Model Answer:</p>
                 <p className="text-sm">{q.correct_answer || "N/A"}</p>
              </div>

              {evalData ? (
                <div className="mt-4">
                  <div className="flex flex-wrap items-center gap-4 mb-2">
                    <Badge className="bg-success text-success-foreground">
                      AI Suggested: {evalData.marks_obtained} / {q.marks}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">Final Marks:</span>
                      <Input 
                         type="number" 
                         min={0}
                         max={q.marks}
                         className="h-7 w-16 text-xs text-center border-charcoal/30 bg-card focus-visible:ring-charcoal/40" 
                         defaultValue={evalData.marks_obtained}
                         onBlur={(e) => handleUpdateMarks(q, Number(e.target.value))}
                      />
                      <span className="text-xs font-semibold text-muted-foreground">/ {q.marks}</span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground bg-charcoal/5 p-3 rounded-xl">
                     <strong>AI Explanation:</strong> {evalData.ai_explanation}
                  </p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => handleEvaluateOne(q)}>
                     Re-evaluate with AI
                  </Button>
                </div>
              ) : (
                <div className="mt-4">
                  <Button onClick={() => handleEvaluateOne(q)} className="gap-2" size="sm">
                     <BrainCircuit className="h-4 w-4" /> Evaluate with AI
                  </Button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
export default TeacherEvaluatePage;
