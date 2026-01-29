
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  icon: string;
}

const CATEGORIES: Category[] = [
  { id: 'mechanics', name: '力学专题', icon: '⚙️' },
  { id: 'electromagnetism', name: '电磁学', icon: '⚡' },
  { id: 'thermodynamics', name: '热学与光', icon: '🔥' },
  { id: 'atomic', name: '原子物理', icon: '⚛️' },
  { id: 'experiment', name: '物理实验', icon: '🛠️' },
];

export async function generateStaticParams() {
  return [{ lang: 'cn' }, { lang: 'en' }];
}

export default async function PhysicsSmallDashboard({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          物理小题特训 <span className="text-indigo-600">Physics</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          专注物理选择题专项突破。强化受力分析与基本定律，练习解题速度。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES.map((category) => (
          <Link 
            key={category.id} 
            href={`/${lang}/physics-small/drill/${category.id}`} 
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
