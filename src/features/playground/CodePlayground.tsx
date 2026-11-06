import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  AlertTriangle,
  AlignLeft,
  Code2,
  CheckCircle2,
  Eye,
  Edit3
} from 'lucide-react';
import { simulateCppExecution, formatCppCode, CppExecutionResult } from '@/utils/courseLogic';
import { Button, highlightCpp } from '@/components/ui';

interface CodePlaygroundProps {
  initialCode?: string;
  initialTitle?: string;
  onCodeRun?: () => void;
}

const TEMPLATES: { name: string; title: string; code: string; defaultStdin?: string }[] = [
  {
    name: 'pointers',
    title: 'Pointers & Dynamic Memory',
    code: `#include <iostream>
using namespace std;

int main() {
    int val = 42;
    int* ptr = &val;

    cout << "Value directly: " << val << endl;
    cout << "Value via pointer: " << *ptr << endl;

    int* heapVal = new int(100);
    cout << "Heap Value: " << *heapVal << endl;

    delete heapVal;
    heapVal = nullptr;

    return 0;
}`
  },
  {
    name: 'stdin',
    title: 'Interactive User Input (cin >>)',
    defaultStdin: '24',
    code: `#include <iostream>
using namespace std;

int main() {
    int age;
    cout << "Enter your age: ";
    cin >> age;

    cout << "You entered age: " << age << endl;
    if (age >= 18) {
        cout << "Status: Adult programmer ready for C++!" << endl;
    } else {
        cout << "Status: Young prodigy mastering algorithms!" << endl;
    }

    return 0;
}`
  },
  {
    name: 'hello',
    title: 'Hello World (Basics)',
    code: `#include <iostream>
using namespace std;

int main() {
    cout << "Welcome to C++ MasterClass IDE!" << endl;
    cout << "Compiler: Modern C++20 Sandbox" << endl;
    return 0;
}`
  },
  {
    name: 'triangle',
    title: 'Area of a Triangle (Expressions)',
    code: `#include <iostream>
using namespace std;

int main() {
    float base = 12.5f;
    float height = 8.0f;
    float area = 0.5f * base * height;

    cout << "Base: " << base << " | Height: " << height << endl;
    cout << "Area of Triangle = " << area << " sq units" << endl;
    return 0;
}`
  },
  {
    name: 'loops',
    title: 'Sum of N Numbers (Loops)',
    code: `#include <iostream>
using namespace std;

int main() {
    int n = 10;
    int sum = 0;

    for (int i = 1; i <= n; i++) {
        sum += i;
    }

    cout << "Sum of numbers 1 to " << n << " is: " << sum << endl;
    return 0;
}`
  },
  {
    name: 'oop',
    title: 'Class & Encapsulation (OOP)',
    code: `#include <iostream>
#include <string>
using namespace std;

class Student {
private:
    string name;
    int score;
public:
    Student(string n, int s) : name(n), score(s) {}

    void display() {
        cout << "Student: " << name << " | Score: " << score << "/100" << endl;
    }
};

int main() {
    Student s1("Example Student", 94);
    s1.display();
    return 0;
}`
  },
  {
    name: 'stl',
    title: 'STL Vector & Sorting',
    code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> nums = {42, 17, 88, 9, 63};
    sort(nums.begin(), nums.end());

    cout << "Sorted STL Vector: ";
    for (int n : nums) {
        cout << n << " ";
    }
    cout << endl;
    return 0;
}`
  },
  {
    name: 'banking',
    title: 'Banking System Project',
    code: `#include <iostream>
#include <string>
using namespace std;

class BankAccount {
private:
    string owner;
    double balance;
public:
    BankAccount(string o, double init) : owner(o), balance(init) {}

    void deposit(double amount) {
        balance += amount;
        cout << "Deposited: $" << amount << " | Balance: $" << balance << endl;
    }

    void withdraw(double amount) {
        if (amount > balance) {
            cout << "Error: Insufficient funds!" << endl;
            return;
        }
        balance -= amount;
        cout << "Withdrew: $" << amount << " | Balance: $" << balance << endl;
    }
};

int main() {
    BankAccount acc("Example Account Holder", 500.0);
    acc.deposit(150.0);
    acc.withdraw(80.0);
    return 0;
}`
  }
];

export const CodePlayground: React.FC<CodePlaygroundProps> = ({
  initialCode,
  initialTitle,
  onCodeRun
}) => {
  const [code, setCode] = useState<string>(
    initialCode || TEMPLATES[0].code
  );
  const [stdinInput, setStdinInput] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<CppExecutionResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [formattedNotice, setFormattedNotice] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('pointers');
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 });
  const [viewMode, setViewMode] = useState<'edit' | 'syntax'>('edit');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Sync cursor position
  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textUpToCursor = textareaRef.current.value.substring(0, pos);
    const lines = textUpToCursor.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1
    });
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setResult(null);

    // Fast simulation latency
    setTimeout(() => {
      const res = simulateCppExecution(code, stdinInput);
      setResult(res);
      setIsRunning(false);
      if (onCodeRun) onCodeRun();
    }, 180);
  };

  const handleFormatCode = () => {
    const formatted = formatCppCode(code);
    setCode(formatted);
    setFormattedNotice(true);
    setTimeout(() => setFormattedNotice(false), 1600);
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTemplate(val);
    const tmpl = TEMPLATES.find(t => t.name === val);
    if (tmpl) {
      setCode(tmpl.code);
      setStdinInput(tmpl.defaultStdin || '');
      setResult(null);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/x-c++src' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'main.cpp';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Synchronize scroll between textarea and line numbers gutter
  const handleTextareaScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Keyboard enhancements: Auto-indent, Tab indentation, Shift+Alt+F to format, Ctrl/Cmd+Enter to run
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    // 1. Run shortcut: Ctrl+Enter or Cmd+Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunCode();
      return;
    }

    // 2. Format shortcut: Shift+Alt+F
    if (e.shiftKey && e.altKey && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault();
      handleFormatCode();
      return;
    }

    // 3. Auto-indent on Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      const upToCursor = val.substring(0, start);
      const currentLineStart = upToCursor.lastIndexOf('\n') + 1;
      const currentLine = upToCursor.substring(currentLineStart);

      // Detect leading whitespace
      const indentMatch = currentLine.match(/^(\s*)/);
      const currentIndent = indentMatch ? indentMatch[1] : '';

      // Check if line opens a block with {
      const trimmedLine = currentLine.trim();
      const opensBlock = trimmedLine.endsWith('{') || (trimmedLine.includes('{') && !trimmedLine.includes('}'));

      // Check if cursor is right between { and }
      const charBefore = val[start - 1];
      const charAfter = val[start];
      const isBetweenBraces = charBefore === '{' && charAfter === '}';

      let newText = '';
      let newCursor = start;

      if (isBetweenBraces) {
        const innerIndent = currentIndent + '    ';
        newText = val.substring(0, start) + '\n' + innerIndent + '\n' + currentIndent + val.substring(end);
        newCursor = start + 1 + innerIndent.length;
      } else if (opensBlock) {
        const nextIndent = currentIndent + '    ';
        newText = val.substring(0, start) + '\n' + nextIndent + val.substring(end);
        newCursor = start + 1 + nextIndent.length;
      } else {
        newText = val.substring(0, start) + '\n' + currentIndent + val.substring(end);
        newCursor = start + 1 + currentIndent.length;
      }

      setCode(newText);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newCursor;
          updateCursorPosition();
        }
      }, 0);
      return;
    }

    // 4. Auto-dedent on }
    if (e.key === '}') {
      const upToCursor = val.substring(0, start);
      const currentLineStart = upToCursor.lastIndexOf('\n') + 1;
      const currentLine = upToCursor.substring(currentLineStart);

      // If line only contains spaces (e.g. 4 spaces indentation)
      if (/^\s{4,}$/.test(currentLine)) {
        e.preventDefault();
        const dedented = currentLine.slice(4) + '}';
        const newText = val.substring(0, currentLineStart) + dedented + val.substring(start);
        setCode(newText);
        const newCursor = currentLineStart + dedented.length;
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newCursor;
            updateCursorPosition();
          }
        }, 0);
        return;
      }
    }

    // 5. Auto-closing pairs: { }, ( ), [ ], " ", ' '
    const PAIRS: Record<string, string> = {
      '{': '}',
      '(': ')',
      '[': ']',
      '"': '"',
      "'": "'"
    };

    if (e.key in PAIRS) {
      const openChar = e.key;
      const closeChar = PAIRS[openChar];

      // If wrapping selected text
      if (start !== end) {
        e.preventDefault();
        const selected = val.substring(start, end);
        const newText = val.substring(0, start) + openChar + selected + closeChar + val.substring(end);
        setCode(newText);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = start + 1;
            textareaRef.current.selectionEnd = end + 1;
          }
        }, 0);
        return;
      }

      // If next char is already quote/bracket, step over it
      if ((openChar === '"' || openChar === "'") && val[start] === openChar) {
        e.preventDefault();
        textarea.selectionStart = textarea.selectionEnd = start + 1;
        updateCursorPosition();
        return;
      }

      // Insert open and close
      e.preventDefault();
      const newText = val.substring(0, start) + openChar + closeChar + val.substring(end);
      setCode(newText);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1;
          updateCursorPosition();
        }
      }, 0);
      return;
    }

    // 6. Tab / Shift+Tab indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Dedent current line by up to 4 spaces
        const upToCursor = val.substring(0, start);
        const currentLineStart = upToCursor.lastIndexOf('\n') + 1;
        const currentLine = upToCursor.substring(currentLineStart);
        const spaceCount = (currentLine.match(/^ {1,4}/) || [''])[0].length;
        if (spaceCount > 0) {
          const newText = val.substring(0, currentLineStart) + currentLine.slice(spaceCount) + val.substring(start);
          setCode(newText);
          setTimeout(() => {
            if (textareaRef.current) {
              const newPos = Math.max(currentLineStart, start - spaceCount);
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newPos;
              updateCursorPosition();
            }
          }, 0);
        }
      } else {
        // Insert 4 spaces at cursor
        const newText = val.substring(0, start) + '    ' + val.substring(end);
        setCode(newText);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
            updateCursorPosition();
          }
        }, 0);
      }
      return;
    }

    // 7. Smart Backspace: delete 4 spaces if preceded by an indent
    if (e.key === 'Backspace' && start === end) {
      const upToCursor = val.substring(0, start);
      const currentLineStart = upToCursor.lastIndexOf('\n') + 1;
      const currentLine = upToCursor.substring(currentLineStart);
      if (/^\s+$/.test(currentLine) && currentLine.length >= 4 && currentLine.length % 4 === 0) {
        e.preventDefault();
        const newText = val.substring(0, start - 4) + val.substring(start);
        setCode(newText);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start - 4;
            updateCursorPosition();
          }
        }, 0);
        return;
      }
    }
  };

  const lines = code.split('\n');
  const lineCount = lines.length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden flex flex-col transition-colors">
      {/* IDE Top Command Bar */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {initialTitle || 'C++ Interactive IDE'}
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                C++20 GCC
              </span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Modern in-browser compiler & runtime</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Template Selector */}
          <select
            value={selectedTemplate}
            onChange={handleTemplateChange}
            aria-label="Choose a C++ code template"
            className="min-h-10 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
          >
            {TEMPLATES.map(t => (
              <option key={t.name} value={t.name}>
                Template: {t.title}
              </option>
            ))}
          </select>

          {/* Mode Switcher: Live Editor vs Syntax Preview */}
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-300 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'edit'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Interactive code editor with auto-indent"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('syntax')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'syntax'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Syntax colorized token preview"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Syntax View</span>
            </button>
          </div>

          {/* Format Code Button */}
          <button
            type="button"
            onClick={handleFormatCode}
            aria-label="Format C++ code (Shift+Alt+F)"
            title="Format Code (Shift+Alt+F)"
            className="flex min-h-10 items-center space-x-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            {formattedNotice ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <AlignLeft className="w-3.5 h-3.5 text-brand-500" />
            )}
            <span>{formattedNotice ? 'Formatted' : 'Format'}</span>
          </button>

          {/* Copy Code */}
          <button
            type="button"
            onClick={handleCopyCode}
            aria-label={copied ? 'Code copied' : 'Copy C++ code'}
            className="grid size-10 place-items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Copy Code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Download main.cpp */}
          <button
            type="button"
            onClick={handleDownload}
            aria-label="Download main.cpp source"
            className="grid size-10 place-items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Download main.cpp"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Run Code Button */}
          <Button
            onClick={handleRunCode}
            disabled={isRunning}
            variant="primary"
            className="min-h-10 rounded-lg px-4 text-xs font-bold shadow-sm"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Compiling...' : 'Run Code (Ctrl+Enter)'}</span>
          </Button>
        </div>
      </div>

      {/* Editor & Console Split Panes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 flex-1 min-h-[460px]">
        
        {/* LEFT PANE: Professional Code Editor with Line Numbers */}
        <div className="relative flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-mono">
          {/* Editor Header Tab */}
          <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between select-none">
            <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              main.cpp {viewMode === 'syntax' && '(Syntax Highlighted)'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Auto-Indent Active • Tab: 4 spaces
            </span>
          </div>

          {/* Editor Workspace */}
          <div className="relative flex-1 flex overflow-hidden min-h-[380px]">
            {/* Synchronized Line Numbers Gutter */}
            <div 
              ref={gutterRef}
              aria-hidden="true"
              className="py-3 px-2 bg-slate-900/70 text-slate-500 select-none text-right font-mono border-r border-slate-800/80 text-[12px] leading-[22px] w-12 shrink-0 overflow-hidden"
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
              }}
            >
              {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => {
                const isCurrent = cursorPos.line === i + 1;
                return (
                  <div 
                    key={i + 1} 
                    className={`h-[22px] ${isCurrent ? 'text-brand-400 font-bold bg-slate-800/60 rounded-xs' : ''}`}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>

            {/* Input or Syntax View */}
            <div className="relative min-w-0 flex-1 flex flex-col overflow-hidden bg-slate-950">
              {viewMode === 'syntax' ? (
                /* Syntax Highlighted View */
                <pre
                  className="flex-1 m-0 p-3 overflow-auto font-mono text-[13px] leading-[22px] whitespace-pre text-slate-100 select-text"
                  style={{
                    tabSize: 4,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                  }}
                >
                  {highlightCpp(code)}
                </pre>
              ) : (
                /* Interactive Code Editor (100% cursor-aligned, visible text, auto-indent) */
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    updateCursorPosition();
                  }}
                  onKeyDown={handleKeyDown}
                  onClick={updateCursorPosition}
                  onKeyUp={updateCursorPosition}
                  onSelect={updateCursorPosition}
                  onScroll={handleTextareaScroll}
                  wrap="off"
                  aria-label="C++ source code editor"
                  spellCheck={false}
                  className="flex-1 w-full h-full resize-none bg-transparent p-3 font-mono text-[13px] leading-[22px] text-slate-100 caret-cyan-400 selection:bg-brand-500/40 focus:outline-none border-0"
                  style={{
                    tabSize: 4,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    fontVariantLigatures: 'none'
                  }}
                />
              )}
            </div>
          </div>

          {/* Editor Status Bar */}
          <div className="px-3 py-1.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono select-none">
            <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
            <span>{lines.length} lines • {code.length} chars</span>
          </div>
        </div>

        {/* RIGHT PANE: Output Terminal & Interactive STDIN */}
        <div className="flex flex-col bg-slate-900 text-slate-100 min-h-[380px]">
          {/* Terminal Tab Bar */}
          <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between select-none">
            <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Console Output (stdout)</span>
            </span>
            {result && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                result.success 
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                  : 'bg-red-950 text-red-400 border border-red-800'
              }`}>
                Exit Code: {result.success ? '0' : '1'} ({result.executionTimeMs}ms)
              </span>
            )}
          </div>

          {/* Terminal Screen Body */}
          <div className="flex-1 p-4 font-mono text-xs overflow-y-auto max-h-[360px] space-y-3">
            {isRunning && (
              <div className="text-brand-400 flex items-center space-x-2">
                <span className="animate-pulse">Compiling g++ -O2 -std=c++20 main.cpp...</span>
              </div>
            )}

            {!isRunning && !result && (
              <div className="text-slate-500 italic space-y-1">
                <p>Press &quot;Run Code (Ctrl+Enter)&quot; to compile and execute in the sandbox.</p>
                <p className="text-[11px] text-slate-600">Standard input below will be fed to cin &gt;&gt; if requested.</p>
              </div>
            )}

            {!isRunning && result && (
              <div className="space-y-3">
                {result.compileError ? (
                  <div className="p-3 bg-red-950/50 border border-red-800 rounded-xl text-red-300 whitespace-pre-wrap">
                    <div className="flex items-center space-x-1.5 font-bold text-red-400 mb-1">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Compilation / Linker Error:</span>
                    </div>
                    {result.compileError}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed font-mono text-xs">
                      {result.output}
                    </pre>
                  </div>
                )}

                {result.warnings && (
                  <div className="p-2.5 bg-amber-950/30 border border-amber-900/60 rounded-xl text-amber-300 text-[11px]">
                    {result.warnings.map((w, idx) => (
                      <p key={idx}>{w}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Interactive STDIN Input Strip */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2.5">
            <span className="text-xs font-mono font-bold text-cyan-400 shrink-0">cin &gt;&gt;</span>
            <input
              type="text"
              value={stdinInput}
              onChange={(e) => setStdinInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRunCode();
                }
              }}
              placeholder="Standard input (e.g. 42 or user text for cin)"
              aria-label="Standard input stream (cin)"
              className="flex-1 bg-slate-900 text-xs px-3 py-1.5 rounded-lg text-slate-100 border border-slate-700/80 focus:outline-none focus:border-brand-500 font-mono"
            />
            {stdinInput && (
              <button
                type="button"
                onClick={() => setStdinInput('')}
                className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 font-mono"
              >
                Clear
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
