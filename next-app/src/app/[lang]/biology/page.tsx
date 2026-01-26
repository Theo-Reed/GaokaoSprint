import BiologyExplorer from '@/components/BiologyExplorer';

export default async function BiologyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  
  return (
    <main className="h-screen w-screen">
      <BiologyExplorer />
    </main>
  );
}
