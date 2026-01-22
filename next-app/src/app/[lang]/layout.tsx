import Sidebar from '@/components/Sidebar';

export default function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  return (
    <div className="min-h-screen bg-white">
      <Sidebar lang={params.lang} />
      <main className="md:ml-64 min-h-screen">
        <div className="max-w-4xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
