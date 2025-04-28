import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, AlertCircle, CheckCircle2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Add global styles for autocomplete inputs
const globalStyle = `
  input:-webkit-autofill,
  input:-webkit-autofill:hover, 
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px var(--card) inset !important;
    -webkit-text-fill-color: var(--card-foreground) !important;
    caret-color: var(--card-foreground) !important;
    transition: background-color 5000s ease-in-out 0s;
  }
  
  .animated-bg {
    background-size: 400% 400%;
    animation: gradient 15s ease infinite;
  }
  
  @keyframes gradient {
    0% {
      background-position: 0% 50%;
    }
    25% {
      background-position: 50% 100%;
    }
    50% {
      background-position: 100% 50%;
    }
    75% {
      background-position: 50% 0%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Get redirect path from location state or default to home
  const from = (location.state?.from?.pathname as string) || '/';

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    
    try {
      // Get user from login response
      const user = await login({ username, password });
      setSuccess(true);
      
      // Determine redirect path based on user role
      let redirectPath = '/';
      if (user?.userType === 'Administrator') {
        redirectPath = '/'; // Administrators go to dashboard
      } else if (user?.userType === 'user') {
        redirectPath = '/reports'; // Regular users go to reports
      }
      
      // Show success toast
      toast.success('Login successful', {
        position: 'top-center',
        duration: 2000,
        className: 'bg-green-50 dark:bg-green-900/20',
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      });
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center animated-bg bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 px-4 py-12 relative overflow-hidden">
      {/* Add style tag for autocomplete styles and animations */}
      <style dangerouslySetInnerHTML={{ __html: globalStyle }} />
      
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center shadow-lg">
              <LogIn className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-indigo-200/80">Sign in to access your dashboard</p>
        </div>
      
        <Card className="w-full border-0 bg-white/10 backdrop-blur-md text-white shadow-2xl rounded-2xl overflow-hidden">
          {error && (
            <div className="px-6 pt-6">
              <Alert variant="destructive" className="mb-0 bg-red-500/20 border-red-500/30 text-white">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
          
          {success && (
            <div className="px-6 pt-6">
              <Alert className="mb-0 bg-green-500/20 border-green-500/30 text-white">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                <AlertDescription>Login successful! Redirecting...</AlertDescription>
              </Alert>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 px-6 pt-6">
              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-indigo-100">
                  Username
                </Label>
                <div className="relative group">
                  <Input
                    id="email"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                    disabled={success || isLoading}
                    className="h-12 pl-4 border-white/20 bg-white/5 text-white backdrop-blur-sm focus:border-indigo-400 focus:ring-indigo-400/30 placeholder:text-indigo-200/50 transition-all duration-300"
                  />
                </div>
              </div>
              
              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-indigo-100">
                  Password
                </Label>
                <div className="relative group">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={success || isLoading}
                    className="h-12 pl-4 border-white/20 bg-white/5 text-white backdrop-blur-sm focus:border-indigo-400 focus:ring-indigo-400/30 placeholder:text-indigo-200/50 transition-all duration-300"
                  />
                </div>
              </div>
              
              {/* Submit button */}
              <Button 
                type="submit" 
                className={cn(
                  "w-full h-12 font-medium mt-2 rounded-xl shadow-lg text-base",
                  success 
                    ? "bg-green-500/80 hover:bg-green-600/80 text-white" 
                    : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white transition-all duration-300"
                )}
                disabled={isLoading || success}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Login successful!
                  </>
                ) : 'Sign in'}
              </Button>
            </CardContent>
          </form>
          
          <CardFooter className="pt-4 pb-6 flex justify-center">
            <p className="text-sm text-indigo-100/70">
              Don't have an account?{' '}
              {!success ? (
                <Link to="/register" className="text-white font-medium hover:text-indigo-200 transition-colors duration-200">
                  Create account
                </Link>
              ) : (
                <span className="text-indigo-100/50">Create account</span>
              )}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 