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
  onReply: (msg: PcMessage) => void;
};

const MessageBubble = ({ message, isOwn, onReply }: Props) => {
  const time = format(new Date(message.created_at), "HH:mm");
  const hasImage = message.file_url && message.file_type?.startsWith("image/");

  return (
    <div className={`flex flex-col mb-4 ${isOwn ? "items-end" : "items-start"}`}>
      {/* Reply preview */}
      {message.reply_nickname && (
        <div className="text-[8px] font-pixel text-pc-text-muted px-2 mb-0.5 max-w-[80%] truncate">
          ↳ {message.reply_nickname}: {message.reply_content || "..."}
        </div>
      )}

      {/* Username */}
      <div
        className="text-[10px] font-pixel font-bold px-1 mb-0.5"
        style={{ color: message.color }}
      >
        {message.nickname}
      </div>

      {/* Bubble */}
      <button
        onClick={() => onReply(message)}
        className={`pc-bubble ${isOwn ? "pc-bubble-own" : ""} px-3 py-2 max-w-[80%] text-left cursor-pointer hover:brightness-95 transition-all`}
        title="Click to reply"
      >
        {message.content && (
          <p className="text-[10px] font-pixel text-pc-text break-words whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        )}
        {hasImage && <ImageLightbox src={message.file_url!} />}
      </button>

      {/* Timestamp */}
      <span className="text-[8px] font-pixel text-pc-text-muted mt-0.5 px-1">
        {time}
      </span>
    </div>
  );
};

export default MessageBubble;
