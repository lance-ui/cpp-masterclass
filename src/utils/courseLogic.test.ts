import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOverallProgress,
  filterCourseTopics,
  calculateQuizScore,
  buildDrivePreviewUrl,
  buildDriveViewUrl,
  formatCppCode
} from './courseLogic';
import { CourseModule, QuizQuestion } from '../types';

test('calculateOverallProgress handles zero, partial, and full completion', () => {
  assert.equal(calculateOverallProgress([], 27), 0);
  assert.equal(calculateOverallProgress(['m1', 'm2', 'm3'], 27), 11);
  assert.equal(calculateOverallProgress(Array.from({ length: 27 }, (_, i) => `m${i}`), 27), 100);
  assert.equal(calculateOverallProgress(['m1'], 0), 0);
});

test('calculateQuizScore grades answers accurately', () => {
  const sampleQuestions: QuizQuestion[] = [
    { id: 'q1', question: 'What is int?', options: ['Type', 'Loop'], correctAnswer: 0, explanation: '' },
    { id: 'q2', question: 'What is cout?', options: ['Input', 'Output stream'], correctAnswer: 1, explanation: '' },
    { id: 'q3', question: 'What is delete?', options: ['Alloc', 'Free memory'], correctAnswer: 1, explanation: '' },
    { id: 'q4', question: 'What is vector?', options: ['Dynamic array', 'Scalar'], correctAnswer: 0, explanation: '' }
  ];

  // 4/4 = 100%
  const res100 = calculateQuizScore({ q1: 0, q2: 1, q3: 1, q4: 0 }, sampleQuestions);
  assert.equal(res100.score, 4);
  assert.equal(res100.percentage, 100);
  assert.equal(res100.passed, true);

  // 2/4 = 50% (< 70% threshold)
  const res50 = calculateQuizScore({ q1: 0, q2: 1, q3: 0, q4: 1 }, sampleQuestions);
  assert.equal(res50.score, 2);
  assert.equal(res50.percentage, 50);
  assert.equal(res50.passed, false);
});

test('filterCourseTopics searches across titles, descriptions, and categories', () => {
  const dummyModules: CourseModule[] = [
    {
      id: 'm1',
      moduleNumber: 1,
      title: 'Introduction to C++',
      category: 'Beginner',
      description: 'First steps with modern C++ compilers',
      folderId: 'f1',
      folderName: '1. Introduction',
      videos: [{ id: 'v1', title: 'Getting Started', fileName: 'v1.mp4', driveId: 'd1', duration: '10m', previewUrl: '' }],
      documents: [],
      exercises: [],
      codeSnippets: [],
      quiz: [],
      readingTime: '15m'
    },
    {
      id: 'm8',
      moduleNumber: 8,
      title: 'Arrays and Matrices',
      category: 'Core Concepts',
      description: 'Fixed-size buffers and 2D arrays',
      folderId: 'f8',
      folderName: '8. Arrays',
      videos: [],
      documents: [{ id: 'doc1', title: 'Array Notes', fileName: 'notes.pdf', driveId: 'd2', previewUrl: '' }],
      exercises: [],
      codeSnippets: [{ title: 'Matrix multiplication', description: '', code: 'int arr[3][3];', expectedOutput: '', explanation: '' }],
      quiz: [],
      readingTime: '20m'
    }
  ];

  assert.equal(filterCourseTopics(dummyModules, '').length, 2);
  assert.equal(filterCourseTopics(dummyModules, 'matrices').length, 1);
  assert.equal(filterCourseTopics(dummyModules, 'getting started').length, 1);
  assert.equal(filterCourseTopics(dummyModules, '', 'Beginner').length, 1);
  assert.equal(filterCourseTopics(dummyModules, '', 'Core Concepts').length, 1);
  assert.equal(filterCourseTopics(dummyModules, 'nonexistent').length, 0);
});

test('buildDrivePreviewUrl outputs proper preview links', () => {
  assert.equal(buildDrivePreviewUrl('1oy9XxlDLeu970jzfruHk0k0uzPn5lHpb'), 'https://drive.google.com/file/d/1oy9XxlDLeu970jzfruHk0k0uzPn5lHpb/preview');
  assert.equal(buildDrivePreviewUrl(''), '');
});

test('buildDriveViewUrl opens the Drive file viewer', () => {
  assert.equal(
    buildDriveViewUrl('1oy9XxlDLeu970jzfruHk0k0uzPn5lHpb'),
    'https://drive.google.com/file/d/1oy9XxlDLeu970jzfruHk0k0uzPn5lHpb/view',
  );
  assert.equal(buildDriveViewUrl(''), '');
});

test('formatCppCode formats indentation and braces properly', () => {
  const unformatted = 'int main(){\nint x=1;\nif(x){\ncout<<x;\n}\nreturn 0;\n}';
  const formatted = formatCppCode(unformatted);
  assert.match(formatted, /    int x=1;/);
  assert.match(formatted, /        cout<<x;/);
});
