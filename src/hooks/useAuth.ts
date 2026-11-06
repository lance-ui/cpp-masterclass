import { useEffect, useState } from 'react';
import type { User, UserRole } from '@/types';
import { readStoredValue, writeStoredValue } from '@/utils/storage';

const LEGACY_DEMO_IDS = new Set(['student-1', 'user-2', 'user-3', 'admin-1', 'demo-student', 'demo-admin']);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === 'string');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNumberRecord = (value: unknown): value is Record<string, number> =>
  isRecord(value) &&
  Object.values(value).every(item => typeof item === 'number');

const isStringRecord = (value: unknown): value is Record<string, string> =>
  isRecord(value) &&
  Object.values(value).every(item => typeof item === 'string');

function isUser(value: unknown): value is User {
  if (!isRecord(value)) return false;
  const user = value;
  return typeof user.id === 'string' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    (user.role === 'student' || user.role === 'admin') &&
    isStringArray(user.bookmarkedModuleIds) &&
    isStringArray(user.completedModuleIds) &&
    isNumberRecord(user.quizScores) &&
    isStringArray(user.recentModuleIds) &&
    isStringRecord(user.notes);
}

const isNullableUser = (value: unknown): value is User | null =>
  value === null || isUser(value);

const isUserArray = (value: unknown): value is User[] =>
  Array.isArray(value) && value.every(isUser);

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const storedUser = readStoredValue<User | null>(
      'current-user',
      null,
      isNullableUser,
      'cpp_masterclass_current_user'
    );
    if (!storedUser || storedUser.id === 'guest' || LEGACY_DEMO_IDS.has(storedUser.id)) {
      return null;
    }
    return storedUser;
  });

  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const storedUsers = readStoredValue(
      'users',
      [] as User[],
      isUserArray,
      'cpp_masterclass_all_users'
    );
    return storedUsers.filter(u => !LEGACY_DEMO_IDS.has(u.id));
  });

  useEffect(() => {
    writeStoredValue('current-user', currentUser);
  }, [currentUser]);

  useEffect(() => {
    writeStoredValue('users', allUsers);
  }, [allUsers]);

  const login = (email: string, _password?: string) => {
    const trimmed = email.trim().toLowerCase();
    const found = allUsers.find(u => u.email.toLowerCase() === trimmed);
    if (found) {
      setCurrentUser(found);
      return { success: true };
    }
    // Auto-create learner account if first time
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: email.split('@')[0],
      email: email.trim(),
      role: 'student',
      bookmarkedModuleIds: [],
      completedModuleIds: [],
      quizScores: {},
      recentModuleIds: [],
      notes: {}
    };
    setAllUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    return { success: true };
  };

  const signup = (name: string, email: string, role: UserRole, _password?: string) => {
    const trimmed = email.trim().toLowerCase();
    const exists = allUsers.find(u => u.email.toLowerCase() === trimmed);
    if (exists) {
      setCurrentUser(exists);
      return { success: true };
    }
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role,
      bookmarkedModuleIds: [],
      completedModuleIds: [],
      quizScores: {},
      recentModuleIds: [],
      notes: {}
    };
    setAllUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    setAllUsers(users =>
      users.map(user => user.id === userId ? { ...user, role: newRole } : user)
    );
    setCurrentUser(user =>
      user && user.id === userId ? { ...user, role: newRole } : user
    );
  };

  return {
    currentUser,
    setCurrentUser,
    allUsers,
    login,
    signup,
    logout,
    updateUserRole
  };
}
