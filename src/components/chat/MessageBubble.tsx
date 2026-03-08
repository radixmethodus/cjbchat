import { Pin, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";
import { Message, AVATAR_STYLE, DISCO_MARKER, CHAT_FONT } from "./types";

type Props = {
  msg: Message;
  consecutive: boolean;
  isOwn: boolean;
  onTogglePin: (msg: Message) => void;
  onDelete: (msg: Message) => void;
  onImageClick: (url: string) => void;
};

const renderContent = (content: string | null) => {
  if (!content) return null;
  const isDisco = content.startsWith(DISCO_MARKER);
  const text = isDisco ? content.slice(DISCO_MARKER.length) : content;
  return <span className={`whitespace-pre-wrap ${isDisco ? "rainbow-text" : ""}`}>{text}</span>;
};

const MessageBubble = ({ msg, consecutive, isOwn, onTogglePin, onDelete, onImageClick }: Props) => {
  const senderColor = msg.chatroom_users?.color || "#888";
  const senderName = msg.chatroom_users?.name || "Unknown";

  return (
    <div
      className={`group flex items-start gap-3 px-3 py-1.5 ${!consecutive ? "mt-2" : ""}`}
      style={{ borderBottom: "1px solid hsl(var(--chat-border) / 0.4)" }}
    >
      {!consecutive ? (
        <div
          className="w-9 h-9 shrink-0 flex items-center justify-center text-base mt-0.5"
          style={{ ...AVATAR_STYLE, background: senderColor }}
        >
          {senderName.charAt(0).toUpperCase()}
        </div>
      ) : (
        <div className="w-9 shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        {!consecutive && (
          <span className="text-sm font-bold mr-2" style={{ color: senderColor, fontFamily: CHAT_FONT }}>
            {senderName}
          </span>
        )}
        <div className="flex items-end gap-3">
          <div className="text-sm leading-relaxed flex-1 min-w-0 py-0.5" style={{ color: "hsl(var(--chat-text))" }}>
            {msg.file_url && msg.file_type === "image" ? (
              <button onClick={() => onImageClick(msg.file_url!)} className="block mt-1">
                <img
                  src={msg.file_url}
                  alt={msg.content || "image"}
                  className="max-w-[200px] max-h-[150px] object-cover cursor-pointer"
                  style={{ border: "2px solid hsl(var(--chat-border))", borderRadius: "4px" }}
                />
              </button>
            ) : msg.file_url ? (
              <a
                href={msg.file_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 underline text-sm"
                style={{ color: "hsl(210 60% 40%)" }}
              >
                <FileText className="h-4 w-4 shrink-0" />
                {msg.content || "Download file"}
              </a>
            ) : (
              renderContent(msg.content)
            )}
          </div>
          <span
            className="text-[10px] shrink-0 select-none leading-5"
            style={{ color: "hsl(var(--chat-text-muted))", fontFamily: CHAT_FONT }}
          >
            {format(new Date(msg.created_at), "h:mm a")}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-0.5 shrink-0 pt-0.5 w-[3.5rem] justify-end">
        <button
          onClick={() => onTogglePin(msg)}
          className={`opacity-0 group-hover:opacity-100 transition-opacity ${msg.is_pinned ? "!opacity-100" : ""}`}
          style={{ color: msg.is_pinned ? "hsl(45 90% 40%)" : "hsl(var(--chat-text-muted))" }}
          title={msg.is_pinned ? "Unpin message" : "Pin message"}
        >
          <Pin className="h-3.5 w-3.5" />
        </button>
        {isOwn ? (
          <button
            onClick={() => onDelete(msg)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "hsl(var(--chat-text-muted))" }}
            title="Delete message"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : (
          <span className="w-3.5" />
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
