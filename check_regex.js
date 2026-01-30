const fs = require('fs');
const path = require('path');

const lookbehindPattern = /\(\?<=|\(\?<!/;
// new RegExp(..., 'v') or /.../v
// Checking for /.../v is hard with regex, scanning for explicit new RegExp with 'v' flag string
const newRegExpVPattern = /new RegExp\s*\([^,]+,\s*['"`][gimsuy]*v[gimsuy]*['"`]\s*\)/;

const searchPaths = [
    '/Users/yeatom/VSCodeProjects/gaokao/next-app/node_modules/tailwindcss',
    '/Users/yeatom/VSCodeProjects/gaokao/next-app/node_modules/@tailwindcss',
    '/Users/yeatom/VSCodeProjects/gaokao/next-app/node_modules/rehype-katex',
    '/Users/yeatom/VSCodeProjects/gaokao/next-app/node_modules/remark-math',
    '/Users/yeatom/VSCodeProjects/gaokao/next-app/node_modules/react-markdown',
    '/Users/yeatom/VSCodeProjects/gaokao/next-app/node_modules/katex',
    '/Users/yeatom/VSCodeProjects/gaokao/next-app/node_modules/lucide-react'
];

function scanFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const issues = [];
        if (lookbehindPattern.test(content)) {
            issues.push("Lookbehind");
        }
        if (newRegExpVPattern.test(content)) {
            issues.push("new RegExp with v flag");
        }
        
        if (issues.length > 0) {
            console.log(`${filePath}: ${issues.join(', ')}`);
        }
    } catch (e) {
        // ignore errors
    }
}

function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walk(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.cjs')) {
            scanFile(fullPath);
        }
    }
}

console.log("Scanning for regex issues...");
searchPaths.forEach(walk);
console.log("Scan complete.");
