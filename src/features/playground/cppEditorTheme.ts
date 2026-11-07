import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

/** Theme that reads CSS variables so light/dark both stay readable. */
export const cppEditorTheme = EditorView.theme(
  {
    "&": {
      height: "100%",
      fontSize: "13px",
      backgroundColor: "var(--app-code-bg)",
      color: "var(--app-code-fg)",
    },
    ".cm-content": {
      fontFamily:
        '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      caretColor: "var(--app-accent)",
      padding: "12px 0",
      lineHeight: "22px",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "var(--app-accent)",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      {
        backgroundColor: "color-mix(in srgb, var(--app-accent) 28%, transparent)",
      },
    ".cm-activeLine": {
      backgroundColor: "color-mix(in srgb, var(--app-accent) 8%, transparent)",
    },
    ".cm-gutters": {
      backgroundColor: "color-mix(in srgb, var(--app-code-bg) 92%, black)",
      color: "var(--app-muted)",
      border: "none",
      borderRight: "1px solid var(--app-border)",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "color-mix(in srgb, var(--app-accent) 12%, transparent)",
      color: "var(--app-accent)",
      fontWeight: "700",
    },
    ".cm-lineNumbers .cm-gutterElement": {
      minWidth: "2.5rem",
      padding: "0 8px 0 4px",
      fontSize: "12px",
      lineHeight: "22px",
    },
    ".cm-scroller": {
      overflow: "auto",
      fontFamily:
        '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    },
  },
  { dark: true },
);

export const cppHighlightStyle = HighlightStyle.define([
  { tag: t.comment, color: "var(--cm-comment)", fontStyle: "italic" },
  { tag: t.string, color: "var(--cm-string)" },
  { tag: t.number, color: "var(--cm-number)" },
  { tag: t.keyword, color: "var(--cm-keyword)", fontWeight: "600" },
  { tag: t.typeName, color: "var(--cm-type)", fontWeight: "500" },
  { tag: t.className, color: "var(--cm-type)", fontWeight: "600" },
  { tag: t.definition(t.variableName), color: "var(--cm-def)" },
  { tag: t.function(t.variableName), color: "var(--cm-func)" },
  { tag: t.operator, color: "var(--cm-operator)" },
  { tag: t.meta, color: "var(--cm-meta)", fontWeight: "600" },
  { tag: t.bool, color: "var(--cm-keyword)" },
  { tag: t.null, color: "var(--cm-keyword)" },
  { tag: t.punctuation, color: "var(--cm-operator)" },
]);

export const cppSyntaxHighlighting = syntaxHighlighting(cppHighlightStyle);
