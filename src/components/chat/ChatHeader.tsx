import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, Volume2, Users } from "lucide-react";
import { ChatUser, GLASS_STYLE, AVATAR_STYLE, CHAT_FONT } from "./types";

type OnlineUser = { user_id: string; name: string; color: string };

type Props = {
  currentUser: ChatUser;
  channel: "general" | "secret";
  onlineUsers: OnlineUser[];
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  toggleSound: (val: boolean) => void;
  toggleNotifications: (val: boolean) => void;
};

const ChatHeader = ({
  currentUser,
  channel,
  onlineUsers,
  soundEnabled,
  notificationsEnabled,
  toggleSound,
  toggleNotifications,
}: Props) => {
  return (
    <header
      className="flex items-center justify-between px-4 py-3 shrink-0 relative"
      style={{
        ...GLASS_STYLE,
        borderTop: "none",
        borderLeft: "none",
        borderRight: "none",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        fontFamily: CHAT_FONT,
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 shrink-0 flex items-center justify-center text-sm"
          style={{ ...AVATAR_STYLE, background: currentUser.color }}
        >
          {currentUser.name.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-bold" style={{ color: "hsl(var(--chat-text))", fontFamily: "'Courier New', monospace" }}>
          {currentUser.name}
        </span>
      </div>

      <span className="text-xs absolute left-1/2 -translate-x-1/2" style={{ color: "hsl(var(--chat-text-muted))", fontFamily: "'Courier New', monospace" }}>
        {channel === "secret" ? "Secret Room" : "Welcome to CJ's Room"}
      </span>

      <div className="flex items-center gap-1">
        {/* Online users */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" style={{ color: "hsl(var(--chat-text-muted))" }}>
              <Users className="h-4 w-4" />
              <span
                className="absolute -top-0.5 -right-0.5 text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
                style={{ background: "hsl(var(--chat-accent-green))", color: "white" }}
              >
                {onlineUsers.length}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-48 p-2"
            style={{
              background: "hsl(var(--chat-surface))",
              border: "2px solid hsl(var(--chat-border))",
              borderRadius: "4px",
            }}
          >
            <p className="text-xs font-bold mb-2" style={{ color: "hsl(var(--chat-text))", fontFamily: CHAT_FONT }}>
              Online now
            </p>
            <div className="space-y-1.5">
              {onlineUsers.map((u) => (
                <div key={u.user_id} className="flex items-center gap-2">
                  <div className="w-2 h-2" style={{ background: "hsl(var(--chat-accent-green))", borderRadius: "2px" }} />
                  <span className="text-xs font-bold" style={{ color: u.color }}>{u.name}</span>
                </div>
              ))}
              {onlineUsers.length === 0 && (
                <span className="text-xs" style={{ color: "hsl(var(--chat-text-muted))" }}>No one else online</span>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Notification settings */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" style={{ color: "hsl(var(--chat-text-muted))" }}>
              <Bell className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-52 p-3"
            style={{
              background: "hsl(var(--chat-surface))",
              border: "2px solid hsl(var(--chat-border))",
              borderRadius: "4px",
            }}
          >
            <p className="text-xs font-bold mb-3" style={{ color: "hsl(var(--chat-text))", fontFamily: CHAT_FONT }}>
              Notifications
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-3.5 w-3.5" style={{ color: "hsl(var(--chat-text-muted))" }} />
                  <span className="text-xs" style={{ color: "hsl(var(--chat-text))" }}>Sound</span>
                </div>
                <Switch checked={soundEnabled} onCheckedChange={toggleSound} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5" style={{ color: "hsl(var(--chat-text-muted))" }} />
                  <span className="text-xs" style={{ color: "hsl(var(--chat-text))" }}>Browser</span>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={toggleNotifications}
                  disabled={"Notification" in window && Notification.permission === "denied"}
                />
              </div>
              {"Notification" in window && Notification.permission === "denied" && (
                <p className="text-[10px]" style={{ color: "hsl(var(--chat-text-muted))" }}>
                  Browser notifications blocked. Enable in browser settings.
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
};

export default ChatHeader;
