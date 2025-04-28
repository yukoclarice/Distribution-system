import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, UserPlus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate form
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      await register({
        username,
        password,
        fname: firstName,
        lname: lastName,
        contact_no: contact,
      });
      
      // Show success toast
      toast.success('Registration successful!', {
        position: 'top-center',
        duration: 2000,
        className: 'bg-green-50 dark:bg-green-900/20',
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      });
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center animated-bg bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 px-4 py-12 relative overflow-hidden">
      {/* Add style tag for autocomplete styles */}
      <style dangerouslySetInnerHTML={{ __html: globalStyle }} />
      
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-lg">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center shadow-lg">
              <UserPlus className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Create an account</h1>
          <p className="text-indigo-200/80">Sign up to access your dashboard</p>
        </div>
        
        <Card className="w-full shadow-xl rounded-2xl border-white/10 overflow-hidden bg-white/10 backdrop-blur-md text-white">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-6">
              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 text-white text-sm rounded-xl flex items-center justify-center">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-indigo-100">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    className="h-12 pl-4 border-white/20 bg-white/5 text-white backdrop-blur-sm focus:border-indigo-400 focus:ring-indigo-400/30 placeholder:text-indigo-200/50 transition-all duration-300"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-indigo-100">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                    className="h-12 pl-4 border-white/20 bg-white/5 text-white backdrop-blur-sm focus:border-indigo-400 focus:ring-indigo-400/30 placeholder:text-indigo-200/50 transition-all duration-300"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-indigo-100">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  className="h-12 pl-4 border-white/20 bg-white/5 text-white backdrop-blur-sm focus:border-indigo-400 focus:ring-indigo-400/30 placeholder:text-indigo-200/50 transition-all duration-300"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact" className="text-sm font-medium text-indigo-100">
                  Contact Number
                </Label>
                <Input
                  id="contact"
                  type="text"
                  placeholder="09XXXXXXXXX"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  autoComplete="tel"
                  className="h-12 pl-4 border-white/20 bg-white/5 text-white backdrop-blur-sm focus:border-indigo-400 focus:ring-indigo-400/30 placeholder:text-indigo-200/50 transition-all duration-300"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-indigo-100">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="h-12 pl-4 border-white/20 bg-white/5 text-white backdrop-blur-sm focus:border-indigo-400 focus:ring-indigo-400/30 placeholder:text-indigo-200/50 transition-all duration-300"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-indigo-100">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="h-12 pl-4 border-white/20 bg-white/5 text-white backdrop-blur-sm focus:border-indigo-400 focus:ring-indigo-400/30 placeholder:text-indigo-200/50 transition-all duration-300"
                />
              </div>
              
              <Button 
                type="submit" 
                className={cn(
                  "w-full h-12 shadow-lg hover:shadow-xl transition-all duration-300 font-medium text-base rounded-xl",
                  "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                )}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : 'Create account'}
              </Button>
            </CardContent>
          </form>
          
          <div className="py-5 text-center mt-6">
            <p className="text-sm text-indigo-100/70">
              Already have an account?{' '}
              <Link to="/login" className="text-white font-medium hover:text-indigo-200 transition-colors duration-200">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
} 