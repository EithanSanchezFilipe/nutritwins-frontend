import React, { useState } from "react";
import {
  Mail,
  Lock,
  User,
  Flame,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { authClient } from "../lib/auth";

interface AuthPageProps {
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const res = await authClient.signIn.email({
          email,
          password,
        });
        if (res.error) {
          throw new Error(res.error.message || "Login failed");
        }
        console.log("[auth-login] Sign-in response:", res);
      } else {
        const res = await authClient.signUp.email({
          email,
          password,
          name,
        });
        if (res.error) {
          throw new Error(res.error.message || "Registration failed");
        }
        console.log("[auth-signup] Sign-up response:", res);
      }
      // Cookies are already set by the backend and stored in the browser.
      // Simply check if they exist locally, then proceed.
      const hasCookies = document.cookie && document.cookie.length > 0;
      console.log(
        "[auth] Cookies after login:",
        hasCookies ? document.cookie : "<none>",
      );

      if (!hasCookies) {
        setError(
          "Login succeeded but no session cookie found. Try refreshing the page.",
        );
        return;
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || "An unexpected error occurred. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-4 py-12 max-w-md mx-auto w-full">
      <div className="text-center mb-8">
        <div className="inline-flex bg-teal-500/10 p-3 rounded-2xl border border-teal-500/20 mb-3 shadow-[0_0_15px_rgba(20,184,166,0.1)]">
          <Flame className="w-8 h-8 text-teal-400 fill-teal-400/20" />
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">
          NutriTwins
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Your intelligent, mobile-first nutrition companion
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-6 border border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
        <div className="flex border-b border-gray-800 pb-4 mb-6">
          <button
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`flex-1 text-center py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
              isLogin
                ? "text-teal-400 bg-teal-500/5 border border-teal-500/20"
                : "text-gray-400 hover:text-gray-200 border border-transparent"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`flex-1 text-center py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
              !isLogin
                ? "text-teal-400 bg-teal-500/5 border border-teal-500/20"
                : "text-gray-400 hover:text-gray-200 border border-transparent"
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 mb-5 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-300 leading-normal">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label
                htmlFor="name-input"
                className="text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="name-input"
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-teal-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500/20 transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="email-input"
              className="text-xs font-medium text-gray-400 uppercase tracking-wider"
            >
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="email-input"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-teal-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password-input"
              className="text-xs font-medium text-gray-400 uppercase tracking-wider"
            >
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="password-input"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-teal-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500/20 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            style={{ color: "white" }}
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 active:scale-98 text-white rounded-xl py-3 text-sm font-semibold tracking-wide shadow-lg shadow-teal-950/20 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{isLogin ? "Sign In" : "Register"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mt-8 text-center space-y-2">
        <p className="text-xs text-gray-500 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
          AI-Powered Calorie Counting
        </p>
        <p className="text-[10px] text-gray-600">
          By continuing, you agree to our Terms of Service & Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
