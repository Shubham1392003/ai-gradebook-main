import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Eye, EyeOff, MonitorOff, Clock, Camera, AlertTriangle,
  User, Calendar, Shield
} from "lucide-react";

type CheatingLogRow = {
  id: string;
  event_type: string;
  description: string;
  evidence_url: string | null;
  timestamp: string;
};

type SubmissionRow = {
  id: string;
  student_id: string;
  warning_count: number;
  status: string;
  is_terminated: boolean;
  started_at: string;
  submitted_at: string | null;
};

const eventIcons: Record<string, React.ElementType> = {
  tab_switch: MonitorOff,
  window_blur: EyeOff,
  face_absent: Eye,
  inactivity: Clock,
  screenshot: Camera,
  other: AlertTriangle,
};

const eventColors: Record<string, string> = {
  tab_switch: "bg-destructive/10 text-destructive",
  window_blur: "bg-warning/10 text-warning",
  face_absent: "bg-destructive/10 text-destructive",
  inactivity: "bg-muted text-muted-foreground",
  screenshot: "bg-primary/10 text-primary",
  other: "bg-muted text-muted-foreground",
};

const TeacherEvidencePage = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<SubmissionRow | null>(null);
  const [logs, setLogs] = useState<CheatingLogRow[]>([]);
  const [screenshots, setScreenshots] = useState<{ url: string; time: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!submissionId) return;

      const { data: subData } = await supabase
        .from("submissions")
        .select("*")
        .eq("id", submissionId)
        .single();
      setSubmission(subData as SubmissionRow | null);

      const { data: logData } = await supabase
        .from("cheating_logs")
        .select("*")
        .eq("submission_id", submissionId)
        .order("timestamp", { ascending: true });

      const allLogs = (logData || []) as CheatingLogRow[];
      setLogs(allLogs);

      // Get screenshot URLs
      const screenshotLogs = allLogs.filter((l) => l.event_type === "screenshot" && l.evidence_url);
      const urls = await Promise.all(
        screenshotLogs.map(async (l) => {
          const { data } = await supabase.storage.from("evidence").createSignedUrl(l.evidence_url!, 3600);
          return { url: data?.signedUrl || "", time: l.timestamp };
        })
      );
      setScreenshots(urls.filter((u) => u.url));
      setLoading(false);
    };
    load();
  }, [submissionId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const warningLogs = logs.filter((l) => !["screenshot", "other"].includes(l.event_type));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-charcoal/10">
            <Shield className="h-6 w-6 text-charcoal" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cheating Evidence Review</h1>
            <p className="text-sm text-muted-foreground">
              Submission {submissionId?.slice(0, 8)}... •{" "}
              {submission?.is_terminated ? (
                <span className="text-destructive font-medium">Terminated</span>
              ) : (
                <span className="text-success font-medium">Completed</span>
              )}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4 mb-8">
          {[
            { label: "Total Warnings", value: submission?.warning_count || 0, color: "text-destructive" },
            { label: "Tab Switches", value: logs.filter((l) => l.event_type === "tab_switch").length, color: "text-warning" },
            { label: "Window Blurs", value: logs.filter((l) => l.event_type === "window_blur").length, color: "text-warning" },
            { label: "Screenshots", value: screenshots.length, color: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Activity Timeline */}
          <div className="glass-card p-5">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Activity Timeline
            </h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {warningLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No suspicious activity logged.</p>
              ) : (
                warningLogs.map((log) => {
                  const Icon = eventIcons[log.event_type] || AlertTriangle;
                  const color = eventColors[log.event_type] || "bg-muted text-muted-foreground";
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-3 rounded-xl border border-border p-3"
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{log.description}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {log.event_type.replace("_", " ")}
                      </Badge>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Screenshots */}
          <div className="glass-card p-5">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Webcam Captures ({screenshots.length})
            </h2>
            {screenshots.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No screenshots captured.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                {screenshots.map((ss, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="cursor-pointer group"
                    onClick={() => setSelectedScreenshot(ss.url)}
                  >
                    <div className="rounded-lg overflow-hidden border border-border group-hover:border-primary/30 transition-colors">
                      <img src={ss.url} alt={`Screenshot ${i + 1}`} className="w-full aspect-video object-cover" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(ss.time).toLocaleTimeString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fullscreen screenshot viewer */}
        {selectedScreenshot && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/90 backdrop-blur-lg cursor-pointer"
            onClick={() => setSelectedScreenshot(null)}
          >
            <img src={selectedScreenshot} alt="Evidence" className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl" />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TeacherEvidencePage;
