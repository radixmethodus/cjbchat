type Props = {
  isOpen: boolean;
  onStar: () => void;
  onReply: () => void;
  onReport: () => void;
  starCount: number;
  hasStarred: boolean;
};

const MessageActionSlider = ({
  isOpen,
  onStar,
  onReply,
  onReport,
  starCount,
  hasStarred,
}: Props) => {
  if (!isOpen) return null;

  return (
    <div className="flex items-center gap-2 px-1 shrink-0 action-slider-enter">
      <button
        onClick={onStar}
        className={`text-[11px] font-pixel underline hover:no-underline transition-colors ${
          hasStarred ? "text-yellow-400" : "text-pc-text-muted"
        }`}
      >
        Star{starCount > 0 ? ` (${starCount})` : ""}
      </button>
      <button
        onClick={onReply}
        className="text-[11px] font-pixel text-pc-text-muted underline hover:no-underline transition-colors"
      >
        Reply
      </button>
      <button
        onClick={onReport}
        className="text-[11px] font-pixel text-destructive underline hover:no-underline transition-colors"
      >
        Report
      </button>
    </div>
  );
};

export default MessageActionSlider;
