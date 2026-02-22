import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Award, FileText, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export const StudentScorecardsPage = () => {
  const { user } = useAuth();
  const [scorecards, setScorecards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (scorecard: any) => {
    if (!user) return;
    setDownloadingId(scorecard.id);

    try {
      // 1. Get submission
      const { data: subData } = await supabase
        .from('submissions')
        .select('id')
        .eq('exam_id', scorecard.exam_id)
        .eq('student_id', user.id)
        .maybeSingle();

      let evaluations: any[] = [];
      if (subData) {
        // 2. Get evaluations with questions
        const { data: evalData } = await supabase
          .from('evaluations')
          .select(`
            marks_obtained,
            questions (
              question_text,
              marks,
              order_index
            )
          `)
          .eq('submission_id', subData.id);

        if (evalData) {
          evaluations = evalData;
        }
      }

      // 3. Generate PDF
      const doc = new jsPDF();

      // Official Title
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42);
      doc.text("Official Scorecard", 105, 20, { align: "center" });

      // Student info block
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);

      doc.text("Current Exam Details:", 14, 35);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.text(`${scorecard.exams?.title || "Unknown Exam"}`, 14, 42);
      doc.text(`Subject: ${scorecard.exams?.subject || "Unknown"}`, 14, 49);
      doc.text(`Date: ${new Date(scorecard.exams?.created_at || scorecard.created_at).toLocaleDateString()}`, 14, 56);

      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text("Performance:", 130, 35);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.text(`Total Marks: ${scorecard.total_marks_obtained} / ${scorecard.total_marks}`, 130, 42);
      doc.text(`Percentage: ${Number(scorecard.percentage).toFixed(1)}%`, 130, 49);

      // Separator line
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 62, 196, 62);

      // Section: Current Exam Per-Question Marks
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text("Question-Wise Breakdown (Current Exam)", 14, 75);

      // Sort by order_index
      evaluations.sort((a, b) => {
        const orderA = Array.isArray(a.questions) ? a.questions[0]?.order_index || 0 : a.questions?.order_index || 0;
        const orderB = Array.isArray(b.questions) ? b.questions[0]?.order_index || 0 : b.questions?.order_index || 0;
        return orderA - orderB;
      });

      // Prepare table data for current exam
      const tableData = evaluations.map((e, index) => {
        const q = Array.isArray(e.questions) ? e.questions[0] : e.questions;
        return [
          (index + 1).toString(),
          q?.question_text || "Unknown Question",
          (q?.marks || 0).toString(),
          (e.marks_obtained || 0).toString()
        ];
      });

      if (tableData.length === 0) {
        tableData.push(["-", "No questions evaluated yet.", "-", "-"]);
      }

      autoTable(doc, {
        startY: 80,
        head: [["Q.No.", "Question", "Max Marks", "Marks Obtained"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 35, halign: 'center' },
        },
      });

      // Calculate Y position for the next section safely
      const jsDoc = doc as any;
      let finalY = jsDoc.lastAutoTable ? jsDoc.lastAutoTable.finalY + 20 : 150;

      // Section: Historical Scorecards
      if (finalY > 250) {
        doc.addPage();
        finalY = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text("Historical Performance (Previous Exams)", 14, finalY);

      // Get past scorecards excluding the current one
      const pastExams = scorecards.filter((s) => s.id !== scorecard.id);
      const pastData = pastExams.map((s, idx) => {
        return [
          (idx + 1).toString(),
          s.exams?.title || "Unknown Exam",
          s.exams?.subject || "Unknown",
          `${s.total_marks_obtained} / ${s.total_marks}`,
          `${Number(s.percentage).toFixed(1)}%`
        ];
      });

      if (pastData.length === 0) {
        pastData.push(["-", "No previous exams taken.", "-", "-", "-"]);
      }

      autoTable(doc, {
        startY: finalY + 5,
        head: [["S.No.", "Exam Title", "Subject", "Score", "Percentage"]],
        body: pastData,
        theme: "striped",
        headStyles: { fillColor: [71, 85, 105], textColor: 255 },
      });

      // Save PDF
      doc.save(`Scorecard_${scorecard.exams?.title?.replace(/\s+/g, "_") || "Exam"}.pdf`);

    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    const fetchScorecards = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("scorecards")
        .select(`
          *,
          exams (
            title,
            subject,
            created_at
          )
        `)
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching scorecards:", error);
      } else {
        setScorecards(data || []);
      }
      setLoading(false);
    };

    fetchScorecards();
  }, [user]);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" />
          My Scorecards
        </h1>
        <p className="mt-1 text-muted-foreground">View and download your final exam scorecards.</p>
      </motion.div>

      <div className="mt-8">
        {scorecards.length === 0 ? (
          <motion.div
            className="glass-card flex items-center justify-center p-12"
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground font-medium">No scorecards available yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Your teacher hasn't published any final scores for your exams.</p>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {scorecards.map((scorecard, index) => (
              <motion.div
                key={scorecard.id}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                transition={{ delay: index * 0.1 }}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
              >
                {/* Decorative border top */}
                <div className={`absolute top-0 left-0 w-full h-1 ${scorecard.percentage >= 80 ? 'bg-success' : scorecard.percentage >= 60 ? 'bg-warning' : 'bg-destructive'}`} />

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1" title={scorecard.exams?.title}>
                      {scorecard.exams?.title || "Unknown Exam"}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-1">
                      {scorecard.exams?.subject}
                      {scorecard.exams?.created_at && (
                        <span className="text-xs opacity-75 ml-2">
                          • {new Date(scorecard.exams.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                </div>

                <div className="bg-muted/30 rounded-xl p-4 border border-border/50 mb-5 relative overflow-hidden">
                  <div className="flex justify-between items-end relative z-10">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Marks Obtained</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">{scorecard.total_marks_obtained}</span>
                        <span className="text-sm text-muted-foreground font-semibold">/ {scorecard.total_marks}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Percentage</p>
                      <span className={`text-xl font-bold ${scorecard.percentage >= 80 ? 'text-success' : scorecard.percentage >= 60 ? 'text-warning' : 'text-destructive'}`}>
                        {Number(scorecard.percentage).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="w-full gap-2 cursor-pointer relative"
                    onClick={() => handleDownload(scorecard)}
                    disabled={downloadingId === scorecard.id}
                  >
                    {downloadingId === scorecard.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {downloadingId === scorecard.id ? "Generating..." : "Download"}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentScorecardsPage;
