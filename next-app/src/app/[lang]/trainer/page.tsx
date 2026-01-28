import { InteractiveTrainer } from "@/components/InteractiveTrainer";

export async function generateStaticParams() {
  return [{ lang: 'cn' }, { lang: 'en' }];
}

export default async function TrainerPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const isCn = lang === 'cn';

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
          {isCn ? '英语语法逻辑特训' : 'English Syntax Logic Trainer'}
        </h1>
        <div className="inline-flex items-center bg-white px-4 py-1 rounded-full shadow-sm border border-slate-200">
          <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
          <span className="text-slate-600 font-medium text-sm">
            {isCn ? '目标: 135+' : 'Target: 135+'}
          </span>
        </div>
      </div>

      {/* Core Training Module */}
      <section>
        <InteractiveTrainer lang={lang} />
      </section>
      
      <div className="mt-16 text-center">
         <p className="text-slate-400 text-sm mb-4">Powered by Gemini 3.0 Pro & Next.js 14</p>
      </div>
    </div>
  );
}
