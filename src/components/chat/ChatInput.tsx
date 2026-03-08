import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Send, Paperclip } from "lucide-react";
import { GLASS_STYLE } from "./types";

type Props = {
  input: string;
  setInput: (v: string) => void;
  loading: boolean;
  uploading: boolean;
  discoMode: boolean;
  onSend: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTyping: () => void;
  chatInputRef: React.RefObject<HTMLDivElement>;
};

const ChatInput = ({ input, setInput, loading, uploading, discoMode, onSend, onFileUpload, onTyping, chatInputRef }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    setInput(chatInputRef.current?.textContent || "");
  };

  return (
    <div
      className="shrink-0 p-4 flex items-center gap-3"
      style={{
        ...GLASS_STYLE,
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        borderBottom: "none",
        borderLeft: "none",
        borderRight: "none",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", opacity: 0, pointerEvents: "none" }}
        onChange={onFileUpload}
        accept="image/*,.pdf,.doc,.docx,.txt,.zip"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="shrink-0"
        style={{ color: "hsl(var(--chat-text-muted))" }}
      >
        <Paperclip className="h-4 w-4" />
      </Button>
      <div
        ref={chatInputRef}
        contentEditable={!uploading}
        role="textbox"
        aria-placeholder={uploading ? "Uploading..." : discoMode ? "🌈 Disco mode — type your message..." : "Type a message..."}
        data-placeholder={uploading ? "Uploading..." : discoMode ? "🌈 Disco mode — type your message..." : "Type a message..."}
        onInput={(e) => {
          const text = (e.currentTarget as HTMLDivElement).textContent || "";
          setInput(text);
          onTyping();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        onPaste={handlePaste}
        inputMode="text"
        enterKeyHint="send"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-form-type="other"
        data-lpignore="true"
        data-1p-ignore="true"
        data-bwignore="true"
        data-protonpass-ignore="true"
        className="chat-input-editable flex-1 text-sm"
        style={{
          background: "rgba(0, 0, 0, 0.35)",
          color: "hsl(var(--chat-text))",
          border: `1px solid ${discoMode ? "hsl(300 80% 50%)" : "rgba(255, 255, 255, 0.1)"}`,
          borderRadius: "6px",
          backdropFilter: "blur(4px)",
          padding: "8px 12px",
          outline: "none",
          whiteSpace: "nowrap",
          overflow: "hidden",
          minHeight: "40px",
          lineHeight: "24px",
          cursor: uploading ? "not-allowed" : "text",
          opacity: uploading ? 0.5 : 1,
        }}
      />
      <Button
        size="icon"
        onClick={onSend}
        disabled={loading || !input.trim()}
        className="shrink-0"
        style={{
          background: "rgba(0, 0, 0, 0.4)",
          color: "hsl(var(--chat-accent-green))",
          borderRadius: "6px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ChatInput;
