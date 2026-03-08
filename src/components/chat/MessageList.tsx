import { forwardRef } from "react";
import { isSameDay, isToday, isYesterday, format } from "date-fns";
import { Message, SystemMessage, JOIN_MARKER, CHAT_FONT } from "./types";
import MessageBubble from "./MessageBubble";

type Props = {
  messages: Message[];
  systemMessages: SystemMessage[];
  currentUserId: string;
  showNewMessagePill: boolean;
  onScrollToBottom: () => void;
  onTogglePin: (msg: Message) => void;
  onDelete: (msg: Message) => void;
  onImageClick: (url: string) => void;
};

const formatDateSeparator = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
};

const isConsecutive = (messages: Message[], msg: Message, idx: number) => {
  if (idx === 0) return false;
  if (msg.content?.startsWith(JOIN_MARKER)) return false;
  const prev = messages[idx - 1];
  if (prev.content?.startsWith(JOIN_MARKER)) return false;
  return prev.user_id === msg.user_id && isSameDay(new Date(prev.created_at), new Date(msg.created_at));
};

const isNewDay = (messages: Message[], idx: number) => {
  if (idx === 0) return true;
  return !isSameDay(new Date(messages[idx - 1].created_at), new Date(messages[idx].created_at));
};

const DateSeparator = ({ dateStr }: { dateStr: string }) => (
  <div className="flex items-center gap-3 mt-4 mb-2 px-2">
    <span
      className="text-[11px] font-bold shrink-0 select-none"
      style={{ color: "hsl(var(--chat-text-muted))", fontFamily: CHAT_FONT }}
    >
      {formatDateSeparator(dateStr)}
    </span>
    <div className="flex-1 h-px" style={{ background: "hsl(var(--chat-border))" }} />
  </div>
);

const MessageList = forwardRef<HTMLDivElement, Props>(
  ({ messages, systemMessages, currentUserId, showNewMessagePill, onScrollToBottom, onTogglePin, onDelete, onImageClick }, ref) => {
    return (
      <div ref={ref} className="flex-1 overflow-y-auto px-5 py-3 relative" style={{ background: "rgba(0,0,0,0.3)" }}>
        {messages.length === 0 && systemMessages.length === 0 && (
          <p className="text-center text-sm mt-8" style={{ color: "hsl(var(--chat-text-muted))" }}>
            No messages yet. Say hello! 👋
          </p>
        )}

        {messages.map((msg, idx) => {
          const isJoinMsg = msg.content?.startsWith(JOIN_MARKER);
          const newDay = isNewDay(messages, idx);

          if (isJoinMsg) {
            const joinText = msg.content!.slice(JOIN_MARKER.length);
            return (
              <div key={msg.id}>
                {newDay && <DateSeparator dateStr={msg.created_at} />}
                <div className="flex justify-center py-1.5">
                  <span className="text-xs italic px-3 py-1" style={{ color: "hsl(var(--chat-text-muted))", fontFamily: CHAT_FONT }}>
                    {joinText}
                  </span>
                </div>
              </div>
            );
          }

          const consecutive = !newDay && isConsecutive(messages, msg, idx);

          return (
            <div key={msg.id}>
              {newDay && <DateSeparator dateStr={msg.created_at} />}
              <MessageBubble
                msg={msg}
                consecutive={consecutive}
                isOwn={msg.user_id === currentUserId}
                onTogglePin={onTogglePin}
                onDelete={onDelete}
                onImageClick={onImageClick}
              />
            </div>
          );
        })}

        {systemMessages.map((sm) => (
          <div key={sm.id} className="px-3 py-1.5">
            <span className="text-xs italic" style={{ color: "hsl(var(--chat-text-muted))" }}>{sm.text}</span>
          </div>
        ))}

        {showNewMessagePill && (
          <button
            onClick={onScrollToBottom}
            className="sticky bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 text-xs font-bold shadow-lg transition-all z-10"
            style={{
              background: "hsl(var(--chat-surface))",
              color: "hsl(var(--chat-text))",
              border: "2px solid hsl(var(--chat-border))",
              borderRadius: "4px",
              fontFamily: CHAT_FONT,
            }}
          >
            ↓ New messages
          </button>
        )}
      </div>
    );
  }
);

MessageList.displayName = "MessageList";

export default MessageList;
