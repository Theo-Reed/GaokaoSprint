
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// ASCII Punctuation + Common Chinese Punctuation
const SAFE_PUNCTUATION = "[!-/:-@[-`{-~\\u3000-\\u303f\\uff00-\\uffef]";

// Set to track unique paths to patch
const pathsToPatch = new Set();

// 1. Hardcoded fallbacks
const FALLBACK_PATHS = [
  // Root node_modules (hoisted)
  'node_modules/micromark-util-character/index.js',
  'node_modules/micromark-util-character/dev/index.js',
  'node_modules/estree-util-is-identifier-name/lib/index.js',
  'node_modules/mdast-util-gfm-autolink-literal/lib/index.js',
  
  // Potential next-app node_modules
  'next-app/node_modules/micromark-util-character/index.js',
  'next-app/node_modules/micromark-util-character/dev/index.js',
  'next-app/node_modules/estree-util-is-identifier-name/lib/index.js',
  'next-app/node_modules/mdast-util-gfm-autolink-literal/lib/index.js',

  // Zod v3 specific locations
  'node_modules/zod/v3/types.js',
  'node_modules/zod/v3/types.cjs',
  'next-app/node_modules/zod/v3/types.js',
  'next-app/node_modules/zod/v3/types.cjs',
];

FALLBACK_PATHS.forEach(p => {
    const full = path.resolve(rootDir, p);
    if(fs.existsSync(full)) pathsToPatch.add(full);
});

function walkAndPatch(dir) {
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            let stat;
            try { stat = fs.statSync(fullPath); } catch (e) { continue; }

            if (stat.isDirectory()) {
                if (file !== 'node_modules' && file !== '.git') {
                   // Limit depth? next-app/node_modules/.../v3 is depth 1 inside package
                   // We trust that we are inside a specific package root provided by dynamic resolution
                   walkAndPatch(fullPath);
                }
            } else if (file.endsWith('.js') || file.endsWith('.cjs') || file.endsWith('.mjs')) {
                 pathsToPatch.add(fullPath);
            }
        }
    } catch (e) {
        console.warn(`Error scanning ${dir}: ${e.message}`);
    }
}

// 2. Dynamic Resolution
try {
    // Try to resolve from next-app context
    const nextAppPkgJson = path.join(rootDir, 'next-app', 'package.json');
    if (fs.existsSync(nextAppPkgJson)) {
        const require = createRequire(nextAppPkgJson);
        
        const PACKAGES_TO_FIND = [
            'micromark-util-character', 
            'estree-util-is-identifier-name',
            'mdast-util-gfm-autolink-literal',
            'micromark-extension-gfm',
            'micromark-extension-gfm-autolink-literal',
            'micromark-extension-gfm-strikethrough',
            'micromark-extension-gfm-table',
            'micromark-extension-gfm-tagfilter',
            'micromark-extension-gfm-task-list-item',
            'remark-gfm',
            'strip-ansi',
            'ansi-regex',
            'zod'
        ];

        for (const pkg of PACKAGES_TO_FIND) {
            try {
                // Try resolving the package main entry point
                const resolved = require.resolve(pkg);
                console.log(`[Dynamic] Resolved ${pkg} -> ${resolved}`);
                
                // Add the resolved file itself
                pathsToPatch.add(resolved);

                // Find package root and scan all JS files
                let currentDir = path.dirname(resolved);
                // Go up max 3 levels looking for package.json
                for(let i=0; i<3; i++) {
                    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
                        console.log(`[Dynamic] Scanning package root: ${currentDir}`);
                        walkAndPatch(currentDir);
                        break;
                    }
                    currentDir = path.dirname(currentDir);
                }

            } catch (e) {
                // Ignore resolution failures
                console.log(`[Dynamic] Could not resolve ${pkg}: ${e.message}`);
            }
        }
    } else {
        console.log("next-app/package.json not found, skipping dynamic resolution from next-app");
    }
} catch (error) {
    console.error("Dynamic resolution error:", error);
}

