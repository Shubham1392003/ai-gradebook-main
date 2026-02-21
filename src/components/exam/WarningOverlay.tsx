import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WarningOverlayProps {
  show: boolean;
  warningCount: number;
  warningLimit: number;
  eventType: string;
  onDismiss: () => void;
}

const eventLabels: Record<string, string> = {
  tab_switch: "Tab Switch Detected",
  window_blur: "Window Focus Lost",
  face_absent: "Face Not Detected",
  multiple_faces: "Multiple Faces Detected",
  audio_detected: "Audio Activity Detected",
  inactivity: "Inactivity Detected",
  screenshot: "Screenshot Captured",
  other: "Suspicious Activity",
};

const WarningOverlay = ({
  show,
  warningCount,
  warningLimit,
  eventType,
  onDismiss,
}: WarningOverlayProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="mx-4 max-w-md w-full rounded-2xl border border-destructive/30 bg-card p-8 shadow-2xl text-center"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>

            <h2 className="text-xl font-bold text-foreground">
              ⚠️ Warning {warningCount}/{warningLimit}
            </h2>

            <p className="mt-2 text-lg font-semibold text-destructive">
              {eventLabels[eventType] || "Suspicious Activity Detected"}
            </p>

            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              This activity has been logged and recorded. Your teacher will be able to review all evidence.
              {warningCount >= warningLimit - 1 && (
                <span className="block mt-2 font-semibold text-destructive">
                  One more warning will terminate your exam!
                </span>
              )}
            </p>

            {/* Warning bar */}
            <div className="mt-5 flex gap-1.5">
              {Array.from({ length: warningLimit }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    i < warningCount ? "bg-destructive" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {warningCount} of {warningLimit} warnings used
            </p>

            <Button
              onClick={onDismiss}
              className="mt-6 w-full bg-charcoal text-charcoal-foreground hover:bg-charcoal/90"
            >
              I Understand — Continue Exam
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WarningOverlay;
