import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp, FileText } from "lucide-react";

type GrievanceRow = {
    id: string;
    reason: string;
    status: string;
    teacher_response: string | null;
    created_at: string;
    submission: {
        exam: {
            title: string;
            subject: string;
        }
    }
};

const StudentGrievancesPage = () => {
    const { user } = useAuth();
    const [grievances, setGrievances] = useState<GrievanceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const fetchGrievances = async () => {
            if (!user) return;

            const { data, error } = await supabase
                .from('grievances')
                .select(`
          id,
          reason,
          status,
          teacher_response,
          created_at,
          submission:submissions (
            exam:exams (
              title,
              subject
            )
          )
        `)
                .eq('student_id', user.id)
                .order('created_at', { ascending: false });

            if (!error && data) {
                // Need to cast the nested relation to our type
                const formattedData = data.map(item => ({
                    ...item,
                    submission: Array.isArray(item.submission) ? item.submission[0] : item.submission
                })) as unknown as GrievanceRow[];

                setGrievances(formattedData);
            }
            setLoading(false);
        };

        fetchGrievances();
    }, [user]);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Link to="/student">
                    <Button variant="ghost" size="sm" className="mb-4 gap-1.5">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-foreground">My Grievances</h1>
                <p className="mt-1 text-muted-foreground">Track the status of your examination grievances.</p>
            </motion.div>

            <div className="mt-8 space-y-4">
                {grievances.length === 0 ? (
                    <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
                        <ShieldAlert className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <p className="text-foreground font-medium">No grievances filed yet.</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            If you have an issue with an exam evaluation, you can raise a grievance from the "My Exams" page.
                        </p>
                        <Link to="/student/exams" className="mt-4">
                            <Button variant="outline">Go to Exams</Button>
                        </Link>
                    </div>
                ) : (
                    grievances.map((grievance, i) => {
                        const isResolved = grievance.status === "resolved";
                        const examTitle = grievance.submission?.exam?.title || "Unknown Exam";
                        const examSubject = grievance.submission?.exam?.subject || "Unknown Subject";
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
                                    className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                    onClick={() => toggleExpand(grievance.id)}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isResolved ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                            {isResolved ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground text-lg">{examTitle}</h3>
                                            <p className="text-sm text-muted-foreground">{examSubject} • Filed on {date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 self-end sm:self-auto">
                                        <Badge variant="outline" className={isResolved ? 'border-success/30 text-success bg-success/5' : 'border-warning/50 text-warning bg-warning/5'}>
                                            {isResolved ? "Resolved" : "Pending Review"}
                                        </Badge>
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
                                                    Your Reason
                                                </h4>
                                                <p className="text-muted-foreground whitespace-pre-wrap pl-5 border-l-2 border-border/50">
                                                    {grievance.reason}
                                                </p>
                                            </div>

                                            {isResolved && grievance.teacher_response && (
                                                <div>
                                                    <h4 className="font-semibold text-success mb-1.5 flex items-center gap-1.5">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        Teacher's Response
                                                    </h4>
                                                    <p className="text-foreground bg-success/5 p-3 rounded-md border border-success/20 whitespace-pre-wrap">
                                                        {grievance.teacher_response}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default StudentGrievancesPage;
