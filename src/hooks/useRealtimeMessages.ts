import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Message } from "@/components/chat/types";

type RealtimePayload = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown>;
  old: Record<string, unknown>;
};

export function useRealtimeMessages(
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  onNewMessage?: (msg: Message) => void,
  table: string = "messages"
) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchMessageById = useCallback(async (id: string): Promise<Message | null> => {
    const fkHint = table === "messages" ? "chatroom_users!messages_user_id_fkey" : "chatroom_users!secret_messages_user_id_fkey";
    const { data } = await supabase
      .from(table as any)
      .select(`*, ${fkHint}(name, color)`)
      .eq("id", id)
      .single();
    return data as unknown as Message | null;
  }, [table]);

  useEffect(() => {
    const channelName = `realtime-${table}-${crypto.randomUUID()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table },
        async (payload: RealtimePayload) => {
          const fullMsg = await fetchMessageById(payload.new.id as string);
          if (fullMsg) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === fullMsg.id)) return prev;
              return [...prev, fullMsg];
            });
            onNewMessage?.(fullMsg);
          }
        }
      )
      .on(
        "postgres_changes" as any,
        { event: "UPDATE", schema: "public", table },
        async (payload: RealtimePayload) => {
          const fullMsg = await fetchMessageById(payload.new.id as string);
          if (fullMsg) {
            setMessages((prev) =>
              prev.map((m) => (m.id === fullMsg.id ? fullMsg : m))
            );
          }
        }
      )
      .on(
        "postgres_changes" as any,
        { event: "DELETE", schema: "public", table },
        (payload: RealtimePayload) => {
          const deletedId = payload.old.id as string;
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setMessages, fetchMessageById, onNewMessage, table]);
}
