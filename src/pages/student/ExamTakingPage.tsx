import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAntiCheat } from "@/hooks/useAntiCheat";
import WebcamMonitor from "@/components/exam/WebcamMonitor";
import WarningOverlay from "@/components/exam/WarningOverlay";
import ActivityLog from "@/components/exam/ActivityLog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Clock, Send, AlertTriangle, ChevronLeft, ChevronRight, Shield, Camera
} from "lucide-react";

type Question = {
  id: string;
  question_text: string;
  question_type: string;
  options: any;
  marks: number;
  order_index: number;
};

type Exam = {
  id: string;
  title: string;
  subject: string;
  duration_minutes: number;
  total_marks: number;
  warning_limit: number;
};

const ExamTakingPage = () => {
  const { examId } = useParams<{ examId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submissionId, setSubmissionId] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTerminated, setIsTerminated] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [lastEvent, setLastEvent] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  // Anti-cheat
  const handleWarning = useCallback((count: number, eventType: string) => {
    setLastEvent(eventType);
    setShowWarning(true);
  }, []);

  const handleTerminate = useCallback(async () => {
    setIsTerminated(true);
    setShowWarning(false);
    if (submissionId) {
      await supabase.from("submissions").update({
        status: "terminated",
        is_terminated: true,
        submitted_at: new Date().toISOString(),
        answers,
      }).eq("id", submissionId);
    }
    toast({
      title: "Exam Terminated",
      description: "Your exam has been terminated due to excessive violations.",
      variant: "destructive",
    });
  }, [submissionId, answers, toast]);

  const captureEvidenceRef = useRef<() => Promise<string | null>>();

  const { warningCount, events, logEvent } = useAntiCheat({
    submissionId,
    studentId: user?.id || "",
    warningLimit: exam?.warning_limit || 3,
    enabled: !!submissionId && !isTerminated && !isSubmitted,
    onWarning: handleWarning,
    onTerminate: handleTerminate,
    captureEvidence: async () => captureEvidenceRef.current ? await captureEvidenceRef.current() : null,
  });

  const handleWebcamWarning = useCallback((desc: string, eventType?: string) => {
    logEvent({ event_type: eventType || "webcam_warning", description: desc }, true);
  }, [logEvent]);

  const handleCaptureReady = useCallback((fn: () => Promise<string | null>) => {
    captureEvidenceRef.current = fn;
  }, []);

  // Load exam and create submission
  useEffect(() => {
    const init = async () => {
      if (!examId || !user) return;

      // Fetch exam
      const { data: examData } = await supabase
        .from("exams")
        .select("*")
        .eq("id", examId)
        .single();
      if (!examData) { navigate("/student/exams"); return; }
      setExam(examData as Exam);
      setTimeLeft(examData.duration_minutes * 60);

      // Fetch questions
      const { data: qData } = await supabase
        .from("questions")
        .select("*")
        .eq("exam_id", examId)
        .order("order_index");
      setQuestions((qData || []) as Question[]);

      // Check existing submission
      const { data: existingSub } = await supabase
        .from("submissions")
        .select("*")
        .eq("exam_id", examId)
        .eq("student_id", user.id)
        .maybeSingle();

      if (existingSub) {
        if (existingSub.status !== "in_progress") {
          setIsSubmitted(true);
          setSubmissionId(existingSub.id);
          setAnswers((existingSub.answers && typeof existingSub.answers === 'object' && !Array.isArray(existingSub.answers)) ? existingSub.answers as Record<string, string> : {});
          setLoading(false);
          return;
        }
        setSubmissionId(existingSub.id);
        setAnswers((existingSub.answers && typeof existingSub.answers === 'object' && !Array.isArray(existingSub.answers)) ? existingSub.answers as Record<string, string> : {});
      } else {
        // Create new submission
        const { data: newSub } = await supabase
          .from("submissions")
          .insert({
            exam_id: examId,
            student_id: user.id,
            status: "in_progress",
            answers: {
                __metadata: {
                    full_name: user?.user_metadata?.full_name || "Student",
                    reg_number: user?.user_metadata?.reg_number || "N/A",
                    class_name: user?.user_metadata?.class_name || "N/A"
                }
            }
          })
          .select()
          .single();
        if (newSub) setSubmissionId(newSub.id);
      }
      setLoading(false);
    };
    init();
  }, [examId, user, navigate]);

  // Timer
  useEffect(() => {
    if (!hasStarted || isTerminated || isSubmitted || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isTerminated, isSubmitted, timeLeft]);

  // Auto-save answers periodically
  useEffect(() => {
    if (!submissionId || isTerminated || isSubmitted) return;
    const save = setInterval(() => {
      supabase.from("submissions").update({ answers }).eq("id", submissionId);
    }, 15000);
    return () => clearInterval(save);
  }, [submissionId, answers, isTerminated, isSubmitted]);

  const handleSubmit = async () => {
    if (!submissionId) return;
    await supabase.from("submissions").update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      answers,
    }).eq("id", submissionId);
    setIsSubmitted(true);
    toast({ title: "Exam Submitted", description: "Your answers have been recorded successfully." });
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hasStarted && !isTerminated && !isSubmitted && questions.length > 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Camera className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Camera Permission Required</h1>
          <p className="mt-4 text-muted-foreground">
            Before starting the exam, you need to provide camera and microphone permissions for securing the exam environment.
          </p>
          <Button 
            onClick={async () => {
              try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                // We briefly stop the stream here so WebcamMonitor can initialize it normally.
                stream.getTracks().forEach(t => t.stop());
                setHasStarted(true);
              } catch (e) {
                toast({ title: "Permission Denied", description: "Camera and microphone access is required to take this exam.", variant: "destructive" });
              }
            }} 
            className="mt-6 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Camera className="h-4 w-4" />
            Grant Permissions & Start Exam
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isTerminated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Exam Terminated</h1>
          <p className="mt-2 text-muted-foreground">
            Your exam was terminated after {warningCount} warnings. Your teacher has been notified and will review the evidence.
          </p>
          <Button onClick={() => navigate("/student")} className="mt-6">
            Return to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
            <Shield className="h-10 w-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Exam Submitted</h1>
          <p className="mt-2 text-muted-foreground">
            Your answers have been recorded. Results will be available after evaluation.
          </p>
          <Button onClick={() => navigate("/student")} className="mt-6">
            Return to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  if (questions.length === 0 && !loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-warning/10">
            <AlertTriangle className="h-10 w-10 text-warning" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Exam Not Active</h1>
          <p className="mt-2 text-muted-foreground">
            This exam has been scheduled, but the questions have not been made available yet due to database privacy rules. 
            Please ask your Teacher to click <b>"Activate Exam"</b> in the Teacher portal.
          </p>
          <Button onClick={() => navigate("/student")} className="mt-6">
            Return to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div className="min-h-screen bg-background">
      {/* Warning overlay */}
      <WarningOverlay
        show={showWarning}
        warningCount={warningCount}
        warningLimit={exam?.warning_limit || 3}
        eventType={lastEvent}
        onDismiss={() => setShowWarning(false)}
      />

      {/* Top bar */}
      <div className="sticky top-16 z-40 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-sm font-bold text-foreground">{exam?.title}</h1>
            <p className="text-xs text-muted-foreground">{exam?.subject} • {questions.length} questions</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-sm font-bold ${timeLeft < 300 ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground"
              }`}>
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </div>
            <Button
              size="sm"
              onClick={handleSubmit}
              className="gap-1.5 bg-charcoal text-charcoal-foreground hover:bg-charcoal/90"
            >
              <Send className="h-3.5 w-3.5" />
              Submit
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          {/* Main exam area */}
          <div>
            {/* Question navigation dots */}
            <div className="mb-4 flex flex-wrap gap-1.5">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all ${i === currentQ
                      ? "bg-charcoal text-charcoal-foreground shadow-md"
                      : answers[questions[i]?.id]
                        ? "bg-success/10 text-success border border-success/20"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Current question */}
            {q && (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card p-6"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Question {currentQ + 1} of {questions.length} ({q.question_type === 'true_false' ? 'msq' : q.question_type === 'long_answer' ? 'theory' : q.question_type})
                  </span>
                  <span className="text-xs font-medium text-primary">{q.marks} marks</span>
                </div>
                <p className="mt-3 text-lg font-medium text-foreground leading-relaxed">
                  {q.question_text}
                </p>

                <div className="mt-6">
                  {q.question_type === "mcq" && q.options ? (
                    <RadioGroup
                      value={answers[q.id] || ""}
                      onValueChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                      className="space-y-3"
                    >
                      {(Array.isArray(q.options) ? q.options : []).map((opt: string, oi: number) => (
                        <div
                          key={oi}
                          className={`flex items-center gap-3 rounded-xl border p-4 transition-colors cursor-pointer ${answers[q.id] === opt
                              ? "border-charcoal bg-charcoal/5"
                              : "border-border hover:border-primary/30"
                            }`}
                        >
                          <RadioGroupItem value={opt} id={`opt-${oi}`} />
                          <Label htmlFor={`opt-${oi}`} className="flex-1 cursor-pointer text-sm">
                            {opt}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : q.question_type === "true_false" && q.options ? (
                    <div className="space-y-3">
                      {(Array.isArray(q.options) ? q.options : []).map((opt: string, oi: number) => {
                        let selectedOpts: string[] = [];
                        try {
                          selectedOpts = answers[q.id] ? JSON.parse(answers[q.id]) : [];
                        } catch {
                          selectedOpts = [];
                        }
                        const isChecked = selectedOpts.includes(opt);

                        return (
                          <div
                            key={oi}
                            className={`flex items-center gap-3 rounded-xl border p-4 transition-colors cursor-pointer ${isChecked ? "border-charcoal bg-charcoal/5" : "border-border hover:border-primary/30"
                              }`}
                            onClick={() => {
                              const newOpts = isChecked ? selectedOpts.filter(o => o !== opt) : [...selectedOpts, opt];
                              setAnswers(prev => ({ ...prev, [q.id]: JSON.stringify(newOpts) }));
                            }}
                          >
                            <Checkbox checked={isChecked} id={`msq-${oi}`} />
                            <Label htmlFor={`msq-${oi}`} className="flex-1 cursor-pointer text-sm">{opt}</Label>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <Textarea
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Type your answer here..."
                      rows={q.question_type === "long_answer" ? 8 : 4}
                      className="resize-none"
                    />
                  )}
                </div>

                {/* Nav buttons */}
                <div className="mt-6 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
                    disabled={currentQ === 0}
                    className="gap-1.5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setCurrentQ((p) => Math.min(questions.length - 1, p + 1))}
                    disabled={currentQ === questions.length - 1}
                    className="gap-1.5 bg-charcoal text-charcoal-foreground hover:bg-charcoal/90"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar: Webcam + Activity */}
          <div className="space-y-4">
            <WebcamMonitor
              submissionId={submissionId}
              studentId={user?.id || ""}
              enabled={!isTerminated && !isSubmitted}
              onCaptureReady={handleCaptureReady}
              onWarning={handleWebcamWarning}
            />
            <ActivityLog
              events={events}
              warningCount={warningCount}
              warningLimit={exam?.warning_limit || 3}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamTakingPage;
