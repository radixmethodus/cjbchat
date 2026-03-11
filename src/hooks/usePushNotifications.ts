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

type PushErrorCode =
  | "not_supported"
  | "permission_denied"
  | "service_worker_not_ready"
  | "vapid_unavailable"
  | "subscribe_failed"
  | "unknown";

type PushError = { code: PushErrorCode; message: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getRegistrationWithRetry(): Promise<ServiceWorkerRegistration | null> {
  // registerSW() should register quickly, but it may take a tick to appear.
  for (let i = 0; i < 8; i++) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) return reg;
    await sleep(250);
  }
  // Fallback: any registration (older or uncontrolled)
  const regs = await navigator.serviceWorker.getRegistrations();
  return regs[0] ?? null;
}

export function usePushNotifications(nickname: string | null) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [notifyAll, setNotifyAll] = useState(true);
  const [notifyMentions, setNotifyMentions] = useState(true);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<PushError | null>(null);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setSupported(ok);
    setError(null);

    if (!ok || !nickname) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const reg = await getRegistrationWithRetry();
        if (!reg) {
          if (!cancelled) {
            setError({
              code: "service_worker_not_ready",
              message: "Service worker is still starting — try again in a moment.",
            });
          }
          return;
        }

        const sub = await reg.pushManager.getSubscription();
        if (!cancelled && sub) {
          const { data } = await supabase.rpc("get_push_subscription_prefs", {
            _endpoint: sub.endpoint,
          });

          if (data && data.length > 0) {
            setIsSubscribed(true);
            setNotifyAll(data[0].notify_all ?? true);
            setNotifyMentions(data[0].notify_mentions ?? true);
          } else {
            setIsSubscribed(false);
          }
        }

        if (!cancelled && !sub) {
          setIsSubscribed(false);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [nickname]);

  const subscribe = useCallback(async () => {
    if (!supported || !nickname) return false;
    setError(null);
    setActionLoading(true);

    try {
      // Request notification permission
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setError({
          code: "permission_denied",
          message: "Notifications are blocked in browser settings.",
        });
        return false;
      }

      // Get VAPID public key
      const { data: keyData, error: keyError } =
        await supabase.functions.invoke("setup-vapid");
      if (keyError || !keyData?.publicKey) {
        setError({
          code: "vapid_unavailable",
          message: "Push keys unavailable — try again in a moment.",
        });
        return false;
      }

      const reg = await getRegistrationWithRetry();
      if (!reg) {
        setError({
          code: "service_worker_not_ready",
          message: "Service worker is still starting — try again in a moment.",
        });
        return false;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey)
          .buffer as ArrayBuffer,
      });

      const subJson = sub.toJSON();

      const { error: upsertError } = await supabase
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

      if (upsertError) {
        setError({
          code: "subscribe_failed",
          message: "Could not save subscription — try again.",
        });
        return false;
      }

      setIsSubscribed(true);
      setNotifyAll(true);
      setNotifyMentions(true);
      return true;
    } catch {
      setError({ code: "unknown", message: "Push subscription failed." });
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [supported, nickname]);

  const unsubscribe = useCallback(async () => {
    setError(null);
    setActionLoading(true);

    try {
      const reg = await getRegistrationWithRetry();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await supabase.rpc("delete_push_subscription", {
          _endpoint: sub.endpoint,
        });
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  }, []);

  const updatePrefs = useCallback(
    async (all: boolean, mentions: boolean) => {
      setNotifyAll(all);
      setNotifyMentions(mentions);
      if (!isSubscribed) return;

      try {
        const reg = await getRegistrationWithRetry();
        const sub = await reg?.pushManager.getSubscription();
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
    error,
    subscribe,
    unsubscribe,
    updatePrefs,
    triggerPush,
  };
}
