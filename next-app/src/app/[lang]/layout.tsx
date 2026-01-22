import Sidebar from '@/components/Sidebar';

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <div className="min-h-screen bg-white">
      <Sidebar lang={lang} />
      <main className="md:ml-64 min-h-screen">
        <div className="max-w-4xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export async function generateStaticParams() {
  return [{ lang: 'cn' }, { lang: 'en' }];
}

