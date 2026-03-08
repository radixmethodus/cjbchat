import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useThemeColor, THEME_COLORS } from "@/hooks/useThemeColor";

const ROOMS = ["A", "B", "C", "D"] as const;

const Lobby = () => {
  const [nickname, setNickname] = useState(
    () => sessionStorage.getItem("pc_nickname") || ""
  );
  const [selectedRoom, setSelectedRoom] = useState<string>("A");
  const navigate = useNavigate();
  const { selected: themeColor, setSelected: setThemeColor } = useThemeColor();

  const handleEnter = () => {
    const trimmed = nickname.trim();
    if (!trimmed || trimmed.length > 20) return;
    sessionStorage.setItem("pc_nickname", trimmed);
    navigate(`/room/${selectedRoom}`);
  };

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-pc-body p-4">
      <div className="w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-pc-blue font-pixel tracking-wider">
            PictoChat
          </h1>
          <p className="text-[10px] text-pc-text-muted font-pixel mt-1">
            Select a chat room
          </p>
        </div>

        {/* Room list - DS top screen */}
        <div className="ds-screen p-3 mb-0">
          <div className="space-y-2">
            {ROOMS.map((room) => (
              <button
                key={room}
                onClick={() => setSelectedRoom(room)}
                className={`room-card w-full flex items-center gap-3 px-3 py-2 border-2 text-left ${
                  selectedRoom === room ? "selected" : ""
                }`}
                style={{
                  borderColor:
                    selectedRoom === room
                      ? "hsl(var(--pc-blue))"
                      : "hsl(var(--pc-border))",
                }}
              >
                <span className="text-xs font-pixel font-bold text-pc-blue">
                  ▶
                </span>
                <span className="text-xs font-pixel text-pc-text">
                  Chat Room {room}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Hinge */}
        <div className="ds-hinge" />

        {/* Bottom screen - nickname + color + enter */}
        <div className="ds-screen-bottom p-4">
          <div className="flex flex-col gap-3">
            {/* Color selector */}
            <div>
              <label className="text-[10px] font-pixel text-pc-text-muted block mb-1.5">
                Theme color:
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {THEME_COLORS.map((c) => (
                  <button
                    key={c.hue}
                    onClick={() => setThemeColor(c)}
                    title={c.label}
                    className="w-6 h-6 border-2 transition-all hover:brightness-125"
                    style={{
                      backgroundColor: `hsl(${c.hue} ${c.sat}% 40%)`,
                      borderColor:
                        themeColor.hue === c.hue
                          ? "#fff"
                          : "hsl(var(--pc-border))",
                      boxShadow:
                        themeColor.hue === c.hue
                          ? `0 0 6px hsl(${c.hue} ${c.sat}% 50% / 0.6)`
                          : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Nickname input */}
            <div>
              <label className="text-[10px] font-pixel text-pc-text-muted block mb-1.5">
                Enter your nickname:
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEnter()}
                maxLength={20}
                placeholder="Nickname..."
                className="pc-input w-full px-3 py-2 text-xs font-pixel bg-pc-screen border-2 border-pc-border text-pc-text outline-none focus:border-pc-blue"
              />
            </div>

            <button
              onClick={handleEnter}
              disabled={!nickname.trim()}
              className="w-full px-4 py-2 text-xs font-pixel font-bold bg-pc-blue text-primary-foreground border-2 border-pc-blue-dark disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:brightness-90 transition-all"
            >
              Enter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
