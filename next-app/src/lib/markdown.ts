import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import remarkGfm from 'remark-gfm';

const contentDirectory = fs.existsSync(path.join(process.cwd(), 'content'))
  ? path.join(process.cwd(), 'content')
  : path.join(process.cwd(), 'next-app', 'content');

// Helper to check and log content directory
if (!fs.existsSync(contentDirectory)) {
    console.warn(`Warning: Content directory not found at ${contentDirectory}. CWD is ${process.cwd()}`);
}

export interface MarkdownData {
  title: string;
  contentHtml: string;
  [key: string]: any;
}

export async function getMarkdownContent(lang: string, slugPath: string[]): Promise<MarkdownData | null> {
  // Construct path: content/[lang]/[k1]/[k2].md
  // slugPath is array, e.g. ['diet_plan'] or ['Math', 'strategy']
  
  const relativePath = slugPath.join('/');
  let fullPath = path.join(contentDirectory, lang, `${relativePath}.md`);

  // Check if file exists, if not, try index.md if it's a folder? 
  // But for now assume direct mapping. 
  // If slug is ['Math'], we might want ['Math', 'README.md']?
  // Let's stick to exact match first.
  
  if (!fs.existsSync(fullPath)) {
    // Try looking for README.md if it's a directory-like request
    const dirPath = path.join(contentDirectory, lang, relativePath, 'README.md');
    if (fs.existsSync(dirPath)) {
      fullPath = dirPath;
    } else {
      return null;
    }
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const matterResult = matter(fileContents);

  const processedContent = await remark()
    .use(remarkGfm)
    .use(html)
    .process(matterResult.content);
  
  const contentHtml = processedContent.toString();

  return {
    title: matterResult.data.title || slugPath[slugPath.length - 1],
    contentHtml,
    ...matterResult.data,
  };
}

function getFilesRecursively(dir: string, fileList: string[] = [], baseDir: string = ''): string[] {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            getFilesRecursively(filePath, fileList, path.join(baseDir, file));
        } else {
            if (file.endsWith('.md')) { // Only md files
                fileList.push(path.join(baseDir, file));
            }
        }
    });
    return fileList;
}

export function getAllSlugs(lang: string): string[][] {
    const langDir = path.join(contentDirectory, lang);
    if (!fs.existsSync(langDir)) return [];

    const files = getFilesRecursively(langDir);
    
    return files.map(file => {
        const parts = file.replace(/\.md$/, '').split(path.sep);
        // Normalize to NFC and decode any URI encoded segments from the filesystem
        const normalizedParts = parts.map(p => {
            try {
                return decodeURIComponent(p).normalize('NFC');
            } catch (e) {
                return p.normalize('NFC');
            }
        });
        
        if (normalizedParts[normalizedParts.length - 1] === 'README') {
            return normalizedParts.slice(0, -1);
        }
        return normalizedParts;
    }).filter(slug => slug.length > 0);
}

export function getNavigation(lang: string) {
    // Hardcoded navigation structure based on known folders
    // In a real app we might scan folders
    const nav = [
        {
            title: lang === 'cn' ? '工具' : 'Tools',
            items: [
                { title: lang === 'cn' ? '英语语法特训' : 'English Syntax Trainer', href: `/${lang}/trainer` },
                { title: lang === 'cn' ? '英语单词特训' : 'Vocabulary Trainer', href: `/${lang}/vocabulary` },
                { title: lang === 'cn' ? '数学大题特训' : 'Math Problem Trainer', href: `/${lang}/math` },
                { title: lang === 'cn' ? '生物背书引擎' : 'Biology Memorization Engine', href: `/${lang}/biology` }
            ]
        },
        {
            title: lang === 'cn' ? '生活与健康' : 'Life & Health',
            items: [
                { title: lang === 'cn' ? '饮食计划' : 'Diet Plan', href: `/${lang}/diet_plan` },
                { title: lang === 'cn' ? '环境布置' : 'Environment', href: `/${lang}/environment` },
                { title: lang === 'cn' ? '疲劳干预' : 'Fatigue', href: `/${lang}/fatigue_intervention` },
                { title: lang === 'cn' ? '作息时间' : 'Schedule', href: `/${lang}/study_schedule` },
            ]
        },
        {
            title: lang === 'cn' ? '学科策略' : 'Strategies',
            items: [
                { title: lang === 'cn' ? '数学' : 'Math', href: `/${lang}/Math/strategy` }, // Note: Folder names in content/en are English, content/cn are Chinese?
                // Wait, let's check folder names in content/cn
                // Previous list_dir showed: cn/数学/strategy.md
                // So URLs might need to match file system or we map them.
                // It's easier if URLs match file system.
            ]
        }
    ];

    // Special handling for language differences in folder structure
    if (lang === 'cn') {
        nav[2].items = [
             { title: '数学', href: '/cn/数学/strategy' },
             { title: '物理', href: '/cn/物理/strategy' },
             { title: '化学', href: '/cn/化学/strategy' },
             { title: '生物', href: '/cn/生物/strategy' },
             { title: '英语', href: '/cn/英语/strategy' },
             { title: '语文', href: '/cn/语文/strategy' },
        ];
    } else {
         nav[2].items = [
             { title: 'Math', href: '/en/Math/strategy' },
             { title: 'Physics', href: '/en/Physics/strategy' },
             { title: 'Chemistry', href: '/en/Chemistry/strategy' },
             { title: 'Biology', href: '/en/Biology/strategy' },
             { title: 'English', href: '/en/English/strategy' },
             { title: 'Chinese', href: '/en/Chinese/strategy' },
        ];
    }

    return nav;
}
