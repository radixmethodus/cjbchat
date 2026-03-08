import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type UserInfo = { user_id: string; name: string; color: string };

export function useOnlinePresence(currentUser: UserInfo | null) {
  const [onlineUsers, setOnlineUsers] = useState<UserInfo[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel("chat-online", {
      config: { presence: { key: currentUser.user_id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<UserInfo>();
        const users: UserInfo[] = [];
        for (const key of Object.keys(state)) {
          const presences = state[key];
          if (presences?.[0]) users.push(presences[0]);
        }
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: currentUser.user_id,
            name: currentUser.name,
            color: currentUser.color,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.user_id]);

  return onlineUsers;
}

export function useTypingIndicator(currentUser: UserInfo | null) {
  const [typingUsers, setTypingUsers] = useState<UserInfo[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel("chat-typing", {
      config: { presence: { key: currentUser.user_id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<UserInfo>();
        const users: UserInfo[] = [];
        for (const key of Object.keys(state)) {
          if (key === currentUser.user_id) continue;
          const presences = state[key];
          if (presences?.[0]) users.push(presences[0]);
        }
        setTypingUsers(users);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.user_id]);

  const broadcastTyping = useCallback(() => {
    if (!channelRef.current || !currentUser) return;

    channelRef.current.track({
      user_id: currentUser.user_id,
      name: currentUser.name,
      color: currentUser.color,
    });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      channelRef.current?.untrack();
    }, 2000);
  }, [currentUser]);

  return { typingUsers, broadcastTyping };
}
