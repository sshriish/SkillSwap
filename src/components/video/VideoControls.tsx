import { Button } from "@/components/ui/button";
import {
  Mic, MicOff, Camera, CameraOff, Monitor, MonitorOff,
  PhoneOff, MessageCircle,
} from "lucide-react";

interface VideoControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  chatOpen: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onEndCall: () => void;
}

export default function VideoControls({
  isMuted, isCameraOff, isScreenSharing, chatOpen,
  onToggleMute, onToggleCamera, onToggleScreenShare, onToggleChat, onEndCall,
}: VideoControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-4 bg-foreground/90">
      <Button
        size="lg" variant="ghost" onClick={onToggleMute}
        className={`rounded-full h-12 w-12 ${isMuted ? "bg-destructive/20 text-destructive" : "text-primary-foreground/80 hover:bg-primary-foreground/10"}`}
      >
        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </Button>
      <Button
        size="lg" variant="ghost" onClick={onToggleCamera}
        className={`rounded-full h-12 w-12 ${isCameraOff ? "bg-destructive/20 text-destructive" : "text-primary-foreground/80 hover:bg-primary-foreground/10"}`}
      >
        {isCameraOff ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
      </Button>
      <Button
        size="lg" variant="ghost" onClick={onToggleScreenShare}
        className={`rounded-full h-12 w-12 ${isScreenSharing ? "bg-primary/20 text-primary" : "text-primary-foreground/80 hover:bg-primary-foreground/10"}`}
      >
        {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
      </Button>
      <Button
        size="lg" variant="ghost" onClick={onToggleChat}
        className={`rounded-full h-12 w-12 ${chatOpen ? "bg-primary/20 text-primary" : "text-primary-foreground/80 hover:bg-primary-foreground/10"}`}
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
      <Button size="lg" onClick={onEndCall} className="rounded-full h-12 w-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
        <PhoneOff className="h-5 w-5" />
      </Button>
    </div>
  );
}
