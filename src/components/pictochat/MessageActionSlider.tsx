import { useEffect, useRef } from "react";

type Props = {
  isOwn: boolean;
  isOpen: boolean;
  onClose: () => void;
  onStar: () => void;
  onReply: () => void;
  onReport: () => void;
  starCount: number;
  hasStarred: boolean;
};

const MessageActionSlider = ({
  isOwn,
  isOpen,
  onClose,
  onStar,
  onReply,
  onReport,
  starCount,
  hasStarred,
}: Props) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid immediate close from the same click that opened it
    const timer = setTimeout(() => {
      window.addEventListener("click", handleClick, true);
    }, 10);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", handleClick, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      label: hasStarred ? `Starred (${starCount})` : `Star${starCount > 0 ? ` (${starCount})` : ""}`,
      icon: hasStarred ? "⭐" : "☆",
      onClick: onStar,
      className: hasStarred ? "text-yellow-400" : "text-pc-text",
    },
    {
      label: "Reply",
      icon: "↩",
      onClick: onReply,
      className: "text-pc-text",
    },
    {
      label: "Report",
      icon: "⚠",
      onClick: onReport,
      className: "text-destructive",
    },
  ];

  return (
    <div
      ref={panelRef}
      className={`absolute top-0 z-20 flex flex-col gap-0.5 py-1.5 px-1 bg-pc-screen border-2 border-pc-border shadow-lg action-slider-enter ${
        isOwn ? "right-full mr-1" : "left-full ml-1"
      }`}
      style={{ minWidth: "72px" }}
      role="menu"
      aria-label="Message actions"
    >
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
            onClose();
          }}
          className={`flex items-center gap-1.5 px-2 py-1.5 text-[9px] font-pixel font-bold rounded-none hover:bg-pc-blue/20 active:scale-95 transition-all ${action.className}`}
          role="menuitem"
        >
          <span className="text-[11px]">{action.icon}</span>
          {action.label}
        </button>
      ))}
    </div>
  );
};

export default MessageActionSlider;
