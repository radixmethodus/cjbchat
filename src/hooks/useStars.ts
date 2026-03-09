import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type Star = {
  id: string;
  message_id: string;
  nickname: string;
};

export function useStars(room: string, nickname: string | null) {
  const [stars, setStars] = useState<Star[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch all stars for messages in this room
  useEffect(() => {
    (async () => {
      // Get all message IDs in room first, then get stars
      const { data: msgs } = await supabase
        .from("pc_messages" as any)
        .select("id")
        .eq("room", room);

      if (!msgs || msgs.length === 0) return;

      const msgIds = (msgs as any[]).map((m) => m.id);
      const { data } = await supabase
        .from("pc_stars" as any)
        .select("*")
        .in("message_id", msgIds);

      if (data) setStars(data as unknown as Star[]);
    })();
  }, [room]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`pc-stars-${room}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "pc_stars" },
        (payload: any) => {
          const newStar = payload.new as Star;
          setStars((prev) => {
            if (prev.some((s) => s.id === newStar.id)) return prev;
            return [...prev, newStar];
          });
        }
      )
      .on(
        "postgres_changes" as any,
        { event: "DELETE", schema: "public", table: "pc_stars" },
        (payload: any) => {
          const oldId = payload.old?.id;
          if (oldId) setStars((prev) => prev.filter((s) => s.id !== oldId));
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [room]);

  const toggleStar = useCallback(
    async (messageId: string) => {
      if (!nickname) return;
      const existing = stars.find(
        (s) => s.message_id === messageId && s.nickname === nickname
      );
      if (existing) {
        await supabase.from("pc_stars" as any).delete().eq("id", existing.id);
        setStars((prev) => prev.filter((s) => s.id !== existing.id));
      } else {
        const { data, error } = await supabase
          .from("pc_stars" as any)
          .insert({ message_id: messageId, nickname } as any)
          .select()
          .single();
        if (!error && data) {
          setStars((prev) => {
            if (prev.some((s) => s.id === (data as any).id)) return prev;
            return [...prev, data as unknown as Star];
          });
        }
      }
    },
    [nickname, stars]
  );

  const getStarCount = useCallback(
    (messageId: string) => stars.filter((s) => s.message_id === messageId).length,
    [stars]
  );

  const hasStarred = useCallback(
    (messageId: string) =>
      nickname ? stars.some((s) => s.message_id === messageId && s.nickname === nickname) : false,
    [stars, nickname]
  );

  return { toggleStar, getStarCount, hasStarred };
}
