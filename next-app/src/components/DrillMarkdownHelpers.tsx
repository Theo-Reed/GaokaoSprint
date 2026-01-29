import React from 'react';

export interface SanitizeOptions {
  stripSingleNewlines?: boolean;
}

export const sanitizeMath = (text: string, options: SanitizeOptions = {}) => {
  if (!text || typeof text !== 'string') return text;
  
  // 1. Remove carriage returns
  let clean = text.replace(/\r/g, '');

  // 2. Optional: Strip single newlines (convert to space) but keep double newlines (paragraphs)
  // This is useful for OCR'd text where lines break arbitrarily, but we want to flow the text.
  // We use lookbehind/lookahead to match a newline that is NOT preceded/followed by another newline.
  if (options.stripSingleNewlines) {
    clean = clean.replace(/(?<!\n)\n(?!\n)/g, ' ');
  }

  // 3. Normalize delimiters
  clean = clean.replace(/\$\$/g, '$');

  // 4. Known LaTeX commands that should be double-escaped if they come in as single-escaped or unescaped in some contexts
  // We essentially want `\sin` in the final string, so if we see `\\sin` (which might be in JSON string), we convert to `\sin`.
  // Wait, the regex `\\\\sin` matches literal `\\sin` in the string.
  // The replacement is `\$1` which is `\sin`.
  // This seems to be fixing double-escaped backslashes from JSON data.
  const knownCommands = [
    // Trig & Log
    'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan',
    'ln', 'log', 'lg', 'exp',
    // Greek Lowercase
    'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 
    'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega',
    // Greek Uppercase
    'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma', 'Upsilon', 'Phi', 'Psi', 'Omega',
    // Operators & Calculus
    'frac', 'sqrt', 'int', 'sum', 'prod', 'lim', 'infty',
    'cdot', 'times', 'div', 'pm', 'mp',
    // Relations
    'le', 'ge', 'leq', 'geq', 'ne', 'neq', 'approx', 'equiv', 'cong',
    // Sets & Logic
    'in', 'subset', 'subseteq', 'cup', 'cap', 'emptyset',
    'forall', 'exists',
    // Vectors, Accents, Geometry
    'vec', 'hat', 'bar', 'tilde', 'angle', 'triangle', 'bot', 'parallel', 'perp', 'deg', 'degree',
    // Arrows
    'leftarrow', 'rightarrow', 'leftrightarrow', 'Leftarrow', 'Rightarrow', 'Leftrightarrow', 
    'uparrow', 'downarrow', 'leftharpoons', 'leftrightharpoons',
    // Chemistry
    'mol', 'aq', 's', 'l', 'g', 'pH',
    // Physics / Others often found
    'B', 'F', 'E', 'Phi', 'v', 'a', 'm', 'K', 'Q', 'c', 'k', 'h'
  ];

  const commandPattern = new RegExp(`\\\\\\\\(${knownCommands.join('|')})\\b`, 'g');
  clean = clean.replace(commandPattern, '\\$1');

  // 5. Fix double-escaped braces and pipes
  clean = clean.replace(/\\\\\{/g, '\\{').replace(/\\\\\}/g, '\\}').replace(/\\\\\|/g, '\\|');

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
  
  autoEscapeSymbols.forEach(sym => {
       // Look for symbol NOT preceded by backslash
       clean = clean.replace(new RegExp(`(?<!\\\\)\\b${sym}\\b`, 'g'), `\\${sym}`);
  });

  return clean;
};

export const markdownComponents = {
  p: ({children}: {children?: React.ReactNode}) => (
    <div className="mb-4 text-slate-800 dark:text-slate-200 leading-relaxed font-serif whitespace-pre-wrap">{children}</div>
  ),
  table: ({children}: {children?: React.ReactNode}) => (
    <div className="table-container shadow-sm my-6 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden overscroll-contain">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">{children}</table>
    </div>
  ),
  th: ({children}: {children?: React.ReactNode}) => (
    <th className="px-4 py-3 bg-slate-50 dark:bg-slate-800 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-r border-slate-200 dark:border-slate-700 last:border-r-0">{children}</th>
  ),
  td: ({children}: {children?: React.ReactNode}) => (
    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 border-b border-r border-slate-200 dark:border-slate-700 last:border-r-0 bg-white dark:bg-slate-900">{children}</td>
  )
};

export const simpleMarkdownComponents = {
  p: ({children}: {children?: React.ReactNode}) => <div className="whitespace-pre-wrap">{children}</div>
};
