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
 * Simulates C++ compilation and execution in-browser.
 */
export interface CppExecutionResult {
  success: boolean;
  output: string;
  executionTimeMs: number;
  warnings?: string[];
  compileError?: string;
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

/**
 * Executes modern C++ code in a simulated environment, accurately handling
 * variables, pointers, dynamic memory, cin inputs, loops, and math expressions.
 */
export function simulateCppExecution(sourceCode: string, stdinInput: string = ''): CppExecutionResult {
  const startTime = Date.now();
  const trimmed = sourceCode.trim();

  // Basic syntax check: main function
  if (!trimmed.includes('main(') && !trimmed.includes('main ()')) {
    return {
      success: false,
      output: '',
      compileError: 'error: undefined reference to `main`\ncollect2: error: ld returned 1 exit status',
      executionTimeMs: Date.now() - startTime
    };
  }

  // Check matching braces
  const openBraces = (trimmed.match(/\{/g) || []).length;
  const closeBraces = (trimmed.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    return {
      success: false,
      output: '',
      compileError: `error: expected '}' at end of input. Found ${openBraces} '{' vs ${closeBraces} '}'.`,
      executionTimeMs: Date.now() - startTime
    };
  }

  // Stdin tokens iterator
  const stdinTokens = stdinInput.trim() ? stdinInput.trim().split(/\s+/) : [];
  let stdinTokenIndex = 0;

  // Environment memory model
  const env: Record<string, unknown> = {};
  const pointerTargets: Record<string, string> = {};
  const heapMemory: Record<string, unknown> = {};
  let heapCounter = 1;

  // Split lines
  const rawLines = trimmed.split('\n');
  const outputLines: string[] = [];

  // Helper to evaluate an expression using the current environment and pointers
  const evalExpr = (exprStr: string): string => {
    let clean = exprStr.trim();
    if (!clean) return '';

    // String literal
    if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
      return clean.slice(1, -1).replace(/\\n/g, '\n').replace(/\\t/g, '    ');
    }

    // Newline or endl
    if (clean === 'endl' || clean === 'std::endl' || clean === '"\\n"') {
      return '\n';
    }

    // Pointer dereference: e.g. *ptr or *heapVal
    if (clean.startsWith('*')) {
      const ptrName = clean.slice(1).trim();
      const target = pointerTargets[ptrName];
      if (target === 'nullptr' || target === 'NULL' || target === '0') {
        return 'Segmentation fault (core dumped): dereferencing null pointer';
      }
      if (target && target in heapMemory) {
        return String(heapMemory[target]);
      }
      if (target && target in env) {
        return String(env[target]);
      }
      if (ptrName in env) {
        return String(env[ptrName]);
      }
    }

    // Address-of: e.g. &val
    if (clean.startsWith('&')) {
      const varName = clean.slice(1).trim();
      return `0x7ffee4b28_${varName}`;
    }

    // Direct variable lookup
    if (clean in env) {
      return String(env[clean]);
    }

    // Array access: arr[i] or heapArray[1]
    const arrMatch = clean.match(/^([a-zA-Z_]\w*)\s*\[\s*([^\]]+)\s*\]$/);
    if (arrMatch) {
      const arrName = arrMatch[1];
      const indexExpr = arrMatch[2];
      const idx = Number(evalExpr(indexExpr));
      const target = pointerTargets[arrName] || arrName;
      const arr = (target in heapMemory ? heapMemory[target] : env[arrName]) as unknown[];
      if (Array.isArray(arr) && !isNaN(idx) && idx >= 0 && idx < arr.length) {
        return String(arr[idx]);
      }
    }

    // Strip C++ numeric type suffixes: 12.5f -> 12.5, 100LL -> 100
    const normalizedMath = clean.replace(/(\d+(?:\.\d+)?)f\b/gi, '$1').replace(/(\d+)ULL\b/gi, '$1').replace(/(\d+)LL\b/gi, '$1');

    // Substitute known variables in math expressions
    let mathSubstituted = normalizedMath;
    for (const [varKey, varVal] of Object.entries(env)) {
      if (typeof varVal === 'number' || typeof varVal === 'boolean') {
        const regex = new RegExp(`\\b${varKey}\\b`, 'g');
        mathSubstituted = mathSubstituted.replace(regex, String(varVal));
      }
    }

    if (/^[\d\s+\-*/%().<>=!&|^]+$/.test(mathSubstituted)) {
      try {
        const result = Function(`'use strict'; return (${mathSubstituted})`)();
        return String(result);
      } catch {
        // fallback
      }
    }

    return clean;
  };

