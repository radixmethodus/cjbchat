import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ROOMS = ["A", "B", "C", "D"] as const;

export function useRoomStats() {
  return useQuery({
    queryKey: ["room-stats"],
    queryFn: async () => {
      const stats = await Promise.all(
        ROOMS.map(async (room) => {
          const { count } = await supabase
            .from("pc_messages")
            .select("*", { count: "exact", head: true })
            .eq("room", room);
          return { room, count: count || 0 };
        })
      );
      return Object.fromEntries(stats.map((s) => [s.room, s.count])) as Record<string, number>;
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
