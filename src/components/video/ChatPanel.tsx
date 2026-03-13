import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, X } from "lucide-react";
import { motion } from "framer-motion";

interface ChatPanelProps {
  sessionId: string;
  userId: string;
  onClose: () => void;
}

export default function ChatPanel({ sessionId, userId, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    load();

    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "chat_messages",
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => setMessages((prev) => [...prev, payload.new]))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      sender_id: userId,
      content: newMsg.trim(),
    });
    setNewMsg("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute top-4 right-4 bottom-20 w-80 bg-card rounded-2xl border border-border flex flex-col shadow-lg"
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <span className="font-display font-semibold text-sm">Chat</span>
        <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className={`text-sm p-2 rounded-lg max-w-[85%] ${m.sender_id === userId ? "bg-primary/10 ml-auto" : "bg-muted"}`}>
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
  );
}
