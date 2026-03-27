import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const buildIceServers = (): RTCIceServer[] => {
  const servers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];
  const turnUrl = import.meta.env.VITE_TURN_URL;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;
  if (turnUrl && turnUsername && turnCredential) {
    servers.push({ urls: turnUrl, username: turnUsername, credential: turnCredential });
    servers.push({
      urls: turnUrl.replace("turn:", "turns:").replace(":80", ":443"),
      username: turnUsername,
      credential: turnCredential,
    });
  }
  return servers;
};

export type ConnectionQuality = "good" | "fair" | "poor" | "unknown";

interface QualityStats {
  quality: ConnectionQuality;
  rttMs: number | null;
  packetLoss: number | null;
}

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

  const [qualityStats, setQualityStats] = useState<QualityStats>({
    quality: "unknown",
    rttMs: null,
    packetLoss: null,
  });
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPackets = useRef<{ sent: number; lost: number } | null>(null);

  const makingOffer = useRef(false);
  const ignoreOffer = useRef(false);
  const polite = useRef(false);

  const startStatsPolling = useCallback(() => {
    if (statsIntervalRef.current) return;
    statsIntervalRef.current = setInterval(async () => {
      const pc = peerConnection.current;
      if (!pc || pc.connectionState !== "connected") return;

      try {
        const stats = await pc.getStats();
        let rttMs: number | null = null;
        let packetsSent = 0;
        let packetsLost = 0;

        stats.forEach((report) => {
          if (report.type === "outbound-rtp" && report.kind === "video") {
            packetsSent = report.packetsSent ?? 0;
          }
          if (report.type === "remote-inbound-rtp" && report.kind === "video") {
            if (typeof report.roundTripTime === "number") {
              rttMs = Math.round(report.roundTripTime * 1000);
            }
            packetsLost = report.packetsLost ?? 0;
          }
          if (report.type === "candidate-pair" && report.state === "succeeded") {
            if (rttMs === null && typeof report.currentRoundTripTime === "number") {
              rttMs = Math.round(report.currentRoundTripTime * 1000);
            }
          }
        });

        let packetLoss: number | null = null;
        if (prevPackets.current !== null) {
          const deltaSent = packetsSent - prevPackets.current.sent;
          const deltaLost = packetsLost - prevPackets.current.lost;
          if (deltaSent > 0) {
            packetLoss = Math.min(100, Math.round((deltaLost / (deltaSent + deltaLost)) * 100));
          }
        }
        prevPackets.current = { sent: packetsSent, lost: packetsLost };

        let quality: ConnectionQuality = "unknown";
        if (rttMs !== null || packetLoss !== null) {
          const rtt = rttMs ?? 0;
          const loss = packetLoss ?? 0;
          if (rtt < 150 && loss < 3) quality = "good";
          else if (rtt < 300 && loss < 10) quality = "fair";
          else quality = "poor";
        }

        setQualityStats({ quality, rttMs, packetLoss });
      } catch {
        // getStats can fail transiently — ignore
      }
    }, 3000);
  }, []);

  const stopStatsPolling = useCallback(() => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
    prevPackets.current = null;
    setQualityStats({ quality: "unknown", rttMs: null, packetLoss: null });
  }, []);

  const handleSignal = useCallback(
    async (signal: { type: string; payload: any }, pc: RTCPeerConnection | null) => {
      if (!pc) return;
      try {
        if (signal.type === "offer") {
          const offerCollision = makingOffer.current || pc.signalingState !== "stable";
          ignoreOffer.current = !polite.current && offerCollision;
          if (ignoreOffer.current) return;
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
          await pc.setLocalDescription();
          if (roomId && userId) {
            await (supabase.from("signaling") as any).insert({
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
            if (!ignoreOffer.current) console.error("[WebRTC] ICE candidate error:", err);
          }
        }
      } catch (err) {
        console.error("[WebRTC] Signal handling error:", err);
      }
    },
    [roomId, userId]
  );

  const cleanup = useCallback(() => {
    stopStatsPolling();
    peerConnection.current?.close();
    peerConnection.current = null;
    setRemoteStream(null);
    setIsConnected(false);
    setConnectionState("closed");
  }, [stopStatsPolling]);

  const createPeerConnection = useCallback(() => {
    if (!roomId || !userId) return null;

    const pc = new RTCPeerConnection({ iceServers: buildIceServers() });

    pc.onicecandidate = async (event) => {
      if (event.candidate && roomId) {
        await (supabase.from("signaling") as any).insert({
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
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      }
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      if (pc.connectionState === "connected") {
        setIsConnected(true);
        startStatsPolling();
      }
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        setIsConnected(false);
        stopStatsPolling();
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") pc.restartIce();
    };

    pc.onnegotiationneeded = async () => {
      try {
        makingOffer.current = true;
        await pc.setLocalDescription();
        await (supabase.from("signaling") as any).insert({
          room_id: roomId,
          sender_id: userId,
          type: "offer",
          payload: pc.localDescription!.toJSON(),
        });
      } catch (err) {
        console.error("[WebRTC] Negotiation error:", err);
      } finally {
        makingOffer.current = false;
      }
    };

    peerConnection.current = pc;
    return pc;
  }, [roomId, userId, startStatsPolling, stopStatsPolling]);

  useEffect(() => {
    if (!localStream || !peerConnection.current) return;
    const pc = peerConnection.current;
    const senders = pc.getSenders();
    localStream.getTracks().forEach((track) => {
      const existingSender = senders.find((s) => s.track?.kind === track.kind);
      if (existingSender) existingSender.replaceTrack(track);
      else pc.addTrack(track, localStream);
    });
  }, [localStream]);

  useEffect(() => {
    if (!roomId || !userId || !localStream) return;

    const pc = createPeerConnection();
    if (!pc) return;

    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    const init = async () => {
      const { data: existing } = await (supabase.from("signaling") as any)
        .select("sender_id")
        .eq("room_id", roomId)
        .neq("sender_id", userId)
        .limit(1);

      polite.current = (existing?.length ?? 0) > 0;

      const { data: signals } = await (supabase.from("signaling") as any)
        .select("*")
        .eq("room_id", roomId)
        .neq("sender_id", userId)
        .order("created_at", { ascending: true });

      if (signals) {
        for (const sig of signals) await handleSignal(sig, pc);
      }
    };

    init();

    const channel = supabase
      .channel(`signaling-${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "signaling", filter: `room_id=eq.${roomId}` },
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
  }, [roomId, userId, localStream, createPeerConnection, handleSignal, cleanup]);

  const replaceTrack = useCallback((newTrack: MediaStreamTrack) => {
    const pc = peerConnection.current;
    if (!pc) return;
    const sender = pc.getSenders().find((s) => s.track?.kind === newTrack.kind);
    if (sender) sender.replaceTrack(newTrack);
  }, []);

  return {
    remoteStream,
    remoteVideoRef,
    connectionState,
    isConnected,
    qualityStats,
    replaceTrack,
    cleanup,
  };
}
