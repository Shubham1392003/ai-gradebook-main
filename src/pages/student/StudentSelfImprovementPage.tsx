import { useState } from "react";
import { motion } from "framer-motion";
import { generateStudyMaterial, evaluateSelfImprovementTest } from "@/lib/gemini";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, BookOpen, Send, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Question = {
  text: string;
  options: string[];
  correct_answer: string;
};

type Material = {
  summary: string;
  questions: Question[];
};

type EvaluationResult = {
  is_correct: boolean;
  ai_feedback: string;
};

const StudentSelfImprovementPage = () => {
  const { toast } = useToast();
  
  const [topic, setTopic] = useState("");
  const [loadingMaterial, setLoadingMaterial] = useState(false);
  const [material, setMaterial] = useState<Material | null>(null);
  
  // Test state
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [evaluating, setEvaluating] = useState(false);
  const [results, setResults] = useState<EvaluationResult[] | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: "Topic required", description: "Please enter a topic you want to improve on.", variant: "destructive" });
      return;
    }
    
    setLoadingMaterial(true);
    setMaterial(null);
    setAnswers({});
    setResults(null);
    
    try {
      const data = await generateStudyMaterial(topic);
      setMaterial(data as Material);
      toast({ title: "Module Ready!", description: "Read the summary and take the quick test below." });
    } catch (error) {
      toast({ title: "Generation Failed", description: (error as Error).message || "Could not generate topic.", variant: "destructive" });
    } finally {
      setLoadingMaterial(false);
    }
  };

  const handleSubmitTest = async () => {
    if (!material) return;
    
    if (Object.keys(answers).length < material.questions.length) {
      toast({ title: "Incomplete", description: "Please answer all questions before submitting.", variant: "destructive" });
      return;
    }
    
    setEvaluating(true);
    try {
      const payload = material.questions.map((q, i) => ({
        question: q.text,
        student_answer: answers[i] || "",
        correct_answer: q.correct_answer
      }));
      
      const evalData = await evaluateSelfImprovementTest(payload);
      setResults(evalData);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      toast({ title: "Test Evaluated", description: "Check out your AI feedback below!" });
    } catch (error) {
      toast({ title: "Evaluation Failed", description: (error as Error).message || "Failed to check answers.", variant: "destructive" });
    } finally {
      setEvaluating(false);
    }
  };

  const handleSelectAnswer = (qIndex: number, option: string) => {
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          Self Improvement
        </h1>
        <p className="mt-1 text-muted-foreground">Type a topic to learn about and take a quick AI-evaluated quiz.</p>
      </motion.div>

      <div className="mt-8 mb-12 glass-card p-6 border flex gap-4 items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="topic">What do you want to learn today?</Label>
          <Input 
            id="topic"
            placeholder="e.g., Photosynthesis, Newton's Laws, Machine Learning..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={loadingMaterial}
            className="h-12 text-base"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
        </div>
        <Button 
          onClick={handleGenerate} 
          disabled={loadingMaterial || !topic.trim()} 
          className="h-12 w-32 gap-2"
        >
          {loadingMaterial ? (
             <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
             <>Generate <Send className="h-4 w-4" /></>
          )}
        </Button>
      </div>

      {material && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
          
          <div className="glass-card border-primary/20 bg-primary/5 p-6 md:p-8">
            <h2 className="flex items-center gap-2 text-lg font-bold text-primary mb-4">
               <BookOpen className="h-5 w-5" /> Topic Summary
            </h2>
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
               {material.summary}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold mt-12 mb-6">Quick Test</h3>
            
            {material.questions.map((q, i) => {
               const res = results?.[i];
               
               return (
                 <motion.div 
                    key={i} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: i * 0.1 }}
                    className={`glass-card p-6 border ${res ? (res.is_correct ? 'border-success/40 bg-success/5' : 'border-destructive/40 bg-destructive/5') : ''}`}
                 >
                    <div className="flex justify-between items-start mb-4">
                       <span className="text-sm font-bold uppercase text-muted-foreground">Question {i + 1}</span>
                       {res && (
                          <Badge className={res.is_correct ? "bg-success hover:bg-success" : "bg-destructive hover:bg-destructive"}>
                             {res.is_correct ? "Correct" : "Incorrect"}
                          </Badge>
                       )}
                    </div>
                    
                    <p className="text-base font-medium mb-4">{q.text}</p>
                    
                    <RadioGroup 
                       value={answers[i] || ""} 
                       onValueChange={(val) => handleSelectAnswer(i, val)}
                       disabled={!!results}
                       className="space-y-3"
                    >
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className={`flex items-center space-x-3 space-y-0 rounded-xl border p-3 transition-colors ${answers[i] === opt ? 'bg-primary/5 border-primary/50' : 'hover:bg-muted/50'}`}>
                          <RadioGroupItem value={opt} id={`q${i}-opt${optIndex}`} />
                          <Label htmlFor={`q${i}-opt${optIndex}`} className="flex-1 cursor-pointer font-normal text-sm">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>

                    {res && (
                      <div className="mt-6 p-4 rounded-xl bg-card border flex gap-3 items-start">
                         {res.is_correct ? <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" /> : <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />}
                         <div>
                            <p className="text-sm font-semibold mb-1">AI Feedback</p>
                            <p className="text-sm text-muted-foreground">{res.ai_feedback}</p>
                         </div>
                      </div>
                    )}
                 </motion.div>
               );
            })}
          </div>
          
          {!results && (
            <div className="flex justify-end pt-4 pb-12">
               <Button onClick={handleSubmitTest} disabled={evaluating} size="lg" className="w-full sm:w-auto min-w-[200px] gap-2">
                 {evaluating ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                 ) : (
                    <>Submit Answers for AI Review <ArrowRight className="h-4 w-4" /></>
                 )}
               </Button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default StudentSelfImprovementPage;
