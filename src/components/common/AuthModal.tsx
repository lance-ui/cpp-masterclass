import React, { useState } from 'react';
import { UserCheck, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { User, UserRole } from '../../types';
import { Button, Input, Modal } from '../ui';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickSwitch = (newRole: UserRole) => {
    onUpdateUser({ ...currentUser, role: newRole });
    setNotification(`Previewing ${newRole} access.`);
    setTimeout(() => {
      setNotification(null);
      onClose();
    }, 900);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    onUpdateUser({
      ...currentUser,
      id: `user-${Date.now()}`,
      name: name || email.split('@')[0],
      email,
      role
    });
    setNotification('Profile saved in this browser.');
    setTimeout(() => {
      setNotification(null);
      onClose();
    }, 900);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isSignUp ? 'Create learner profile' : 'Learner profile'}
      className="max-w-md"
    >
        <div className="space-y-5 p-6">
          <p className="text-sm text-slate-500">Profile and progress stay in this browser.</p>
          {notification && (
            <div className="flex items-center space-x-2 p-3 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 rounded-xl text-brand-700 dark:text-brand-300 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {import.meta.env.DEV && (
            <div className="p-3.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Development preview
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickSwitch('student')}
                  className="flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-medium border bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Student access</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSwitch('admin')}
                  className="flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-medium border bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin access</span>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <Input
              label="Full name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              />
            )}

            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
            />

            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Requested Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="student">Student / Learner</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
            >
              {isSignUp ? 'Save profile' : 'Continue'}
            </Button>
          </form>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
            >
              {isSignUp ? 'Use existing profile' : 'Create a profile'}
            </button>
          </div>
        </div>
    </Modal>
  );
};
