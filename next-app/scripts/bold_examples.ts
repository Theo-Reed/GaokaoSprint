
import * as fs from 'fs';
import * as path from 'path';

const DATA_FILES = [
    path.join(process.cwd(), 'src/data/vocabulary_app_data_refined_final.json'),
    path.join(process.cwd(), 'src/data/vocabulary_app_data_final.json'),
    path.join(process.cwd(), 'src/data/vocabulary_app_data_high_yield.json'),
    path.join(process.cwd(), 'src/data/vocabulary_app_data_lite.json'),
];

function getVariations(word: string): string[] {
    const variations = new Set([word]);
    const lower = word.toLowerCase();
    
    // basic endings
    variations.add(lower + 's');
    variations.add(lower + 'es');
    variations.add(lower + 'ed');
    variations.add(lower + 'd');
    variations.add(lower + 'ing');
    
    // words ending in e
    if (lower.endsWith('e')) {
        const base = lower.slice(0, -1);
        variations.add(base + 'ing');
        variations.add(base + 'ed');
        variations.add(base + 'er');
    }
    
    // words ending in y
    if (lower.endsWith('y')) {
        const base = lower.slice(0, -1);
        variations.add(base + 'ies');
        variations.add(base + 'ied');
        variations.add(base + 'ier');
    }

    // words ending in consonant-vowel-consonant (doubling)
    if (lower.length >= 3 && /[^aeiou][aeiou][^aeiou]$/i.test(lower)) {
        const lastChar = lower[lower.length - 1];
        if (!'wx'.includes(lastChar)) {
            variations.add(lower + lastChar + 'ing');
            variations.add(lower + lastChar + 'ed');
        }
    }

    return Array.from(variations).sort((a, b) => b.length - a.length); // match longest first
}

function boldWord(text: string, word: string): string {
    if (!text || !word) return text;

    const variations = getVariations(word);
    
    // Create a regex to match any of the variations
    // We escape each variation and join with |
    const escapedVariations = variations.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const patternStr = `\\b(${escapedVariations.join('|')})\\b`;
    const pattern = new RegExp(patternStr, 'gi');
    
    // Smart replace: only wrap in ** if not already wrapped
    const parts = text.split(/(\*\*.*?\*\*)/);
    const processedParts = parts.map(part => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return part; // Skip already bolded
        }
        return part.replace(pattern, (match) => {
            return `**${match}**`;
        });
    });
    
    return processedParts.join('');
}

async function run() {
    for (const filePath of DATA_FILES) {
        if (!fs.existsSync(filePath)) {
            console.log(`File not found, skipping: ${filePath}`);
            continue;
        }

        console.log(`Reading data file: ${filePath}`);
        const rawData = fs.readFileSync(filePath, 'utf-8');
        let data;
        try {
            data = JSON.parse(rawData);
        } catch (e) {
            console.error(`Error parsing ${filePath}:`, e);
            continue;
        }

        console.log(`Processing ${data.length} entries...`);
        let count = 0;
        let changedSentenceCount = 0;

        for (const entry of data) {
            if (entry.examples) {
                const word = entry.word;
                
                // Handle teach examples
                if (entry.examples.teach) {
                    if (Array.isArray(entry.examples.teach)) {
                        entry.examples.teach = entry.examples.teach.map((ex: string) => {
                            const updated = boldWord(ex, word);
                            if (updated !== ex) changedSentenceCount++;
                            return updated;
                        });
                    } else if (typeof entry.examples.teach === 'string') {
                        const updated = boldWord(entry.examples.teach, word);
                        if (updated !== entry.examples.teach) changedSentenceCount++;
                        entry.examples.teach = updated;
                    }
                }

                // Handle exam examples
                if (entry.examples.exams && Array.isArray(entry.examples.exams)) {
                    entry.examples.exams = entry.examples.exams.map((exam: any) => {
                        if (exam.text) {
                            const updated = boldWord(exam.text, word);
                            if (updated !== exam.text) changedSentenceCount++;
                            exam.text = updated;
                        }
                        return exam;
                    });
                }
            }
            count++;
            if (count % 1000 === 0) {
                console.log(`Processed ${count} entries...`);
            }
        }

        console.log(`Saving updated data to ${filePath}... (${changedSentenceCount} sentences updated)`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
    console.log('Done!');
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