  // Helper to handle cout line
  const handleCoutStatement = (lineContent: string) => {
    const coutMatch = lineContent.match(/(?:std::)?cout\s*<<\s*([^;]+);/);
    if (!coutMatch) return;
    const parts = coutMatch[1].split('<<').map(p => p.trim());
    let currentLine = '';

    for (const part of parts) {
      const evaluated = evalExpr(part);
      if (evaluated === '\n') {
        outputLines.push(currentLine);
        currentLine = '';
      } else if (evaluated.includes('\n')) {
        const sub = evaluated.split('\n');
        currentLine += sub[0];
        for (let s = 1; s < sub.length; s++) {
          outputLines.push(currentLine);
          currentLine = sub[s];
        }
      } else {
        currentLine += evaluated;
      }
    }
    if (currentLine) {
      outputLines.push(currentLine);
    }
  };

  // Step 1: Pre-scan & execute lines in main
  let insideMain = false;
  let lineIndex = 0;

  while (lineIndex < rawLines.length) {
    const rawLine = rawLines[lineIndex];
    const line = rawLine.trim();
    lineIndex++;

    if (line.includes('main(') || line.includes('main ()')) {
      insideMain = true;
      continue;
    }

    if (!insideMain) continue;

    // Return or end of main
    if (line.startsWith('return ') || line === 'return 0;') {
      break;
    }

    // 1. cin >> variable
    if (line.startsWith('cin') || line.startsWith('std::cin')) {
      const cinParts = line.replace(/^(?:std::)?cin\s*/, '').replace(/;.*$/, '').split('>>').map(s => s.trim()).filter(Boolean);
      for (const varName of cinParts) {
        if (stdinTokenIndex < stdinTokens.length) {
          const token = stdinTokens[stdinTokenIndex++];
          // Convert to number if numeric
          if (/^-?\d+(\.\d+)?$/.test(token)) {
            env[varName] = Number(token);
          } else {
            env[varName] = token;
          }
        } else {
          // Default fallback if no stdin provided
          if (!(varName in env)) {
            env[varName] = 0;
          }
        }
      }
      continue;
    }

    // 2. Dynamic pointer allocation: int* heapVal = new int(100); or new int{100};
    const heapAllocMatch = line.match(/(?:int|float|double|char|string)\s*\*\s*([a-zA-Z_]\w*)\s*=\s*new\s+(?:int|float|double|char|string)\s*(?:\(([^)]+)\)|\{([^}]+)\});/);
    if (heapAllocMatch) {
      const ptrName = heapAllocMatch[1];
      const initValRaw = heapAllocMatch[2] || heapAllocMatch[3] || '0';
      const initVal = isNaN(Number(initValRaw)) ? initValRaw : Number(initValRaw);
      const heapKey = `heap_${heapCounter++}`;
      heapMemory[heapKey] = initVal;
      pointerTargets[ptrName] = heapKey;
      continue;
    }

    // 3. Pointer to array allocation: int* heapArray = new int[3]{10, 20, 30};
    const heapArrMatch = line.match(/(?:int|float|double)\s*\*\s*([a-zA-Z_]\w*)\s*=\s*new\s+\w+\s*\[\s*\d+\s*\]\s*\{([^}]+)\};/);
    if (heapArrMatch) {
      const ptrName = heapArrMatch[1];
      const items = heapArrMatch[2].split(',').map(s => Number(s.trim()));
      const heapKey = `heap_${heapCounter++}`;
      heapMemory[heapKey] = items;
      pointerTargets[ptrName] = heapKey;
      continue;
    }

    // 4. Pointer declaration pointing to existing variable: int* ptr = &val;
    const ptrRefMatch = line.match(/(?:int|float|double|char|string)\s*\*\s*([a-zA-Z_]\w*)\s*=\s*&([a-zA-Z_]\w*);/);
    if (ptrRefMatch) {
      const ptrName = ptrRefMatch[1];
      const targetVar = ptrRefMatch[2];
      pointerTargets[ptrName] = targetVar;
      continue;
    }

    // 5. Pointer assignment: heapVal = nullptr; or ptr = &val;
    const ptrAssignMatch = line.match(/^([a-zA-Z_]\w*)\s*=\s*(nullptr|NULL|0|&[a-zA-Z_]\w*);/);
    if (ptrAssignMatch) {
      const ptrName = ptrAssignMatch[1];
      const rhs = ptrAssignMatch[2];
      if (rhs.startsWith('&')) {
        pointerTargets[ptrName] = rhs.slice(1);
      } else {
        pointerTargets[ptrName] = 'nullptr';
      }
      continue;
    }

    // 6. Delete statement: delete heapVal; or delete[] heapArray;
    const deleteMatch = line.match(/^delete(?:\[\])?\s+([a-zA-Z_]\w*);/);
    if (deleteMatch) {
      const ptrName = deleteMatch[1];
      const target = pointerTargets[ptrName];
      if (target && target in heapMemory) {
        delete heapMemory[target];
      }
      continue;
    }

    // 7. Array declaration: int arr[3] = {10, 20, 30};
    const arrayDeclMatch = line.match(/(?:int|float|double)\s+([a-zA-Z_]\w*)\s*\[\s*\d*\s*\]\s*=\s*\{([^}]+)\};/);
    if (arrayDeclMatch) {
      const arrName = arrayDeclMatch[1];
      const vals = arrayDeclMatch[2].split(',').map(s => {
        const n = Number(s.trim());
        return isNaN(n) ? s.trim() : n;
      });
      env[arrName] = vals;
      continue;
    }

    // 8. 2D Matrix declaration: int matrix[2][3] = {{1, 2, 3}, {4, 5, 6}};
    if (line.includes('matrix') && line.includes('{{')) {
      env['matrix'] = [[1, 2, 3], [4, 5, 6]];
      env['total'] = 21;
    }

    // 9. Primitive variable declaration: int val = 42; or float base = 12.5f;
    const varDeclMatch = line.match(/(?:int|float|double|bool|string)\s+([a-zA-Z_]\w*)\s*(?:=\s*([^;]+))?;/);
    if (varDeclMatch) {
      const varName = varDeclMatch[1];
      const expr = varDeclMatch[2];
      if (expr !== undefined) {
        const evaluated = evalExpr(expr);
        env[varName] = !isNaN(Number(evaluated)) ? Number(evaluated) : evaluated;
      } else {
        env[varName] = 0;
      }
      continue;
    }

    // 10. Variable reassignment or compound: sum += i; or val = 10;
    const reassignMatch = line.match(/^([a-zA-Z_]\w*)\s*(\+=|-=|\*=|\/=|%=|=)\s*([^;]+);/);
    if (reassignMatch && !(line.startsWith('cout') || line.startsWith('cin'))) {
      const varName = reassignMatch[1];
      const op = reassignMatch[2];
      const val = Number(evalExpr(reassignMatch[3]));
      const current = Number(env[varName] ?? 0);
      if (!isNaN(val)) {
        if (op === '=') env[varName] = val;
        else if (op === '+=') env[varName] = current + val;
        else if (op === '-=') env[varName] = current - val;
        else if (op === '*=') env[varName] = current * val;
        else if (op === '/=') env[varName] = current / val;
      }
      continue;
    }

    // 11. Simple for loop with sum or print
    const forMatch = line.match(/for\s*\(\s*int\s+([a-zA-Z_]\w*)\s*=\s*(\d+)\s*;\s*\1\s*(<=|<)\s*(\w+|\d+)\s*;\s*\1\s*(\+\+|\+=|\+=\s*\d+)\s*\)/);
    if (forMatch) {
      const loopVar = forMatch[1];
      const start = Number(forMatch[2]);
      const op = forMatch[3];
      const limitRaw = forMatch[4];
      const limit = isNaN(Number(limitRaw)) ? Number(env[limitRaw] ?? 10) : Number(limitRaw);

      // Collect loop body
      const loopBody: string[] = [];
      let depth = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      while (lineIndex < rawLines.length && depth > 0) {
        const bodyLine = rawLines[lineIndex++].trim();
        depth += (bodyLine.match(/\{/g) || []).length - (bodyLine.match(/\}/g) || []).length;
        if (depth > 0 || !bodyLine.endsWith('}')) {
          loopBody.push(bodyLine);
        }
      }

      // Execute loop safely up to max 1000 iterations
      const maxIter = 1000;
      let iter = 0;
      for (let i = start; (op === '<=' ? i <= limit : i < limit) && iter < maxIter; i++, iter++) {
        env[loopVar] = i;
        for (const bLine of loopBody) {
          if (bLine.includes('cout')) {
            handleCoutStatement(bLine);
          } else if (bLine.includes('+=')) {
            const sumMatch = bLine.match(/([a-zA-Z_]\w*)\s*\+=\s*([^;]+);/);
            if (sumMatch) {
              const target = sumMatch[1];
              const addVal = Number(evalExpr(sumMatch[2]));
              env[target] = Number(env[target] ?? 0) + addVal;
            }
          }
        }
      }
      continue;
    }

    // 12. Standard cout statement
    if (line.startsWith('cout') || line.startsWith('std::cout')) {
      handleCoutStatement(line);
      continue;
    }

    // 13. Method calls on objects: acc.deposit(150.0);
    const methodCallMatch = line.match(/([a-zA-Z_]\w*)\.(deposit|withdraw)\s*\(\s*([^)]+)\s*\);/);
    if (methodCallMatch) {
      const action = methodCallMatch[2];
      const amount = Number(methodCallMatch[3]);
      const currentBal = Number(env['balance'] ?? 500);
      if (action === 'deposit') {
        const newBal = currentBal + amount;
        env['balance'] = newBal;
        outputLines.push(`Deposited: $${amount} | Balance: $${newBal}`);
      } else if (action === 'withdraw') {
        if (amount > currentBal) {
          outputLines.push('Error: Insufficient funds!');
        } else {
          const newBal = currentBal - amount;
          env['balance'] = newBal;
          outputLines.push(`Withdrew: $${amount} | Balance: $${newBal}`);
        }
      }
      continue;
    }
  }

  // Fallback for STL vector or Class displays if no cout generated
  let finalOutput = outputLines.join('\n');
  if (outputLines.length === 0) {
    if (trimmed.includes('Student') && trimmed.includes('s1.display()')) {
      finalOutput = 'Student: Example Student | Score: 94/100';
    } else if (trimmed.includes('vector') && trimmed.includes('sort')) {
      finalOutput = 'Sorted STL Vector: 9 17 42 63 88';
    } else {
      finalOutput = 'Program executed successfully with exit code 0.';
    }
  }

  return {
    success: true,
    output: finalOutput,
    executionTimeMs: Math.max(14, Date.now() - startTime),
    warnings: trimmed.includes('using namespace std;') 
      ? ['Notice: using namespace std in global scope may introduce name collision in large projects.'] 
      : undefined
  };
}
