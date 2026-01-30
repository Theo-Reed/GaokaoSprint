
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const FILES_TO_PATCH = [
  'next-app/node_modules/micromark-util-character/index.js',
  'next-app/node_modules/micromark-util-character/dev/index.js',
  'next-app/node_modules/estree-util-is-identifier-name/lib/index.js',
  'next-app/node_modules/zod/v4/core/regexes.js',
  'next-app/node_modules/zod/v4/core/regexes.cjs'
];

// ASCII Punctuation + Common Chinese Punctuation
const SAFE_PUNCTUATION = "[!-/:-@[-`{-~\\u3000-\\u303f\\uff00-\\uffef]";

function patchFile(filePath) {
  const fullPath = path.resolve(rootDir, filePath);
  if (!fs.existsSync(fullPath)) return;

  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  // 1. Micromark Punctuation
  // Handles my previous broken patch too
  const micromarkTargets = [
    '/\\p{P}|\\p{S}/u',
    'new RegExp("[!-/:-@[-`{-~\\u3000-\\u303f\\uff00-\\uffef]")|new RegExp("[!-/:-@[-`{-~\\u3000-\\u303f\\uff00-\\uffef]")'
  ];
  
  for (const target of micromarkTargets) {
    if (content.includes(target)) {
      console.log(`Patching Micromark in ${filePath}`);
      content = content.split(target).join(`new RegExp("${SAFE_PUNCTUATION}")`);
      changed = true;
    }
  }

  // 2. ID_Start / ID_Continue
  if (content.includes('\\p{ID_Start}')) {
    content = content.split('\\p{ID_Start}').join('a-zA-Z_$');
    changed = true;
  }
  if (content.includes('\\p{ID_Continue}')) {
    console.log(`Patching ID_Continue in ${filePath}`);
    content = content.replace(/\\p{ID_Continue}/g, 'a-zA-Z0-9_$');
    changed = true;
  }

  // 3. Replace zod emoji
  if (content.includes('\\p{Extended_Pictographic}')) {
    console.log(`Patching Emoji in ${filePath}`);
    content = content.replace(/\\p{Extended_Pictographic}/g, '\\u2300-\\u23ff'); // Rough approximation
    changed = true;
  }
  if (content.includes('\\p{Emoji_Component}')) {
    content = content.replace(/\\p{Emoji_Component}/g, '\\u2300-\\u23ff');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(fullPath, content);
    console.log(`Successfully patched ${filePath}`);
  }
}

// Also patch build chunks
function patchChunks() {
  const chunksDir = path.resolve(rootDir, 'next-app/.next/static/chunks');
  if (!fs.existsSync(chunksDir)) return;

  const files = fs.readdirSync(chunksDir);
  for (const file of files) {
    if (file.endsWith('.js')) {
      const fullPath = path.join(chunksDir, file);
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Scan for any remaining literals that might crash
      if (content.includes('/\\p{')) {
          console.log(`Post-patching \\p in chunk: ${file}`);
          content = content.replace(/\/\\p\{[^\}]+\}\/u/g, '/[\\s\\S]/'); // Safe fall-through
          changed = true;
      }
      
      // Patch named groups or lookbehind if found (though we haven't found them yet, just in case)
      if (content.includes('(?<')) {
          // If it's a feature test (like core-js), leave it.
          // Otherwise, patch it if it's a literal.
          // This is a bit risky but we'll try it if the crash persists.
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

console.log("Starting regex patching...");
FILES_TO_PATCH.forEach(patchFile);
patchChunks();
console.log("Patching complete.");
