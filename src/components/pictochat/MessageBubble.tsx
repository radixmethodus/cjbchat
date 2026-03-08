import { forwardRef } from "react";
import { format } from "date-fns";
import ImageLightbox from "./ImageLightbox";

export type PcMessage = {
  id: string;
  room: string;
  nickname: string;
  color: string;
  content: string;
  file_url: string | null;
  file_type: string | null;
  reply_to: string | null;
  created_at: string;
  reply_nickname?: string;
  reply_content?: string;
};

type Props = {
  message: PcMessage;
  isOwn: boolean;
  showName: boolean;
  onReply: (msg: PcMessage) => void;
};

const MessageBubble = forwardRef<HTMLDivElement, Props>(
  ({ message, isOwn, showName, onReply }, ref) => {
    const time = format(new Date(message.created_at), "HH:mm");
    const hasImage = message.file_url && message.file_type?.startsWith("image/");

    return (
      <div
        ref={ref}
        className={`flex flex-col ${showName ? "mt-3" : "mt-0.5"} ${isOwn ? "items-end" : "items-start"}`}
      >
        {/* Reply preview */}
        {message.reply_nickname && (
          <div className="text-[8px] font-pixel text-pc-text-muted px-2 mb-0.5 max-w-[80%] truncate">
            ↳ {message.reply_nickname}: {message.reply_content || "..."}
          </div>
        )}

        {/* Username - only show if different from previous */}
        {showName && (
          <div
            className="text-[10px] font-pixel font-bold px-1 mb-0.5"
            style={{ color: message.color }}
          >
            {message.nickname}
          </div>
        )}

        {/* Bubble - use div instead of button to avoid nested button issues */}
        <div
          onClick={() => onReply(message)}
          className={`pc-bubble ${isOwn ? "pc-bubble-own" : ""} px-3 py-2 max-w-[80%] text-left cursor-pointer hover:brightness-95 transition-all`}
          title="Click to reply"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onReply(message);
            }
          }}
        >
          {message.content && (
            <p className="text-[10px] font-pixel text-pc-text break-words whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          )}
          {hasImage && <ImageLightbox src={message.file_url!} />}
        </div>

        {/* Timestamp */}
        <span className="text-[8px] font-pixel text-pc-text-muted mt-0.5 px-1">
          {time}
        </span>
      </div>
    );
  }
);

MessageBubble.displayName = "MessageBubble";

export default MessageBubble;
