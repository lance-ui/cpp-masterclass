import type { User } from '../types';

export const DEMO_USERS: User[] = [
  {
    id: 'demo-student',
    name: 'Demo Student',
    email: 'student@example.test',
    role: 'student',
    bookmarkedModuleIds: ['module-5'],
    completedModuleIds: ['module-1', 'module-2'],
    quizScores: { 'module-1': 80 },
    recentModuleIds: ['module-2', 'module-1'],
    notes: {}
  },
  {
    id: 'demo-admin',
    name: 'Demo Administrator',
    email: 'admin@example.test',
    role: 'admin',
    bookmarkedModuleIds: [],
    completedModuleIds: [],
    quizScores: {},
    recentModuleIds: [],
    notes: {}
  }
];
