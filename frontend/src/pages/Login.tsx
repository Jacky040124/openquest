import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useLogin } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN PAGE - E2B INDUSTRIAL AESTHETIC
// Pure black, monospace typography, terminal windows, orange accents
// ═══════════════════════════════════════════════════════════════════════════════

const Login = () => {
  const navigate = useNavigate();
  const { mutate: login, isPending } = useLogin();
  const { error } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      login({ email, password });
    }
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white overflow-hidden selection:bg-[#FF6B00]/30 font-mono">
      {/* Subtle grid pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{ 
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <header className="relative z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleLogoClick}
          >
            <div className="w-8 h-8 bg-[#FF6B00] flex items-center justify-center">
              <span className="text-black font-black text-lg">Q</span>
            </div>
            <span className="text-white/80 font-medium tracking-wide">OpenQuest</span>
          </motion.div>

          {/* Right Nav */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/onboarding")}
              className="text-[13px] text-white/60 hover:text-white tracking-widest uppercase transition-colors"
            >
              CREATE ACCOUNT
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* MAIN CONTENT */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <main className="relative z-10 flex-1 flex items-center justify-center min-h-[calc(100vh-73px)] p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Title Section */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-3 mb-6"
            >
              <span className="text-white/30 tracking-[0.3em] text-xs">✶✶✶</span>
              <span className="text-[11px] text-white/50 tracking-[0.3em] uppercase">AUTHENTICATION</span>
              <span className="text-white/30 tracking-[0.3em] text-xs">✶✶✶</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold tracking-tight mb-3"
              style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Monaco, monospace" }}
            >
              WELCOME <span className="text-[#FF6B00]">BACK</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white/50 text-sm tracking-wide"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              Sign in to continue your open source journey
            </motion.p>
          </div>

          {/* Terminal-style Login Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-black border border-white/10"
          >
            {/* Terminal Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.02]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B00]/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              </div>
              <div className="flex-1 flex items-center justify-center">
                <span className="text-[10px] text-white/40 tracking-[0.2em]">━━━━━━</span>
                <span className="text-[10px] text-white/60 tracking-widest mx-3 font-bold">LOGIN</span>
                <span className="text-[10px] text-white/40 tracking-[0.2em]">━━━━━━</span>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error message */}
                {error && (
                  <div className="p-4 border border-red-500/30 bg-red-500/5 text-red-400 text-sm font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">▸</span>
                      <span>ERROR:</span>
                    </div>
                    <div className="mt-1 pl-4 text-red-400/80">{error}</div>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-[11px] font-medium text-white/60 tracking-widest uppercase flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    EMAIL ADDRESS
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-white placeholder-white/30 
                                 focus:outline-none focus:border-[#FF6B00]/50 focus:bg-[#FF6B00]/5
                                 transition-all duration-200 font-mono text-sm tracking-wide"
                      disabled={isPending}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-[11px] font-medium text-white/60 tracking-widest uppercase flex items-center gap-2">
                    <Lock className="w-3 h-3" />
                    PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type="password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-white placeholder-white/30 
                                 focus:outline-none focus:border-[#FF6B00]/50 focus:bg-[#FF6B00]/5
                                 transition-all duration-200 font-mono text-sm tracking-wide"
                      disabled={isPending}
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-[#FF6B00] text-black py-4 text-sm tracking-[0.2em] uppercase font-bold 
                             hover:bg-[#FF8533] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AUTHENTICATING...</span>
                    </>
                  ) : (
                    <>
                      <span>SIGN IN</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="mt-8 pt-6 border-t border-white/5">
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => navigate("/onboarding")}
                    className="text-sm text-white/40 hover:text-[#FF6B00] transition-colors tracking-wide"
                    disabled={isPending}
                  >
                    Don't have an account? <span className="text-[#FF6B00]">Get started →</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ASCII Decoration */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center font-mono text-[10px] text-white/20"
          >
            ┌──────────────────────────────────────┐<br />
            │&nbsp;&nbsp;SECURE CONNECTION ESTABLISHED&nbsp;&nbsp;│<br />
            └──────────────────────────────────────┘
          </motion.div>
        </motion.div>
      </main>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-white/5 py-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
          <span className="text-white/20 text-xs tracking-[0.3em]">✶✶✶</span>
          <span className="text-white/30 text-[11px] tracking-widest">© 2024 OPENQUEST</span>
          <span className="text-white/20 text-xs tracking-[0.3em]">✶✶✶</span>
        </div>
      </footer>
    </div>
  );
};

export default Login;
