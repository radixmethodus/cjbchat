import { forwardRef, useState, useCallback } from "react";
import { format } from "date-fns";
import ImageLightbox from "./ImageLightbox";
import MessageActionSlider from "./MessageActionSlider";

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
  onReport: (nickname: string) => void;
  starCount: number;
  hasStarred: boolean;
  onToggleStar: (messageId: string) => void;
  activeSlider: string | null;
  onSliderOpen: (id: string | null) => void;
  animate?: boolean;
};

const OBSCURE_PREFIX = "[OBSCURE]";

const MessageBubble = forwardRef<HTMLDivElement, Props>(
  ({ message, isOwn, showName, onReply, onReport, starCount, hasStarred, onToggleStar, activeSlider, onSliderOpen, animate = true }, ref) => {
    const time = format(new Date(message.created_at), "h:mm a");
    const hasImage = message.file_url && message.file_type?.startsWith("image/");
    const isSliderOpen = activeSlider === message.id;

    const isObscure = message.content?.startsWith(OBSCURE_PREFIX);
    const [revealed, setRevealed] = useState(false);
    const displayContent = isObscure
      ? message.content.slice(OBSCURE_PREFIX.length)
      : message.content;

    const handleBubbleClick = useCallback(() => {
      if (isObscure && !revealed) {
        setRevealed(true);
        return;
      }
      onSliderOpen(isSliderOpen ? null : message.id);
    }, [isObscure, revealed, isSliderOpen, message.id, onSliderOpen]);

    return (
      <div
        ref={ref}
        className={`flex flex-col ${animate ? "animate-slide-up" : ""} ${showName ? "mt-3" : "mt-0.5"} ${isOwn ? "items-end" : "items-start"}`}
      >
        {/* Reply preview */}
        {message.reply_nickname && (
          <div className="text-[8px] font-pixel text-pc-text-muted px-2 mb-0.5 max-w-[80%] truncate">
            ↳ {message.reply_nickname}: {message.reply_content || "..."}
          </div>
        )}

        {/* Username */}
        {showName && (
          <div
            className="text-[10px] font-pixel font-bold px-1 mb-0.5"
            style={{ color: message.color === "disco" ? "hsl(var(--pc-blue))" : message.color }}
          >
            {message.nickname}
          </div>
        )}

        {/* Bubble + inline actions row */}
        <div className={`flex items-start gap-1.5 max-w-[90%] ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
          <div
            onClick={handleBubbleClick}
            onContextMenu={(e) => e.preventDefault()}
            className={`pc-bubble ${isOwn ? "pc-bubble-own" : ""} px-3 py-2 text-left select-none relative cursor-pointer shrink`}
            title={isObscure && !revealed ? "Tap to reveal" : "Tap for actions"}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleBubbleClick();
              }
            }}
          >
            {displayContent && (
              <p
                className={`text-[13px] font-pixel break-words whitespace-pre-wrap leading-relaxed transition-all duration-200 ${
                  message.color === "disco" ? "disco-text" : "text-pc-text"
                } ${isObscure && !revealed ? "obscure-blur" : ""}`}
              >
                {displayContent}
              </p>
            )}
            {isObscure && !revealed && (
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-pixel text-pc-text-muted pointer-events-none">
                🔒 Tap to reveal
              </span>
            )}
            {hasImage && <ImageLightbox src={message.file_url!} />}
          </div>

          <MessageActionSlider
            isOpen={isSliderOpen}
            onStar={() => { onToggleStar(message.id); onSliderOpen(null); }}
            onReply={() => { onReply(message); onSliderOpen(null); }}
            onReport={() => { onReport(message.nickname); onSliderOpen(null); }}
            starCount={starCount}
            hasStarred={hasStarred}
          />
        </div>

        {/* Star count + Timestamp */}
        <div className="flex items-center gap-1.5 mt-0.5 px-1">
          {starCount > 0 && (
            <span
              className={`text-[9px] font-pixel flex items-center gap-0.5 ${
                hasStarred ? "text-yellow-400" : "text-pc-text-muted"
              }`}
            >
              ⭐ {starCount}
            </span>
          )}
          <span className="text-[8px] font-pixel text-pc-text-muted">
            {time}
          </span>
        </div>
      </div>
    );
  }
);

MessageBubble.displayName = "MessageBubble";

export default MessageBubble;
