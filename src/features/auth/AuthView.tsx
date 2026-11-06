import React, { useState } from 'react';
import { 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Sun, 
  Moon, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UserRole } from '@/types';
import { Button, Input } from '@/components/ui';

interface AuthViewProps {
  onLogin: (email: string, password?: string) => { success: boolean; error?: string };
  onSignup: (name: string, email: string, role: UserRole, password?: string) => { success: boolean; error?: string };
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onLogin,
  onSignup,
  isDarkMode,
  onToggleDarkMode
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (mode === 'signin') {
      if (!email.trim()) {
        setError('Please enter your email address.');
        return;
      }
      const res = onLogin(email, password);
      if (!res.success) {
        setError(res.error || 'Failed to sign in. Please verify your credentials.');
      }
    } else {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Please provide a valid email address.');
        return;
      }
      if (password && password.length < 4) {
        setError('Password should be at least 4 characters.');
        return;
      }
      const res = onSignup(name, email, role, password);
      if (!res.success) {
        setError(res.error || 'Failed to create account.');
      } else {
        setSuccessMsg('Account created successfully! Redirecting...');
      }
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-between bg-canvas dark:bg-canvas-dark text-ink dark:text-ink-dark transition-colors px-4 py-8">
      {/* Top Bar with Brand & Theme Toggle */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-700 flex items-center justify-center text-white shadow-sm">
            <span className="font-extrabold text-base font-mono">C++</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              C++ MasterClass
            </h1>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Beginner to Advance • 27 Interactive Modules
            </span>
          </div>
        </div>

        <button
          onClick={onToggleDarkMode}
          className="grid size-11 place-items-center text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Main Auth Container */}
      <main className="my-auto py-10 w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          {/* Tab Selector */}
          <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-1.5">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {mode === 'signin' ? 'Welcome back' : 'Start your C++ journey'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {mode === 'signin'
                  ? 'Sign in to access your course lessons, code sandbox, and progress.'
                  : 'Register your learner profile to track modules, notes, and quiz scores.'}
              </p>
            </div>

            {error && (
              <div role="alert" className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-red-700 dark:text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div role="status" className="flex items-center space-x-2 p-3 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/60 rounded-xl text-brand-700 dark:text-brand-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1">
                  <Input
                    label="Full Name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="space-y-1">
                <Input
                  label="Email Address"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    className="min-h-11 w-full rounded-control border border-slate-300 bg-white px-3 pr-10 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Account Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="min-h-11 w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-control focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
                  >
                    <option value="student">Student / Learner</option>
                    <option value="admin">Course Administrator</option>
                  </select>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full font-bold shadow-md"
              >
                <span>{mode === 'signin' ? 'Sign In to Platform' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        <p>C++ MasterClass • Interactive Web-Based Learning Platform</p>
      </footer>
    </div>
  );
};

