import { useState, useEffect } from "react";
import loginBg from "@/assets/login-bg.png";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";

const Index = () => {
  const [name, setName] = useState(() => localStorage.getItem("chatroom_last_name") || "");
  const [color, setColor] = useState(() => localStorage.getItem("chatroom_last_color") || "#3b82f6");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"name" | "create-pin" | "enter-pin">("name");
  const [pendingUser, setPendingUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("chatroom_user");
    if (stored) {
      navigate("/chat");
    }
  }, [navigate]);

  const handleNameSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Please enter a name");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("chatroom_users")
        .select("*")
        .eq("name", trimmed)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPendingUser(data);
        setStep("enter-pin");
      } else {
        setStep("create-pin");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (pin.length !== 4) {
      toast.error("Please enter a 4-digit PIN");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await (supabase.rpc as any)("create_user_with_pin", {
        _name: name.trim(),
        _color: color,
        _pin: pin,
      });

      if (error) throw error;

      const { data: user, error: fetchErr } = await supabase
        .from("chatroom_users")
        .select("id, name, color")
        .eq("name", name.trim())
        .single();

      if (fetchErr) throw fetchErr;

      localStorage.setItem("chatroom_user", JSON.stringify(user));
      sessionStorage.setItem("chatroom_pin", pin);
      localStorage.setItem("chatroom_last_name", user.name);
      localStorage.setItem("chatroom_last_color", user.color);
      navigate("/chat");
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (pin.length !== 4) {
      toast.error("Please enter your 4-digit PIN");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await (supabase.rpc as any)("verify_user_pin", {
        _name: pendingUser.name,
        _pin: pin,
      });

      if (error) throw error;
      if (!data) {
        toast.error("Incorrect PIN");
        setLoading(false);
        return;
      }

      // Update color in DB if changed (requires PIN verification)
      if (color !== pendingUser.color) {
        await (supabase.rpc as any)("update_user_color", {
          _user_id: pendingUser.id,
          _color: color,
          _pin: pin,
        });
      }

      localStorage.setItem(
        "chatroom_user",
        JSON.stringify({ id: pendingUser.id, name: pendingUser.name, color })
      );
      sessionStorage.setItem("chatroom_pin", pin);
      localStorage.setItem("chatroom_last_name", pendingUser.name);
      localStorage.setItem("chatroom_last_color", color);
      navigate("/chat");
    } catch (err: any) {
      toast.error(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const rowStyle: React.CSSProperties = {
    background: "rgba(0, 0, 0, 0.35)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "6px",
    color: "hsl(0 0% 88%)",
    fontFamily: "var(--chat-font), sans-serif",
    fontWeight: 600,
    backdropFilter: "blur(4px)",
  };

  const flatButtonStyle: React.CSSProperties = {
    ...rowStyle,
    cursor: "pointer",
    fontWeight: 700,
    background: "rgba(0, 0, 0, 0.4)",
  };

  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center p-4"
      style={{
        background: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${loginBg}) center/cover no-repeat`,
      }}
    >
      <div className="w-full max-w-sm space-y-0">
        {/* Title bar */}
        <div
          className="text-center py-3 px-4"
          style={{
            background: "rgba(0, 0, 0, 0.45)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderBottom: "none",
            borderRadius: "10px 10px 0 0",
            color: "hsl(0 0% 92%)",
            fontFamily: "var(--chat-font), sans-serif",
            fontWeight: 700,
            fontSize: "14px",
            backdropFilter: "blur(14px)",
          }}
        >
          {step === "name"
            ? "Enter your name and choose a color to join."
            : step === "create-pin"
            ? "Set a 4-digit PIN."
            : `Welcome back, ${pendingUser?.name}.`}
        </div>

        {/* Content area */}
        <div
          className="px-4 py-5 space-y-3"
          style={{
            background: "rgba(0, 0, 0, 0.35)",
            borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
            borderRight: "1px solid rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(14px)",
          }}
        >
          {step === "name" && (
            <>
              {/* Name input row */}
              <div
                className="flex items-center gap-3 px-3 py-2.5"
                style={rowStyle}
              >
                <div
                  className="w-8 h-8 shrink-0 flex items-center justify-center text-sm font-black"
                  style={{
                    background: color,
                    color: "#fff",
                    borderRadius: "4px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  {name.trim() ? name.trim().charAt(0).toUpperCase() : "?"}
                </div>
                <input
                  placeholder="Your name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                  maxLength={24}
                  className="flex-1 bg-transparent outline-none text-sm font-semibold placeholder:text-white/30"
                  style={{ color: "hsl(0 0% 88%)", fontFamily: "var(--chat-font), sans-serif" }}
                />
              </div>

              {/* Color picker row */}
              <div
                className="flex items-center gap-3 px-3 py-2.5"
                style={rowStyle}
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 cursor-pointer border-0 p-0 bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-1 [&::-webkit-color-swatch]:border-white/20 [&::-webkit-color-swatch]:rounded-sm [&::-moz-color-swatch]:border-1"
                />
                <span className="text-sm font-semibold" style={{ color: "hsl(0 0% 88%)" }}>
                  Choose your color
                </span>
                <span className="ml-auto text-xs font-mono" style={{ color: "hsl(0 0% 55%)" }}>
                  {color}
                </span>
              </div>
            </>
          )}

          {(step === "create-pin" || step === "enter-pin") && (
            <>
              {step === "enter-pin" && (
                <div
                  className="flex items-center gap-3 px-3 py-2.5"
                  style={rowStyle}
                >
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 cursor-pointer border-0 p-0 bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-1 [&::-webkit-color-swatch]:border-white/20 [&::-webkit-color-swatch]:rounded-sm [&::-moz-color-swatch]:border-1"
                  />
                  <span className="text-sm font-semibold" style={{ color: "hsl(0 0% 88%)" }}>
                    Change your color
                  </span>
                  <span className="ml-auto text-xs font-mono" style={{ color: "hsl(0 0% 55%)" }}>
                    {color}
                  </span>
                </div>
              )}
              <p className="text-center text-xs" style={{ color: "hsl(0 0% 55%)" }}>
                {step === "create-pin"
                  ? "Create a 4-digit PIN to secure your account"
                  : "Enter your PIN to log in"}
              </p>
              <div className="flex justify-center py-2">
                <InputOTP maxLength={4} value={pin} onChange={setPin}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        style={{
                          background: "rgba(0, 0, 0, 0.35)",
                          borderColor: "rgba(255, 255, 255, 0.1)",
                          color: "hsl(0 0% 92%)",
                          borderRadius: "5px",
                          fontWeight: 700,
                        }}
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </>
          )}
        </div>

        {/* Bottom action bar */}
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{
            background: "rgba(0, 0, 0, 0.45)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderTop: "none",
            borderRadius: "0 0 10px 10px",
            backdropFilter: "blur(14px)",
          }}
        >
          {step !== "name" && (
            <button
              onClick={() => { setStep("name"); setPin(""); setPendingUser(null); }}
              className="flex-1 py-2 px-4 text-sm transition-all hover:brightness-125 active:brightness-90"
              style={flatButtonStyle}
            >
              Go back
            </button>
          )}

          <button
            onClick={
              step === "name"
                ? handleNameSubmit
                : step === "create-pin"
                ? handleCreateUser
                : handleLogin
            }
            disabled={loading || (step !== "name" && pin.length !== 4)}
            className="flex-1 py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:brightness-125 active:brightness-90"
            style={flatButtonStyle}
          >
            {loading
              ? "Please wait..."
              : step === "name"
              ? "Continue"
              : step === "create-pin"
              ? "Create"
              : "Join"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
