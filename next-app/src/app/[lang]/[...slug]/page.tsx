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
        // Push decoded version (standard)
        params.push({ lang, slug });
        
        // Push encoded version (to satisfy strict matching if browser sends encoded path)
        const encodedSlug = slug.map(s => encodeURIComponent(s));
        if (JSON.stringify(slug) !== JSON.stringify(encodedSlug)) {
             params.push({ lang, slug: encodedSlug });
        }
      }
    }
  }

  return params;
}

