import { CourseModule, QuizQuestion } from '../types';

/**
 * Calculates course completion percentage across total lessons/modules.
 */
export function calculateOverallProgress(
  completedModuleIds: string[],
  totalModulesCount: number
): number {
  if (totalModulesCount <= 0) return 0;
  const completed = Math.min(completedModuleIds.length, totalModulesCount);
  return Math.round((completed / totalModulesCount) * 100);
}

/**
 * Filters course topics by a search query and optional category filter.
 */
export function filterCourseTopics(
  modules: CourseModule[],
  query: string,
  categoryFilter?: string
): CourseModule[] {
  const normalizedQuery = query.trim().toLowerCase();
  
  return modules.filter(mod => {
    if (categoryFilter && categoryFilter !== 'All' && mod.category !== categoryFilter) {
      return false;
    }
    
    if (!normalizedQuery) return true;
    
    if (mod.title.toLowerCase().includes(normalizedQuery) ||
        mod.description.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    
    const hasVideoMatch = mod.videos.some(v => v.title.toLowerCase().includes(normalizedQuery));
    if (hasVideoMatch) return true;

    const hasDocMatch = mod.documents.some(d => d.title.toLowerCase().includes(normalizedQuery));
    if (hasDocMatch) return true;

    const hasCodeMatch = mod.codeSnippets.some(c => 
      c.title.toLowerCase().includes(normalizedQuery) || 
      c.code.toLowerCase().includes(normalizedQuery)
    );
    if (hasCodeMatch) return true;

    return false;
  });
}

/**
 * Calculates quiz score and pass status.
 */
export function calculateQuizScore(
  userAnswers: Record<string, number>,
  questions: QuizQuestion[]
): { score: number; total: number; percentage: number; passed: boolean } {
  const total = questions.length;
  if (total === 0) return { score: 0, total: 0, percentage: 100, passed: true };

  let correct = 0;
  questions.forEach(q => {
    if (userAnswers[q.id] === q.correctAnswer) {
      correct++;
    }
  });

  const percentage = Math.round((correct / total) * 100);
  return {
    score: correct,
    total,
    percentage,
    passed: percentage >= 70
  };
}

/**
 * Generates an embeddable Google Drive preview URL from a file ID.
 */
export function buildDrivePreviewUrl(fileId: string): string {
  if (!fileId) return '';
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Opens the file in Google Drive's full viewer (better controls than a tiny embed).
 */
export function buildDriveViewUrl(fileId: string): string {
  if (!fileId) return '';
  return `https://drive.google.com/file/d/${fileId}/view`;
}

/**
 * Formats C++ source code with clean 4-space indentation and brace alignment.
 */
export function formatCppCode(rawCode: string): string {
  const lines = rawCode.split('\n');
  let indentLevel = 0;
  const formatted: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Preserve empty lines
    if (!line) {
      formatted.push('');
      continue;
    }

    // Access specifiers (public:, private:, protected:) indent at -1
    const isAccessSpecifier = /^(public|private|protected):/.test(line);

    // If line starts with closing brace, decrease indent before printing
    const closingBraces = (line.match(/^(\s*\})+/)?.[0] || '').replace(/\s+/g, '').length;
    if (closingBraces > 0) {
      indentLevel = Math.max(0, indentLevel - closingBraces);
    }

    const currentIndent = Math.max(0, isAccessSpecifier ? indentLevel - 1 : indentLevel);
    const indentSpace = '    '.repeat(currentIndent);
    formatted.push(`${indentSpace}${line}`);

    // Count opening braces that are not matched on the same line
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;
    const netOpens = opens - closes;
    if (netOpens > 0) {
      indentLevel += netOpens;
    }
  }

  return formatted.join('\n');
}

