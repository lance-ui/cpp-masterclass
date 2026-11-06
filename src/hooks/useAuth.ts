import { useEffect, useState } from 'react';
import type { User, UserRole } from '@/types';
import { DEMO_USERS } from '@/data/demoUsers';
import { readStoredValue, writeStoredValue } from '@/utils/storage';

const GUEST_USER: User = {
  id: 'guest',
  name: 'Guest',
  email: '',
  role: 'student',
  bookmarkedModuleIds: [],
  completedModuleIds: [],
  quizScores: {},
  recentModuleIds: [],
  notes: {}
};

const LEGACY_DEMO_IDS = new Set(['student-1', 'user-2', 'user-3', 'admin-1']);

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

const isUserArray = (value: unknown): value is User[] =>
  Array.isArray(value) && value.every(isUser);

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const storedUser = readStoredValue(
      'current-user',
      GUEST_USER,
      isUser,
      'cpp_masterclass_current_user'
    );
    return LEGACY_DEMO_IDS.has(storedUser.id) ? GUEST_USER : storedUser;
  });

  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const storedUsers = readStoredValue(
      'users',
      [],
      isUserArray,
      'cpp_masterclass_all_users'
    );
    const nonDemoUsers = storedUsers.filter(user =>
      !LEGACY_DEMO_IDS.has(user.id) &&
      (import.meta.env.DEV || !user.id.startsWith('demo-'))
    );
    return import.meta.env.DEV && nonDemoUsers.length === 0
      ? DEMO_USERS
      : nonDemoUsers;
  });

  useEffect(() => writeStoredValue('current-user', currentUser), [currentUser]);
  useEffect(() => writeStoredValue('users', allUsers), [allUsers]);

  const updateUserRole = (userId: string, newRole: UserRole) => {
    setAllUsers(users =>
      users.map(user => user.id === userId ? { ...user, role: newRole } : user)
    );
    setCurrentUser(user =>
      user.id === userId ? { ...user, role: newRole } : user
    );
  };

  return { currentUser, setCurrentUser, allUsers, updateUserRole };
}
