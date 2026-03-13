import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWebRTC } from "@/hooks/useWebRTC";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, CameraOff, Clock, Wifi, WifiOff } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import VideoControls from "@/components/video/VideoControls";
import ChatPanel from "@/components/video/ChatPanel";

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
  const timerRef = useRef<NodeJS.Timeout>();

  const { remoteVideoRef, connectionState, isConnected, replaceTrack, cleanup: cleanupWebRTC } =
    useWebRTC({ roomId, userId: user?.id, localStream });

  // Start local media
  useEffect(() => {
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch {
        toast.error("Could not access camera/microphone");
      }
    };
    startMedia();
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    return () => {
      clearInterval(timerRef.current);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localStream?.getTracks().forEach((t) => t.stop());
    };
  }, [localStream]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
      setIsCameraOff(!isCameraOff);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        stream.getVideoTracks().forEach((t) => replaceTrack(t));
        stream.getAudioTracks().forEach((t) => replaceTrack(t));
        setIsScreenSharing(false);
      } catch {
        toast.error("Could not revert to camera");
      }
    } else {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
        localStream?.getVideoTracks().forEach((t) => t.stop());
        if (localVideoRef.current) localVideoRef.current.srcObject = screen;
        screen.getVideoTracks().forEach((t) => replaceTrack(t));
        setLocalStream(screen);
        setIsScreenSharing(true);
        screen.getVideoTracks()[0].onended = () => toggleScreenShare();
      } catch {
        // User cancelled
      }
    }
  };

  const endCall = async () => {
    localStream?.getTracks().forEach((t) => t.stop());
    clearInterval(timerRef.current);
    cleanupWebRTC();

    if (sessionId) {
      const minutes = Math.floor(elapsed / 60);
      await supabase.from("sessions").update({
        status: "completed",
        ended_at: new Date().toISOString(),
        duration_minutes: minutes,
        credits_transferred: minutes >= 5 ? 1 : 0,
      }).eq("id", sessionId);

      // Clean up signaling data
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
      case "connected": return "Connected";
      case "connecting": return "Connecting...";
      case "disconnected": return "Reconnecting...";
      case "failed": return "Connection failed";
      default: return "Waiting for peer...";
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-foreground/90">
        <div className="flex items-center gap-3">
          <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-primary" : "bg-muted-foreground"} animate-pulse`} />
          <span className="text-sm font-medium text-primary-foreground/80">
            {connectionLabel()}
          </span>
          {isConnected ? (
            <Wifi className="h-3.5 w-3.5 text-primary" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center gap-2 text-primary-foreground/80">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-mono">{formatTime(elapsed)}</span>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 relative flex items-center justify-center p-4">
        {/* Remote video */}
        <div className="w-full max-w-4xl aspect-video bg-card/10 rounded-2xl overflow-hidden border border-primary-foreground/10">
          {isConnected ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-primary-foreground/40">
                <Camera className="mx-auto h-12 w-12 mb-2" />
                <p className="text-sm">Waiting for peer to connect...</p>
                <p className="text-xs mt-1 text-primary-foreground/20">
                  Share this session link with your partner
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Local video (PiP) */}
        <div className="absolute bottom-8 right-8 w-48 aspect-video rounded-xl overflow-hidden border-2 border-primary/50 shadow-lg">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          {isCameraOff && (
            <div className="absolute inset-0 bg-card flex items-center justify-center">
              <CameraOff className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Chat panel */}
        <AnimatePresence>
          {chatOpen && sessionId && user && (
            <ChatPanel sessionId={sessionId} userId={user.id} onClose={() => setChatOpen(false)} />
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <VideoControls
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        chatOpen={chatOpen}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare}
        onToggleChat={() => setChatOpen(!chatOpen)}
        onEndCall={endCall}
      />
    </div>
  );
}
