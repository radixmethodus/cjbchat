import { Pin, ChevronDown, ChevronUp } from "lucide-react";
import { Message } from "./types";

type Props = {
  pinnedMessages: Message[];
  showPinned: boolean;
  setShowPinned: (v: boolean) => void;
  togglePin: (msg: Message) => void;
};

const PinnedBar = ({ pinnedMessages, showPinned, setShowPinned, togglePin }: Props) => {
  if (pinnedMessages.length === 0) return null;

  return (
    <div
      className="shrink-0"
      style={{ background: "hsl(var(--chat-surface))", borderBottom: "2px solid hsl(var(--chat-border))" }}
    >
      <button
        onClick={() => setShowPinned(!showPinned)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs transition-colors"
        style={{ color: "hsl(var(--chat-text-muted))" }}
      >
        <span className="flex items-center gap-1.5">
          <Pin className="h-3 w-3" />
          {pinnedMessages.length} pinned message{pinnedMessages.length > 1 ? "s" : ""}
        </span>
        {showPinned ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {showPinned && (
        <div className="px-4 pb-2 space-y-1 max-h-40 overflow-y-auto">
          {pinnedMessages.map((msg) => (
            <div
              key={msg.id}
              className="flex items-center gap-2 text-xs px-2 py-1.5"
              style={{ background: "hsl(var(--chat-input-bg))", border: "1px solid hsl(var(--chat-border))", borderRadius: "4px" }}
            >
              <span className="font-bold shrink-0" style={{ color: msg.chatroom_users?.color || "#aaa" }}>
                {msg.chatroom_users?.name}:
              </span>
              <span className="truncate" style={{ color: "hsl(var(--chat-text))" }}>
                {msg.file_url ? (msg.file_type === "image" ? "📷 Image" : "📎 File") : msg.content}
              </span>
              <button
                onClick={() => togglePin(msg)}
                className="ml-auto shrink-0 transition-colors"
                style={{ color: "hsl(var(--chat-text-muted))" }}
              >
                <Pin className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PinnedBar;
