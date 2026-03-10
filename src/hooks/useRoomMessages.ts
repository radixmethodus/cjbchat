import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PcMessage } from "@/components/pictochat/MessageBubble";

type RealtimePayload = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown>;
  old: Record<string, unknown>;
};

function resolveReplies(msgs: PcMessage[]): PcMessage[] {
  return msgs.map((m) => {
    if (m.reply_to) {
      const parent = msgs.find((p) => p.id === m.reply_to);
      if (parent) {
        return { ...m, reply_nickname: parent.nickname, reply_content: parent.content };
      }
    }
    return m;
  });
}

export function useRoomMessages(room: string) {
  const [messages, setMessages] = useState<PcMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("pc_messages" as any)
      .select("*")
      .eq("room", room)
      .order("created_at", { ascending: true })
      .limit(200);

    if (!error && data) {
      setMessages(resolveReplies(data as unknown as PcMessage[]));
    }
  }, [room]);

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    fetchMessages().finally(() => setLoading(false));
  }, [fetchMessages]);

  // Re-sync when page becomes visible (fixes mobile background desync)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchMessages();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    const channelName = `pc-room-${room}-${crypto.randomUUID()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "pc_messages", filter: `room=eq.${room}` },
        async (payload: RealtimePayload) => {
          const newMsg = payload.new as unknown as PcMessage;
          if (newMsg.reply_to) {
            const { data } = await supabase
              .from("pc_messages" as any)
              .select("nickname, content")
              .eq("id", newMsg.reply_to)
              .single();
            if (data) {
              const d = data as any;
              newMsg.reply_nickname = d.nickname;
              newMsg.reply_content = d.content;
            }
          }
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [room]);

  const sendMessage = useCallback(
    async (nickname: string, content: string, color: string, replyTo?: string, fileUrl?: string, fileType?: string) => {
      const { error } = await supabase.from("pc_messages" as any).insert({
        room,
        nickname,
        color,
        content: content || null,
        reply_to: replyTo || null,
        file_url: fileUrl || null,
        file_type: fileType || null,
      } as any);
      return error;
    },
    [room]
  );

  const uploadImage = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${room}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("pc-images").upload(path, file);
    if (error) return { url: null, error };
    const { data: urlData } = supabase.storage.from("pc-images").getPublicUrl(path);
    return { url: urlData.publicUrl, error: null };
  }, [room]);

  return { messages, loading, sendMessage, uploadImage };
}
