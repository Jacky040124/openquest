import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useRegister, useLogin, useCreatePreferences } from '@/hooks/useAuth';
import { Mail, Lock, Eye, EyeOff, Loader2, User, ArrowRight } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE ACCOUNT STEP - E2B INDUSTRIAL AESTHETIC
// Terminal windows, ASCII art, orange accents, monospace typography
// ═══════════════════════════════════════════════════════════════════════════════

const CreateAccountStep = () => {
  const navigate = useNavigate();
  const { error: authError, setError } = useAuthStore();
  const { preferences, getSkillsForApi, resetPreferences } = usePreferencesStore();
  const registerMutation = useRegister();
  const loginMutation = useLogin();
  const createPrefsMutation = useCreatePreferences();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const isLoading = registerMutation.isPending || loginMutation.isPending || createPrefsMutation.isPending;

  const handleCreateAccount = async () => {
    setLocalError('');
    setError(null);

    // Validation
    if (!username.trim()) {
      setLocalError('Please enter a username');
      return;
    }
    if (username.trim().length < 3) {
      setLocalError('Username must be at least 3 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
      setLocalError('Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }
    if (!email.trim()) {
      setLocalError('Please enter an email address');
      return;
    }
    if (!email.includes('@')) {
      setLocalError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      // 1. Register the user
      await registerMutation.mutateAsync({ email: email.trim(), password, username: username.trim() });

      // 2. Login to get tokens
      await loginMutation.mutateAsync({ email: email.trim(), password });

      // 3. Create preferences (GitHub OAuth is done after signup in Dashboard)
      await createPrefsMutation.mutateAsync({
        user_name: username.trim(),
        languages: preferences.languages,
        skills: getSkillsForApi(),
        project_interests: preferences.project_interests,
        issue_interests: preferences.issue_interests,
      });

      // 4. Reset preferences store (clear onboarding state)
      resetPreferences();

      // 5. Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      // Errors are handled by the mutation hooks
      console.error('Registration flow error:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleCreateAccount();
    }
  };

  const displayError = localError || authError;

  return (
    <motion.div
      className="max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-3 mb-6"
        >
          <span className="text-white/30 tracking-[0.3em] text-xs">✶✶✶</span>
          <span className="text-[11px] text-white/50 tracking-[0.3em] uppercase">FINAL STEP</span>
          <span className="text-white/30 tracking-[0.3em] text-xs">✶✶✶</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
          style={{ fontFamily: "'JetBrains Mono', 'SF Mono', Monaco, monospace" }}
        >
          CREATE YOUR <span className="text-[#FF6B00]">ACCOUNT</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-white/50 text-sm tracking-wide"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          Set up your credentials to save your preferences
        </motion.p>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* TERMINAL-STYLE FORM */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
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
            <span className="text-[10px] text-white/60 tracking-widest mx-3 font-bold">REGISTER</span>
            <span className="text-[10px] text-white/40 tracking-[0.2em]">━━━━━━</span>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-5">
          {/* Error message */}
          {displayError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border border-red-500/30 bg-red-500/5 text-red-400 text-sm font-mono"
            >
              <div className="flex items-center gap-2">
                <span className="text-red-500">▸</span>
                <span>ERROR:</span>
              </div>
              <div className="mt-1 pl-4 text-red-400/80">{displayError}</div>
            </motion.div>
          )}

          {/* Username Field */}
          <div className="space-y-2">
            <label htmlFor="username" className="text-[11px] font-medium text-white/60 tracking-widest uppercase flex items-center gap-2">
              <User className="w-3 h-3" />
              USERNAME
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                placeholder="your_username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setLocalError('');
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-white placeholder-white/30
                           focus:outline-none focus:border-[#FF6B00]/50 focus:bg-[#FF6B00]/5
                           transition-all duration-200 font-mono text-sm tracking-wide"
                disabled={isLoading}
              />
            </div>
          </div>

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
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLocalError('');
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-white placeholder-white/30
                           focus:outline-none focus:border-[#FF6B00]/50 focus:bg-[#FF6B00]/5
                           transition-all duration-200 font-mono text-sm tracking-wide"
                disabled={isLoading}
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
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLocalError('');
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 pr-12 text-white placeholder-white/30
                           focus:outline-none focus:border-[#FF6B00]/50 focus:bg-[#FF6B00]/5
                           transition-all duration-200 font-mono text-sm tracking-wide"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-[11px] font-medium text-white/60 tracking-widest uppercase flex items-center gap-2">
              <Lock className="w-3 h-3" />
              CONFIRM PASSWORD
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setLocalError('');
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 pr-12 text-white placeholder-white/30
                           focus:outline-none focus:border-[#FF6B00]/50 focus:bg-[#FF6B00]/5
                           transition-all duration-200 font-mono text-sm tracking-wide"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleCreateAccount}
            disabled={isLoading}
            className="w-full bg-[#FF6B00] text-black py-4 text-sm tracking-[0.2em] uppercase font-bold
                       hover:bg-[#FF8533] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2 mt-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>CREATING ACCOUNT...</span>
              </>
            ) : (
              <>
                <span>CREATE ACCOUNT</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Terms Text */}
          <p className="text-[10px] text-white/30 text-center leading-relaxed mt-4">
            By creating an account, you'll be able to save your preferences
            <br />and track your contributions across open source projects.
          </p>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ASCII DECORATION */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 0.6 }}
        className="mt-8 text-center font-mono text-[10px] text-white/20"
      >
        ┌────────────────────────────────────┐<br />
        │&nbsp;&nbsp;SECURE CONNECTION ESTABLISHED&nbsp;&nbsp;│<br />
        └────────────────────────────────────┘
      </motion.div>
    </motion.div>
  );
};

export default CreateAccountStep;
