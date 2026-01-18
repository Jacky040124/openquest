import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useRegister, useLogin, useCreatePreferences } from '@/hooks/useAuth';
import { Mail, Lock, Eye, EyeOff, UserPlus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const CreateAccountStep = () => {
  const navigate = useNavigate();
  const { error: authError, setError } = useAuthStore();
  const { preferences, getSkillsForApi, resetPreferences } = usePreferencesStore();
  const registerMutation = useRegister();
  const loginMutation = useLogin();
  const createPrefsMutation = useCreatePreferences();

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
      await registerMutation.mutateAsync({ email: email.trim(), password });

      // 2. Login to get tokens
      await loginMutation.mutateAsync({ email: email.trim(), password });

      // 3. Create preferences (GitHub OAuth is done after signup in Dashboard)
      await createPrefsMutation.mutateAsync({
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-center mb-8">
        <motion.div
          className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <UserPlus className="w-8 h-8 text-primary" />
        </motion.div>
        <h2 className="text-3xl font-bold mb-3">Create Your Account</h2>
        <p className="text-muted-foreground">
          Set up your credentials to save your preferences
        </p>
      </div>

      <motion.div
        className="card-interactive p-6 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {displayError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm text-center"
          >
            {displayError}
          </motion.div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setLocalError('');
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter your email"
            className="bg-background"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLocalError('');
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Create a password"
              className="bg-background pr-10"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Confirm Password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setLocalError('');
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Confirm your password"
              className="bg-background pr-10"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={isLoading}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button
          onClick={handleCreateAccount}
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Create Account & Continue
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          By creating an account, you'll be able to save your preferences and track your contributions.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default CreateAccountStep;
