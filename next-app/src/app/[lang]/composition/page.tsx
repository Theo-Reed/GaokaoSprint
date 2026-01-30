
import { CompositionTrainer } from '@/components/CompositionTrainer';

export async function generateStaticParams() {
  return [{ lang: 'cn' }, { lang: 'en' }];
}

export default async function CompositionPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <CompositionTrainer lang={lang} />
    </div>
  );
}
