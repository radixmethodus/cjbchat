import { useState, useCallback } from "react";

export function useNotificationPrefs() {
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem("chat_sound_enabled") !== "false"
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem("chat_notifications_enabled") !== "false"
  );

  const toggleSound = useCallback((val: boolean) => {
    setSoundEnabled(val);
    localStorage.setItem("chat_sound_enabled", String(val));
  }, []);

  const toggleNotifications = useCallback(async (val: boolean) => {
    if (val && "Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setNotificationsEnabled(false);
        localStorage.setItem("chat_notifications_enabled", "false");
        return false;
      }
    }
    setNotificationsEnabled(val);
    localStorage.setItem("chat_notifications_enabled", String(val));
    return true;
  }, []);

  const playSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // AudioContext not available
    }
  }, [soundEnabled]);

  const showNotification = useCallback(
    (senderName: string, content: string) => {
      if (!notificationsEnabled || !document.hidden) return;
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`New message from ${senderName}`, {
          body: content || "Sent a file",
          icon: "/favicon.png",
        });
      }
    },
    [notificationsEnabled]
  );

  return {
    soundEnabled,
    notificationsEnabled,
    toggleSound,
    toggleNotifications,
    playSound,
    showNotification,
  };
}
