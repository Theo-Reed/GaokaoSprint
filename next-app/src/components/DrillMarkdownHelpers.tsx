import React from 'react';
import { escapeRegExp } from '@/lib/utils';

export interface SanitizeOptions {
  stripSingleNewlines?: boolean;
}

export const sanitizeMath = (text: string, options: SanitizeOptions = {}) => {
  if (!text || typeof text !== 'string') return "";
  
  // 1. Remove carriage returns
  let clean = text.replace(/\r/g, '');

  // 2. Optional: Strip single newlines (convert to space) but keep double newlines (paragraphs)
  // This is useful for OCR'd text where lines break arbitrarily.
  // Using a safe split/map approach instead of lookbehind for Safari compatibility.
  if (options.stripSingleNewlines) {
    clean = clean.split('\n\n')
      .map(para => para.replace(/\n/g, ' '))
      .join('\n\n');
  }

  // 3. Normalize delimiters - ONLY if they are not already properly escaped
  // High-level check: if we have $$ and they aren't part of a code block, 
  // we usually want them to stay $$ for block math, but next-app uses $ for everything.
  // We'll keep this but make it safer.
  clean = clean.replace(/\$\$\$/g, '$'); 

  // 4. Fix escaped backslashes common in JSON data
  // Only target actual LaTeX commands that were double-escaped (e.g., \\frac -> \frac)
  const knownCommands = [
    'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan',
    'ln', 'log', 'lg', 'exp',
    'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 
    'lambda', 'mu', 'nu', 'xi', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega',
    'frac', 'sqrt', 'int', 'sum', 'prod', 'lim', 'infty', 'cdot', 'times', 'div', 'pm', 'mp',
    'le', 'ge', 'leq', 'geq', 'ne', 'neq', 'approx', 'equiv', 'cong',
    'in', 'subset', 'subseteq', 'cup', 'cap', 'emptyset', 'forall', 'exists',
    'vec', 'hat', 'bar', 'tilde', 'angle', 'triangle', 'bot', 'parallel', 'perp', 'deg', 'degree'
  ];

  // This specifically looks for double-escaped backslashes before known commands
  // We remove 'K', 'k', 'c' etc because they are often just letters in text
  const commandPattern = new RegExp(`\\\\\\\\(${knownCommands.map(escapeRegExp).join('|')})\\b`, 'g');
  clean = clean.replace(commandPattern, '\\$1');

  // 5. Fix double-escaped braces and symbols
  clean = clean.replace(/\\\\\{/g, '\\{')
               .replace(/\\\\\}/g, '\\}')
               .replace(/\\\\\|/g, '\\|')
               .replace(/\\\\%/g, '\\%')
               .replace(/\\%/g, '\\%'); // Ensure % is properly escaped for KaTeX

  // 6. Heuristic: wrapping likely math expressions in $...$ if they are not already
  if (clean.includes('\\') && !clean.includes('$')) {
      // If text looks like a formula (contains backslash, ops, etc) and is short
      if (/^[0-9a-z\s+\-*/=_,.()\\{}[\]^]+$/i.test(clean) && clean.length < 100) {
           clean = `$${clean}$`;
      }
  }
  
  // 7. Targeted fixes (from Math Large)
  clean = clean.replace(/\\frac\{pi\}/g, '\\frac{\\pi}'); 
  clean = clean.replace(/\\frac\{(\\?)pi\}/g, '\\frac{\\pi}');

  // 8. Auto-escape common symbols if they appear unescaped as whole words (careful with this)
  const autoEscapeSymbols = [
     'alpha', 'beta', 'gamma', 'delta', 'theta', 'lambda', 'mu', 'pi', 'rho', 'sigma', 'omega'
  ];
  
  // Using a capture group approach instead of lookbehind for Safari compatibility
  const symPattern = new RegExp(`(\\\\?)\\b(${autoEscapeSymbols.join('|')})\\b`, 'g');
  clean = clean.replace(symPattern, (match, prefix, symbol) => {
    return prefix === '\\' ? match : '\\' + symbol;
  });

  return clean;
};

export const markdownComponents = {
  p: ({children}: {children?: React.ReactNode}) => (
    <div className="mb-4 text-slate-800 dark:text-white/90 leading-relaxed font-serif whitespace-pre-wrap">{children}</div>
  ),
  table: ({children}: {children?: React.ReactNode}) => (
    <div className="table-container shadow-sm my-6 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden overscroll-contain">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">{children}</table>
    </div>
  ),
  th: ({children}: {children?: React.ReactNode}) => (
    <th className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 text-left text-xs font-bold text-slate-500 dark:text-white/90 uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-800 last:border-r-0">{children}</th>
  ),
  td: ({children}: {children?: React.ReactNode}) => (
    <td className="px-4 py-3 text-sm text-slate-600 dark:text-white/80 border-b border-r border-slate-200 dark:border-slate-800 last:border-r-0 bg-white dark:bg-transparent">{children}</td>
  ),
  strong: ({children}: {children?: React.ReactNode}) => (
    <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>
  ),
  li: ({children}: {children?: React.ReactNode}) => (
    <li className="text-slate-800 dark:text-white/90 mb-1">{children}</li>
  ),
  h1: ({children}: {children?: React.ReactNode}) => (
    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{children}</h1>
  ),
  h2: ({children}: {children?: React.ReactNode}) => (
    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{children}</h2>
  ),
  h3: ({children}: {children?: React.ReactNode}) => (
    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{children}</h3>
  )
};

export const simpleMarkdownComponents = {
  p: ({children}: {children?: React.ReactNode}) => <div className="whitespace-pre-wrap dark:text-slate-100">{children}</div>
};