function patchFile(fullPath) {
  if (!fs.existsSync(fullPath)) {
      return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;
  let changed = false;

  // 1. Micromark Punctuation
  const micromarkTargets = [
    '/\\p{P}|\\p{S}/u',
    'new RegExp("[!-/:-@[-`{-~\\u3000-\\u303f\\uff00-\\uffef]")|new RegExp("[!-/:-@[-`{-~\\u3000-\\u303f\\uff00-\\uffef]")'
  ];
  
  for (const target of micromarkTargets) {
    if (content.includes(target)) {
      console.log(`  - Patching Micromark Punctuation in ${path.relative(rootDir, fullPath)}`);
      content = content.replace(target, `new RegExp("${SAFE_PUNCTUATION}")`);
      changed = true;
    }
  }

  // 2. Mdast Autolink Literal
  if (fullPath.includes('mdast-util-gfm-autolink-literal')) {
    // Replace unicodePunctuation call with manual safe check
    const unsafeCheck = 'unicodePunctuation(code))';
    if (content.includes(unsafeCheck)) {
       console.log(`  - Patching unicodePunctuation call in ${path.relative(rootDir, fullPath)}`);
       // We replace it with a direct regex check using our safe punctuation
       const safeCheck = `(code !== null && code > -1 && new RegExp("${SAFE_PUNCTUATION}").test(String.fromCharCode(code))))`;
       content = content.replace(unsafeCheck, safeCheck);
       changed = true;
    }
  }

  // 3. ID_Start / ID_Continue
  if (content.includes('\\p{ID_Start}')) {
    console.log(`  - Patching ID_Start in ${path.relative(rootDir, fullPath)}`);
    // Global replace for this one
    content = content.split('\\p{ID_Start}').join('a-zA-Z_$');
    changed = true;
  }
  if (content.includes('\\p{ID_Continue}')) {
    console.log(`  - Patching ID_Continue in ${path.relative(rootDir, fullPath)}`);
    content = content.replace(/\\p{ID_Continue}/g, 'a-zA-Z0-9_$');
    changed = true;
  }

  // 5. Lookbehind Detection & Strip-Ansi Patching
  const lookbehind = /[^\\\\]\(\?<!|[^\\\\]\(\?<=/g;
  if (lookbehind.test(content)) {
     console.warn(`  ⚠️  WARNING: Potential Lookbehind usage in ${path.relative(rootDir, fullPath)}`);
     const matches = content.match(lookbehind);
     console.log(`     Matches: ${matches ? matches.join(', ') : 'unknown'}`);
     
     // Specific patch for strip-ansi v7 / ansi-regex v6
     // pattern: new RegExp(..., 'u'), or complex regex
     if (fullPath.includes('ansi-regex') || fullPath.includes('strip-ansi')) {
        // Fallback to ANSI-Regex v5 pattern (safe for older browsers)
        // https://github.com/chalk/ansi-regex/blob/main/index.js (v5)
        const ansiRegexV5 = "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))";
        
        // Naive replacement for the "return ..." or "export default ..."
        const regexConstruction = /return new RegExp\(.*\)/;
        if (regexConstruction.test(content)) {
            console.log(`  - Patching ansi-regex to use safe v5 pattern`);
            content = content.replace(regexConstruction, `return new RegExp("${ansiRegexV5}", "g")`);
            changed = true;
        } else if (content.includes('({onlyFirst = false} = {}) =>')) {
             // strip-ansi v7 implementation
             console.log(`  - Patching strip-ansi to use safe v5 pattern`);
             // This is harder to patch cleanly without parsing, but let's try replacing the regex usage
             // Usually it calls ansiRegex()
             // We can just replace the whole file export if we are bold, but let's stick to regex replacement if possible
             // or patching the ansi-regex dependency is enough.
        }
     }
  }

  // 6. Fix Zod Emoji instantiation (Global fix)
  if (content.includes('new RegExp(_emojiRegex, "u")')) {
      console.log(`  - Patching Emoji RegExp instantiation in ${path.relative(rootDir, fullPath)}`);
      // Use split/join to replace ALL occurrences, just in case
      content = content.split('new RegExp(_emojiRegex, "u")').join('new RegExp(_emojiRegex)');
      changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Successfully patched ${path.relative(rootDir, fullPath)}`);
  }
}

console.log("Starting regex patching...");
console.log(`Targeting ${pathsToPatch.size} potential file paths.`);

for (const p of pathsToPatch) {
    // console.log(`Checking ${path.relative(rootDir, p)}...`);
    patchFile(p);
}

console.log("Patching complete.");
