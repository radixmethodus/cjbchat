import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRoomMessages } from "@/hooks/useRoomMessages";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useTypingPresence } from "@/hooks/useTypingPresence";
import { useStars } from "@/hooks/useStars";
import MessageBubble, { type PcMessage } from "@/components/pictochat/MessageBubble";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

// Shared AudioContext for reuse
let sharedAudioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    sharedAudioCtx = new AudioContext();
  }
  return sharedAudioCtx;
}

const playSendSound = () => {
  try {
    const ctx = getAudioCtx();
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

const playReceiveSound = () => {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.setValueAtTime(440, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch { /* no audio */ }
};

type InlineAlert = {
  id: string;
  text: string;
  type: "info" | "error" | "success";
};

const COLOR_RE = /^hsl\(\d+,\s*\d+%,\s*\d+%\)$/;

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
  const [alerts, setAlerts] = useState<InlineAlert[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [activeSlider, setActiveSlider] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const initialScrollDone = useRef(false);
  const lastSendTimeRef = useRef(0);

  const room = roomId?.toUpperCase() || "A";

  // Validate nickname on mount
  useEffect(() => {
    if (nickname && nickname.length > 20) {
      sessionStorage.removeItem("pc_nickname");
      navigate("/");
    }
  }, [nickname, navigate]);

  const { messages, loading, loadingMore, hasMore, loadMore, sendMessage, uploadImage } = useRoomMessages(room);
  const { typingUsers, setTyping } = useTypingPresence(room, nickname);
  const { toggleStar, getStarCount, hasStarred } = useStars(room, nickname);

  const prevCountRef = useRef(0);

  // Derive unique participants from messages
  const participants = useMemo(() => {
    const map = new Map<string, string>();
    for (const msg of messages) {
      if (!map.has(msg.nickname)) {
        map.set(msg.nickname, msg.color);
      }
    }
    return Array.from(map.entries()).map(([name, clr]) => ({ name, color: clr }));
  }, [messages]);

  const showAlert = useCallback((text: string, type: InlineAlert["type"] = "info") => {
    const id = crypto.randomUUID();
    setAlerts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, 3500);
  }, []);

  useEffect(() => {
    if (!nickname) navigate("/");
  }, [nickname, navigate]);

  // Scroll to bottom: instant on first load, smooth on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || messages.length === 0) return;

    if (!initialScrollDone.current) {
      el.scrollTop = el.scrollHeight;
      initialScrollDone.current = true;
      prevCountRef.current = messages.length;
      return;
    }

    if (messages.length > prevCountRef.current) {
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
      if (isNearBottom) {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }
      if (messages[messages.length - 1]?.nickname !== nickname) {
        playReceiveSound();
      }
    }
    prevCountRef.current = messages.length;
  }, [messages.length, nickname]);

  // Reset initial scroll flag when room changes
  useEffect(() => {
    initialScrollDone.current = false;
    prevCountRef.current = 0;
  }, [room]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || !nickname || sending) return;

    // Throttle: 1 message per second
    const now = Date.now();
    if (now - lastSendTimeRef.current < 1000) {
      showAlert("Slow down! Wait a second between messages.", "error");
      return;
    }

    // === SECRET COMMANDS ===

    if (trimmed.toLowerCase() === "/disco") {
      setDiscoMode((prev) => !prev);
      setInput("");
      showAlert(discoMode ? "Disco mode OFF" : "🪩 Disco mode ON!", "success");
      return;
    }

    // /secret — navigate to hidden room E
    if (trimmed.toLowerCase() === "/secret") {
      setInput("");
      showAlert("Entering secret room...", "info");
      setTimeout(() => navigate("/room/E"), 600);
      return;
    }

    // /complaints — show local-only complaint list
    if (trimmed.toLowerCase() === "/complaints") {
      setInput("");
      try {
        const { data, error } = await supabase
          .from("complaints_public" as any)
          .select("*")
          .eq("room", room)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error || !data || (data as any[]).length === 0) {
          showAlert("No complaints found for this room.", "info");
        } else {
          (data as any[]).forEach((c: any) => {
            showAlert(`⚠ ${c.reported_nickname}: ${c.reason || "No reason given"}`, "info");
          });
        }
      } catch {
        showAlert("Failed to load complaints.", "error");
      }
      return;
    }

    // /obscure [text] — send blurred message
    if (trimmed.toLowerCase().startsWith("/obscure ")) {
      const obscureText = trimmed.slice(9).trim();
      if (!obscureText) {
        showAlert("Usage: /obscure [message]", "error");
        setInput("");
        return;
      }
      setSending(true);
      lastSendTimeRef.current = Date.now();
      const msgColor = discoMode ? "disco" : color;
      if (!COLOR_RE.test(msgColor) && msgColor !== "disco") {
        showAlert("Invalid color", "error");
        setSending(false);
        return;
      }
      const error = await sendMessage(nickname, `[OBSCURE]${obscureText}`, msgColor, replyTo?.id);
      if (error) {
        showAlert(error.message || "Failed to send", "error");
      } else {
        playSendSound();
        try {
          await supabase.functions.invoke("send-push", {
            body: { room, nickname, content: `[OBSCURE]${obscureText}` },
          });
        } catch { /* fire-and-forget */ }
        setInput("");
        setReplyTo(null);
        setTyping(false);
        inputRef.current?.focus();
      }
      setSending(false);
      return;
    }

    if (trimmed.toLowerCase() === "/report") {
      showAlert("Usage: /report [nickname]", "error");
      setInput("");
      return;
    }
    if (trimmed.toLowerCase().startsWith("/report ")) {
      const target = trimmed.slice(8).trim();
      if (target.toLowerCase() === nickname.toLowerCase()) {
        showAlert("You can't report yourself!", "error");
        setInput("");
        return;
      }
      setReportTarget(target);
      setInput("");
      showAlert(`Reporting ${target} — type your reason and press Send`, "info");
      inputRef.current?.focus();
      return;
    }

    if (reportTarget) {
      setSending(true);
      lastSendTimeRef.current = Date.now();
      const { error } = await supabase.from("complaints" as any).insert({
        room,
        reporter_nickname: nickname,
        reported_nickname: reportTarget,
        reason: trimmed.slice(0, 500),
      } as any);
      if (error) {
        showAlert("Failed to submit report", "error");
      } else {
        showAlert(`Report against ${reportTarget} submitted`, "success");
      }
      setReportTarget(null);
      setInput("");
      setSending(false);
      inputRef.current?.focus();
      return;
    }

    // Validate color
    const msgColor = discoMode ? "disco" : color;
    if (!COLOR_RE.test(msgColor) && msgColor !== "disco") {
      showAlert("Invalid color", "error");
      return;
    }

    setSending(true);
    lastSendTimeRef.current = Date.now();
    const error = await sendMessage(nickname, trimmed, msgColor, replyTo?.id);
    if (error) {
      showAlert(error.message || "Failed to send", "error");
    } else {
      playSendSound();
      try {
        await supabase.functions.invoke("send-push", {
          body: { room, nickname, content: trimmed },
        });
      } catch { /* fire-and-forget */ }
      setInput("");
      setReplyTo(null);
      setTyping(false);
      inputRef.current?.focus();
    }
    setSending(false);
  }, [input, nickname, color, replyTo, sending, sendMessage, discoMode, reportTarget, room, showAlert, navigate, setTyping]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !nickname || sending) return;
    if (!file.type.startsWith("image/")) {
      showAlert("Only images are allowed", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showAlert("Max file size is 5MB", "error");
      return;
    }

    // Throttle
    const now = Date.now();
    if (now - lastSendTimeRef.current < 1000) {
      showAlert("Slow down! Wait a second between messages.", "error");
      return;
    }

    setSending(true);
    lastSendTimeRef.current = Date.now();
    const { url, error: upError } = await uploadImage(file);
    if (upError || !url) {
      showAlert("Upload failed", "error");
      setSending(false);
      return;
    }
    const error = await sendMessage(nickname, input.trim(), color, replyTo?.id, url, file.type);
    if (error) {
      showAlert(error.message || "Failed to send", "error");
    } else {
      try {
        await supabase.functions.invoke("send-push", {
          body: { room, nickname, content: input.trim() || "📷 Image", file_url: url },
        });
      } catch { /* fire-and-forget */ }
      setInput("");
      setReplyTo(null);
      setTyping(false);
      inputRef.current?.focus();
    }
    setSending(false);
    if (fileRef.current) fileRef.current.value = "";
  }, [input, nickname, color, replyTo, sending, sendMessage, uploadImage, showAlert, room, setTyping]);

  const handleReply = useCallback((msg: PcMessage) => {
    setReplyTo(msg);
    inputRef.current?.focus();
  }, []);

  const handleReport = useCallback((targetNickname: string) => {
    if (targetNickname.toLowerCase() === nickname?.toLowerCase()) {
      showAlert("You can't report yourself!", "error");
      return;
    }
    setReportTarget(targetNickname);
    showAlert(`Reporting ${targetNickname} — type your reason and press Send`, "info");
    inputRef.current?.focus();
  }, [nickname, showAlert]);

  // Close slider on scroll
  const handleScroll = useCallback(() => {
    setActiveSlider(null);
    const el = scrollRef.current;
    if (!el || loadingMore || !hasMore) return;
    if (el.scrollTop < 80) {
      const prevHeight = el.scrollHeight;
      loadMore().then(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevHeight;
          }
        });
      });
    }
  }, [loadMore, loadingMore, hasMore]);

  if (!nickname) return null;

  const alertColors = {
    info: "text-pc-blue",
    success: "text-pc-blue",
    error: "text-destructive",
  };

  return (
    <div className={`flex flex-col h-[100dvh] bg-pc-body animate-fade-in ${discoMode ? "disco-mode" : ""}`}>
      {/* Header bar */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b-2 border-pc-border bg-pc-body">
        <button
          onClick={() => navigate("/")}
          className="text-[10px] font-pixel text-pc-blue hover:brightness-125 transition-all active:scale-95"
        >
          ◀ Back
        </button>
        <span className="text-xs font-pixel font-bold text-pc-blue">
          Chat Room {room}
        </span>
        <div className="flex items-center gap-2 leading-none">
          {/* Participants button */}
          <Popover open={showParticipants} onOpenChange={setShowParticipants}>
            <PopoverTrigger asChild>
              <button
                className="text-[10px] font-pixel text-pc-text-muted hover:text-pc-blue transition-all leading-none flex items-center gap-0.5"
                aria-label="Show participants"
                title="Participants"
              >
                👥 <span className="text-[8px] leading-none">{participants.length}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3 bg-pc-body/95 border-2 border-pc-border rounded-[2px] font-pixel shadow-lg">
              <p className="text-[9px] font-pixel font-bold text-pc-blue mb-2">
                Participants ({participants.length})
              </p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {participants.map((p) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 shrink-0"
                      style={{ backgroundColor: p.color === "disco" ? "hsl(var(--pc-blue))" : p.color }}
                    />
                    <span
                      className="text-[9px] font-pixel font-bold truncate"
                      style={{ color: p.color === "disco" ? "hsl(var(--pc-blue))" : p.color }}
                    >
                      {p.name}
                      {p.name === nickname && " (you)"}
                    </span>
                  </div>
                ))}
                {participants.length === 0 && (
                  <span className="text-[8px] font-pixel text-pc-text-muted">No messages yet</span>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <span className="text-[8px] font-pixel text-pc-text-muted leading-none">
            {messages.length} msgs
          </span>
        </div>
      </div>

      {/* Top screen - message list */}
      <div className="flex-1 min-h-0 ds-screen m-1 mb-0">
        <div ref={scrollRef} className="h-full overflow-y-auto p-3 scroll-smooth" role="log" aria-live="polite" onScroll={handleScroll}>
          {loadingMore && (
            <p className="text-center text-[9px] font-pixel text-pc-text-muted py-2">
              Loading older messages...
            </p>
          )}
          {loading ? (
            <div className="space-y-3 py-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`flex flex-col ${i % 2 === 0 ? "items-start" : "items-end"}`}>
                  <Skeleton className="h-2.5 w-16 mb-1 bg-pc-border/40" />
                  <Skeleton className={`h-8 ${i % 3 === 0 ? "w-[60%]" : "w-[45%]"} bg-pc-border/30`} />
                  <Skeleton className="h-2 w-10 mt-0.5 bg-pc-border/20" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-[10px] font-pixel text-pc-text-muted py-8">
              No messages yet. Say something!
            </p>
          ) : (
            messages.map((msg, i) => {
              const prev = messages[i - 1];
              const showName = !prev || prev.nickname !== msg.nickname;
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.nickname === nickname}
                  showName={showName}
                  onReply={handleReply}
                  onReport={handleReport}
                  starCount={getStarCount(msg.id)}
                  hasStarred={hasStarred(msg.id)}
                  onToggleStar={toggleStar}
                  activeSlider={activeSlider}
                  onSliderOpen={setActiveSlider}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Hinge */}
      <div className="ds-hinge mx-1" />

      {/* Bottom screen - input area */}
      <div className="shrink-0 ds-screen-bottom m-1 mt-0 p-3">
        {/* Inline alerts */}
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`text-[10px] font-pixel font-bold ${alertColors[alert.type]} mb-1.5 animate-fade-in px-2 py-1.5 border-l-[3px] ${
              alert.type === "error"
                ? "border-destructive bg-destructive/10"
                : alert.type === "success"
                  ? "border-pc-blue bg-pc-blue/10"
                  : "border-pc-blue bg-pc-blue/5"
            }`}
          >
            {alert.type === "error" ? "✕ " : alert.type === "success" ? "✓ " : "ℹ "}
            {alert.text}
          </div>
        ))}

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
          <div
            className="flex items-center gap-2 mb-2 px-2 py-1.5 border-l-[3px]"
            style={{
              borderColor: replyTo.color === "disco" ? "hsl(var(--pc-blue))" : replyTo.color,
              backgroundColor: "hsl(var(--pc-border) / 0.3)",
            }}
          >
            <div className="flex-1 min-w-0">
              <span className="text-[8px] font-pixel text-pc-text-muted">Replying to </span>
              <span
                className="text-[8px] font-pixel font-bold"
                style={{ color: replyTo.color === "disco" ? "hsl(var(--pc-blue))" : replyTo.color }}
              >
                {replyTo.nickname}
              </span>
              {replyTo.content && (
                <p className="text-[8px] font-pixel text-pc-text-muted truncate mt-0.5 opacity-75">
                  "{replyTo.content}"
                </p>
              )}
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="text-[14px] text-pc-blue hover:brightness-125 transition-all shrink-0"
              aria-label="Cancel reply"
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
              className="text-[14px] text-pc-blue hover:brightness-125 transition-all"
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
            className="px-2 py-2 text-[10px] font-pixel bg-pc-screen border-2 border-pc-border text-pc-text-muted hover:text-pc-blue hover:border-pc-blue disabled:opacity-40 transition-all active:scale-95"
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
            placeholder={reportTarget ? "Type your reason..." : replyTo ? `Reply to ${replyTo.nickname}...` : "Type a message..."}
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
            className="px-4 py-2 text-[10px] font-pixel font-bold bg-pc-blue-btn text-primary-foreground border-2 border-pc-blue-dark disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 active:brightness-90 transition-all"
          >
            {reportTarget ? "Report" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Room;
