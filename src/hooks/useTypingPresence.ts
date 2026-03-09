import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const TYPING_TIMEOUT = 3000;
const PRESENCE_DEBOUNCE = 2000; // Suppress leave→join flicker within this window

export type PresenceEvent = {
  id: string;
  type: "join" | "leave";
  nickname: string;
  timestamp: number;
};

export function useTypingPresence(room: string, nickname: string | null) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [presenceEvents, setPresenceEvents] = useState<PresenceEvent[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialSyncDone = useRef(false);
  // Track pending leave events so we can cancel them if a quick rejoin happens
  const pendingLeaves = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!nickname) return;
    initialSyncDone.current = false;

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
        initialSyncDone.current = true;
      })
      .on("presence", { event: "join" }, ({ key }) => {
        if (!initialSyncDone.current || key === nickname) return;
        // If there's a pending leave for this user, cancel it (it was just a track() update)
        const pendingLeave = pendingLeaves.current.get(key);
        if (pendingLeave) {
          clearTimeout(pendingLeave);
          pendingLeaves.current.delete(key);
          return;
        }
        setPresenceEvents((prev) => [
          ...prev,
          { id: crypto.randomUUID(), type: "join", nickname: key, timestamp: Date.now() },
        ]);
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        if (!initialSyncDone.current || key === nickname) return;
        // Delay the leave event — if a join comes quickly, it was just a track() update
        const timer = setTimeout(() => {
          pendingLeaves.current.delete(key);
          setPresenceEvents((prev) => [
            ...prev,
            { id: crypto.randomUUID(), type: "leave", nickname: key, timestamp: Date.now() },
          ]);
        }, PRESENCE_DEBOUNCE);
        pendingLeaves.current.set(key, timer);
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
      initialSyncDone.current = false;
      pendingLeaves.current.forEach((t) => clearTimeout(t));
      pendingLeaves.current.clear();
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

  return { typingUsers, presenceEvents, setTyping };
}
