import BiologyExplorer from '@/components/BiologyExplorer';

export async function generateStaticParams() {
  return [{ lang: 'cn' }, { lang: 'en' }];
}

export default async function BiologyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  
  return (
    <main className="h-screen w-screen">
      <BiologyExplorer />
    </main>
  );
}
