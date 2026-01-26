// debug-slugs.ts
import { getAllSlugs } from './next-app/src/lib/markdown';

const slugs = getAllSlugs('cn');
console.log('Generated Slugs:', JSON.stringify(slugs, null, 2));

const targetSlug = ['数学', 'strategy'];
const match = slugs.find(s => JSON.stringify(s) === JSON.stringify(targetSlug));
console.log('Match found for 数学/strategy:', !!match);

if (!match) {
    // Check char codes
    console.log('Target codes:', targetSlug[0].split('').map(c => c.charCodeAt(0)));
    slugs.forEach(s => {
        if (s.length === 2 && s[1] === 'strategy') {
            console.log('Candidate:', s[0], s[0].split('').map(c => c.charCodeAt(0)));
        }
    })
}
