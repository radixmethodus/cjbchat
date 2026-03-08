import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type CommandResult = {
  handled: boolean;
  systemMessage?: string;
};

type Channel = "general" | "secret";

export function useCommands(
  currentUserId: string,
  channel: Channel,
  setChannel: (c: Channel) => void,
  discoMode: boolean,
  setDiscoMode: (d: boolean) => void
) {
  const handleCommand = useCallback(
    async (raw: string): Promise<CommandResult> => {
      const trimmed = raw.trim();
      if (!trimmed.startsWith("/")) return { handled: false };

      const parts = trimmed.split(/\s+/);
      const cmd = parts[0].toLowerCase();

      switch (cmd) {
        case "/logout": {
          localStorage.removeItem("chatroom_user");
          sessionStorage.removeItem("chatroom_pin");
          window.location.href = "/";
          return { handled: true, systemMessage: "Logged out." };
        }

        case "/sudo": {
          return { handled: true, systemMessage: "This command has been disabled for security reasons." };
        }

        case "/secret": {
          setChannel("secret");
          return { handled: true, systemMessage: "Switched to secret room." };
        }

        case "/back": {
          setChannel("general");
          return { handled: true, systemMessage: "Switched to main room." };
        }

        case "/disco": {
          setDiscoMode(true);
          return { handled: true, systemMessage: "Disco enabled." };
        }

        case "/homescreen": {
          const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
          const isAndroid = /Android/.test(navigator.userAgent);

          // Android: try native install prompt
          if (isAndroid && (window as any).__pwaInstallPrompt) {
            const prompt = (window as any).__pwaInstallPrompt;
            prompt.prompt();
            return { handled: true, systemMessage: "Install prompt shown." };
          }

          // iOS: instructions only
          if (isIOS) {
            return {
              handled: true,
              systemMessage: "Tap the Share button (⬆︎) → Add to Home Screen.",
            };
          }

          // Desktop: download a shortcut .html file
          const appUrl = window.location.origin;
          const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${appUrl}"><title>CJR</title></head><body><a href="${appUrl}">Open CJR</a></body></html>`;
          const blob = new Blob([html], { type: "text/html" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "CJR.html";
          a.click();
          URL.revokeObjectURL(a.href);
          return { handled: true, systemMessage: "Shortcut downloaded." };
        }

        default:
          return { handled: true, systemMessage: `Unknown command: ${cmd}` };
      }
    },
    [setChannel, setDiscoMode]
  );

  return { handleCommand };
}
