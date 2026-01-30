
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  icon: string;
}

const CATEGORIES: Category[] = [
  { id: 'logic', name: '集合与逻辑', icon: '🎯' },
  { id: 'complex', name: '复数专题', icon: '🔢' },
  { id: 'function', name: '函数专题', icon: '📈' },
  { id: 'derivative', name: '导数专题', icon: '📉' },
  { id: 'trigo_func', name: '三角函数', icon: '🌊' },
  { id: 'trigo_sol', name: '解三角形', icon: '⛰️' },
  { id: 'sequence', name: '数列专题', icon: '📝' },
  { id: 'vector', name: '向量专题', icon: '➡️' },
  { id: 'inequality', name: '不等式专题', icon: '⚖️' },
  { id: 'line_circle', name: '直线与圆', icon: '⚪' },
  { id: 'conic', name: '圆锥曲线', icon: '📐' },
  { id: 'solid_geometry', name: '立体几何', icon: '🧊' },
  { id: 'probability', name: '概率统计', icon: '🎲' },
];

export async function generateStaticParams() {
  return [{ lang: 'cn' }, { lang: 'en' }];
}

export default async function MathSmallDashboard({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
          数学小题特训 <span className="text-violet-600 dark:text-slate-300">Speed</span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          专注选择题、填空题专项突破。强化基础概念，练习解题技巧与速度。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES.map((category) => (
          <Link 
            key={category.id} 
            href={`/${lang}/math-small/drill/${category.id}`} 
            className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-violet-200 dark:hover:border-violet-500 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity dark:invert">
              <span className="text-6xl">{category.icon}</span>
            </div>
            <div className="flex flex-col h-full">
               <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                 {category.icon}
               </div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{category.name}</h3>
               <p className="text-slate-500 dark:text-slate-400 text-sm">
                 点击进入快速训练模式 &rarr;
               </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
