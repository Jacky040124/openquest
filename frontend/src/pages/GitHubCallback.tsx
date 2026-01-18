import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGitHubCallback } from '@/hooks/useGitHubOAuth';
import { useAuthStore } from '@/store/authStore';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const GitHubCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const githubCallback = useGitHubCallback();
  const { isLoggedIn } = useAuthStore();

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Helper to redirect based on login state
  const redirectWithError = (errorType: string) => {
    if (isLoggedIn) {
      // Logged in users go back to dashboard (they can try again from there)
      navigate('/dashboard');
    } else {
      // Onboarding users go back to onboarding with error
      navigate(`/onboarding?github_error=${errorType}`);
    }
  };

  useEffect(() => {
    // Handle OAuth error from GitHub
    if (error) {
      console.error('GitHub OAuth error:', error);
      redirectWithError('denied');
      return;
    }

    // Handle missing parameters
    if (!code || !state) {
      console.error('Missing OAuth parameters');
      redirectWithError('invalid');
      return;
    }

    // Exchange code for token
    if (!githubCallback.isPending && !githubCallback.isSuccess && !githubCallback.isError) {
      githubCallback.mutate({ code, state });
    }
  }, [code, state, error, navigate, githubCallback, isLoggedIn]);

  // Redirect on success
  useEffect(() => {
    if (githubCallback.isSuccess && githubCallback.data) {
      const { username, isLoggedIn } = githubCallback.data;

      if (isLoggedIn) {
        // User is logged in - redirect to dashboard
        navigate('/dashboard');
      } else {
        // User is in onboarding - redirect back with success params
        navigate(`/onboarding?github_connected=true&github_username=${encodeURIComponent(username)}`);
      }
    }
  }, [githubCallback.isSuccess, githubCallback.data, navigate]);

  // Redirect on error
  useEffect(() => {
    if (githubCallback.isError) {
      console.error('GitHub callback error:', githubCallback.error);
      redirectWithError('exchange_failed');
    }
  }, [githubCallback.isError, githubCallback.error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        {githubCallback.isPending && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <h1 className="text-xl font-semibold">Connecting to GitHub...</h1>
            <p className="text-muted-foreground">Please wait while we complete the connection.</p>
          </>
        )}

        {githubCallback.isSuccess && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h1 className="text-xl font-semibold">GitHub Connected!</h1>
            <p className="text-muted-foreground">Redirecting you back...</p>
          </>
        )}

        {githubCallback.isError && (
          <>
            <XCircle className="w-12 h-12 text-destructive mx-auto" />
            <h1 className="text-xl font-semibold">Connection Failed</h1>
            <p className="text-muted-foreground">
              {githubCallback.error?.message || 'Something went wrong. Please try again.'}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default GitHubCallback;
