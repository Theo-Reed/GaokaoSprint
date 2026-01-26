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
  
  // Ensure we are working with decoded strings
  const decodedSlug = slug.map(s => {
      try {
          return decodeURIComponent(s);
      } catch {
          return s;
      }
  });

  const data = await getMarkdownContent(lang, decodedSlug);

  if (!data) {
    return notFound();
  }

  return (
    <article className="prose prose-slate lg:prose-lg max-w-none">
      <div className="overflow-x-auto">
        <div dangerouslySetInnerHTML={{ __html: data.contentHtml }} />
      </div>
    </article>
  );
}

export async function generateStaticParams() {
  const params: { lang: string; slug: string[] }[] = [];
  
  for (const lang of ['cn', 'en']) {
    const slugs = getAllSlugs(lang);
    for (const slug of slugs) {
      if (slug.length > 0) {
        // Just push the direct slug array. 
        // Next.js handles the path mapping automatically.
        // We ensure it's normalized in the slug collection logic.
        params.push({ lang, slug });
      }
    }
  }

  return params;
}

