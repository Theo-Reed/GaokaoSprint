
const fs = require('fs');
const path = require('path');

// MOCK DrillMarkdownHelpers sanitizeMath
const sanitizeMath = (text) => {
  if (!text || typeof text !== 'string') return "";
  
  let clean = text.replace(/\r/g, '');
  // Simplified logic from the real file
  clean = clean.replace(/\$\$\$/g, '$');
  return clean;
};

// SIMULATE Client Logic
const processContent = (content, label) => {
    try {
        const sanitized = sanitizeMath(content);
        // Simulate chain in DrillClient
        const processed = sanitized
                                .replace(/^\s*\d+[\.、\s]*/, '') 
                                .replace(/\\n/g, '\n');
        return true;
    } catch (e) {
        console.error(`CRASH in ${label}:`, e);
        return false;
    }
};

const checkFile = (filePath, label) => {
    console.log(`Checking ${label}...`);
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);
        
        if (!Array.isArray(data)) {
            console.error(`${label} is NOT an array!`);
            return;
        }

        let errors = 0;
        data.forEach((q, idx) => {
            if (!processContent(q.content, `${label} item ${idx}`)) {
                errors++;
            }
            if (q.options && Array.isArray(q.options)) {
                q.options.forEach(opt => {
                    if (!processContent(opt.text, `${label} item ${idx} option ${opt.label}`)) {
                        errors++;
                    }
                });
            }
            if (q.explanation) {
                if (!processContent(q.explanation, `${label} item ${idx} explanation`)) {
                    errors++;
                }
            }
        });

        console.log(`${label}: Checked ${data.length} items. Errors: ${errors}`);

    } catch (e) {
        console.error(`Failed to read/parse ${label}:`, e);
    }
};

const root = './next-app/src/data';
checkFile(path.join(root, 'math/questions.json'), 'Math Large');
checkFile(path.join(root, 'math/small_questions.json'), 'Math Small');
checkFile(path.join(root, 'biology/small_questions.json'), 'Biology Small');
checkFile(path.join(root, 'physics/small_questions.json'), 'Physics Small');
checkFile(path.join(root, 'chemistry/small_questions.json'), 'Chemistry Small');
