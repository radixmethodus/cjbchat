import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRoomMessages } from "@/hooks/useRoomMessages";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useTypingPresence } from "@/hooks/useTypingPresence";
import MessageBubble, { type PcMessage } from "@/components/pictochat/MessageBubble";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const playMessageSound = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch { /* no audio */ }
};

const Room = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const nickname = sessionStorage.getItem("pc_nickname");
  const { selected: themeColor } = useThemeColor();
  const color = `hsl(${themeColor.hue}, ${themeColor.sat}%, 45%)`;
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<PcMessage | null>(null);
  const [sending, setSending] = useState(false);
  const [discoMode, setDiscoMode] = useState(false);
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const room = roomId?.toUpperCase() || "A";
  const { messages, loading, sendMessage, uploadImage } = useRoomMessages(room);
  const { typingUsers, setTyping } = useTypingPresence(room, nickname);

  const prevCountRef = useRef(0);

  useEffect(() => {
    if (!nickname) navigate("/");
  }, [nickname, navigate]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
    // Play sound for new messages (skip initial load)
    if (prevCountRef.current > 0 && messages.length > prevCountRef.current) {
      playMessageSound();
    }
    prevCountRef.current = messages.length;
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || !nickname || sending) return;

    // Check for /disco command
    if (trimmed.toLowerCase() === "/disco") {
      setDiscoMode((prev) => !prev);
      setInput("");
      toast.success(discoMode ? "Disco mode OFF" : "🪩 Disco mode ON!");
      return;
    }

    // Check for /report command
    if (trimmed.toLowerCase() === "/report") {
      toast.error("Usage: /report [nickname]");
      setInput("");
      return;
    }
    if (trimmed.toLowerCase().startsWith("/report ")) {
      const target = trimmed.slice(8).trim();
      if (target.toLowerCase() === nickname.toLowerCase()) {
        toast.error("You can't report yourself!");
        setInput("");
        return;
      }
      setReportTarget(target);
      setInput("");
      toast.info(`Reporting ${target} — type your reason and press Send`);
      inputRef.current?.focus();
      return;
    }

    // Handle report reason submission
    if (reportTarget) {
      setSending(true);
      const { error } = await supabase.from("complaints" as any).insert({
        room,
        reporter_nickname: nickname,
        reported_nickname: reportTarget,
        reason: trimmed.slice(0, 500),
      } as any);
      if (error) {
        toast.error("Failed to submit report");
      } else {
        toast.success(`Report against ${reportTarget} submitted`);
      }
      setReportTarget(null);
      setInput("");
      setSending(false);
      inputRef.current?.focus();
      return;
    }

    setSending(true);
    const msgColor = discoMode ? "disco" : color;
    const error = await sendMessage(nickname, trimmed, msgColor, replyTo?.id);
    if (error) {
      toast.error(error.message || "Failed to send");
    } else {
      setInput("");
      setReplyTo(null);
      setTyping(false);
      inputRef.current?.focus();
    }
    setSending(false);
  }, [input, nickname, color, replyTo, sending, sendMessage, discoMode, reportTarget, room]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !nickname || sending) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only images are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max file size is 5MB");
      return;
    }
    setSending(true);
    const { url, error: upError } = await uploadImage(file);
    if (upError || !url) {
      toast.error("Upload failed");
      setSending(false);
      return;
    }
    const error = await sendMessage(nickname, input.trim(), color, replyTo?.id, url, file.type);
    if (error) {
      toast.error(error.message || "Failed to send");
    } else {
      setInput("");
      setReplyTo(null);
      setTyping(false);
      inputRef.current?.focus();
    }
    setSending(false);
    // Reset file input
    if (fileRef.current) fileRef.current.value = "";
  }, [input, nickname, color, replyTo, sending, sendMessage, uploadImage]);

  const handleReply = useCallback((msg: PcMessage) => {
    setReplyTo(msg);
    inputRef.current?.focus();
  }, []);

  if (!nickname) return null;

  return (
    <div className={`flex flex-col h-[100dvh] bg-pc-body ${discoMode ? "disco-mode" : ""}`}>
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
            (() => {
              // Merge messages and presence events into a single timeline
              type TimelineItem =
                | { kind: "msg"; data: PcMessage }
                | { kind: "event"; data: PresenceEvent };

              const timeline: TimelineItem[] = [
                ...messages.map((m) => ({ kind: "msg" as const, data: m })),
                ...presenceEvents.map((e) => ({ kind: "event" as const, data: e })),
              ].sort((a, b) => {
                const tA = a.kind === "msg" ? new Date(a.data.created_at).getTime() : a.data.timestamp;
                const tB = b.kind === "msg" ? new Date(b.data.created_at).getTime() : b.data.timestamp;
                return tA - tB;
              });

              let prevNickname: string | null = null;
              return timeline.map((item) => {
                if (item.kind === "event") {
                  prevNickname = null;
                  const e = item.data;
                  return (
                    <div
                      key={e.id}
                      className="text-center text-[8px] font-pixel text-pc-text-muted my-2 opacity-60"
                    >
                      {e.type === "join" ? `▸ ${e.nickname} joined` : `◂ ${e.nickname} left`}
                    </div>
                  );
                }
                const msg = item.data;
                const showName = prevNickname !== msg.nickname;
                prevNickname = msg.nickname;
                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.nickname === nickname}
                    showName={showName}
                    onReply={handleReply}
                  />
                );
              });
            })()
          )}
        </div>
      </div>

      {/* Hinge */}
      <div className="ds-hinge mx-1" />

      {/* Bottom screen - input area */}
      <div className="shrink-0 ds-screen-bottom m-1 mt-0 p-3">
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="text-[8px] font-pixel text-pc-text-muted mb-1 animate-pulse">
            {typingUsers.length === 1
              ? `${typingUsers[0]} is typing...`
              : `${typingUsers.join(", ")} are typing...`}
          </div>
        )}
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

        {/* Report reason prompt */}
        {reportTarget && (
          <div className="flex items-center gap-2 mb-2 text-[8px] font-pixel text-destructive">
            <span>⚠ Reporting <strong>{reportTarget}</strong> — type reason below</span>
            <button
              onClick={() => setReportTarget(null)}
              className="text-pc-blue hover:brightness-125"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex gap-2">
          {/* Image upload button */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={sending}
            className="px-2 py-2 text-[10px] font-pixel bg-pc-screen border-2 border-pc-border text-pc-text-muted hover:text-pc-blue hover:border-pc-blue disabled:opacity-40 transition-all"
            title="Upload image"
          >
            📷
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          <input
            ref={inputRef}
            type="text"
            name="pc-msg-input"
            id="pc-msg-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setTyping(e.target.value.length > 0);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            maxLength={2000}
            placeholder={reportTarget ? "Type your reason..." : "Type a message..."}
            autoComplete="new-password"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-protonpass-ignore="true"
            aria-autocomplete="none"
            role="presentation"
            className="pc-input flex-1 px-3 py-2 text-[10px] font-pixel bg-pc-screen border-2 border-pc-border text-pc-text outline-none focus:border-pc-blue"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="px-4 py-2 text-[10px] font-pixel font-bold bg-pc-blue-btn text-primary-foreground border-2 border-pc-blue-dark disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:brightness-90 transition-all"
          >
            {reportTarget ? "Report" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Room;
