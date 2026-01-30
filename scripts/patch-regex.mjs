
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
  'node_modules/zod/lib/regex.js',
  'node_modules/zod/v4/core/regexes.js', 
  'node_modules/mdast-util-gfm-autolink-literal/lib/index.js',
  
  // Potential next-app node_modules
  'next-app/node_modules/micromark-util-character/index.js',
  'next-app/node_modules/micromark-util-character/dev/index.js',
  'next-app/node_modules/estree-util-is-identifier-name/lib/index.js',
  'next-app/node_modules/mdast-util-gfm-autolink-literal/lib/index.js'
];

FALLBACK_PATHS.forEach(p => pathsToPatch.add(path.resolve(rootDir, p)));

// 2. Dynamic Resolution
try {
    // Try to resolve from next-app context
    const nextAppPkgJson = path.join(rootDir, 'next-app', 'package.json');
    if (fs.existsSync(nextAppPkgJson)) {
        const require = createRequire(nextAppPkgJson);
        
        const PACKAGES_TO_FIND = [
            'micromark-util-character', // Resolves to main (index.js usually)
            'estree-util-is-identifier-name',
            'mdast-util-gfm-autolink-literal',
            'mdast-util-gfm-autolink-literal/lib/index.js',
            'zod'
        ];

        for (const pkg of PACKAGES_TO_FIND) {
            try {
                // Try resolving the package main entry point
                const resolved = require.resolve(pkg);
                console.log(`[Dynamic] Resolved ${pkg} -> ${resolved}`);
                pathsToPatch.add(resolved);
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

  console.log(`Checking ${path.relative(rootDir, fullPath)}...`);

  // 1. Micromark Punctuation
  const micromarkTargets = [
    '/\\p{P}|\\p{S}/u',
    'new RegExp("[!-/:-@[-`{-~\\u3000-\\u303f\\uff00-\\uffef]")|new RegExp("[!-/:-@[-`{-~\\u3000-\\u303f\\uff00-\\uffef]")'
  ];
  
  for (const target of micromarkTargets) {
    if (content.includes(target)) {
      console.log(`  - Patching Micromark Punctuation`);
      content = content.replace(target, `new RegExp("${SAFE_PUNCTUATION}")`);
      changed = true;
    }
  }

  // 2. Mdast Autolink Literal
  if (fullPath.includes('mdast-util-gfm-autolink-literal')) {
    // Replace unicodePunctuation call with manual safe check
    const unsafeCheck = 'unicodePunctuation(code))';
    if (content.includes(unsafeCheck)) {
       console.log(`  - Patching unicodePunctuation call`);
       // We replace it with a direct regex check using our safe punctuation
       const safeCheck = `(code !== null && code > -1 && new RegExp("${SAFE_PUNCTUATION}").test(String.fromCharCode(code))))`;
       content = content.replace(unsafeCheck, safeCheck);
       changed = true;
    }
  }

  // 3. ID_Start / ID_Continue
  if (content.includes('\\p{ID_Start}')) {
    console.log(`  - Patching ID_Start`);
    // Global replace for this one
    content = content.split('\\p{ID_Start}').join('a-zA-Z_$');
    changed = true;
  }
  if (content.includes('\\p{ID_Continue}')) {
    console.log(`  - Patching ID_Continue`);
    content = content.replace(/\\p{ID_Continue}/g, 'a-zA-Z0-9_$');
    changed = true;
  }

  // 4. Replace zod emoji
  if (content.includes('\\p{Extended_Pictographic}')) {
    console.log(`  - Patching Emoji`);
    content = content.replace(/\\p{Extended_Pictographic}/g, '\\u2300-\\u23ff'); 
    changed = true;
  }
  if (content.includes('\\p{Emoji_Component}')) {
    content = content.replace(/\\p{Emoji_Component}/g, '\\u2300-\\u23ff');
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
    patchFile(p);
}

console.log("Patching complete.");
