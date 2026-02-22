import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Clock, Play, CheckCircle2, XCircle, ShieldAlert, CalendarDays } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CLASS_OPTIONS } from "@/lib/constants";

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

type SubmissionInfo = {
  id: string;
  status: string;
  grievanceStatus?: string;
  hasScorecard: boolean;
};

const StudentExamsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, SubmissionInfo>>({});
  const [loading, setLoading] = useState(true);

  // Grievance state
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [grievanceReason, setGrievanceReason] = useState("");
  const [isSubmittingGrievance, setIsSubmittingGrievance] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Class configuration state
  const [missingClassDialog, setMissingClassDialog] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [savingClass, setSavingClass] = useState(false);

  const loadData = async () => {
    if (!user) return;

    // Check if the student has a class assigned
    const studentClass = user.user_metadata?.class_name;
    if (!studentClass) {
      setMissingClassDialog(true);
      setLoading(false);
      return;
    }

    const { data: examData } = await supabase
      .from("exams")
      .select("*")
      .in("status", ["scheduled", "active", "completed"])
      .eq("class_name", studentClass)
      .order("created_at", { ascending: false });

    setExams((examData || []) as ExamRow[]);

    const { data: subData } = await supabase
      .from("submissions")
      .select("id, exam_id, status")
      .eq("student_id", user.id);

    const { data: grievanceData } = await supabase
      .from("grievances")
      .select("submission_id, status")
      .eq("student_id", user.id);

    const grievanceMap: Record<string, string> = {};
    (grievanceData || []).forEach((g: any) => {
      grievanceMap[g.submission_id] = g.status;
    });

    const { data: scorecardData } = await supabase
      .from("scorecards")
      .select("exam_id")
      .eq("student_id", user.id);
      
    const scorecardMap: Record<string, boolean> = {};
    (scorecardData || []).forEach((sc: any) => {
      scorecardMap[sc.exam_id] = true;
    });

    const subMap: Record<string, SubmissionInfo> = {};
    (subData || []).forEach((s: any) => {
      subMap[s.exam_id] = {
        id: s.id,
        status: s.status,
        grievanceStatus: grievanceMap[s.id],
        hasScorecard: scorecardMap[s.exam_id] || false
      };
    });
    setSubmissions(subMap);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const statusBadge = (examStatus: string, subStatus?: string) => {
    if (subStatus === "submitted") return <Badge className="bg-success/10 text-success border-success/20">Submitted</Badge>;
    if (subStatus === "terminated") return <Badge variant="destructive">Terminated</Badge>;
    if (subStatus === "in_progress") return <Badge className="bg-warning/10 text-warning border-warning/20">In Progress</Badge>;
    if (examStatus === "active") return <Badge className="bg-primary/10 text-primary border-primary/20">Active</Badge>;
    if (examStatus === "scheduled") return <Badge className="bg-muted text-muted-foreground">Scheduled</Badge>;
    return <Badge variant="outline">Completed</Badge>;
  };

  const handleApplyGrievance = async () => {
    if (!selectedSubmissionId || !grievanceReason.trim() || !user) {
      toast({
        title: "Reason required",
        description: "Please explain your grievance clearly before applying.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingGrievance(true);
    try {
      const { error } = await supabase
        .from("grievances")
        .insert({
          student_id: user.id,
          submission_id: selectedSubmissionId,
          reason: grievanceReason,
          status: "pending"
        });

      if (error) throw error;

      toast({
        title: "Grievance applied",
        description: "Your grievance has been submitted successfully to the teacher."
      });

      setIsDialogOpen(false);
      setGrievanceReason("");
      setSelectedSubmissionId(null);

      loadData();
    } catch (error: any) {
      toast({
        title: "Failed to apply grievance",
        description: error.message || "Something went wrong.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingGrievance(false);
    }
  };

  const openGrievanceDialog = (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    setGrievanceReason("");
    setIsDialogOpen(true);
  };

  const handleSaveClass = async () => {
    if (!newClassName.trim() || !user) return;

    setSavingClass(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { class_name: newClassName.trim() }
      });

      if (error) throw error;

      toast({
        title: "Class updated",
        description: `You are now enrolled in ${newClassName.trim()}.`,
      });

      setMissingClassDialog(false);
      setLoading(true);

      // Update local user object manually if needed or just reload data
      user.user_metadata.class_name = newClassName.trim();
      loadData();
    } catch (error: any) {
      toast({
        title: "Failed to update class",
        description: error.message || "An error occurred.",
        variant: "destructive"
      });
    } finally {
      setSavingClass(false);
    }
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
            const subInfo = submissions[exam.id];
            const subStatus = subInfo?.status;
            const grievanceStatus = subInfo?.grievanceStatus;

            const isLive = exam.status === "active" || (exam.status === "scheduled" && exam.scheduled_at && new Date(exam.scheduled_at).getTime() <= Date.now());
            const displayStatus = isLive && exam.status !== "completed" ? "active" : exam.status;

            const canTake = displayStatus === "active" && (!subStatus || subStatus === "in_progress");

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
                  {statusBadge(displayStatus, subStatus)}
                </div>
                <h3 className="font-semibold text-foreground">{exam.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{exam.subject} • {exam.class_name}</p>
                {exam.scheduled_at && (
                  <p className="text-xs text-primary font-medium mt-1.5 flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Scheduled: {new Date(exam.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{exam.duration_minutes} min</span>
                  <span>{exam.total_marks} marks</span>
                </div>
                <div className="mt-auto pt-4 flex items-center justify-between">
                  {canTake ? (
                    <Link to={`/student/exam/${exam.id}`} className="w-full">
                      <Button size="sm" className="w-full gap-1.5 bg-charcoal text-charcoal-foreground hover:bg-charcoal/90">
                        <Play className="h-3.5 w-3.5" />
                        {subStatus === "in_progress" ? "Continue Exam" : "Start Exam"}
                      </Button>
                    </Link>
                  ) : subStatus === "submitted" ? (
                    <div className="w-full flex flex-col gap-2">
                       <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="flex items-center gap-1.5 text-success">
                             <CheckCircle2 className="h-3.5 w-3.5" />
                             Completed
                          </span>
                          {subInfo.hasScorecard ? (
                             <Badge className="bg-success text-success-foreground border-success text-[10px] py-0">Score Published</Badge>
                          ) : (
                             <Badge variant="outline" className="text-muted-foreground bg-muted/20 text-[10px] py-0 border-dashed">Pending Teacher Review</Badge>
                          )}
                       </div>
                       
                       <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center gap-2 w-full justify-between">
                            {subInfo.hasScorecard && (
                              <Link to={`/student/exam/${exam.id}/results`}>
                                 <Button size="sm" variant="outline" className="h-8 text-xs bg-card border-primary/20 text-primary hover:bg-primary/10 px-3">
                                   View Evaluated Paper
                                 </Button>
                              </Link>
                            )}

                            {subInfo.hasScorecard && (
                              !grievanceStatus ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openGrievanceDialog(subInfo.id)}
                                  className="h-8 text-xs px-2 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <ShieldAlert className="h-3.5 w-3.5" />
                                  Raise Grievance
                                </Button>
                              ) : (
                                <Badge variant="outline" className={`text-[10px] py-0.5 ${grievanceStatus === "resolved" ? "border-success/30 text-success" : "border-warning/30 text-warning"}`}>
                                  Grievance {grievanceStatus.charAt(0).toUpperCase() + grievanceStatus.slice(1)}
                                </Badge>
                              )
                            )}
                          </div>
                       </div>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {/* Existing Grievance Dialog */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise Grievance</DialogTitle>
            <DialogDescription>
              Explain the issue with your examination. This will be sent directly to your teacher.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="e.g., I faced network issues during submission, or I believe question 4 was evaluated incorrectly."
              value={grievanceReason}
              onChange={(e) => setGrievanceReason(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmittingGrievance}>
              Cancel
            </Button>
            <Button onClick={handleApplyGrievance} disabled={isSubmittingGrievance}>
              {isSubmittingGrievance ? "Submitting..." : "Submit Grievance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={missingClassDialog} onOpenChange={setMissingClassDialog}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Set Your Class</DialogTitle>
            <DialogDescription>
              We need to know your class to show you the correct exams. Please enter your class name exactly as provided by your teacher.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="class-name">Class Name</Label>
              <Select value={newClassName} onValueChange={setNewClassName}>
                <SelectTrigger id="class-name">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_OPTIONS.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveClass} disabled={savingClass || !newClassName.trim()}>
              {savingClass ? "Saving..." : "Save Class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentExamsPage;
