import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Settings, Sparkles, FileText, CheckCircle2, Loader2,
  BookOpen, Zap, ArrowRight, PlusCircle, Trash2
} from "lucide-react";

type GeneratedQuestion = {
  question_text: string;
  question_type: string;
  options?: string[];
  correct_answer: string;
  marks: number;
};

const gradeOptions = ["Class 8", "Class 10", "Class 12", "Undergraduate", "Postgraduate"];
const typeOptions = [
  { value: "mcq", label: "MCQ" },
  { value: "true_false", label: "True/False" },
  { value: "short_answer", label: "Short Answer" },
  { value: "long_answer", label: "Long Answer" },
];

const AIQuestionGeneratorPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [gradeLevel, setGradeLevel] = useState("Undergraduate");
  const [questionType, setQuestionType] = useState("mcq");
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [saving, setSaving] = useState(false);

  // Exam metadata for saving
  const [examTitle, setExamTitle] = useState("");
  const [className, setClassName] = useState("");
  const [duration, setDuration] = useState(60);

  const handleGenerate = async () => {
    if (!subject || !topic) {
      toast({ title: "Missing fields", description: "Please fill in subject and topic.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-questions", {
        body: { subject, topic, gradeLevel, questionType, count },
      });
      if (error) throw error;
      setQuestions(data.questions || []);
      if (data.questions?.length) {
        toast({ title: "Questions Generated!", description: `${data.questions.length} questions ready for review.` });
      }
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAsExam = async () => {
    if (!examTitle || !className || !questions.length) {
      toast({ title: "Missing info", description: "Please provide exam title, class name, and generate questions.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: exam, error: examErr } = await supabase.from("exams").insert({
        title: examTitle,
        subject,
        class_name: className,
        teacher_id: user!.id,
        duration_minutes: duration,
        total_marks: questions.reduce((sum, q) => sum + q.marks, 0),
        status: "draft",
      }).select().single();
      if (examErr) throw examErr;

      const qInserts = questions.map((q, i) => ({
        exam_id: exam.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options || null,
        correct_answer: q.correct_answer,
        marks: q.marks,
        order_index: i,
      }));
      const { error: qErr } = await supabase.from("questions").insert(qInserts);
      if (qErr) throw qErr;

      toast({ title: "Exam Created!", description: "Exam saved as draft with generated questions." });
      navigate("/teacher/exams");
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">
          <span className="text-primary">AI</span> Question Generator
        </h1>
        <p className="mt-1 text-muted-foreground">
          Generate comprehensive, curriculum-aligned exam questions using AI
        </p>
      </motion.div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Config Panel (Stitch-style) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* Configuration */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Configuration</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Grade Level</Label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {gradeOptions.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGradeLevel(g)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                        gradeLevel === g
                          ? "bg-charcoal text-charcoal-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Question Type</Label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {typeOptions.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setQuestionType(t.value)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                        questionType === t.value
                          ? "bg-charcoal text-charcoal-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="subject" className="text-xs text-muted-foreground">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Mathematics, Physics"
                  className="mt-1.5 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="topic" className="text-xs text-muted-foreground">Topic / Lesson Title</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Photosynthesis, Quadratic Equations"
                  className="mt-1.5 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Number of Questions: {count}</Label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="mt-1.5 w-full accent-charcoal"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>1</span><span>5</span><span>10</span><span>15</span><span>20</span>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full rounded-xl h-11 bg-charcoal text-charcoal-foreground hover:bg-charcoal/90 gap-2"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {generating ? "Generating..." : "Generate Questions"}
              </Button>
            </div>
          </div>

          {/* Save as Exam panel */}
          {questions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Save as Exam</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="examTitle" className="text-xs text-muted-foreground">Exam Title</Label>
                  <Input id="examTitle" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} placeholder="Midterm Exam" className="mt-1 rounded-xl" />
                </div>
                <div>
                  <Label htmlFor="className" className="text-xs text-muted-foreground">Class Name</Label>
                  <Input id="className" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="CS-101" className="mt-1 rounded-xl" />
                </div>
                <div>
                  <Label htmlFor="duration" className="text-xs text-muted-foreground">Duration (minutes)</Label>
                  <Input id="duration" type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="mt-1 rounded-xl" />
                </div>
                <Button
                  onClick={handleSaveAsExam}
                  disabled={saving}
                  className="w-full rounded-xl h-11 gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {saving ? "Saving..." : "Save & Create Exam"}
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Generated Questions Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="rounded-2xl border border-border bg-card p-6 min-h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Generated Questions</h3>
              </div>
              {questions.length > 0 && (
                <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                  {questions.length} questions
                </span>
              )}
            </div>

            <AnimatePresence mode="wait">
              {generating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-20 gap-4"
                >
                  <div className="relative">
                    <div className="h-12 w-12 rounded-2xl bg-charcoal/10 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-charcoal animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">AI is thinking...</p>
                    <p className="text-xs text-muted-foreground mt-1">Generating {count} {questionType} questions</p>
                  </div>
                </motion.div>
              ) : questions.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 gap-4"
                >
                  <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">No Questions Generated Yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Configure settings and click "Generate Questions"
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="questions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {questions.map((q, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group rounded-xl border border-border p-4 hover:border-primary/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-charcoal text-charcoal-foreground text-xs font-bold">
                              {i + 1}
                            </span>
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                              {q.question_type} • {q.marks} marks
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground mt-2">{q.question_text}</p>
                          {q.options && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {q.options.map((opt, oi) => (
                                <span
                                  key={oi}
                                  className={`text-xs px-2.5 py-1 rounded-lg ${
                                    q.correct_answer === opt
                                      ? "bg-success/10 text-success border border-success/20"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {opt}
                                </span>
                              ))}
                            </div>
                          )}
                          {q.correct_answer && !q.options && (
                            <div className="mt-2">
                              <span className="text-xs text-success flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                {q.correct_answer}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeQuestion(i)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AIQuestionGeneratorPage;
