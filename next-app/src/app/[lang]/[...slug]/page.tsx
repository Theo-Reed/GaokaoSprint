import { getMarkdownContent } from '@/lib/markdown';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    lang: string;
    slug: string[];
  };
}

export default async function MarkdownPage({ params }: PageProps) {
  const { lang, slug } = params;
  const data = await getMarkdownContent(lang, slug);

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
