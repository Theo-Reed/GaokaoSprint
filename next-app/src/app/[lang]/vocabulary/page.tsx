import VocabularyClient from './VocabularyClient';

export async function generateStaticParams() {
  return [{ lang: 'cn' }, { lang: 'en' }];
}

export default async function VocabularyPage() {
  return <VocabularyClient />;
}
