import { getMarkdownContent } from '@/lib/markdown';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return [{ lang: 'cn' }, { lang: 'en' }];
}

export default async function LanguageHome({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  // Load README.md as the home content for the language
  const data = await getMarkdownContent(lang, ['README']);

  if (!data) {
    return notFound();
  }

  return (
    <article className="prose prose-slate lg:prose-lg mx-auto">
      <h1>{data.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: data.contentHtml }} />
    </article>
  );
}
