import { motion } from "framer-motion";
import {
  Eye, EyeOff, MonitorOff, MousePointerClick, Keyboard, Clock, Camera, AlertTriangle
} from "lucide-react";

type LogEntry = {
  event_type: string;
  description: string;
  evidence_url?: string;
};

interface ActivityLogProps {
  events: LogEntry[];
  warningCount: number;
  warningLimit: number;
}

const eventIcons: Record<string, React.ElementType> = {
  tab_switch: MonitorOff,
  window_blur: EyeOff,
  face_absent: Eye,
  multiple_faces: Eye,
  inactivity: Clock,
  screenshot: Camera,
  other: Keyboard,
};

const ActivityLog = ({ events, warningCount, warningLimit }: ActivityLogProps) => {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Activity Monitor
        </h3>
        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
          warningCount === 0
            ? "bg-success/10 text-success"
            : warningCount >= warningLimit - 1
            ? "bg-destructive/10 text-destructive"
            : "bg-warning/10 text-warning"
        }`}>
          {warningCount}/{warningLimit}
        </span>
      </div>

      {/* Warning progress */}
      <div className="flex gap-1 mb-3">
        {Array.from({ length: warningLimit }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < warningCount ? "bg-destructive" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Log entries */}
      <div className="max-h-48 overflow-y-auto space-y-2">
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No suspicious activity detected
          </p>
        ) : (
          events.map((event, i) => {
            const Icon = eventIcons[event.event_type] || MousePointerClick;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2"
              >
                <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground leading-relaxed">{event.description}</p>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
