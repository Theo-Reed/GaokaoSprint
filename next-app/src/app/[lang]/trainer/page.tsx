import { InteractiveTrainer } from "@/components/InteractiveTrainer";

export async function generateStaticParams() {
  return [{ lang: 'cn' }, { lang: 'en' }];
}

export default async function TrainerPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const isCn = lang === 'cn';

  return (
    <div className="space-y-8">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-5 mb-2 tracking-tight">
          {isCn ? '英语语法逻辑特训' : 'English Syntax Logic Trainer'}
        </h1>
      </div>

      {/* Core Training Module */}
      <section>
        <InteractiveTrainer lang={lang} />
      </section>
    </div>
  );
}
