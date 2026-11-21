import { trackBraces } from "./utils";
import { isWordChar } from "./utils";
import { extractTrailingWord } from "./utils";
import { stripComments } from "./utils";
import { isCommentLine } from "./utils";

/**
 * Match a function declaration like "public void toggle() {" or "u8 read() {"
 * Returns the function name or null
 *
 * Logic:
 * 1. Find '(' in line
 * 2. Extract word immediately before '(' — that's the function name
 * 3. Verify there's a return type word before the function name
 * 4. Verify line contains '{' after the ')'
 */
function matchFunctionDeclaration(line: string): string | null {
  const parenIdx = line.indexOf("(");
  if (parenIdx === -1) return null;

  // Must have '{' somewhere after the ')'
  const closeParenIdx = line.indexOf(")", parenIdx);
  if (closeParenIdx === -1) return null;
  const braceIdx = line.indexOf("{", closeParenIdx);
  if (braceIdx === -1) return null;

  // Extract function name: word immediately before '('
  const beforeParen = line.substring(0, parenIdx);
  const funcName = extractTrailingWord(beforeParen.trimEnd());
  if (!funcName) return null;

  // There must be a return type word before the function name
  // Find where the function name starts in the original beforeParen
  const trimmedBefore = beforeParen.trimEnd();
  const nameStart = trimmedBefore.length - funcName.length;
  const beforeName = trimmedBefore.substring(0, nameStart).trimEnd();

  // Check for a return type word (at least one word char before the function name)
  if (beforeName.length === 0) return null;
  if (!isWordChar(beforeName.codePointAt(beforeName.length - 1)!)) return null;

  return funcName;
}

const REGISTER_OPENER = /\bregister\s+\w+\s*$/;

export default class ScopeTracker {
  /**
   * Get the name of a context (scope or function) at the given cursor position
   * Uses pattern matching to identify context boundaries and brace tracking for scope
   */
  private static getContext(
    source: string,
    cursorLine: number,
    matcher: RegExp | ((line: string) => string | null),
  ): string | null {
    const lines = source.split("\n");
    let currentName: string | null = null;
    let braceDepth = 0;
    let blockStartDepth = 0;

    for (
      let lineNum = 0;
      lineNum <= cursorLine && lineNum < lines.length;
      lineNum++
    ) {
      const line = lines[lineNum];
      const trimmed = line.trim();

      // Skip comment lines
      if (isCommentLine(trimmed)) continue;

      // Remove inline comments
      const clean = stripComments(line);

      // Check for context start (scope/function declaration)
      let matchedName: string | null = null;
      if (typeof matcher === "function") {
        matchedName = matcher(clean);
      } else {
        const match = matcher.exec(clean);
        if (match) {
          matchedName = match[1];
        }
      }

      if (matchedName) {
        currentName = matchedName;
        blockStartDepth = braceDepth;
        braceDepth++;
        continue;
      }

      // Track braces and detect context exit
      const braceState = trackBraces(clean, braceDepth);
      braceDepth = braceState.depth;

      // If we closed below the block start depth, we've exited the context
      if (
        currentName &&
        braceState.closedToDepth !== null &&
        braceState.closedToDepth <= blockStartDepth
      ) {
        currentName = null;
        blockStartDepth = 0;
      }
    }

    return currentName;
  }

  /**
   * The register block the end of `textBefore` sits in (ADR-072): a
   * `register X {` body, an offset group inside one, or neither (null)
   */
  static getRegisterBlock(textBefore: string): "register" | "group" | null {
    const stack: Array<"register" | "group" | "other"> = [];
    let opener = "";
    for (const line of textBefore.split("\n")) {
      for (const ch of stripComments(line)) {
        if (ch === "{") {
          stack.push(ScopeTracker.blockKind(opener, stack.at(-1)));
          opener = "";
        } else if (ch === "}") {
          stack.pop();
          opener = "";
        } else if (ch === ";") {
          opener = "";
        } else {
          opener += ch;
        }
      }
      opener += "\n";
    }
    const top = stack.at(-1);
    return top === "register" || top === "group" ? top : null;
  }

  private static blockKind(
    opener: string,
    enclosing: "register" | "group" | "other" | undefined,
  ): "register" | "group" | "other" {
    if (REGISTER_OPENER.test(opener)) return "register";
    if (enclosing === "register") return "group";
    return "other";
  }

  static getCurrentScope(source: string, cursorLine: number): string | null {
    return ScopeTracker.getContext(source, cursorLine, /\bscope\s+(\w+)\s*\{/);
  }

  static getCurrentFunction(source: string, cursorLine: number): string | null {
    return ScopeTracker.getContext(
      source,
      cursorLine,
      matchFunctionDeclaration,
    );
  }
}
