import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Camera, CameraOff, AlertCircle } from "lucide-react";
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

interface WebcamMonitorProps {
  submissionId: string;
  studentId: string;
  enabled: boolean;
  onFaceAbsent?: () => void;
  onWarning?: (desc: string, eventType?: string) => void;
  captureInterval?: number; // ms between screenshots
  onCaptureReady?: (captureFn: () => Promise<string | null>) => void;
}

const WebcamMonitor = ({
  submissionId,
  studentId,
  enabled,
  onFaceAbsent,
  onWarning,
  captureInterval = 10000, // 10s
  onCaptureReady,
}: WebcamMonitorProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const faceIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const [modelError, setModelError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Setup Audio Analysis
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
      } catch (e) {
        console.warn("Audio Context setup failed", e);
      }
      
      setHasPermission(true);
      setIsActive(true);
    } catch {
      setHasPermission(false);
      setIsActive(false);
    }
  }, []);

  const takeScreenshotForEvidence = useCallback(async (): Promise<string | null> => {
    if (!videoRef.current || !canvasRef.current || !isActive) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.6)
    );
    if (!blob) {
       console.error("Failed to generate blob from canvas");
       return null;
    }

    const fileName = `${studentId}/${submissionId}/${Date.now()}_evidence.jpg`;
    
    // Force upload using the blob
    const { data: uploadData, error } = await supabase.storage
      .from("evidence")
      .upload(fileName, blob, { contentType: "image/jpeg", upsert: true });

    if (error) {
       console.error("Screenshot upload failed due to storage error:", error);
       return null;
    }

    return uploadData?.path || null;
  }, [submissionId, studentId, isActive]);

  useEffect(() => {
    if (onCaptureReady) {
       onCaptureReady(takeScreenshotForEvidence);
    }
  }, [onCaptureReady, takeScreenshotForEvidence]);

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

    // Multi-face detection loop using robust BlazeFace model
    let isRunning = true;
    const runFaceDetection = async () => {
      try {
        await tf.ready();
        const model = await blazeface.load();
        setModelError(null);
        
        faceIntervalRef.current = setInterval(async () => {
          if (!isRunning || !videoRef.current || !isActive || videoRef.current.readyState !== 4) return;
          try {
            const predictions = await model.estimateFaces(videoRef.current, false);
            if (predictions.length > 1) {
              onWarning?.(`Multiple people detected! Count: ${predictions.length}`, "multiple_faces");
            } else if (predictions.length === 0) {
              onWarning?.(`No face detected on camera!`, "missing_face");
            }
          } catch (e) {
             console.error("Face detection error:", e);
          }
        }, 1500); // Check every 1.5s
      } catch (err: any) {
        console.error("Failed to load face detection model:", err);
        setModelError(err?.message || "Model failed to load");
      }
    };
    
    runFaceDetection();

    // Audio Analysis Loop
    if (analyserRef.current) {
      audioIntervalRef.current = setInterval(() => {
        if (!isActive) return;
        const dataArray = new Uint8Array(analyserRef.current!.frequencyBinCount);
        analyserRef.current!.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avgVolume = sum / dataArray.length;
        
        // Threshold for human talking or loud noise
        if (avgVolume > 60) {
           onWarning?.(`Voice or loud noise detected!`, "audio_detected");
        }
      }, 2000);
    }

    return () => {
      isRunning = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (audioContextRef.current) {
         audioContextRef.current.close().catch(() => {});
      }
      clearTimeout(initTimeout);
    };
  }, [isActive, enabled, captureScreenshot, captureInterval, onWarning]);

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
        {modelError && (
          <div className="absolute inset-x-0 bottom-0 bg-destructive/90 text-destructive-foreground p-1 text-[10px] text-center z-20 font-bold truncate">
            Model Error: {modelError}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebcamMonitor;
