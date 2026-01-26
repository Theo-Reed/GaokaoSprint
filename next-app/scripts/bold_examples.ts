
import * as fs from 'fs';
import * as path from 'path';

const DATA_FILES = [
    path.join(process.cwd(), 'src/data/vocabulary_app_data_refined_final.json'),
];

function getVariations(word: string): string[] {
    const variations = new Set<string>();
    
    // Split by slash or space if it's a phrase but we want to match parts,
    // though usually matching the full phrase is better.
    const subWords = word.split(/[\/\uff0f]/).map(w => w.trim()).filter(w => w.length > 0);
    
    for (const subWord of subWords) {
        variations.add(subWord);
        const lower = subWord.toLowerCase();
        variations.add(lower);
        
        // Suffixes that can be added to the base or slightly modified base
        const suffixes = [
            's', 'es', 'ed', 'd', 'ing', 'ings',
            'ly', 'er', 'or', 'est', 'r', 'st',
            'ment', 'ments', 'ness', 'nesses',
            'tion', 'ations', 'ation', 'tions', 'tension', 'sion', 'sions', 'ion', 'ions',
            'able', 'ible', 'ive', 'al', 'ous', 'ful', 'less',
            'ity', 'ities', 'ance', 'ence', 'ancy', 'ency',
            'y', 'ie', 'ies', 'ied', 'ier', 'iest',
            'ish', 'ic', 'ical', 'ize', 'ise', 'en',
            'ative', 'atory', 'ary', 'ery', 'ory', 'ship', 'hood',
            'room', 'board', 'work', 'time', 'day', 'side', 'land'
        ];

        // 1. Direct addition
        for (const s of suffixes) {
            variations.add(lower + s);
        }

        // 2. Base modifications
        // If ends in 'e', remove it before adding suffixes
        if (lower.endsWith('e')) {
            const base = lower.slice(0, -1);
            for (const s of suffixes) {
                variations.add(base + s);
            }
        }

        // 3. 'y' to 'i' logic
        if (lower.endsWith('y')) {
            const base = lower.slice(0, -1);
            for (const s of suffixes) {
                variations.add(base + 'i' + s);
            }
        }

        // 3b. 'f' or 'fe' to 'ves' logic (wolf -> wolves, knife -> knives)
        if (lower.endsWith('f')) {
            variations.add(lower.slice(0, -1) + 'ves');
        } else if (lower.endsWith('fe')) {
            variations.add(lower.slice(0, -2) + 'ves');
        }

        // 4. Doubling consonants (stop -> stopped)
        if (lower.length >= 3 && /[^aeiou][aeiou][^aeiou]$/i.test(lower)) {
            const lastChar = lower[lower.length - 1];
            if (!'wx'.includes(lastChar)) {
                variations.add(lower + lastChar + 'ing');
                variations.add(lower + lastChar + 'ed');
                variations.add(lower + lastChar + 'er');
            }
        }

        // 5. Common irregular transformations (subset)
        // This is not exhaustive but helps for the most common words
        const irregulars: Record<string, string[]> = {
            'go': ['went', 'gone'],
            'see': ['saw', 'seen'],
            'do': ['did', 'done'],
            'take': ['took', 'taken'],
            'come': ['came'],
            'get': ['got', 'gotten'],
            'write': ['wrote', 'written'],
            'speak': ['spoke', 'spoken'],
            'know': ['knew', 'known'],
            'think': ['thought'],
            'buy': ['bought'],
            'make': ['made'],
            'find': ['found'],
            'teach': ['taught'],
            'bring': ['brought']
        };
        if (irregulars[lower]) {
            irregulars[lower].forEach(v => variations.add(v));
        }

        // 6. Support for common compounds (prefix + word or word + suffix)
        const currentVariations = Array.from(variations);
        for (const v of currentVariations) {
            variations.add('re' + v);
            variations.add('un' + v);
            variations.add('in' + v);
            variations.add('im' + v);
            variations.add('dis' + v);
            variations.add('mis' + v);
            variations.add('pre' + v);
            variations.add('over' + v);
            variations.add('under' + v);
            variations.add('white' + v);
            variations.add('sand' + v);
            variations.add('sea' + v);
        }
    }

    // Clean up: filter out too short strings if the original wasn't
    const result = Array.from(variations)
        .filter(v => v.length > 1) // ignore single chars
        .sort((a, b) => b.length - a.length); // match longest first
        
    return result;
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
                
                // Handle direct array examples
                if (Array.isArray(entry.examples)) {
                    entry.examples = entry.examples.map((ex: string) => {
                        if (typeof ex !== 'string') return ex;
                        const updated = boldWord(ex, word);
                        if (updated !== ex) changedSentenceCount++;
                        return updated;
                    });
                }

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
