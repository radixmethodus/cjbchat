import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRoomStats() {
  return useQuery({
    queryKey: ["room-stats"],
    queryFn: async () => {
      const rooms = ["A", "B", "C", "D"] as const;
      const stats = await Promise.all(
        rooms.map(async (room) => {
          const { count } = await supabase
            .from("pc_messages")
            .select("*", { count: "exact", head: true })
            .eq("room", room);
          return { room, count: count || 0 };
        })
      );
      return Object.fromEntries(stats.map((s) => [s.room, s.count])) as Record<string, number>;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}
