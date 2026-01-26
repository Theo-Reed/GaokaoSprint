
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  icon: string;
}

const CATEGORIES: Category[] = [
  { id: 'conic', name: '圆锥曲线', icon: '📐' },
  { id: 'derivative', name: '导数', icon: '📈' },
  { id: 'solid_geometry', name: '立体几何', icon: '🧊' },
  { id: 'trigonometry', name: '三角函数', icon: '⛰️' },
  { id: 'sequence', name: '数列', icon: '🔢' },
  { id: 'probability', name: '概率统计', icon: '🎲' },
];

export async function generateStaticParams() {
  return [{ lang: 'cn' }, { lang: 'en' }];
}

export default async function MathDashboard({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          数学大题特训 <span className="text-indigo-600">Mastery</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          选择一个专项进行高强度刻意练习。AI 辅助解析思路，倒计时强化考场手感。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES.map((category) => (
          <Link 
            key={category.id} 
            href={`/${lang}/math/drill/${category.id}`}
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
                 点击进入随机刷题模式 &rarr;
               </p>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="mt-16 bg-slate-50 rounded-2xl p-8 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">🏆 训练目标</h3>
        <ul className="space-y-3 text-slate-600 text-sm">
            <li className="flex items-start">
                <span className="bg-green-100 text-green-700 p-1 rounded mr-3 mt-0.5">基础</span>
                <span>圆锥曲线第一问：3分钟内完成，准确率100%。</span>
            </li>
            <li className="flex items-start">
                <span className="bg-yellow-100 text-yellow-700 p-1 rounded mr-3 mt-0.5">进阶</span>
                <span>导数分类讨论：快速找到界点，分类逻辑不重不漏。</span>
            </li>
            <li className="flex items-start">
                <span className="bg-red-100 text-red-700 p-1 rounded mr-3 mt-0.5">高压</span>
                <span>限时模式：三角函数/数列大题必须在10分钟内满分解决。</span>
            </li>
        </ul>
      </div>
    </div>
  );
}
