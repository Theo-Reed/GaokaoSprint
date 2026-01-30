
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// ASCII Punctuation + Common Chinese Punctuation
const SAFE_PUNCTUATION = "[!-/:-@[-`{-~\\u3000-\\u303f\\uff00-\\uffef]";


const SAFE_MDAST_AUTOLINK_CONTENT = `/**
 * @import {RegExpMatchObject, ReplaceFunction} from 'mdast-util-find-and-replace'
 * @import {CompileContext, Extension as FromMarkdownExtension, Handle as FromMarkdownHandle, Transform as FromMarkdownTransform} from 'mdast-util-from-markdown'
 * @import {ConstructName, Options as ToMarkdownExtension} from 'mdast-util-to-markdown'
 * @import {Link, PhrasingContent} from 'mdast'
 */

import {ccount} from 'ccount'
import {ok as assert} from 'devlop'
import {unicodePunctuation, unicodeWhitespace} from 'micromark-util-character'
import {findAndReplace} from 'mdast-util-find-and-replace'

/** @type {ConstructName} */
const inConstruct = 'phrasing'
/** @type {Array<ConstructName>} */
const notInConstruct = ['autolink', 'link', 'image', 'label']

/**
 * Create an extension for \`mdast-util-from-markdown\` to enable GFM autolink
 * literals in markdown.
 *
 * @returns {FromMarkdownExtension}
 *   Extension for \`mdast-util-to-markdown\` to enable GFM autolink literals.
 */
export function gfmAutolinkLiteralFromMarkdown() {
  return {
    transforms: [transformGfmAutolinkLiterals],
    enter: {
      literalAutolink: enterLiteralAutolink,
      literalAutolinkEmail: enterLiteralAutolinkValue,
      literalAutolinkHttp: enterLiteralAutolinkValue,
      literalAutolinkWww: enterLiteralAutolinkValue
    },
    exit: {
      literalAutolink: exitLiteralAutolink,
      literalAutolinkEmail: exitLiteralAutolinkEmail,
      literalAutolinkHttp: exitLiteralAutolinkHttp,
      literalAutolinkWww: exitLiteralAutolinkWww
    }
  }
}

/**
 * Create an extension for \`mdast-util-to-markdown\` to enable GFM autolink
 * literals in markdown.
 *
 * @returns {ToMarkdownExtension}
 *   Extension for \`mdast-util-to-markdown\` to enable GFM autolink literals.
 */
export function gfmAutolinkLiteralToMarkdown() {
  return {
    unsafe: [
      {
        character: '@',
        before: '[+\\\\-.\\\\w]',
        after: '[\\\\-.\\\\w]',
        inConstruct,
        notInConstruct
      },
      {
        character: '.',
        before: '[Ww]',
        after: '[\\\\-.\\\\w]',
        inConstruct,
        notInConstruct
      },
      {
        character: ':',
        before: '[ps]',
        after: '\\\\/',
        inConstruct,
        notInConstruct
      }
    ]
  }
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterLiteralAutolink(token) {
  this.enter({type: 'link', title: null, url: '', children: []}, token)
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterLiteralAutolinkValue(token) {
  this.config.enter.autolinkProtocol.call(this, token)
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitLiteralAutolinkHttp(token) {
  this.config.exit.autolinkProtocol.call(this, token)
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitLiteralAutolinkWww(token) {
  this.config.exit.data.call(this, token)
  const node = this.stack[this.stack.length - 1]
  assert(node.type === 'link')
  node.url = 'http://' + this.sliceSerialize(token)
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitLiteralAutolinkEmail(token) {
  this.config.exit.autolinkEmail.call(this, token)
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitLiteralAutolink(token) {
  this.exit(token)
}

/** @type {FromMarkdownTransform} */
function transformGfmAutolinkLiterals(tree) {
  findAndReplace(
    tree,
    [
      [new RegExp("(https?:\\\\/\\\\/|www(?=\\\\.))([-.\\\\w]+)([^ \\\\t\\\\r\\\\n]*)", "gi"), findUrl],
      [new RegExp("([-.\\\\w+]+)@([-\\\\w]+(?:\\\\.[-\\\\w]+)+)", "gu"), findEmail]
    ],
    {ignore: ['link', 'linkReference']}
  )
}

/**
 * @type {ReplaceFunction}
 * @param {string} _
 * @param {string} protocol
 * @param {string} domain
 * @param {string} path
 * @param {RegExpMatchObject} match
 * @returns {Array<PhrasingContent> | Link | false}
 */
// eslint-disable-next-line max-params
function findUrl(_, protocol, domain, path, match) {
  let prefix = ''

  // Not an expected previous character.
  if (!previous(match)) {
    return false
  }

  // Treat \`www\` as part of the domain.
  if (/^w/i.test(protocol)) {
    domain = protocol + domain
    protocol = ''
    prefix = 'http://'
  }

  if (!isCorrectDomain(domain)) {
    return false
  }

  const parts = splitUrl(domain + path)

  if (!parts[0]) return false

  /** @type {Link} */
  const result = {
    type: 'link',
    title: null,
    url: prefix + protocol + parts[0],
    children: [{type: 'text', value: protocol + parts[0]}]
  }

  if (parts[1]) {
    return [result, {type: 'text', value: parts[1]}]
  }

  return result
}

/**
 * @type {ReplaceFunction}
 * @param {string} _
 * @param {string} atext
 * @param {string} label
 * @param {RegExpMatchObject} match
 * @returns {Link | false}
 */
function findEmail(_, atext, label, match) {
  if (
    // Not an expected previous character.
    !previous(match, true) ||
    // Label ends in not allowed character.
    /[-\\\\d_]$/.test(label)
  ) {
    return false
  }

  return {
    type: 'link',
    title: null,
    url: 'mailto:' + atext + '@' + label,
    children: [{type: 'text', value: atext + '@' + label}]
  }
}

/**
 * @param {string} domain
 * @returns {boolean}
 */
function isCorrectDomain(domain) {
  const parts = domain.split('.')

  if (
    parts.length < 2 ||
    (parts[parts.length - 1] &&
      (/_/.test(parts[parts.length - 1]) ||
        !/[a-zA-Z\\\\d]/.test(parts[parts.length - 1]))) ||
    (parts[parts.length - 2] &&
      (/_/.test(parts[parts.length - 2]) ||
        !/[a-zA-Z\\\\d]/.test(parts[parts.length - 2])))
  ) {
    return false
  }

  return true
}

/**
 * @param {string} url
 * @returns {[string, string | undefined]}
 */
function splitUrl(url) {
  const trailExec = /[!"&'),.:;<>?\\\\]}]+$/.exec(url)

  if (!trailExec) {
    return [url, undefined]
  }

  url = url.slice(0, trailExec.index)

  let trail = trailExec[0]
  let closingParenIndex = trail.indexOf(')')
  const openingParens = ccount(url, '(')
  let closingParens = ccount(url, ')')

  while (closingParenIndex !== -1 && openingParens > closingParens) {
    url += trail.slice(0, closingParenIndex + 1)
    trail = trail.slice(closingParenIndex + 1)
    closingParenIndex = trail.indexOf(')')
    closingParens++
  }

  return [url, trail]
}

/**
 * @param {RegExpMatchObject} match
 * @param {boolean | null | undefined} [email=false]
 * @returns {boolean}
 */
function previous(match, email) {
  const code = match.input.charCodeAt(match.index - 1)

  // Patched unicodePunctuation check for iOS 16 compatibility
  const isPunctuation = (code !== null && code > -1 && new RegExp("${SAFE_PUNCTUATION.replace(/\\/g, '\\\\\\\\')}").test(String.fromCharCode(code)));

  return (
    (match.index === 0 ||
      unicodeWhitespace(code) ||
      isPunctuation) &&
    // If it’s an email, the previous character should not be a slash.
    (!email || code !== 47)
  )
}
`;

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
  
  // 7. Force Overwrite mdast-util-gfm-autolink-literal if lookbehind detected
  // This is a nuclear option because we can't find the lookbehind locally but Vercel sees it.
  if (fullPath.includes('mdast-util-gfm-autolink-literal/lib/index.js')) {
      // Check if file seems "new" or "broken"
      // If our previous SAFE check detected lookbehind:
      if (lookbehind.test(content)) {
          console.log(`  🚨 Nuclear Patch: Overwriting mdast-util-gfm-autolink-literal/lib/index.js with known safe content.`);
          content = SAFE_MDAST_AUTOLINK_CONTENT;
          changed = true;
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
