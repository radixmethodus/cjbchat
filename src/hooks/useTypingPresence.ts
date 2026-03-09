import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const TYPING_TIMEOUT = 3000;

export function useTypingPresence(room: string, nickname: string | null) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!nickname) return;

    const channel = supabase.channel(`typing:${room}`, {
      config: { presence: { key: nickname } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users = Object.keys(state).filter((n) => {
          const entries = state[n] as { typing?: boolean }[];
          return entries.some((e) => e.typing) && n !== nickname;
        });
        setTypingUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ typing: false });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [room, nickname]);

  const setTyping = useCallback(
    (isTyping: boolean) => {
      const channel = channelRef.current;
      if (!channel) return;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      channel.track({ typing: isTyping });

      if (isTyping) {
        timeoutRef.current = setTimeout(() => {
          channel.track({ typing: false });
        }, TYPING_TIMEOUT);
      }
    },
    []
  );

  return { typingUsers, setTyping };
}
