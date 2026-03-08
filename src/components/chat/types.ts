import { CSSProperties } from "react";

export type ChatUser = { id: string; name: string; color: string };

export type Message = {
  id: string;
  content: string | null;
  file_url: string | null;
  file_type: string | null;
  created_at: string;
  user_id: string;
  is_pinned: boolean;
  pinned_by: string | null;
  chatroom_users: { name: string; color: string } | null;
};

export type SystemMessage = {
  id: string;
  text: string;
  created_at: string;
};

export const DISCO_MARKER = "\x01DISCO\x01";
export const JOIN_MARKER = "\x01JOIN\x01";

export const CHAT_FONT = "var(--chat-font), monospace";

export const GLASS_STYLE: CSSProperties = {
  background: "rgba(0, 0, 0, 0.45)",
  backdropFilter: "blur(14px)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
};

export const AVATAR_STYLE: CSSProperties = {
  color: "#fff",
  borderRadius: "2px",
  border: "2px solid hsl(var(--chat-border))",
  fontFamily: "'Courier New', monospace",
  fontWeight: 900,
  letterSpacing: "-1px",
  textShadow: "1px 1px 0 rgba(0,0,0,0.4)",
  boxShadow: "inset -2px -2px 0 rgba(0,0,0,0.2), inset 2px 2px 0 rgba(255,255,255,0.15)",
};
