import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useThemeColor, THEME_COLORS } from "@/hooks/useThemeColor";
import { useRoomStats } from "@/hooks/useRoomStats";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const ROOMS = ["A", "B", "C", "D"] as const;

const Lobby = () => {
  const [nickname, setNickname] = useState(
    () => sessionStorage.getItem("pc_nickname") || localStorage.getItem("pc_last_nickname") || ""
  );
  const [selectedRoom, setSelectedRoom] = useState<string>("A");
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const navigate = useNavigate();
  const { selected: themeColor, setSelected: setThemeColor } = useThemeColor();
  const { data: roomStats } = useRoomStats();
  const { supported: pushSupported, isSubscribed, subscribe: pushSubscribe, actionLoading: pushLoading } = usePushNotifications(nickname || null);

  const handleEnter = () => {
    const trimmed = nickname.trim();
    if (!trimmed || trimmed.length > 20) return;
    sessionStorage.setItem("pc_nickname", trimmed);
    localStorage.setItem("pc_last_nickname", trimmed);

    // Show push prompt once per session if supported and not already subscribed
    const alreadyPrompted = sessionStorage.getItem("pc_push_prompted");
    if (pushSupported && !isSubscribed && !alreadyPrompted) {
      setShowPushPrompt(true);
      return;
    }

    navigate(`/room/${selectedRoom}`);
  };

  const handlePushEnable = async () => {
    sessionStorage.setItem("pc_push_prompted", "1");
    await pushSubscribe();
    setShowPushPrompt(false);
    navigate(`/room/${selectedRoom}`);
  };

  const handlePushSkip = () => {
    sessionStorage.setItem("pc_push_prompted", "1");
    setShowPushPrompt(false);
    navigate(`/room/${selectedRoom}`);
  };

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-pc-body p-4 animate-fade-in">
      <div className="w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-pc-blue font-pixel tracking-wider">
            CJ's Chat
          </h1>
          <p className="text-[10px] text-pc-text-muted font-pixel mt-1">
            Select a chat room
          </p>
        </div>

        {/* Room list - DS top screen */}
        <div className="ds-screen p-3 mb-0">
          <div className="space-y-1">
            {ROOMS.map((room) => (
              <button
                key={room}
                onClick={() => setSelectedRoom(room)}
                className={`room-card w-full flex items-center gap-3 px-2 py-2 border text-left transition-colors ${
                  selectedRoom === room ? "selected" : ""
                }`}
                style={{
                  borderColor: "hsl(var(--pc-border))",
                  backgroundColor:
                    selectedRoom === room
                      ? "hsl(var(--pc-blue) / 0.15)"
                      : "transparent",
                }}
              >
                <div className="flex items-center justify-center w-8 h-8 border border-pc-border bg-pc-screen">
                  <span className="text-lg font-pixel font-bold text-pc-text">
                    {room}
                  </span>
                </div>
                <span className="text-xs font-pixel text-pc-text flex-1">
                  Chat Room {room}
                </span>
                <span className="text-[10px] font-pixel text-pc-text-muted">
                  {roomStats?.[room] || 0} msgs
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
              <label className="text-[10px] font-pixel text-pc-text-muted block mb-1">
                Theme color:
              </label>
              <div className="grid grid-cols-6 gap-1">
                {THEME_COLORS.map((c) => (
                  <button
                    key={c.hue}
                    onClick={() => setThemeColor(c)}
                    title={c.label}
                    className="flex flex-col items-center gap-0.5 p-1 border transition-all hover:brightness-125"
                    style={{
                      borderWidth: "1px",
                      borderColor:
                        themeColor.hue === c.hue
                          ? "#fff"
                          : "hsl(var(--pc-border))",
                      backgroundColor: themeColor.hue === c.hue ? "hsl(var(--pc-bubble))" : "transparent",
                      boxShadow:
                        themeColor.hue === c.hue
                          ? `0 0 4px hsl(${c.hue} ${c.sat}% 50% / 0.5)`
                          : "none",
                    }}
                  >
                    <div
                      className="w-5 h-5"
                      style={{
                        backgroundColor: `hsl(${c.hue} ${c.sat}% 40%)`,
                        border: "1px solid hsl(var(--pc-border))",
                      }}
                    />
                    <span className="text-[7px] font-pixel text-pc-text text-center leading-none">
                      {c.label}
                    </span>
                  </button>
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
                name="pc-nickname"
                id="pc-nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEnter()}
                maxLength={20}
                placeholder="Nickname..."
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
                className="pc-input w-full px-3 py-2 text-xs font-pixel bg-pc-screen border-2 border-pc-border text-pc-text outline-none focus:border-pc-blue"
              />
            </div>

            <button
              onClick={handleEnter}
              disabled={!nickname.trim()}
              className="w-full px-4 py-2 text-xs font-pixel font-bold bg-pc-blue-btn text-primary-foreground border-2 border-pc-blue-dark disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 active:brightness-90 transition-all"
            >
              Enter
            </button>
          </div>
        </div>
      </div>

      {/* Push notification prompt modal */}
      {showPushPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
          <div className="ds-screen-bottom p-5 w-72 flex flex-col gap-4 animate-slide-up">
            <p className="text-xs font-pixel font-bold text-pc-blue text-center">
              🔔 Enable Notifications?
            </p>
            <p className="text-[9px] font-pixel text-pc-text-muted text-center leading-relaxed">
              Get notified when someone sends a message while the app is closed.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handlePushSkip}
                disabled={pushLoading}
                className="flex-1 px-3 py-2 text-[10px] font-pixel bg-pc-screen border-2 border-pc-border text-pc-text hover:brightness-110 active:scale-95 transition-all disabled:opacity-40"
              >
                Skip
              </button>
              <button
                onClick={handlePushEnable}
                disabled={pushLoading}
                className="flex-1 px-3 py-2 text-[10px] font-pixel font-bold bg-pc-blue-btn text-primary-foreground border-2 border-pc-blue-dark hover:brightness-110 active:scale-95 transition-all disabled:opacity-40"
              >
                {pushLoading ? "Enabling..." : "Enable"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lobby;
