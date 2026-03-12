"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LogIn, UserPlus, Fingerprint, MailCheck } from "lucide-react";
import { syncUser } from "@/app/actions/auth";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<"login" | "signup" | "verify_otp">("login");
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // Properly initialize and listen to session changes
  useEffect(() => {
    // Get initial session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await syncUser(session.user);
      }
      setAuthReady(true);
    };
    
    checkSession();

    // Listen for all auth events (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await syncUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (view === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) alert(error.message);
      else {
        setUser(data.user);
        if (data.user) await syncUser(data.user);
      }
    } else if (view === "signup") {
      // Sign up normally, which sends the email verification OTP
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });
      if (error) {
        alert(error.message);
      } else {
        // Shift view to OTP verification
        setView("verify_otp");
      }
    } else if (view === "verify_otp") {
      // Verify the OTP the user received in their email
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup",
      });
      if (error) {
        alert(error.message);
      } else {
        setUser(data.user);
        if (data.user) await syncUser(data.user);
      }
    }

    setLoading(false);
  };

  if (!authReady) return null; // Don't flash login screen while checking session
  if (user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 border border-blue-500/20">
            {view === "verify_otp" ? (
              <MailCheck className="text-blue-500" size={32} />
            ) : (
              <Fingerprint className="text-blue-500" size={32} />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {view === "verify_otp"
              ? "Verify Agent Identity"
              : "Investigator Access"}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Nexus Intelligence Platform
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {view !== "verify_otp" && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Agent Name
                </label>
                <input
                  type="text"
                  required={view === "signup"}
                  className="w-full bg-[#1f2937] border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 mt-1"
                  placeholder="Agent Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="w-full bg-[#1f2937] border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 mt-1"
                  placeholder="agent@nexus.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Security Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full bg-[#1f2937] border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 mt-1"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </>
          )}

          {view === "verify_otp" && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Authentication Code
              </label>
              <input
                type="text"
                required
                className="w-full bg-[#1f2937] border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 mt-1 tracking-[0.5em] font-mono text-center text-xl"
                placeholder=""
                maxLength={8}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-2 text-center">
                We&apos;ve sent an authentication code to {email}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              "Authenticating..."
            ) : view === "login" ? (
              <>
                <LogIn size={18} /> Enter Platform
              </>
            ) : view === "verify_otp" ? (
              "Verify Code"
            ) : (
              <>
                <UserPlus size={18} /> Register Agent
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setView(view === "login" ? "signup" : "login");
              setOtp("");
            }}
            className="text-slate-500 hover:text-blue-400 text-sm transition-colors"
          >
            {view === "login"
              ? "Need agent credentials? Register here"
              : view === "signup"
                ? "Already have access? Log in"
                : "Back to Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
