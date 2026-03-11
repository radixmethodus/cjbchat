import { forwardRef, useState, useRef, useCallback } from "react";
import { format } from "date-fns";
import ImageLightbox from "./ImageLightbox";
import MessageActionDrawer from "./MessageActionSlider";

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
};

const OBSCURE_PREFIX = "[OBSCURE]";

const MessageBubble = forwardRef<HTMLDivElement, Props>(
  ({ message, isOwn, showName, onReply, onReport, starCount, hasStarred, onToggleStar, activeSlider, onSliderOpen }, ref) => {
    const time = format(new Date(message.created_at), "h:mm a");
    const hasImage = message.file_url && message.file_type?.startsWith("image/");
    const isDrawerOpen = activeSlider === message.id;

    const isObscure = message.content?.startsWith(OBSCURE_PREFIX);
    const [revealed, setRevealed] = useState(false);
    const displayContent = isObscure
      ? message.content.slice(OBSCURE_PREFIX.length)
      : message.content;

    // Long-press detection for mobile
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handlePointerDown = useCallback(() => {
      longPressTimer.current = setTimeout(() => {
        onSliderOpen(message.id);
      }, 400);
    }, [message.id, onSliderOpen]);

    const handlePointerUp = useCallback(() => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }, []);

    const handlePointerLeave = useCallback(() => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }, []);

    const handleBubbleClick = useCallback(() => {
      if (isObscure && !revealed) {
        setRevealed(true);
      }
    }, [isObscure, revealed]);

    return (
      <div
        ref={ref}
        className={`flex flex-col animate-slide-up ${showName ? "mt-3" : "mt-0.5"} ${isOwn ? "items-end" : "items-start"}`}
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

        {/* Bubble */}
        <div className="relative max-w-[80%]">
          <div
            onClick={handleBubbleClick}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onContextMenu={(e) => e.preventDefault()}
            className={`pc-bubble ${isOwn ? "pc-bubble-own" : ""} px-3 py-2 text-left select-none relative`}
            title={isObscure && !revealed ? "Tap to reveal" : "Hold for actions"}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (isObscure && !revealed) {
                  setRevealed(true);
                  return;
                }
                onSliderOpen(isDrawerOpen ? null : message.id);
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

        {/* Action Drawer */}
        <MessageActionDrawer
          isOpen={isDrawerOpen}
          onClose={() => onSliderOpen(null)}
          onStar={() => onToggleStar(message.id)}
          onReply={() => onReply(message)}
          onReport={() => onReport(message.nickname)}
          starCount={starCount}
          hasStarred={hasStarred}
          messageNickname={message.nickname}
          messagePreview={message.content?.slice(0, 60)}
        />
      </div>
    );
  }
);

MessageBubble.displayName = "MessageBubble";

export default MessageBubble;
