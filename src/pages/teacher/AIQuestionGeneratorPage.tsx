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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { generateQuestionsWithGemini } from "@/lib/gemini";
import { CLASS_OPTIONS } from "@/lib/constants";

type GeneratedQuestion = {
  question_text: string;
  question_type: string;
  options?: string[];
  correct_answer: string;
  marks: number;
};

const typeOptions = [
  { value: "mcq", label: "MCQ" },
  { value: "msq", label: "MSQ (Multiple Select)" },
  { value: "theory", label: "Theory Question" },
  { value: "nat", label: "NAT (Numerical)" },
  { value: "tf", label: "True / False" },
];

const AIQuestionGeneratorPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [className, setClassName] = useState(CLASS_OPTIONS[0]);
  const [questionType, setQuestionType] = useState("mcq");
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [saving, setSaving] = useState(false);

  // Exam metadata for saving
  const [examTitle, setExamTitle] = useState("");
  const [duration, setDuration] = useState(60);

  const handleGenerate = async () => {
    if (!subject || !topic || !className) {
      toast({ title: "Missing fields", description: "Please fill in subject, topic, and class name.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const generatedQuestions = await generateQuestionsWithGemini(
        subject, topic, className, questionType, count
      );
      setQuestions(generatedQuestions || []);
      if (generatedQuestions?.length) {
        toast({ title: "Questions Generated!", description: `${generatedQuestions.length} questions ready for review.` });
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

      const qInserts = questions.map((q, i) => {
        let dbType = q.question_type;
        if (dbType === "msq") dbType = "true_false";
        if (dbType === "theory") dbType = "long_answer";
        if (dbType === "tf") dbType = "mcq";
        if (dbType === "nat") dbType = "short_answer";

        return {
          exam_id: exam.id,
          question_text: q.question_text,
          question_type: dbType,
          options: q.options || null,
          correct_answer: q.correct_answer,
          marks: q.marks,
          order_index: i,
        };
      });
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

  const addManualQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question_text: "New Question...",
        question_type: questionType,
        options: questionType === "mcq" || questionType === "msq" ? ["A", "B", "C", "D"] : undefined,
        correct_answer: "A",
        marks: 2,
      },
    ]);
  };

  const updateQuestion = (idx: number, field: keyof GeneratedQuestion, value: any) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
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
                <Label className="text-xs text-muted-foreground">Class Name</Label>
                <div className="mt-1.5 flex flex-col gap-1.5">
                  <Select value={className} onValueChange={setClassName}>
                    <SelectTrigger className="w-full rounded-xl bg-card">
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
                <Label className="text-xs text-muted-foreground">Question Type</Label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {typeOptions.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setQuestionType(t.value)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${questionType === t.value
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
                <Label className="text-xs text-muted-foreground">Number of Questions</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="mt-1.5 rounded-xl w-full"
                />
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
                <Label htmlFor="duration" className="text-xs text-muted-foreground">Duration (minutes)</Label>
                <Input id="duration" type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="mt-1 rounded-xl" />
              </div>
              <Button
                onClick={handleSaveAsExam}
                disabled={saving || questions.length === 0}
                className="w-full rounded-xl h-11 gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {saving ? "Saving..." : "Save & Create Exam"}
              </Button>
              {questions.length === 0 && (
                <p className="text-[10px] text-muted-foreground text-center">
                  You must generate questions before you can save an exam.
                </p>
              )}
            </div>
          </motion.div>
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
              <div className="flex items-center gap-3">
                <Button
                  onClick={addManualQuestion}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Add Question
                </Button>
                {questions.length > 0 && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                    {questions.length} questions
                  </span>
                )}
              </div>
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
                          <Textarea
                            value={q.question_text}
                            onChange={(e) => updateQuestion(i, "question_text", e.target.value)}
                            className="mt-2 min-h-[60px] text-sm font-medium"
                          />
                          {q.options && (
                            <div className="mt-3 flex flex-col gap-2">
                              {q.options.map((opt, oi) => (
                                <div key={oi} className="flex items-center gap-2">
                                  <div className={`h-2 w-2 rounded-full ${q.correct_answer?.includes(opt) ? 'bg-success' : 'bg-muted'}`} />
                                  <Input
                                    value={opt}
                                    onChange={(e) => {
                                      const newOpts = [...q.options!];
                                      newOpts[oi] = e.target.value;
                                      updateQuestion(i, "options", newOpts);
                                    }}
                                    className="h-8 text-xs flex-1"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="mt-3">
                            <Label className="text-[10px] text-muted-foreground uppercase">Correct Answer (or Model Answer)</Label>
                            <Input
                              value={q.correct_answer}
                              onChange={(e) => updateQuestion(i, "correct_answer", e.target.value)}
                              className="mt-1 h-8 text-xs border-success/30 focus-visible:ring-success"
                            />
                          </div>
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
