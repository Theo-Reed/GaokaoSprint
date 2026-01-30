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
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Sidebar lang={lang} />
      <main className="md:ml-64 min-h-screen">
        <div className="max-w-6xl mx-auto p-3 md:p-8 pt-0 pb-0 md:pt-8 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}

// generateStaticParams removed from here

