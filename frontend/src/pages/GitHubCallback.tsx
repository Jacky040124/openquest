import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGitHubCallback } from '@/hooks/useGitHubOAuth';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const GitHubCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const githubCallback = useGitHubCallback();

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  useEffect(() => {
    // Handle OAuth error from GitHub
    if (error) {
      console.error('GitHub OAuth error:', error);
      // Redirect back to onboarding with error
      navigate('/onboarding?github_error=denied');
      return;
    }

    // Handle missing parameters
    if (!code || !state) {
      console.error('Missing OAuth parameters');
      navigate('/onboarding?github_error=invalid');
      return;
    }

    // Exchange code for token
    if (!githubCallback.isPending && !githubCallback.isSuccess && !githubCallback.isError) {
      githubCallback.mutate({ code, state });
    }
  }, [code, state, error, navigate, githubCallback]);

  // Redirect on success
  useEffect(() => {
    if (githubCallback.isSuccess && githubCallback.data) {
      // Redirect back to onboarding with success and username
      const username = githubCallback.data.username;
      navigate(`/onboarding?github_connected=true&github_username=${encodeURIComponent(username)}`);
    }
  }, [githubCallback.isSuccess, githubCallback.data, navigate]);

  // Redirect on error
  useEffect(() => {
    if (githubCallback.isError) {
      console.error('GitHub callback error:', githubCallback.error);
      navigate('/onboarding?github_error=exchange_failed');
    }
  }, [githubCallback.isError, githubCallback.error, navigate]);

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
