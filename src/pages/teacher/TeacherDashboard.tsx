import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, Users, BarChart3, Shield, PlusCircle, ClipboardCheck,
  AlertTriangle, TrendingUp, ArrowRight, Loader2, Upload, FileCheck, CheckCircle2, Settings, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CLASS_OPTIONS } from "@/lib/constants";
import { extractOfflineQuestions, evaluateOfflineAnswerSheet } from "@/lib/gemini";
import localforage from "localforage";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const TeacherDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({ exams: 0, submissions: 0, grievances: 0, avgScore: "--" });
  
  // Offline Evaluation State
  const [className, setClassName] = useState<string>("");
  const [registrationId, setRegistrationId] = useState("");
  const [questionPdf, setQuestionPdf] = useState<File | null>(null);
  const [answerPdf, setAnswerPdf] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState<any[]>([]);
  const [evaluationResults, setEvaluationResults] = useState<any[]>([]);

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "question" | "answer") => {
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].type !== "application/pdf") {
        toast({ title: "Invalid file", description: "Please upload a PDF file", variant: "destructive" });
        return;
      }
      if (type === "question") setQuestionPdf(e.target.files[0]);
      if (type === "answer") setAnswerPdf(e.target.files[0]);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
  };

  const processQuestionPaper = async () => {
    if (!className || !registrationId || !questionPdf) {
      toast({ title: "Missing Information", description: "Please provide class, registration ID, and question paper PDF", variant: "destructive" });
      return;
    }
    setIsExtracting(true);
    try {
      const base64 = await fileToBase64(questionPdf);
      const questions = await extractOfflineQuestions(base64);
      setExtractedQuestions(questions);
      toast({ title: "Extraction Success", description: `Extracted ${questions.length} questions from the question paper.` });
    } catch (err: any) {
      toast({ title: "Extraction Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsExtracting(false);
    }
  };

  const processAnswerSheet = async () => {
    if (!answerPdf || !extractedQuestions.length) return;
    setIsEvaluating(true);
    try {
       const base64 = await fileToBase64(answerPdf);
       const results = await evaluateOfflineAnswerSheet(base64, extractedQuestions);
       setEvaluationResults(results);
       toast({ title: "Evaluation Complete", description: "Answer sheet graded successfully! Check the report to save." });
    } catch (err: any) {
       toast({ title: "Evaluation Failed", description: err.message, variant: "destructive" });
    } finally {
       setIsEvaluating(false);
    }
  };

  const saveOfflineEvaluation = async () => {
    setIsEvaluating(true);
    try {
       const totalMarksObtained = evaluationResults.reduce((sum, res) => sum + (Number(res.marks_obtained) || 0), 0);
       const maxMarks = extractedQuestions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

       // Retrieve PDF base64 contents
       const questionPaperBase64 = questionPdf ? await fileToBase64(questionPdf) : null;
       const answerSheetBase64 = answerPdf ? await fileToBase64(answerPdf) : null;

       const newEvaluation = {
          id: `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          teacher_id: user?.id,
          class_name: className,
          registration_id: registrationId,
          extracted_questions: extractedQuestions,
          evaluation_results: evaluationResults,
          total_marks_obtained: totalMarksObtained,
          max_marks: maxMarks,
          question_paper_base64: questionPaperBase64,
          answer_sheet_base64: answerSheetBase64,
          created_at: new Date().toISOString()
       };

       // Store all requirements in IndexedDB flawlessly via localforage
       const storageKey = `offline_evaluations_${user?.id || 'default'}`;
       const existingEvals: any[] = (await localforage.getItem(storageKey)) || [];
       await localforage.setItem(storageKey, [...existingEvals, newEvaluation]);

       toast({ title: "Saved Locally", description: "Offline evaluation and PDFs securely saved in your browser storage." });
       
       // Reset form
       setRegistrationId(""); setQuestionPdf(null); setAnswerPdf(null); 
       setExtractedQuestions([]); setEvaluationResults([]);
    } catch (err: any) {
       toast({ title: "Save Error", description: err.message, variant: "destructive" });
    } finally {
       setIsEvaluating(false);
    }
  };

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

      {/* Offline AI Evaluation (Replaces Recent Activity) */}
      <motion.div
        className="mt-8 rounded-2xl border border-border bg-card p-6"
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center gap-2 mb-6">
          <FileCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Offline Paper Evaluation</h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
           {/* Left side: Setup & Question Paper */}
           <div className="space-y-4 rounded-xl border p-5 bg-muted/30">
             <h3 className="font-medium mb-3 border-b pb-2">1. Setup & Question Paper</h3>
             <div>
                <Label className="text-xs text-muted-foreground">Class</Label>
                <div className="mt-1.5 flex flex-col gap-1.5">
                  <Select value={className} onValueChange={setClassName}>
                    <SelectTrigger className="w-full bg-card">
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASS_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Student Registration ID</Label>
                <Input value={registrationId} onChange={e => setRegistrationId(e.target.value)} placeholder="e.g. STU-2024-001" className="mt-1.5 bg-card" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Question Paper (PDF)</Label>
                <div className="mt-1.5 relative">
                  <Input type="file" accept="application/pdf" onChange={e => handlePdfUpload(e, "question")} className="bg-card cursor-pointer file:cursor-pointer pb-2 pt-2 h-11" />
                  <Upload className="h-4 w-4 absolute right-3 top-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <Button disabled={isExtracting || !className || !registrationId || !questionPdf} onClick={processQuestionPaper} className="w-full mt-2 gap-2">
                 {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4 hidden" />} 
                 {isExtracting ? "Extracting from AI..." : "Extract Answers Key"}
              </Button>
              {extractedQuestions.length > 0 && (
                 <div className="text-sm text-success flex items-center gap-1 mt-2 p-2 bg-success/10 rounded-lg">
                    <CheckCircle2 className="h-4 w-4" /> Successfully extracted {extractedQuestions.length} questions
                 </div>
              )}
           </div>

           {/* Right side: Answer Sheet */}
           <div className={`space-y-4 rounded-xl border p-5 transition-opacity duration-300 ${extractedQuestions.length === 0 ? "opacity-50 pointer-events-none bg-muted/10" : "bg-primary/5 border-primary/20"}`}>
             <h3 className="font-medium mb-3 border-b pb-2">2. Upload Student Answer Sheet</h3>
             {extractedQuestions.length === 0 && (
                <p className="text-xs text-muted-foreground italic mb-2">Please complete step 1 first.</p>
             )}
             <div>
                <Label className="text-xs text-muted-foreground">Handwritten/Typed Answer Paper (PDF)</Label>
                <div className="mt-1.5 relative">
                  <Input type="file" accept="application/pdf" onChange={e => handlePdfUpload(e, "answer")} className="bg-card cursor-pointer file:cursor-pointer pb-2 pt-2 h-11 border-primary/30" />
                  <Upload className="h-4 w-4 absolute right-3 top-3.5 text-muted-foreground pointer-events-none" />
                </div>
             </div>
             <Button disabled={isEvaluating || !answerPdf} onClick={processAnswerSheet} className="w-full mt-2 gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                 {isEvaluating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} 
                 {isEvaluating ? "Evaluating with AI..." : "Evaluate Answer Paper"}
              </Button>
           </div>
        </div>

        {/* Results Overview */}
        {evaluationResults.length > 0 && (
           <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Evaluation Report</h3>
              <div className="grid gap-3">
                 {evaluationResults.map((res: any, idx) => (
                    <div key={idx} className="p-4 border rounded-xl bg-card">
                       <div className="flex justify-between items-start mb-2">
                           <span className="text-xs font-bold uppercase text-muted-foreground">Q{idx + 1}</span>
                           <span className="text-sm font-semibold bg-success/20 text-success px-2 py-0.5 rounded-md text-right whitespace-nowrap">
                              {res.marks_obtained} marks
                           </span>
                       </div>
                       <p className="text-sm font-medium mb-2">{res.question_text}</p>
                       <p className="text-xs text-muted-foreground bg-muted p-3 rounded-lg border"><strong>AI Feedback:</strong> {res.ai_explanation}</p>
                    </div>
                 ))}
                 <div className="mt-4 p-4 rounded-xl bg-charcoal text-white flex justify-between items-center shadow-lg">
                    <span className="font-semibold">Total Estimated Score:</span>
                    <span className="text-xl font-bold">
                       {evaluationResults.reduce((sum, res) => sum + (Number(res.marks_obtained) || 0), 0).toFixed(1)}
                    </span>
                 </div>
                 <Button onClick={saveOfflineEvaluation} disabled={isEvaluating} className="w-full mt-2 h-11 gap-2 bg-success text-success-foreground hover:bg-success/90">
                    {isEvaluating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                    {isEvaluating ? "Saving Results..." : "Save Evaluation to Database"}
                 </Button>
              </div>
           </div>
        )}
      </motion.div>
    </div>
  );
};

export default TeacherDashboard;
