import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Register PWA service worker (required for PushManager subscriptions)
registerSW({
  immediate: true,
  onRegistered(r) {
    // Best-effort: keep SW up to date
    r?.update();
  },
});

// Hide the iOS keyboard accessory bar (Prev/Next/Done) in native shell
if (Capacitor.isNativePlatform()) {
  Keyboard.setAccessoryBarVisible({ isVisible: false });
}

// Capture the PWA install prompt for Android so /homescreen can trigger it
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  (window as any).__pwaInstallPrompt = e;
});

createRoot(document.getElementById("root")!).render(<App />);

