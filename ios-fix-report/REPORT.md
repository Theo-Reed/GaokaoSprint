# iOS 16 (Safari) Compatibility Fix Report in Next.js

**Date:** January 31, 2026
**Target Issue:** `SyntaxError: Invalid regular expression: invalid group specifier name`
**Target Environment:** iOS 16+, Vercel Deployment

## 1. Problem Summary
The application crashed on older Safari versions (specifically iOS 16) with an "Invalid regular expression" error. This was caused by the use of modern regex features—specifically **Lookbehind Assertions** (`(?<=...)`) and **Unicode Property Escapes** (`\p{...}`) combined with the `u` flag—inside third-party dependencies (`mdast-util-gfm-autolink-literal`, `zod`, `micromark`, etc.).

While these features work in modern Chrome/Edge, they cause fatal errors in strict mode on WebKit older than version 16.4.

## 2. Technical Root Causes
1.  **Lookbehind (`(?<=`)**: Vercel's build environment pulled in versions of `mdast-util-gfm-autolink-literal` containing lookbehind syntax, which differed from the local environment versions.
2.  **`\p{Emoji}` + `u` flag**: The `zod` library was instantiating `new RegExp(..., "u")` with emojis. Even if the regex body is patched, the strict `u` flag on iOS 16 often rejects complex Unicode combinations.
3.  **Hoisting & Paths**: Hardcoded paths (e.g., `node_modules/pkg`) failed on Vercel because package managers hoist dependencies differently in CI vs Local.

## 3. The Solution Strategy
We implemented a robust **Regex Patching Script** (`patch-regex.mjs`) that runs automatically before `next build`.

### Key Features of the Script:
1.  **Dynamic Discovery**: Uses `createRequire` and `require.resolve` to find the exact location of problematic packages on disk, regardless of whether they are nested or hoisted.
2.  **Recursive Scanning**: Deeply scans package directories (like `zod/v3/`) to find all JS files, not just the entry point.
3.  **Nuclear "Safe File" Overwrite**:
    *   The script contains a "clean" version of `mdast-util-gfm-autolink-literal/lib/index.js`.
    *   If the script detects `(?<=` (Lookbehind) in the target file, it **completely overwrites** the file with the clean version. This effectively downgrades the problematic file to a safe state during build time.
4.  **Zod Patching**:
    *   Removes `\p{Extended_Pictographic}` and other unstable Unicode properties.
    *   **Crucially**: Removes the `"u"` flag from `new RegExp(..., "u")` instantiation calls in Zod source code.

## 4. Implementation Details

### File Structure
- **Script**: `ios-fix-report/patch-regex.mjs` (Copy of the active script).
- **Active Location**: `scripts/patch-regex.mjs`.

### Integration
In `next-app/package.json`:
```json
"scripts": {
  "build": "node ../scripts/patch-regex.mjs && next build"
}
```

### Verification
The script runs during Vercel build logs:
```
[Dynamic] Scanning package root: ...
🚨 Nuclear Patch: Overwriting mdast-util-gfm-autolink-literal/lib/index.js...
✅ Successfully patched next-app/node_modules/zod/v3/types.js
```

## 5. Maintenance
If you update dependencies (`zod`, `react-markdown`, etc.) and the error reappears:
1.  Check Vercel Build Logs for the script output.
2.  Add the new problematic package name to the `PACKAGES_TO_FIND` array in `patch-regex.mjs`.
3.  If a new Lookbehind is introduced in a different file, add a warning logger in `patch-regex.mjs` to detect it.
