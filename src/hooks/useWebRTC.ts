import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

interface UseWebRTCOptions {
  roomId: string | null;
  userId: string | undefined;
  localStream: MediaStream | null;
}

export function useWebRTC({ roomId, userId, localStream }: UseWebRTCOptions) {
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<string>("new");
  const [isConnected, setIsConnected] = useState(false);
  const makingOffer = useRef(false);
  const ignoreOffer = useRef(false);
  const polite = useRef(false);

  const cleanup = useCallback(() => {
    peerConnection.current?.close();
    peerConnection.current = null;
    setRemoteStream(null);
    setIsConnected(false);
    setConnectionState("closed");
  }, []);

  const createPeerConnection = useCallback(() => {
    if (!roomId || !userId) return null;

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = async (event) => {
      if (event.candidate && roomId) {
        await supabase.from("signaling").insert({
          room_id: roomId,
          sender_id: userId,
          type: "ice-candidate",
          payload: event.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream) {
        setRemoteStream(stream);
        setIsConnected(true);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      }
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      if (pc.connectionState === "connected") setIsConnected(true);
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        setIsConnected(false);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        pc.restartIce();
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        makingOffer.current = true;
        await pc.setLocalDescription();
        await supabase.from("signaling").insert({
          room_id: roomId,
          sender_id: userId,
          type: "offer",
          payload: pc.localDescription!.toJSON(),
        });
      } catch (err) {
        console.error("Negotiation error:", err);
      } finally {
        makingOffer.current = false;
      }
    };

    peerConnection.current = pc;
    return pc;
  }, [roomId, userId]);

  // Add local tracks to peer connection
  useEffect(() => {
    if (!localStream || !peerConnection.current) return;
    const pc = peerConnection.current;
    const senders = pc.getSenders();

    localStream.getTracks().forEach((track) => {
      const existingSender = senders.find((s) => s.track?.kind === track.kind);
      if (existingSender) {
        existingSender.replaceTrack(track);
      } else {
        pc.addTrack(track, localStream);
      }
    });
  }, [localStream]);

  // Initialize WebRTC and listen for signaling
  useEffect(() => {
    if (!roomId || !userId || !localStream) return;

    const pc = createPeerConnection();
    if (!pc) return;

    // Add tracks
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // Determine politeness by checking if there are existing signals
    const init = async () => {
      const { data: existing } = await supabase
        .from("signaling")
        .select("sender_id")
        .eq("room_id", roomId)
        .neq("sender_id", userId)
        .limit(1);

      // If someone else already sent signals, we're the polite peer
      polite.current = (existing?.length ?? 0) > 0;

      // Load existing signals
      const { data: signals } = await supabase
        .from("signaling")
        .select("*")
        .eq("room_id", roomId)
        .neq("sender_id", userId)
        .order("created_at", { ascending: true });

      if (signals) {
        for (const sig of signals) {
          await handleSignal(sig, pc);
        }
      }
    };

    init();

    // Listen for new signals in realtime
    const channel = supabase
      .channel(`signaling-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "signaling",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const signal = payload.new as any;
          if (signal.sender_id === userId) return;
          await handleSignal(signal, peerConnection.current);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      cleanup();
    };
  }, [roomId, userId, localStream, createPeerConnection, cleanup]);

  const handleSignal = async (
    signal: { type: string; payload: any },
    pc: RTCPeerConnection | null
  ) => {
    if (!pc) return;

    try {
      if (signal.type === "offer") {
        const offerCollision =
          makingOffer.current || pc.signalingState !== "stable";
        ignoreOffer.current = !polite.current && offerCollision;
        if (ignoreOffer.current) return;

        await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
        await pc.setLocalDescription();

        if (roomId && userId) {
          await supabase.from("signaling").insert({
            room_id: roomId,
            sender_id: userId,
            type: "answer",
            payload: pc.localDescription!.toJSON(),
          });
        }
      } else if (signal.type === "answer") {
        if (pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
        }
      } else if (signal.type === "ice-candidate") {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
        } catch (err) {
          if (!ignoreOffer.current) console.error("ICE candidate error:", err);
        }
      }
    } catch (err) {
      console.error("Signal handling error:", err);
    }
  };

  const replaceTrack = useCallback(
    (newTrack: MediaStreamTrack) => {
      const pc = peerConnection.current;
      if (!pc) return;
      const sender = pc.getSenders().find((s) => s.track?.kind === newTrack.kind);
      if (sender) sender.replaceTrack(newTrack);
    },
    []
  );

  return {
    remoteStream,
    remoteVideoRef,
    connectionState,
    isConnected,
    replaceTrack,
    cleanup,
  };
}
