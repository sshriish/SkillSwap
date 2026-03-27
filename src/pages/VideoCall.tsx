import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWebRTC } from "@/hooks/useWebRTC";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, CameraOff, Clock, Monitor } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import VideoControls from "@/components/video/VideoControls";
import ChatPanel from "@/components/video/ChatPanel";
import type { ConnectionQuality } from "@/hooks/useWebRTC";

const QUALITY_CONFIG: Record
  ConnectionQuality,
  { label: string; color: string; dot: string; bars: number }
> = {
  good:    { label: "Good",    color: "#22c55e", dot: "#22c55e", bars: 3 },
  fair:    { label: "Fair",    color: "#f59e0b", dot: "#f59e0b", bars: 2 },
  poor:    { label: "Poor",    color: "#ef4444", dot: "#ef4444", bars: 1 },
  unknown: { label: "–",       color: "#6b7280", dot: "#6b7280", bars: 0 },
};

function SignalBars({ bars, color }: { bars: number; color: string }) {
  return (
    <div className="flex items-end gap-[2px] h-3.5">
      {[1, 2, 3].map((b) => (
        <div
          key={b}
          style={{
            width: 3,
            height: b === 1 ? 5 : b === 2 ? 9 : 14,
            borderRadius: 1,
            background: b <= bars ? color : "rgba(255,255,255,0.2)",
            transition: "background 0.4s",
          }}
        />
      ))}
    </div>
  );
}

function QualityBadge({
  quality,
  rttMs,
  packetLoss,
}: {
  quality: ConnectionQuality;
  rttMs: number | null;
  packetLoss: number | null;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const cfg = QUALITY_CONFIG[quality];

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetail((v) => !v)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
      >
        <SignalBars bars={cfg.bars} color={cfg.color} />
        <span className="text-xs font-medium" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
      </button>

      <AnimatePresence>
        {showDetail && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-9 left-0 z-50 rounded-xl border border-white/10 bg-black/80 backdrop-blur-sm p-3 min-w-[160px] space-y-1.5"
          >
            <p className="text-xs font-semibold text-white/80 mb-2">Connection stats</p>
            <div className="flex justify-between text-xs">
              <span className="text-white/50">Latency</span>
              <span className="text-white font-mono">
                {rttMs !== null ? `${rttMs} ms` : "–"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/50">Packet loss</span>
              <span className="text-white font-mono">
                {packetLoss !== null ? `${packetLoss}%` : "–"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/50">Quality</span>
              <span className="font-medium" style={{ color: cfg.color }}>
                {cfg.label}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScreenSharePill() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium"
    >
      <Monitor className="h-3 w-3" />
      Sharing screen
    </motion.div>
  );
}

export default function VideoCall() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("room");
  const navigate = useNavigate();
  const { user } = useAuth();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const isScreenSharingRef = useRef(false);

  const { remoteVideoRef, connectionState, isConnected, qualityStats, replaceTrack, cleanup: cleanupWebRTC } =
    useWebRTC({ roomId, userId: user?.id, localStream });

  useEffect(() => {
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch {
        toast.error("Could not access camera/microphone. Please check your browser permissions.");
      }
    };
    startMedia();
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    return () => { localStream?.getTracks().forEach((t) => t.stop()); };
  }, [localStream]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
      setIsMuted((prev) => !prev);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
      setIsCameraOff((prev) => !prev);
    }
  };

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharingRef.current) {
      try {
        localStream?.getTracks().forEach((t) => t.stop());
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(camStream);
        if (localVideoRef.current) localVideoRef.current.srcObject = camStream;
        camStream.getVideoTracks().forEach((t) => replaceTrack(t));
        camStream.getAudioTracks().forEach((t) => replaceTrack(t));
        isScreenSharingRef.current = false;
        setIsScreenSharing(false);
        toast.success("Switched back to camera");
      } catch {
        toast.error("Could not switch back to camera.");
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 30 },
          audio: true,
        });
        localStream?.getVideoTracks().forEach((t) => t.stop());

        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        screenStream.getVideoTracks().forEach((t) => replaceTrack(t));
        setLocalStream(screenStream);
        isScreenSharingRef.current = true;
        setIsScreenSharing(true);
        toast.success("Screen sharing started");

        screenStream.getVideoTracks()[0].onended = () => {
          if (isScreenSharingRef.current) toggleScreenShare();
        };
      } catch (err: any) {
        if (err?.name !== "NotAllowedError") {
          toast.error("Could not start screen sharing.");
        }
      }
    }
  }, [localStream, replaceTrack]);

  const endCall = async () => {
    localStream?.getTracks().forEach((t) => t.stop());
    clearInterval(timerRef.current);
    cleanupWebRTC();

    if (sessionId) {
      const minutes = Math.floor(elapsed / 60);
      await supabase
        .from("sessions")
        .update({
          status: "completed",
          ended_at: new Date().toISOString(),
          duration_minutes: minutes,
          credits_transferred: elapsed >= 10 ? 1 : 0,
        })
        .eq("id", sessionId);

      if (roomId) {
        await (supabase.from("signaling") as any).delete().eq("room_id", roomId);
      }
    }

    navigate("/sessions");
    toast.success("Call ended");
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const connectionLabel = () => {
    switch (connectionState) {
      case "connected":    return "Connected";
      case "connecting":   return "Connecting...";
      case "disconnected": return "Reconnecting...";
      case "failed":       return "Connection failed";
      default:             return "Waiting for peer...";
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground flex flex-col">

      <div className="flex items-center justify-between px-5 py-3 bg-foreground/90">
        <div className="flex items-center gap-3">
          <div
            className={`h-2 w-2 rounded-full ${
              isConnected ? "bg-green-500 animate-pulse" : "bg-white/30"
            }`}
          />
          <span className="text-sm text-white/70">{connectionLabel()}</span>

          <AnimatePresence>
            {isConnected && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
              >
                <QualityBadge
                  quality={qualityStats.quality}
                  rttMs={qualityStats.rttMs}
                  packetLoss={qualityStats.packetLoss}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {isScreenSharing && <ScreenSharePill />}
        </AnimatePresence>

        <div className="flex items-center gap-2 text-white/70">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-sm font-mono">{formatTime(elapsed)}</span>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center p-4">

        <div className="w-full max-w-4xl aspect-video bg-card/10 rounded-2xl overflow-hidden border border-white/10">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${isConnected ? "block" : "hidden"}`}
          />
          {!isConnected && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white/30">
                <Camera className="mx-auto h-12 w-12 mb-2" />
                <p className="text-sm">Waiting for peer to connect...</p>
                <p className="text-xs mt-1 text-white/20">Share this session link with your partner</p>
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-8 right-8 w-48 aspect-video rounded-xl overflow-hidden border-2 border-primary/50 shadow-lg group">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

          {isCameraOff && !isScreenSharing && (
            <div className="absolute inset-0 bg-card flex items-center justify-center">
              <CameraOff className="h-6 w-6 text-muted-foreground" />
            </div>
          )}

          <AnimatePresence>
            {isScreenSharing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-1.5 left-0 right-0 flex justify-center"
              >
                <span className="text-[10px] bg-black/60 text-white/80 px-2 py-0.5 rounded-full">
                  Your screen
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {chatOpen && sessionId && user && (
            <ChatPanel sessionId={sessionId} userId={user.id} onClose={() => setChatOpen(false)} />
          )}
        </AnimatePresence>
      </div>

      <VideoControls
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        chatOpen={chatOpen}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare}
        onToggleChat={() => setChatOpen((prev) => !prev)}
        onEndCall={endCall}
      />
    </div>
  );
}
