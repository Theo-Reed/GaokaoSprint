
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  icon: string;
}

const CATEGORIES: Category[] = [
  { id: 'cell', name: '细胞与代谢', icon: '🧬' },
  { id: 'genetics', name: '遗传与变异', icon: '🧬' },
  { id: 'regulation', name: '稳态与环境', icon: '🌿' },
  { id: 'ecology', name: '生态系统', icon: '🌎' },
  { id: 'experiment', name: '实验专题', icon: '🧪' },
];

export async function generateStaticParams() {
  return [{ lang: 'cn' }, { lang: 'en' }];
}

export default async function BiologySmallDashboard({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          生物小题特训 <span className="text-indigo-600">Biology</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          专注生物基础小题专项突破。强化知识点记忆，练习解题技巧与速度。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES.map((category) => (
          <Link 
            key={category.id} 
            href={`/${lang}/biology-small/drill/${category.id}`} 
            className="group relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="text-6xl">{category.icon}</span>
            </div>
            <div className="flex flex-col h-full">
               <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                 {category.icon}
               </div>
               <h3 className="text-xl font-bold text-slate-900 mb-2">{category.name}</h3>
               <p className="text-slate-500 text-sm">
                 点击进入快速训练模式 &rarr;
               </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
