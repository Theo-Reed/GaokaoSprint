import { getMarkdownContent, getAllSlugs } from '@/lib/markdown';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{
    lang: string;
    slug: string[];
  }>;
}

export default async function MarkdownPage({ params }: PageProps) {
  const { lang, slug } = await params;
  const data = await getMarkdownContent(lang, slug);

  if (!data) {
    return notFound();
  }

  return (
    <article className="prose prose-slate lg:prose-lg mx-auto">
      <div dangerouslySetInnerHTML={{ __html: data.contentHtml }} />
    </article>
  );
}

export async function generateStaticParams() {
  const params: { lang: string; slug: string[] }[] = [];
  
  ['cn', 'en'].forEach(lang => {
    const slugs = getAllSlugs(lang);
    slugs.forEach(slug => {
       params.push({ lang, slug });
    });
  });

  return params;
}

