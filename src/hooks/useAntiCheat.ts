import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type CheatingEvent = {
  event_type: string;
  description: string;
  evidence_url?: string;
};

interface UseAntiCheatOptions {
  submissionId: string;
  studentId: string;
  warningLimit: number;
  enabled: boolean;
  onWarning: (count: number, event: string) => void;
  onTerminate: () => void;
  captureEvidence?: () => Promise<string | null>;
}

export const useAntiCheat = ({
  submissionId,
  studentId,
  warningLimit,
  enabled,
  onWarning,
  onTerminate,
  captureEvidence,
}: UseAntiCheatOptions) => {
  const [warningCount, setWarningCount] = useState(0);
  const [events, setEvents] = useState<CheatingEvent[]>([]);
  const lastActivityRef = useRef(Date.now());
  const inactivityTimerRef = useRef<ReturnType<typeof setInterval>>();
  const warningCountRef = useRef(0);

  const captureEvidenceRef = useRef(captureEvidence);
  useEffect(() => { captureEvidenceRef.current = captureEvidence; }, [captureEvidence]);

  const logEvent = useCallback(
    async (event: CheatingEvent, isWarning = true) => {
      let finalEvidenceUrl = event.evidence_url || null;
      if (isWarning && !finalEvidenceUrl && captureEvidenceRef.current) {
        finalEvidenceUrl = await captureEvidenceRef.current() || null;
      }

      setEvents((prev) => [...prev, { ...event, evidence_url: finalEvidenceUrl || undefined }]);

      // Store in DB
      await supabase.from("cheating_logs").insert({
        submission_id: submissionId,
        student_id: studentId,
        event_type: event.event_type,
        description: event.description,
        evidence_url: finalEvidenceUrl,
      });

      if (isWarning) {
        let newCount = warningCountRef.current + 1;

        // Immediate termination for Tab Switches or Window Blurs
        if (event.event_type === "tab_switch" || event.event_type === "window_blur") {
          newCount = warningLimit; // Force limit to trigger termination
        }

        warningCountRef.current = newCount;
        setWarningCount(newCount);

        // Update submission warning count
        await supabase
          .from("submissions")
          .update({ warning_count: newCount })
          .eq("id", submissionId);

        onWarning(newCount, event.event_type);

        if (newCount >= warningLimit) {
          onTerminate();
        }
      }
    },
    [submissionId, studentId, warningLimit, onWarning, onTerminate]
  );

  // Tab visibility change
  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      if (document.hidden) {
        logEvent({
          event_type: "tab_switch",
          description: "Student switched away from exam tab",
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabled, logEvent]);

  // Window blur (focus lost)
  useEffect(() => {
    if (!enabled) return;

    const handleBlur = () => {
      logEvent({
        event_type: "window_blur",
        description: "Exam window lost focus",
      });
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [enabled, logEvent]);

  // Removed Inactivity detection to allow students to solve paper-based tests securely.

  // Keyboard shortcuts and Clipboard (copy/paste/print)
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ["c", "v", "x", "p", "a"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        logEvent(
          {
            event_type: "copy_paste",
            description: `Blocked keyboard shortcut: ${e.ctrlKey ? "Ctrl" : "Cmd"}+${e.key.toUpperCase()}`,
          },
          true // Strict warning!
        );
      }
    };

    const handleClipboard = (e: Event) => {
      e.preventDefault();
      logEvent(
        {
          event_type: "copy_paste",
          description: `Unauthorized clipboard action: ${e.type}`,
        },
        true // Strict warning for clipboard operations
      );
    };

    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logEvent(
        {
          event_type: "other",
          description: "Right-click context menu blocked",
        },
        true // Count this as a warning as well!
      );
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("copy", handleClipboard);
    window.addEventListener("paste", handleClipboard);
    window.addEventListener("cut", handleClipboard);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("copy", handleClipboard);
      window.removeEventListener("paste", handleClipboard);
      window.removeEventListener("cut", handleClipboard);
    };
  }, [enabled, logEvent]);

  return { warningCount, events, logEvent };
};
