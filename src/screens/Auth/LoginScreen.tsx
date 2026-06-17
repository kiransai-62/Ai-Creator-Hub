/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';
import { Logo } from '../../components/Logo/Logo';
import './LoginScreen.css';

interface LoginScreenProps {
  onSuccess: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot-password';

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // F-1: Sign Up flow
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      setSuccessMessage('Check your email for a confirmation link to complete your registration.');
      setMode('login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // F-2: Forgot Password flow
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      setSuccessMessage('Password reset link sent to your email. Check your inbox.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = (newMode: AuthMode) => {
    setError(null);
    setSuccessMessage(null);
    setMode(newMode);
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <Logo size={40} layout="vertical" className="login-logo" />
          <p>
            {mode === 'login' && 'Create, Discover & Share AI'}
            {mode === 'signup' && 'Join the AI Creator Community'}
            {mode === 'forgot-password' && 'Reset Your Password'}
          </p>
        </div>

        {error && <div className="login-error">{error}</div>}
        {successMessage && <div className="login-success">{successMessage}</div>}

        {/* ── Sign In Form ──────────────────────────────── */}
        {mode === 'login' && (
          <>
            <form onSubmit={handleEmailLogin} className="email-form">
              <label htmlFor="signin-email" className="input-label">Email Address</label>
              <div className="input-group">
                <Mail className="input-icon" size={18} />
                <input 
                  type="email" 
                  id="signin-email"
                  placeholder="your@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  aria-label="Email address"
                />
              </div>

              <label htmlFor="signin-password" className="input-label">Password</label>
              <div className="input-group">
                <Lock className="input-icon" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  id="signin-password"
                  placeholder="••••••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  aria-label="Password"
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="forgot-password">
                <button type="button" onClick={() => resetForm('forgot-password')}>Forgot Password?</button>
              </div>

              <button type="submit" className="btn btn-primary btn-signin" disabled={loading || !email || !password}>
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="divider">
              <span>OR CONTINUE WITH</span>
            </div>

            <button 
              className="btn btn-google" 
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="google-icon" />
              Google Sign In
            </button>

            <div className="signup-prompt">
              Don't have an account? <button type="button" className="signup-link" onClick={() => resetForm('signup')}>Sign Up</button>
            </div>
          </>
        )}

        {/* ── Sign Up Form ──────────────────────────────── */}
        {mode === 'signup' && (
          <>
            <form onSubmit={handleSignUp} className="email-form">
              <label htmlFor="signup-email" className="input-label">Email Address</label>
              <div className="input-group">
                <Mail className="input-icon" size={18} />
                <input 
                  type="email" 
                  id="signup-email"
                  placeholder="your@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  aria-label="Email address"
                />
              </div>

              <label htmlFor="signup-password" className="input-label">Password</label>
              <div className="input-group">
                <Lock className="input-icon" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  id="signup-password"
                  placeholder="Min 6 characters" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  aria-label="Password"
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <label htmlFor="signup-confirm-password" className="input-label">Confirm Password</label>
              <div className="input-group">
                <Lock className="input-icon" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  id="signup-confirm-password"
                  placeholder="Re-enter password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  aria-label="Confirm password"
                />
              </div>

              <button type="submit" className="btn btn-primary btn-signin" disabled={loading || !email || !password || !confirmPassword}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="divider">
              <span>OR CONTINUE WITH</span>
            </div>

            <button 
              className="btn btn-google" 
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="google-icon" />
              Google Sign Up
            </button>

            <div className="signup-prompt">
              Already have an account? <button type="button" className="signup-link" onClick={() => resetForm('login')}>Sign In</button>
            </div>
          </>
        )}

        {/* ── Forgot Password Form ──────────────────────── */}
        {mode === 'forgot-password' && (
          <>
            <form onSubmit={handleForgotPassword} className="email-form">
              <label htmlFor="forgot-email" className="input-label">Email Address</label>
              <div className="input-group">
                <Mail className="input-icon" size={18} />
                <input 
                  type="email" 
                  id="forgot-email"
                  placeholder="your@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  aria-label="Email address"
                />
              </div>

              <button type="submit" className="btn btn-primary btn-signin" disabled={loading || !email}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="signup-prompt" style={{ marginTop: 16 }}>
              <button type="button" className="signup-link" onClick={() => resetForm('login')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ArrowLeft size={14} />
                Back to Sign In
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
