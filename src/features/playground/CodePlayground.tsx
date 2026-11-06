import React, { useRef, useState } from 'react';
import { 
  Play, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  AlertTriangle
} from 'lucide-react';
import { simulateCppExecution, CppExecutionResult } from '@/utils/courseLogic';
import { Button, highlightCpp } from '@/components/ui';

interface CodePlaygroundProps {
  initialCode?: string;
  initialTitle?: string;
  onCodeRun?: () => void;
}

const TEMPLATES: { name: string; title: string; code: string; stdin?: string }[] = [
  {
    name: 'hello',
    title: 'Hello World (Basics)',
    code: `#include <iostream>
using namespace std;

int main() {
    cout << "Welcome to C++ MasterClass Playground!" << endl;
    cout << "Compiler: GCC C++20 Standard" << endl;
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
    name: 'pointers',
    title: 'Pointers & Dynamic Memory',
    code: `#include <iostream>
using namespace std;

int main() {
    int data = 99;
    int* ptr = &data;

    cout << "Variable value: " << data << endl;
    cout << "Dereferenced *ptr: " << *ptr << endl;

    // Heap allocation
    int* heapArray = new int[3]{10, 20, 30};
    cout << "Dynamic heapArray[1]: " << heapArray[1] << endl;
    delete[] heapArray;
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
  const [copyError, setCopyError] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('hello');
  const highlightedCode = useRef<HTMLPreElement>(null);

  const handleRunCode = () => {
    setIsRunning(true);
    setResult(null);

    // Simulate compilation time
    setTimeout(() => {
      const res = simulateCppExecution(code, stdinInput);
      setResult(res);
      setIsRunning(false);
      if (onCodeRun) onCodeRun();
    }, 280);
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTemplate(val);
    const tmpl = TEMPLATES.find(t => t.name === val);
    if (tmpl) {
      setCode(tmpl.code);
      setResult(null);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setCopyError('');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setCopyError('Clipboard unavailable.');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/x-c++src' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'program.cpp';
    a.click();
    URL.revokeObjectURL(url);
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
      {/* Playground Header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {initialTitle || 'C++ Live Code Playground'}
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                Interactive editor
              </span>
            </h3>
            <span className="text-xs text-slate-500">Interactive C++20 Sandbox</span>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center space-x-2">
          {/* Template Selector */}
          <select
            value={selectedTemplate}
            onChange={handleTemplateChange}
            aria-label="Choose a C++ code template"
            className="min-h-11 max-w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {TEMPLATES.map(t => (
              <option key={t.name} value={t.name}>
                Template: {t.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleCopyCode}
            aria-label={copied ? 'Code copied' : 'Copy C++ code'}
            className="grid size-11 shrink-0 place-items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Copy C++ Code"
          >
            {copied ? <Check className="w-4 h-4 text-brand-500" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            aria-label="Download C++ source"
            className="grid size-11 shrink-0 place-items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Download program.cpp"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Run the current snippet */}
          <Button
            onClick={handleRunCode}
            disabled={isRunning}
            variant="primary"
            className="min-h-10 rounded-lg px-4 text-xs font-bold"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Compiling...' : 'Run Code'}</span>
          </Button>
          {copyError && <span role="status" className="text-xs text-amber-700 dark:text-amber-300">{copyError}</span>}
        </div>
      </div>

      {/* Editor & Console Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
        {/* Left: Code Editor with Line Numbers */}
        <div className="relative flex bg-slate-950 text-slate-100 font-mono text-xs overflow-hidden min-h-[340px]">
          {/* Line Numbers */}
          <div className="py-3 px-2 bg-slate-900/80 text-slate-500 select-none text-right font-mono border-r border-slate-800 text-[11px] w-10 shrink-0">
            {Array.from({ length: Math.max(lineCount, 16) }, (_, i) => (
              <div key={i + 1} className="leading-5">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Text Area */}
          <div className="relative min-w-0 flex-1">
            <pre
              ref={highlightedCode}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre p-3 font-mono text-xs leading-5"
              style={{ tabSize: 4 }}
            >
              {highlightCpp(code)}
            </pre>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              wrap="off"
              onScroll={(e) => {
                if (!highlightedCode.current) return;
                highlightedCode.current.scrollTop = e.currentTarget.scrollTop;
                highlightedCode.current.scrollLeft = e.currentTarget.scrollLeft;
              }}
              aria-label="C++ source code"
              spellCheck={false}
              className="relative z-10 h-full w-full resize-none bg-transparent p-3 font-mono text-xs leading-5 text-transparent caret-slate-100 selection:bg-brand-600/40 selection:text-transparent focus:outline-none"
              style={{ tabSize: 4 }}
            />
          </div>
        </div>

        {/* Right: Output Terminal & STDIN */}
        <div className="flex flex-col bg-slate-900 text-slate-100 min-h-[340px]">
          {/* Terminal Tab Bar */}
          <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500"></span>
              Console Output (stdout)
            </span>
            {result && (
              <span className="text-[10px] font-mono text-slate-400">
                Exit: {result.success ? '0' : '1'} ({result.executionTimeMs}ms)
              </span>
            )}
          </div>

          {/* Terminal Screen */}
          <div className="flex-1 p-4 font-mono text-xs overflow-y-auto max-h-[260px]">
            {isRunning && (
              <div className="text-brand-400 flex items-center space-x-2">
                <span className="animate-pulse">Compiling g++ -O2 -std=c++20 program.cpp...</span>
              </div>
            )}

            {!isRunning && !result && (
              <div className="text-slate-500 italic">
                Press "Run Code ▶" to compile and execute this C++ snippet in the sandbox.
              </div>
            )}

            {!isRunning && result && (
              <div className="space-y-3">
                {result.compileError ? (
                  <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-lg text-red-300 whitespace-pre-wrap">
                    <div className="flex items-center space-x-1.5 font-bold text-red-400 mb-1">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Compilation / Linker Error:</span>
                    </div>
                    {result.compileError}
                  </div>
                ) : (
                  <div className="text-brand-300 whitespace-pre-wrap leading-relaxed">
                    {result.output}
                  </div>
                )}

                {result.warnings && (
                  <div className="p-2 bg-amber-950/30 border border-amber-900/60 rounded text-amber-300 text-[11px]">
                    {result.warnings.map((w, idx) => (
                      <p key={idx}>{w}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Optional Stdin input */}
          <div className="p-2 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
            <span className="text-[11px] font-mono text-slate-400 shrink-0">cin &gt;&gt;</span>
            <input
              type="text"
              value={stdinInput}
              onChange={(e) => setStdinInput(e.target.value)}
              placeholder="Standard input (optional, e.g. 42 or user text)"
              className="w-full bg-slate-900 text-xs px-2.5 py-1 rounded text-slate-200 border border-slate-800 focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
