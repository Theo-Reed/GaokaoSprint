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

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  const { lang } = params;
  const slugs = getAllSlugs(lang);
  
  if (slugs.length === 0) {
    console.warn(`No slugs found for language: ${lang}`);
  }

  return slugs.map(slug => ({
    slug: slug
  }));
}

