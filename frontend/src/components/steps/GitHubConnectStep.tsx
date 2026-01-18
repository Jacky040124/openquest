import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useGitHubAuthorize, getOAuthToken } from '@/hooks/useGitHubOAuth';
import { Github, CheckCircle, Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GitHubConnectStep = () => {
  const [searchParams] = useSearchParams();
  const { githubConnected, githubUsername, setGitHubConnected } = useAuthStore();
  const { nextStep } = usePreferencesStore();
  const githubAuthorize = useGitHubAuthorize();

  // Check for callback results (from OAuth redirect)
  const callbackUsername = searchParams.get('github_username');
  const justConnected = searchParams.get('github_connected') === 'true';
  const githubError = searchParams.get('github_error');

  // Update state from callback params and restore token from sessionStorage
  useEffect(() => {
    if (justConnected && callbackUsername) {
      // Get token from sessionStorage (stored during OAuth callback)
      const token = getOAuthToken();
      setGitHubConnected(true, callbackUsername, token);
    }
  }, [justConnected, callbackUsername, setGitHubConnected]);

  // Clear URL params after reading
  useEffect(() => {
    if (justConnected || githubError) {
      window.history.replaceState({}, '', '/onboarding');
    }
  }, [justConnected, githubError]);

  const handleConnectGitHub = () => {
    githubAuthorize.mutate();
  };

  const handleContinue = () => {
    nextStep();
  };

  const handleSkip = () => {
    nextStep();
  };

  const isConnected = githubConnected || justConnected;
  const displayUsername = githubUsername || callbackUsername;

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
          <Github className="w-8 h-8 text-primary" />
        </motion.div>
        <h2 className="text-3xl font-bold mb-3">Connect GitHub</h2>
        <p className="text-muted-foreground">
          Connect your GitHub account to enable the AI agent to push code changes on your behalf
        </p>
      </div>

      <motion.div
        className="card-interactive p-6 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {githubError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm text-center"
          >
            {githubError === 'denied'
              ? 'GitHub authorization was denied. Please try again.'
              : githubError === 'exchange_failed'
              ? 'Failed to connect to GitHub. Please try again.'
              : 'An error occurred. Please try again.'}
          </motion.div>
        )}

        {isConnected ? (
          // Connected state
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div className="text-center">
                <p className="font-medium text-green-500">GitHub Connected</p>
                {displayUsername && (
                  <p className="text-sm text-muted-foreground">@{displayUsername}</p>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              The AI agent can now create branches and push code to your repositories.
            </p>

            <Button
              onClick={handleContinue}
              className="w-full"
            >
              Continue to Create Account
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ) : (
          // Not connected state
          <div className="space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>By connecting your GitHub account, you allow the AI agent to:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Create branches in your repositories</li>
                <li>Push code changes on your behalf</li>
                <li>Create pull requests for your contributions</li>
              </ul>
            </div>

            <Button
              onClick={handleConnectGitHub}
              className="w-full"
              disabled={githubAuthorize.isPending}
            >
              {githubAuthorize.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Github className="w-4 h-4 mr-2" />
                  Connect GitHub
                  <ExternalLink className="w-3 h-3 ml-2" />
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={handleSkip}
              className="w-full text-muted-foreground"
            >
              Skip for now
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              You can connect GitHub later from your profile settings.
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default GitHubConnectStep;
