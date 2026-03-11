import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onStar: () => void;
  onReply: () => void;
  onReport: () => void;
  starCount: number;
  hasStarred: boolean;
  messageNickname?: string;
  messagePreview?: string;
};

const MessageActionDrawer = ({
  isOpen,
  onClose,
  onStar,
  onReply,
  onReport,
  starCount,
  hasStarred,
  messageNickname,
  messagePreview,
}: Props) => {
  const actions = [
    {
      label: hasStarred ? `Starred (${starCount})` : `Star${starCount > 0 ? ` (${starCount})` : ""}`,
      icon: hasStarred ? "⭐" : "☆",
      onClick: onStar,
      accent: hasStarred,
    },
    {
      label: "Reply",
      icon: "↩",
      onClick: onReply,
      accent: false,
    },
    {
      label: "Report",
      icon: "⚠",
      onClick: onReport,
      accent: false,
      destructive: true,
    },
  ];

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-pc-body border-t-2 border-pc-border rounded-t-lg max-h-[40vh]">
        <DrawerHeader className="pb-1 pt-2 px-4">
          <DrawerTitle className="text-[11px] font-pixel font-bold text-pc-blue text-center">
            {messageNickname && (
              <span className="block text-pc-text-muted text-[9px] font-normal mb-0.5 truncate max-w-[80%] mx-auto">
                {messageNickname}: {messagePreview || "…"}
              </span>
            )}
            Message Actions
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-1 px-4 pb-4 pt-1">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                action.onClick();
                onClose();
              }}
              className={`flex items-center gap-3 px-4 py-3 text-[12px] font-pixel font-bold rounded-sm transition-all active:scale-[0.98] ${
                action.destructive
                  ? "text-destructive hover:bg-destructive/10"
                  : action.accent
                    ? "text-yellow-400 hover:bg-yellow-400/10"
                    : "text-pc-text hover:bg-pc-blue/10"
              }`}
            >
              <span className="text-[16px]">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MessageActionDrawer;
