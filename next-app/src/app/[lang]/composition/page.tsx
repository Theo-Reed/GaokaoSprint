
import { CompositionTrainer } from '@/components/CompositionTrainer';

export async function generateStaticParams() {
  return [{ lang: 'cn' }, { lang: 'en' }];
}

export default async function CompositionPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return (
    <div className="min-h-screen bg-slate-50/50">
      <CompositionTrainer lang={lang} />
    </div>
  );
}
