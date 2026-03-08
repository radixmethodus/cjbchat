import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import loginBg from "@/assets/login-bg.png";
import { toast } from "sonner";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { useOnlinePresence, useTypingIndicator } from "@/hooks/usePresence";
import { useNotificationPrefs } from "@/hooks/useNotificationPrefs";
import { useCommands } from "@/hooks/useCommands";
import { ChatUser, Message, SystemMessage, DISCO_MARKER, CHAT_FONT } from "@/components/chat/types";
import ChatHeader from "@/components/chat/ChatHeader";
import PinnedBar from "@/components/chat/PinnedBar";
import MessageList from "@/components/chat/MessageList";
import ChatInput from "@/components/chat/ChatInput";

const ChatRoom = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showNewMessagePill, setShowNewMessagePill] = useState(false);
  const [channel, setChannel] = useState<"general" | "secret">("general");
  const [discoMode, setDiscoMode] = useState(false);
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([]);
  const chatInputRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const stored = localStorage.getItem("chatroom_user");
  const currentUser: ChatUser | null = stored ? JSON.parse(stored) : null;

  const { handleCommand } = useCommands(currentUser?.id || "", channel, setChannel, discoMode, setDiscoMode);
  const { soundEnabled, notificationsEnabled, toggleSound, toggleNotifications, playSound, showNotification } = useNotificationPrefs();

  const presenceUser = currentUser ? { user_id: currentUser.id, name: currentUser.name, color: currentUser.color } : null;
  const onlineUsers = useOnlinePresence(presenceUser);
  const { typingUsers, broadcastTyping } = useTypingIndicator(presenceUser);

  const tableName = channel === "secret" ? "secret_messages" : "messages";
  const fkHint = channel === "secret" ? "chatroom_users!secret_messages_user_id_fkey" : "chatroom_users!messages_user_id_fkey";

  const isNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    setShowNewMessagePill(false);
  }, []);

  const onNewMessage = useCallback(
    (msg: Message) => {
      if (msg.user_id !== currentUser?.id) {
        playSound();
        showNotification(msg.chatroom_users?.name || "Someone", msg.content || "");
        if (!isNearBottom()) setShowNewMessagePill(true);
      }
      if (isNearBottom()) setTimeout(() => scrollToBottom(), 50);
    },
    [currentUser?.id, playSound, showNotification, isNearBottom, scrollToBottom]
  );

  useRealtimeMessages(setMessages, onNewMessage, tableName);

  const addSystemMessage = useCallback((text: string) => {
    const msg: SystemMessage = { id: crypto.randomUUID(), text, created_at: new Date().toISOString() };
    setSystemMessages((prev) => [...prev, msg]);
    setTimeout(() => setSystemMessages((prev) => prev.filter((m) => m.id !== msg.id)), 8000);
  }, []);

  useEffect(() => {
    if (!currentUser) { navigate("/"); return; }
    (async () => {
      const { data, error } = await supabase
        .from(tableName as any)
        .select(`*, ${fkHint}(name, color)`)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) toast.error("Failed to load messages");
      else {
        setMessages((data as unknown as Message[]) || []);
        setTimeout(() => scrollToBottom(), 100);
      }
    })();
  }, [channel]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || !currentUser) return;
    if (trimmed.length > 4000) { toast.error("Message too long (max 4000 characters)"); return; }

    if (trimmed.startsWith("/")) {
      setInput("");
      if (chatInputRef.current) chatInputRef.current.textContent = "";
      const result = await handleCommand(trimmed);
      if (result.handled) {
        if (result.systemMessage) addSystemMessage(result.systemMessage);
        return;
      }
    }

    setLoading(true);
    const content = discoMode ? DISCO_MARKER + trimmed : trimmed;
    if (discoMode) setDiscoMode(false);

    const { error } = await supabase.from(tableName as any).insert({ user_id: currentUser.id, content } as any);
    if (error) toast.error("Failed to send");
    else {
      setInput("");
      if (chatInputRef.current) chatInputRef.current.textContent = "";
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("chat-files").upload(path, file);
    if (uploadError) { toast.error("Upload failed"); setUploading(false); return; }

    const { data: urlData } = await supabase.storage.from("chat-files").createSignedUrl(path, 60 * 60 * 24 * 365);
    const fileType = file.type.startsWith("image/") ? "image" : "file";

    const { error: msgError } = await supabase.from(tableName as any).insert({
      user_id: currentUser.id,
      file_url: urlData?.signedUrl || path,
      file_type: fileType,
      content: file.name,
    } as any);
    if (msgError) toast.error("Failed to send file");
    setUploading(false);
  };

  const togglePin = async (msg: Message) => {
    const sessionPin = sessionStorage.getItem("chatroom_pin");
    if (!sessionPin) { toast.error("Session expired. Please log in again."); return; }
    const { error } = await (supabase.rpc as any)("pin_message", { _message_id: msg.id, _user_id: currentUser?.id, _pin: sessionPin, _table: tableName });
    if (error) toast.error("Failed to update pin");
    else toast.success(msg.is_pinned ? "Message unpinned" : "Message pinned");
  };

  const deleteMessage = async (msg: Message) => {
    if (msg.user_id !== currentUser?.id) return;
    const sessionPin = sessionStorage.getItem("chatroom_pin");
    if (!sessionPin) { toast.error("Session expired. Please log in again."); return; }
    const { error } = await (supabase.rpc as any)("delete_own_message", { _message_id: msg.id, _user_id: currentUser.id, _table: tableName, _pin: sessionPin });
    if (error) toast.error("Failed to delete message");
    else toast.success("Message deleted");
  };

  if (!currentUser) return null;

  const pinnedMessages = messages.filter((m) => m.is_pinned);

  return (
    <div className="flex flex-col h-[100dvh]" style={{ background: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${loginBg}) center/cover no-repeat fixed` }}>
      <ChatHeader
        currentUser={currentUser}
        channel={channel}
        onlineUsers={onlineUsers}
        soundEnabled={soundEnabled}
        notificationsEnabled={notificationsEnabled}
        toggleSound={toggleSound}
        toggleNotifications={toggleNotifications}
      />

      <PinnedBar pinnedMessages={pinnedMessages} showPinned={showPinned} setShowPinned={setShowPinned} togglePin={togglePin} />

      <MessageList
        ref={scrollRef}
        messages={messages}
        systemMessages={systemMessages}
        currentUserId={currentUser.id}
        showNewMessagePill={showNewMessagePill}
        onScrollToBottom={scrollToBottom}
        onTogglePin={togglePin}
        onDelete={deleteMessage}
        onImageClick={setLightboxUrl}
      />

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div
          className="shrink-0 px-4 py-1.5 text-xs flex items-center gap-1.5"
          style={{ color: "hsl(var(--chat-text-muted))", background: "hsl(var(--chat-bg))", fontFamily: CHAT_FONT }}
        >
          <span className="inline-flex gap-0.5">
            <span className="animate-bounce" style={{ animationDelay: "0ms", animationDuration: "0.6s" }}>·</span>
            <span className="animate-bounce" style={{ animationDelay: "150ms", animationDuration: "0.6s" }}>·</span>
            <span className="animate-bounce" style={{ animationDelay: "300ms", animationDuration: "0.6s" }}>·</span>
          </span>
          <span>{typingUsers.map((u) => u.name).join(" and ")} {typingUsers.length === 1 ? "is" : "are"} typing</span>
        </div>
      )}

      <ChatInput
        input={input}
        setInput={setInput}
        loading={loading}
        uploading={uploading}
        discoMode={discoMode}
        onSend={sendMessage}
        onFileUpload={handleFileUpload}
        onTyping={broadcastTyping}
        chatInputRef={chatInputRef}
      />

      {/* Image lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content className="fixed inset-0 z-50 flex items-center justify-center">
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-4 right-4 z-50 flex items-center justify-center w-10 h-10 rounded-full transition-opacity hover:opacity-80"
              style={{ background: "hsla(0, 0%, 0%, 0.6)", color: "#fff" }}
            >
              <X className="h-6 w-6" />
            </button>
            {lightboxUrl && (
              <img
                src={lightboxUrl}
                alt="Enlarged image"
                className="max-w-[90vw] max-h-[85vh] object-contain"
                style={{ border: "2px solid hsl(var(--chat-border))", borderRadius: "4px" }}
              />
            )}
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </div>
  );
};

export default ChatRoom;
