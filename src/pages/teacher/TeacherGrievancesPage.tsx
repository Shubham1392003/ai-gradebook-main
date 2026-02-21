import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft, User, ShieldAlert, Clock, CheckCircle2, ChevronDown, ChevronUp, FileText, Check, Eye
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type FullGrievanceInfo = {
    id: string;
    reason: string;
    status: string;
    teacher_response: string | null;
    created_at: string;
    student_id: string;
    submission_id: string;
    student: {
        full_name: string;
        email: string;
    };
    exam: {
        title: string;
        subject: string;
        class_name: string;
    };
};

const TeacherGrievancesPage = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [grievances, setGrievances] = useState<FullGrievanceInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Dialog state
    const [selectedGrievance, setSelectedGrievance] = useState<FullGrievanceInfo | null>(null);
    const [teacherResponse, setTeacherResponse] = useState("");
    const [isResolving, setIsResolving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const loadData = async () => {
        if (!user) return;

        // 1. Get Teacher's Exams
        const { data: examsData } = await supabase
            .from("exams")
            .select("id, title, subject, class_name")
            .eq("teacher_id", user.id);

        if (!examsData || examsData.length === 0) {
            setGrievances([]);
            setLoading(false);
            return;
        }

        const examMap: Record<string, typeof examsData[0]> = {};
        examsData.forEach(e => examMap[e.id] = e);
        const examIds = examsData.map(e => e.id);

        // 2. Get Submissions for those exams
        const { data: subsData } = await supabase
            .from("submissions")
            .select("id, exam_id")
            .in("exam_id", examIds);

        if (!subsData || subsData.length === 0) {
            setGrievances([]);
            setLoading(false);
            return;
        }

        const subToExamMap: Record<string, string> = {};
        subsData.forEach(s => subToExamMap[s.id] = s.exam_id);
        const subIds = subsData.map(s => s.id);

        // 3. Get Grievances for those submissions
        const { data: grievsData } = await supabase
            .from("grievances")
            .select("*")
            .in("submission_id", subIds)
            .order("created_at", { ascending: false });

        if (!grievsData || grievsData.length === 0) {
            setGrievances([]);
            setLoading(false);
            return;
        }

        // 4. Get Student Profiles
        const studentIds = [...new Set(grievsData.map(g => g.student_id))];
        const { data: profsData } = await supabase
            .from("profiles")
            .select("user_id, full_name, email")
            .in("user_id", studentIds);

        const profMap: Record<string, any> = {};
        (profsData || []).forEach(p => profMap[p.user_id] = p);

        // Combine data
        const combinedData: FullGrievanceInfo[] = grievsData.map((g: any) => {
            const examId = subToExamMap[g.submission_id];
            const exam = examMap[examId];
            const student = profMap[g.student_id] || { full_name: "Unknown Student", email: g.student_id };

            return {
                ...g,
                student,
                exam: exam || { title: "Unknown Exam", subject: "Unknown", class_name: "Unknown" }
            };
        });

        setGrievances(combinedData);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [user]);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const openResolveDialog = (grievance: FullGrievanceInfo, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent expanding the row
        setSelectedGrievance(grievance);
        setTeacherResponse(grievance.teacher_response || "");
        setIsDialogOpen(true);
    };

    const handleResolveGrievance = async () => {
        if (!selectedGrievance || !teacherResponse.trim()) {
            toast({
                title: "Response required",
                description: "Please provide a response before resolving.",
                variant: "destructive"
            });
            return;
        }

        setIsResolving(true);
        try {
            const { error } = await supabase
                .from("grievances")
                .update({
                    teacher_response: teacherResponse,
                    status: "resolved"
                })
                .eq("id", selectedGrievance.id);

            if (error) throw error;

            toast({
                title: "Grievance resolved",
                description: "The grievance has been resolved successfully."
            });

            setIsDialogOpen(false);
            loadData();
        } catch (error: any) {
            toast({
                title: "Failed to resolve grievance",
                description: error.message || "Something went wrong.",
                variant: "destructive"
            });
        } finally {
            setIsResolving(false);
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
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Link to="/teacher">
                    <Button variant="ghost" size="sm" className="mb-4 gap-1.5">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-foreground">Grievance Management</h1>
                <p className="mt-1 text-muted-foreground">Review and respond to all student grievances across your exams.</p>
            </motion.div>

            <div className="mt-8 space-y-4">
                {grievances.length === 0 ? (
                    <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
                        <ShieldAlert className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <p className="text-foreground font-medium">No grievances to review.</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            You're all caught up! Students have not raised any grievances for your exams.
                        </p>
                    </div>
                ) : (
                    grievances.map((grievance, i) => {
                        const isResolved = grievance.status === "resolved";
                        const date = new Date(grievance.created_at).toLocaleDateString();
                        const isExpanded = expandedId === grievance.id;

                        return (
                            <motion.div
                                key={grievance.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`glass-card overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-1 ring-primary/20' : ''}`}
                            >
                                <div
                                    className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                                    onClick={() => toggleExpand(grievance.id)}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-charcoal/10 text-charcoal">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-foreground text-base">{grievance.student.full_name}</h3>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                    {grievance.student.email}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-0.5">
                                                <span className="font-medium text-foreground/80">{grievance.exam.title}</span> • {grievance.exam.class_name} • Filed {date}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 self-end md:self-auto shrink-0 flex-wrap justify-end">
                                        <Badge variant="outline" className={isResolved ? 'border-success/30 text-success bg-success/5' : 'border-warning/50 text-warning bg-warning/5'}>
                                            {isResolved ? "Resolved" : "Pending Review"}
                                        </Badge>

                                        <Button
                                            size="sm"
                                            variant={isResolved ? "outline" : "default"}
                                            onClick={(e) => openResolveDialog(grievance, e)}
                                            className={`gap-1.5 h-8 text-xs ${!isResolved ? "bg-warning hover:bg-warning/90 text-warning-foreground" : ""}`}
                                        >
                                            {isResolved ? <Eye className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                                            {isResolved ? "View" : "Resolve"}
                                        </Button>

                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        className="border-t border-border bg-muted/30 px-5 text-sm"
                                    >
                                        <div className="py-4 space-y-4">
                                            <div>
                                                <h4 className="font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    Student's Reason
                                                </h4>
                                                <p className="text-muted-foreground whitespace-pre-wrap pl-5 border-l-2 border-border/50">
                                                    {grievance.reason}
                                                </p>
                                            </div>

                                            {isResolved && grievance.teacher_response && (
                                                <div>
                                                    <h4 className="font-semibold text-success mb-1.5 flex items-center gap-1.5">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        Your Response
                                                    </h4>
                                                    <p className="text-foreground bg-success/5 p-3 rounded-md border border-success/20 whitespace-pre-wrap">
                                                        {grievance.teacher_response}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="pt-2 flex justify-end">
                                                <Link to={`/teacher/evaluate/${grievance.submission_id}`}>
                                                    <Button size="sm" variant="outline" className="gap-1.5">
                                                        <FileText className="h-3.5 w-3.5" /> Go to Submission Evaluation
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Resolve Grievance</DialogTitle>
                        <DialogDescription>
                            Provide a response to the student's grievance. They will be able to see this message on their dashboard.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div>
                            <h4 className="text-sm font-semibold mb-1">Student's Reason:</h4>
                            <p className="text-sm text-foreground bg-muted p-3 rounded-md border text-muted-foreground whitespace-pre-wrap">
                                {selectedGrievance?.reason}
                            </p>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold mb-2">Your Response:</h4>
                            <Textarea
                                placeholder="Explain the result of your review..."
                                value={teacherResponse}
                                onChange={(e) => setTeacherResponse(e.target.value)}
                                className="resize-none"
                                rows={4}
                                disabled={selectedGrievance?.status === "resolved"}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isResolving}>
                            {selectedGrievance?.status === "resolved" ? "Close" : "Cancel"}
                        </Button>
                        {selectedGrievance?.status !== "resolved" && (
                            <Button onClick={handleResolveGrievance} disabled={isResolving}>
                                {isResolving ? "Resolving..." : "Resolve Grievance"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TeacherGrievancesPage;
