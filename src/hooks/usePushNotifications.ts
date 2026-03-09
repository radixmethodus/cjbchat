import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (c) => c.charCodeAt(0));
}

export function usePushNotifications(nickname: string | null) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [notifyAll, setNotifyAll] = useState(true);
  const [notifyMentions, setNotifyMentions] = useState(true);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const ok = "serviceWorker" in navigator && "PushManager" in window;
    setSupported(ok);
    if (!ok || !nickname) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          const { data } = await supabase
            .from("push_subscriptions" as any)
            .select("*")
            .eq("endpoint", sub.endpoint)
            .single();
          if (data) {
            setIsSubscribed(true);
            setNotifyAll((data as any).notify_all ?? true);
            setNotifyMentions((data as any).notify_mentions ?? true);
          }
        }
      } catch {
        // ignore
      }
      setLoading(false);
    })();
  }, [nickname]);

  const subscribe = useCallback(async () => {
    if (!supported || !nickname) return false;
    setActionLoading(true);
    try {
      // Request notification permission
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setActionLoading(false);
        return false;
      }

      // Get VAPID public key
      const { data: keyData, error: keyError } =
        await supabase.functions.invoke("setup-vapid");
      if (keyError || !keyData?.publicKey) {
        setActionLoading(false);
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey).buffer as ArrayBuffer,
      });

      const subJson = sub.toJSON();

      const { error } = await supabase
        .from("push_subscriptions" as any)
        .upsert(
          {
            nickname,
            endpoint: subJson.endpoint,
            p256dh: subJson.keys?.p256dh,
            auth_key: subJson.keys?.auth,
            notify_all: true,
            notify_mentions: true,
          } as any,
          { onConflict: "endpoint" }
        );

      if (!error) {
        setIsSubscribed(true);
        setNotifyAll(true);
        setNotifyMentions(true);
        setActionLoading(false);
        return true;
      }
    } catch {
      // ignore
    }
    setActionLoading(false);
    return false;
  }, [supported, nickname]);

  const unsubscribe = useCallback(async () => {
    setActionLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase
          .from("push_subscriptions" as any)
          .delete()
          .eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } catch {
      // ignore
    }
    setActionLoading(false);
  }, []);

  const updatePrefs = useCallback(
    async (all: boolean, mentions: boolean) => {
      setNotifyAll(all);
      setNotifyMentions(mentions);
      if (!isSubscribed) return;
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await supabase
            .from("push_subscriptions" as any)
            .update({ notify_all: all, notify_mentions: mentions } as any)
            .eq("endpoint", sub.endpoint);
        }
      } catch {
        // ignore
      }
    },
    [isSubscribed]
  );

  /** Call after sending a message to trigger push to other users */
  const triggerPush = useCallback(
    async (room: string, content: string, fileUrl?: string) => {
      if (!nickname) return;
      try {
        await supabase.functions.invoke("send-push", {
          body: { room, nickname, content, file_url: fileUrl },
        });
      } catch {
        // fire-and-forget
      }
    },
    [nickname]
  );

  return {
    isSubscribed,
    notifyAll,
    notifyMentions,
    loading,
    actionLoading,
    supported,
    subscribe,
    unsubscribe,
    updatePrefs,
    triggerPush,
  };
}
