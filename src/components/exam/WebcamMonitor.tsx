import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Camera, CameraOff, AlertCircle } from "lucide-react";

interface WebcamMonitorProps {
  submissionId: string;
  studentId: string;
  enabled: boolean;
  onFaceAbsent?: () => void;
  captureInterval?: number; // ms between screenshots
}

const WebcamMonitor = ({
  submissionId,
  studentId,
  enabled,
  onFaceAbsent,
  captureInterval = 30000, // 30s
}: WebcamMonitorProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasPermission(true);
      setIsActive(true);
    } catch {
      setHasPermission(false);
      setIsActive(false);
    }
  }, []);

  const captureScreenshot = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isActive) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.6)
    );
    if (!blob) return;

    // Upload to storage
    const fileName = `${studentId}/${submissionId}/${Date.now()}.jpg`;
    const { data: uploadData } = await supabase.storage
      .from("evidence")
      .upload(fileName, blob, { contentType: "image/jpeg" });

    if (uploadData?.path) {
      // Log the screenshot
      await supabase.from("cheating_logs").insert({
        submission_id: submissionId,
        student_id: studentId,
        event_type: "screenshot",
        description: "Periodic webcam screenshot captured",
        evidence_url: uploadData.path,
      });
    }
  }, [submissionId, studentId, isActive]);

  useEffect(() => {
    if (enabled) {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, startCamera]);

  // Periodic screenshot capture
  useEffect(() => {
    if (!isActive || !enabled) return;
    intervalRef.current = setInterval(captureScreenshot, captureInterval);
    // Capture first screenshot after 5 seconds
    const initTimeout = setTimeout(captureScreenshot, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearTimeout(initTimeout);
    };
  }, [isActive, enabled, captureScreenshot, captureInterval]);

  return (
    <div className="relative">
      <div className="rounded-xl overflow-hidden border border-border bg-charcoal relative">
        {/* Status indicator */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 rounded-full bg-charcoal/80 backdrop-blur-sm px-2.5 py-1">
          {isActive ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
              </span>
              <span className="text-[10px] font-medium text-charcoal-foreground">REC</span>
            </>
          ) : (
            <>
              <CameraOff className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">OFF</span>
            </>
          )}
        </div>

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-auto aspect-video object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {hasPermission === false && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-charcoal text-charcoal-foreground p-4">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-xs text-center">Camera access denied. Please enable it for exam monitoring.</p>
          </div>
        )}

        {hasPermission === null && enabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-charcoal text-charcoal-foreground">
            <Camera className="h-6 w-6 animate-pulse text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
};

export default WebcamMonitor;
