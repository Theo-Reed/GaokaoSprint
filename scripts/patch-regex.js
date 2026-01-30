
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const FILES_TO_PATCH = [
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

// ASCII Punctuation + Common Chinese Punctuation
const SAFE_PUNCTUATION = "[!-/:-@[-`{-~\\u3000-\\u303f\\uff00-\\uffef]";

function patchFile(filePath) {
  const fullPath = path.resolve(rootDir, filePath);
  if (!fs.existsSync(fullPath)) return;

  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  console.log(`Checking ${filePath}...`);

  // 1. Micromark Punctuation
  const micromarkTargets = [
    '/\\p{P}|\\p{S}/u',
    'new RegExp("[!-/:-@[-`{-~\\u3000-\\u303f\\uff00-\\uffef]")|new RegExp("[!-/:-@[-`{-~\\u3000-\\u303f\\uff00-\\uffef]")'
  ];
  
  for (const target of micromarkTargets) {
    if (content.includes(target)) {
      console.log(`Patching Micromark in ${filePath}`);
      content = content.replace(target, `new RegExp("${SAFE_PUNCTUATION}")`);
      changed = true;
    }
  }

  // 2. Mdast Autolink Literal
  if (filePath.includes('mdast-util-gfm-autolink-literal')) {
    // Email regex
    const emailRegex = '/([-.\\w+]+)@([-\\w]+(?:\\.[-\\w]+)+)/gu';
    if (content.includes(emailRegex)) {
      console.log(`Patching Email Regex in ${filePath}`);
      content = content.replace(
        emailRegex,
        'new RegExp("([-.\\\\w+]+)@([-\\\\w]+(?:\\\\.[-\\\\w]+)+)", "gu")'
      );
      changed = true;
    }

    // URL regex
    const urlRegex = '/(https?:\\/\\/|www(?=\\.))([-.\\w]+)([^ \\t\\r\\n]*)/gi';
    if (content.includes(urlRegex)) {
      console.log(`Patching URL Regex in ${filePath}`);
      content = content.replace(
        urlRegex,
        'new RegExp("(https?:\\\\/\\\\/|www(?=\\\\.))([-.\\\\w]+)([^ \\\\t\\\\r\\\\n]*)", "gi")'
      );
      changed = true;
    }

    // Replace unicodePunctuation call with manual safe check
    const unsafeCheck = 'unicodePunctuation(code))';
    if (content.includes(unsafeCheck)) {
       console.log(`Patching unicodePunctuation call in ${filePath}`);
       // We replace it with a direct regex check using our safe punctuation
       const safeCheck = `(code !== null && code > -1 && new RegExp("${SAFE_PUNCTUATION}").test(String.fromCharCode(code))))`;
       content = content.replace(unsafeCheck, safeCheck);
       changed = true;
    }
  }

  // 3. ID_Start / ID_Continue
  if (content.includes('\\p{ID_Start}')) {
    console.log(`Patching ID_Start in ${filePath}`);
    content = content.split('\\p{ID_Start}').join('a-zA-Z_$');
    changed = true;
  }
  if (content.includes('\\p{ID_Continue}')) {
    console.log(`Patching ID_Continue in ${filePath}`);
    content = content.replace(/\\p{ID_Continue}/g, 'a-zA-Z0-9_$');
    changed = true;
  }

  // 4. Replace zod emoji
  if (content.includes('\\p{Extended_Pictographic}')) {
    console.log(`Patching Emoji in ${filePath}`);
    content = content.replace(/\\p{Extended_Pictographic}/g, '\\u2300-\\u23ff'); 
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
