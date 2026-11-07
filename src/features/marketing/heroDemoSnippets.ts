/**
 * Scripted hero sandbox demos.
 * Add a snippet: push { id, label, code, finalConsole, input? } — the player
 * types `code`, clicks Run, streams console lines, then types `input` if set.
 */

export interface HeroSnippet {
  id: string;
  label: string;
  /** Full source shown / typed in the editor */
  code: string;
  /** Console lines after a successful run (for static / reduced-motion) */
  finalConsole: { text: string; tone?: "meta" | "out" | "in" }[];
  /** Typed into the console after the prompt (optional) */
  input?: string;
  /** Prompt line that appears before user input (optional) */
  prompt?: string;
}

export const HERO_SNIPPETS: HeroSnippet[] = [
  {
    id: "cin",
    label: "Input",
    code: `#include <iostream>
using namespace std;

int main() {
  int n;
  cout << "Enter an integer value: ";
  cin >> n;
  cout << "You entered: " << n << "\\n";
  return 0;
}`,
    prompt: "Enter an integer value: ",
    input: "42",
    finalConsole: [
      { text: "Compiling...", tone: "meta" },
      { text: "Running...", tone: "meta" },
      { text: "Enter an integer value: 42", tone: "out" },
      { text: "You entered: 42", tone: "out" },
      { text: "Process finished · exit 0 · 48ms", tone: "meta" },
    ],
  },
  {
    id: "loop",
    label: "Loop",
    code: `#include <iostream>
using namespace std;

int main() {
  for (int i = 1; i <= 5; ++i) {
    cout << i << " ";
  }
  cout << "\\n";
  return 0;
}`,
    finalConsole: [
      { text: "Compiling...", tone: "meta" },
      { text: "Running...", tone: "meta" },
      { text: "1 2 3 4 5 ", tone: "out" },
      { text: "Process finished · exit 0 · 31ms", tone: "meta" },
    ],
  },
  {
    id: "pointer",
    label: "Pointer",
    code: `#include <iostream>
using namespace std;

int main() {
  int x = 10;
  int* p = &x;
  cout << *p << "\\n";
  return 0;
}`,
    finalConsole: [
      { text: "Compiling...", tone: "meta" },
      { text: "Running...", tone: "meta" },
      { text: "10", tone: "out" },
      { text: "Process finished · exit 0 · 27ms", tone: "meta" },
    ],
  },
];

const KEYWORDS = new Set([
  "int",
  "return",
  "using",
  "namespace",
  "for",
  "if",
  "else",
  "while",
  "class",
  "struct",
  "void",
  "bool",
  "char",
  "auto",
  "const",
  "true",
  "false",
]);

/** Lightweight C++-ish highlighter → React-friendly token list */
export function tokenizeCpp(source: string): { t: string; c?: string }[] {
  const out: { t: string; c?: string }[] = [];
  let i = 0;
  while (i < source.length) {
    if (source[i] === "#" && (i === 0 || source[i - 1] === "\n")) {
      let j = i;
      while (j < source.length && source[j] !== "\n") j++;
      out.push({ t: source.slice(i, j), c: "pp" });
      i = j;
      continue;
    }
    if (source[i] === "/" && source[i + 1] === "/") {
      let j = i;
      while (j < source.length && source[j] !== "\n") j++;
      out.push({ t: source.slice(i, j), c: "cm" });
      i = j;
      continue;
    }
    if (source[i] === '"') {
      let j = i + 1;
      while (j < source.length && source[j] !== '"' && source[j] !== "\n") {
        if (source[j] === "\\") j++;
        j++;
      }
      if (j < source.length && source[j] === '"') j++;
      out.push({ t: source.slice(i, j), c: "str" });
      i = j;
      continue;
    }
    if (/[0-9]/.test(source[i]!)) {
      let j = i;
      while (j < source.length && /[0-9.]/.test(source[j]!)) j++;
      out.push({ t: source.slice(i, j), c: "num" });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(source[i]!)) {
      let j = i;
      while (j < source.length && /[A-Za-z0-9_]/.test(source[j]!)) j++;
      const word = source.slice(i, j);
      const next = source[j];
      let c: string | undefined;
      if (KEYWORDS.has(word)) c = "kw";
      else if (word === "std" || word === "cout" || word === "cin" || word === "endl")
        c = "type";
      else if (next === "(") c = "fn";
      out.push({ t: word, c });
      i = j;
      continue;
    }
    if ("<>()*&:;=+-!".includes(source[i]!)) {
      out.push({ t: source[i]!, c: "op" });
      i++;
      continue;
    }
    out.push({ t: source[i]! });
    i++;
  }
  return out;
}
