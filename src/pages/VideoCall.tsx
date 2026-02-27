import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Mic, MicOff, Camera, CameraOff, Monitor, MonitorOff,
  PhoneOff, MessageCircle, Clock, Send, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const timerRef = useRef<NodeJS.Timeout>();

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

    // Timer
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    return () => {
      clearInterval(timerRef.current);
      localStream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Load chat messages + realtime
  useEffect(() => {
    if (!sessionId) return;
    const loadMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    loadMessages();

    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `session_id=eq.${sessionId}` },
        (payload) => setMessages((prev) => [...prev, payload.new])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

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
      // Revert to camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setIsScreenSharing(false);
      } catch {
        toast.error("Could not revert to camera");
      }
    } else {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
        localStream?.getVideoTracks().forEach((t) => t.stop());
        if (localVideoRef.current) localVideoRef.current.srcObject = screen;
        setLocalStream(screen);
        setIsScreenSharing(true);
        screen.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
      } catch {
        // User cancelled
      }
    }
  };

  const endCall = async () => {
    localStream?.getTracks().forEach((t) => t.stop());
    clearInterval(timerRef.current);
    // Update session
    if (sessionId) {
      const minutes = Math.floor(elapsed / 60);
      await supabase.from("sessions").update({
        status: "completed",
        ended_at: new Date().toISOString(),
        duration_minutes: minutes,
        credits_transferred: minutes >= 5 ? 1 : 0,
      }).eq("id", sessionId);
    }
    navigate("/sessions");
    toast.success("Call ended");
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !sessionId || !user) return;
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      sender_id: user.id,
      content: newMsg.trim(),
    });
    setNewMsg("");
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 bg-foreground flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-foreground/90">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-primary-foreground/80">Live Session</span>
        </div>
        <div className="flex items-center gap-2 text-primary-foreground/80">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-mono">{formatTime(elapsed)}</span>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 relative flex items-center justify-center p-4">
        {/* Placeholder for remote video */}
        <div className="w-full max-w-4xl aspect-video bg-card/10 rounded-2xl flex items-center justify-center border border-primary-foreground/10">
          <div className="text-center text-primary-foreground/40">
            <Camera className="mx-auto h-12 w-12 mb-2" />
            <p className="text-sm">Waiting for peer to connect...</p>
            <p className="text-xs mt-1 text-primary-foreground/20">WebRTC signaling requires a backend signaling server</p>
          </div>
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
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-4 right-4 bottom-20 w-80 bg-card rounded-2xl border border-border flex flex-col shadow-lg"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="font-display font-semibold text-sm">Chat</span>
                <button onClick={() => setChatOpen(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((m) => (
                  <div key={m.id} className={`text-sm p-2 rounded-lg max-w-[85%] ${m.sender_id === user?.id ? "bg-primary/10 ml-auto" : "bg-muted"}`}>
                    {m.content}
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border flex gap-2">
                <Input
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="text-sm"
                />
                <Button size="icon" variant="ghost" onClick={sendMessage}><Send className="h-4 w-4" /></Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 py-4 bg-foreground/90">
        <Button
          size="lg"
          variant="ghost"
          onClick={toggleMute}
          className={`rounded-full h-12 w-12 ${isMuted ? "bg-destructive/20 text-destructive" : "text-primary-foreground/80 hover:bg-primary-foreground/10"}`}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        <Button
          size="lg"
          variant="ghost"
          onClick={toggleCamera}
          className={`rounded-full h-12 w-12 ${isCameraOff ? "bg-destructive/20 text-destructive" : "text-primary-foreground/80 hover:bg-primary-foreground/10"}`}
        >
          {isCameraOff ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
        </Button>
        <Button
          size="lg"
          variant="ghost"
          onClick={toggleScreenShare}
          className={`rounded-full h-12 w-12 ${isScreenSharing ? "bg-primary/20 text-primary" : "text-primary-foreground/80 hover:bg-primary-foreground/10"}`}
        >
          {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
        </Button>
        <Button
          size="lg"
          variant="ghost"
          onClick={() => setChatOpen(!chatOpen)}
          className="rounded-full h-12 w-12 text-primary-foreground/80 hover:bg-primary-foreground/10"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
        <Button size="lg" onClick={endCall} className="rounded-full h-12 w-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
