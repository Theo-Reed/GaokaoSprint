
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  icon: string;
}

const CATEGORIES: Category[] = [
  // 必修 1
  { id: 'molecular_basis', name: '元素、化合物与无机物', icon: '🧪' },
  { id: 'cell_structure', name: '细胞器与生物膜系统', icon: '🦠' },
  { id: 'transport', name: '物质跨膜运输', icon: '🚚' },
  { id: 'enzymes_atp', name: '酶与 ATP 的机制', icon: '⚡' },
  { id: 'photo_resp', name: '光合与呼吸', icon: '🍃' },
  { id: 'cell_lifecycle', name: '细胞生命历程', icon: '⏳' },

  // 必修 2
  { id: 'genetics_laws', name: '孟德尔遗传定律', icon: '🧬' },
  { id: 'meiosis', name: '减数分裂与受精', icon: '🏹' },
  { id: 'molecular_genetics', name: '分子遗传机制', icon: '🔗' },
  { id: 'variation_evolution', name: '变异、育种与进化', icon: '🐵' },

  // 选必 1
  { id: 'internal_environment', name: '内环境稳态', icon: '⚖️' },
  { id: 'nervous_system', name: '神经调节', icon: '🧠' },
  { id: 'hormonal_reg', name: '激素/体液调节', icon: '💉' },
  { id: 'immune_system', name: '免疫调节', icon: '🛡️' },
  { id: 'plant_hormones', name: '植物激素调节', icon: '🌱' },

  // 选必 2 & 3
  { id: 'ecology_system', name: '生态系统及其稳态', icon: '🌍' },
  { id: 'bio_engineering', name: '基因与细胞工程', icon: '🏗️' },
  { id: 'fermentation', name: '发酵工程与微生物', icon: '🍺' },
];

export async function generateStaticParams() {
  return [{ lang: 'cn' }, { lang: 'en' }];
}

export default async function BiologySmallDashboard({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
          生物小题特训 <span className="text-indigo-600 dark:text-slate-300">Biology</span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          专注生物基础小题专项突破。强化知识点记忆，练习解题技巧与速度。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES.map((category) => (
          <Link 
            key={category.id} 
            href={`/${lang}/biology-small/drill/${category.id}`} 
            className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-700 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity dark:invert">
              <span className="text-6xl">{category.icon}</span>
            </div>
            <div className="flex flex-col h-full">
               <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
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
