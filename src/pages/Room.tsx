import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRoomMessages } from "@/hooks/useRoomMessages";
import { useThemeColor } from "@/hooks/useThemeColor";
import MessageBubble, { type PcMessage } from "@/components/pictochat/MessageBubble";
import { toast } from "sonner";

const COLORS = ["#00B800", "#E03030", "#3080E0", "#E0A000", "#B040D0", "#E07020", "#20B0B0", "#808080"];

const Room = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const nickname = sessionStorage.getItem("pc_nickname");
  const [color] = useState(() => {
    const saved = sessionStorage.getItem("pc_color");
    if (saved) return saved;
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    sessionStorage.setItem("pc_color", c);
    return c;
  });
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<PcMessage | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const room = roomId?.toUpperCase() || "A";
  const { messages, loading, sendMessage } = useRoomMessages(room);

  // Redirect if no nickname
  useEffect(() => {
    if (!nickname) navigate("/");
  }, [nickname, navigate]);

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || !nickname || sending) return;
    setSending(true);
    const error = await sendMessage(nickname, trimmed, color, replyTo?.id);
    if (error) {
      toast.error(error.message || "Failed to send");
    } else {
      setInput("");
      setReplyTo(null);
      inputRef.current?.focus();
    }
    setSending(false);
  }, [input, nickname, color, replyTo, sending, sendMessage]);

  const handleReply = useCallback((msg: PcMessage) => {
    setReplyTo(msg);
    inputRef.current?.focus();
  }, []);

  if (!nickname) return null;

  return (
    <div className="flex flex-col h-[100dvh] bg-pc-body">
      {/* Header bar */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b-2 border-pc-border bg-pc-body">
        <button
          onClick={() => navigate("/")}
          className="text-[10px] font-pixel text-pc-blue hover:brightness-125 transition-all"
        >
          ◀ Back
        </button>
        <span className="text-xs font-pixel font-bold text-pc-blue">
          Chat Room {room}
        </span>
        <span className="text-[8px] font-pixel text-pc-text-muted">
          {messages.length} msgs
        </span>
      </div>

      {/* Top screen - message list */}
      <div className="flex-1 min-h-0 ds-screen m-1 mb-0">
        <div ref={scrollRef} className="h-full overflow-y-auto p-3">
          {loading ? (
            <p className="text-center text-[10px] font-pixel text-pc-text-muted py-8">
              Loading...
            </p>
          ) : messages.length === 0 ? (
            <p className="text-center text-[10px] font-pixel text-pc-text-muted py-8">
              No messages yet. Say something!
            </p>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.nickname === nickname}
                onReply={handleReply}
              />
            ))
          )}
        </div>
      </div>

      {/* Hinge */}
      <div className="ds-hinge mx-1" />

      {/* Bottom screen - input area */}
      <div className="shrink-0 ds-screen-bottom m-1 mt-0 p-3">
        {/* Reply indicator */}
        {replyTo && (
          <div className="flex items-center gap-2 mb-2 text-[8px] font-pixel text-pc-text-muted">
            <span>↳ Replying to <strong style={{ color: replyTo.color }}>{replyTo.nickname}</strong></span>
            <button
              onClick={() => setReplyTo(null)}
              className="text-pc-blue hover:brightness-125"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            maxLength={2000}
            placeholder="Type a message..."
            className="pc-input flex-1 px-3 py-2 text-[10px] font-pixel bg-pc-screen border-2 border-pc-border text-pc-text outline-none focus:border-pc-blue"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="px-4 py-2 text-[10px] font-pixel font-bold bg-pc-blue text-primary-foreground border-2 border-pc-blue-dark disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:brightness-90 transition-all"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Room;
