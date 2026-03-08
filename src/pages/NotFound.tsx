import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import loginBg from "@/assets/login-bg.png";
import { GLASS_STYLE, CHAT_FONT } from "@/components/chat/types";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center p-4"
      style={{
        background: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${loginBg}) center/cover no-repeat`,
      }}
    >
      <div
        className="text-center px-8 py-10 max-w-sm w-full"
        style={{
          ...GLASS_STYLE,
          borderRadius: "10px",
        }}
      >
        <h1
          className="text-5xl font-black mb-3"
          style={{ color: "hsl(var(--chat-text))", fontFamily: "'Courier New', monospace" }}
        >
          404
        </h1>
        <p className="text-sm mb-6" style={{ color: "hsl(var(--chat-text-muted))", fontFamily: CHAT_FONT }}>
          This page doesn't exist.
        </p>
        <a
          href="/"
          className="inline-block px-5 py-2 text-sm font-bold transition-all hover:brightness-125"
          style={{
            background: "rgba(0, 0, 0, 0.4)",
            color: "hsl(var(--chat-text))",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "6px",
            fontFamily: CHAT_FONT,
          }}
        >
          Go home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
