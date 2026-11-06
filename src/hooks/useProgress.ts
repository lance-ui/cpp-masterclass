import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ActiveTab, CourseModule, User } from '@/types';
import { calculateOverallProgress } from '@/utils/courseLogic';

export function useProgress(
  modules: CourseModule[],
  currentUser: User,
  setCurrentUser: Dispatch<SetStateAction<User>>
) {
  if (modules.length === 0) throw new Error('The course must contain at least one module.');

  const [selectedModuleId, setSelectedModuleId] = useState(modules[0]?.id ?? '');
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const selectModule = (moduleId: string, tab: ActiveTab = 'overview') => {
    if (!modules.some(module => module.id === moduleId)) {
      console.error(`Cannot select unknown course module "${moduleId}".`);
      return;
    }
    setSelectedModuleId(moduleId);
    setActiveTab(tab);
    setCurrentUser(user => ({
      ...user,
      recentModuleIds: [moduleId, ...user.recentModuleIds.filter(id => id !== moduleId)].slice(0, 8)
    }));
  };

  const toggleComplete = (moduleId: string) => {
    setCurrentUser(user => ({
      ...user,
      completedModuleIds: user.completedModuleIds.includes(moduleId)
        ? user.completedModuleIds.filter(id => id !== moduleId)
        : [...user.completedModuleIds, moduleId]
    }));
  };

  const toggleBookmark = (moduleId: string) => {
    setCurrentUser(user => ({
      ...user,
      bookmarkedModuleIds: user.bookmarkedModuleIds.includes(moduleId)
        ? user.bookmarkedModuleIds.filter(id => id !== moduleId)
        : [...user.bookmarkedModuleIds, moduleId]
    }));
  };

  const saveQuizScore = (moduleId: string, score: number) => {
    setCurrentUser(user => ({
      ...user,
      quizScores: { ...user.quizScores, [moduleId]: score }
    }));
  };

  const saveUserNote = (moduleId: string, note: string) => {
    setCurrentUser(user => ({
      ...user,
      notes: { ...user.notes, [moduleId]: note }
    }));
  };

  const currentModuleIndex = modules.findIndex(module => module.id === selectedModuleId);
  const activeModule = modules.find(module => module.id === selectedModuleId) ?? modules[0];
  if (!activeModule) throw new Error('The selected course module is unavailable.');
  const hasPrev = currentModuleIndex > 0;
  const hasNext = currentModuleIndex < modules.length - 1;
  const previousModule = hasPrev ? modules.at(currentModuleIndex - 1) : undefined;
  const nextModule = hasNext ? modules.at(currentModuleIndex + 1) : undefined;
  const progressPercentage = calculateOverallProgress(
    currentUser.completedModuleIds,
    modules.length
  );

  return {
    selectedModuleId,
    activeTab,
    setActiveTab,
    selectModule,
    toggleComplete,
    toggleBookmark,
    saveQuizScore,
    saveUserNote,
    activeModule,
    hasPrev,
    hasNext,
    navigatePrev: () => {
      if (previousModule) selectModule(previousModule.id);
    },
    navigateNext: () => {
      if (nextModule) selectModule(nextModule.id);
    },
    progressPercentage
  };
}
