export type UserRole = "student" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  bookmarkedModuleIds: string[];
  completedModuleIds: string[];
  quizScores: Record<string, number>;
  recentModuleIds: string[];
  notes: Record<string, string>;
  avatarUrl?: string;
  authProvider?: "local" | "google";
}

export interface VideoLesson {
  id: string;
  title: string;
  fileName: string;
  driveId: string;
  duration: string;
  previewUrl: string;
}

export interface PDFDocument {
  id: string;
  title: string;
  fileName: string;
  driveId: string;
  previewUrl: string;
}

export interface PracticeExercise {
  id: string;
  title: string;
  driveId: string;
  previewUrl: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface CodeSnippet {
  title: string;
  description: string;
  code: string;
  expectedOutput: string;
  explanation: string;
}

export interface CourseModule {
  id: string;
  moduleNumber: number;
  title: string;
  category:
    | "Beginner"
    | "Core Concepts"
    | "Object Oriented (OOP)"
    | "Advanced C++ & STL"
    | "Projects & Deep Dives";
  description: string;
  folderId: string;
  folderName: string;
  videosCount?: number;
  documentsCount?: number;
  exercisesCount?: number;
  videos: VideoLesson[];
  documents: PDFDocument[];
  exercises: PracticeExercise[];
  codeSnippets: CodeSnippet[];
  quiz: QuizQuestion[];
  readingTime: string;
}

export type ActiveTab =
  | "overview"
  | "video"
  | "pdf"
  | "code"
  | "quiz";
export type AppView =
  | "landing"
  | "login"
  | "signup"
  | "learn"
  | "playground"
  | "dashboard"
  | "admin"
  | "community"
  | "design"
  | "terms"
  | "privacy";
