import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRoomMessages } from "@/hooks/useRoomMessages";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useTypingPresence } from "@/hooks/useTypingPresence";
import { useStars } from "@/hooks/useStars";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import MessageBubble, { type PcMessage } from "@/components/pictochat/MessageBubble";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
const playSendSound = () => {
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

const playReceiveSound = () => {
  try {
    const ctx = new AudioContext();
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const room = roomId?.toUpperCase() || "A";
  const { messages, loading, sendMessage, uploadImage } = useRoomMessages(room);
  const { typingUsers, setTyping } = useTypingPresence(room, nickname);
  const { toggleStar, getStarCount, hasStarred } = useStars(room, nickname);
  const {
    isSubscribed,
    notifyAll,
    notifyMentions,
    supported: pushSupported,
    actionLoading: pushLoading,
    error: pushError,
    subscribe: pushSubscribe,
    unsubscribe: pushUnsubscribe,
    updatePrefs,
    triggerPush,
  } = usePushNotifications(nickname);


  const prevCountRef = useRef(0);

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

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
    if (prevCountRef.current > 0 && messages.length > prevCountRef.current) {
      playReceiveSound();
    }
    prevCountRef.current = messages.length;
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || !nickname || sending) return;

    if (trimmed.toLowerCase() === "/disco") {
      setDiscoMode((prev) => !prev);
      setInput("");
      showAlert(discoMode ? "Disco mode OFF" : "🪩 Disco mode ON!", "success");
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

    setSending(true);
    const msgColor = discoMode ? "disco" : color;
    const error = await sendMessage(nickname, trimmed, msgColor, replyTo?.id);
    if (error) {
      showAlert(error.message || "Failed to send", "error");
    } else {
      playSendSound();
      triggerPush(room, trimmed);
      setInput("");
      setReplyTo(null);
      setTyping(false);
      inputRef.current?.focus();
    }
    setSending(false);
  }, [input, nickname, color, replyTo, sending, sendMessage, discoMode, reportTarget, room, showAlert, triggerPush]);

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
    setSending(true);
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
      triggerPush(room, input.trim() || "📷 Image", url);
      setInput("");
      setReplyTo(null);
      setTyping(false);
      inputRef.current?.focus();
    }
    setSending(false);
    if (fileRef.current) fileRef.current.value = "";
  }, [input, nickname, color, replyTo, sending, sendMessage, uploadImage, showAlert, triggerPush, room]);

  const handleReply = useCallback((msg: PcMessage) => {
    setReplyTo(msg);
    inputRef.current?.focus();
  }, []);

  if (!nickname) return null;

  const alertColors = {
    info: "text-pc-blue",
    success: "text-pc-blue",
    error: "text-destructive",
  };

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
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-pixel text-pc-text-muted">
            {messages.length} msgs
          </span>
          {pushSupported && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="text-[10px] font-pixel text-pc-text-muted hover:text-pc-blue transition-all relative"
                  aria-label="Push notifications"
                >
                  🔔
                  {isSubscribed && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-pc-blue" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3 bg-pc-body/95 border-2 border-pc-border rounded-[2px] font-pixel shadow-lg">
                <p className="text-[9px] font-pixel font-bold text-pc-blue mb-2">
                  Push Notifications
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-pixel text-pc-text">
                      {pushLoading
                        ? "Working…"
                        : isSubscribed
                          ? "Enabled"
                          : "Disabled"}
                    </span>
                    <Switch
                      checked={isSubscribed}
                      disabled={pushLoading || ("Notification" in window && Notification.permission === "denied")}
                      onCheckedChange={async (val) => {
                        if (val) await pushSubscribe();
                        else await pushUnsubscribe();
                      }}
                    />
                  </div>

                  {"Notification" in window && Notification.permission === "denied" && (
                    <p className="text-[7px] font-pixel text-pc-text-muted">
                      Browser blocked notifications — enable in site settings.
                    </p>
                  )}

                  {pushError && (
                    <p className="text-[7px] font-pixel text-destructive">
                      {pushError.message}
                    </p>
                  )}

                  {isSubscribed ? (
                    <>
                      <div className="h-px bg-pc-border my-2" />
                      <p className="text-[7px] font-pixel text-pc-text-muted mb-2">
                        Notify me for:
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-pixel text-pc-text">All messages</span>
                        <Switch
                          checked={notifyAll}
                          disabled={pushLoading}
                          onCheckedChange={(val) => updatePrefs(val, notifyMentions)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-pixel text-pc-text">@mentions only</span>
                        <Switch
                          checked={notifyMentions}
                          disabled={pushLoading}
                          onCheckedChange={(val) => updatePrefs(notifyAll, val)}
                        />
                      </div>
                      <p className="text-[6px] font-pixel text-pc-text-muted mt-2 opacity-75">
                        Tip: type @name to mention
                      </p>
                    </>
                  ) : (
                    !pushLoading && (
                      <p className="text-[6px] font-pixel text-pc-text-muted">
                        Turn this on to get notified when the app is closed.
                      </p>
                    )
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}

        </div>
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
                  starCount={getStarCount(msg.id)}
                  hasStarred={hasStarred(msg.id)}
                  onToggleStar={toggleStar}
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
            className={`text-[9px] font-pixel ${alertColors[alert.type]} mb-1 animate-fade-in`}
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
          <div className="flex items-center gap-2 mb-2 text-[8px] font-pixel text-pc-text-muted">
            <span>↳ Replying to <strong style={{ color: replyTo.color }}>{replyTo.nickname}</strong></span>
            <button
              onClick={() => setReplyTo(null)}
              className="text-[14px] text-pc-blue hover:brightness-125 transition-all"
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
