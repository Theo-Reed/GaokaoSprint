
import React from 'react';
import DrillClient, { SmallQuestion } from './DrillClient';
import questionsData from '@/data/chemistry/small_questions.json';

interface PageProps {
  params: Promise<{
    lang: string;
    category: string;
  }>;
}

const CATEGORY_NAMES: Record<string, string> = {
  'concepts': '基本概念',
  'inorganic': '元素化合物',
  'organic': '有机化学',
  'physical_chem': '反应原理',
  'experiment': '化学实验',
};

export async function generateStaticParams() {
  const languages = ['cn', 'en'];
  const categories = Object.keys(CATEGORY_NAMES);

  const params: { lang: string; category: string }[] = [];
  for (const lang of languages) {
    for (const category of categories) {
      params.push({ lang, category });
    }
  }
  return params;
}

export default async function ChemistrySmallDrillPage({ params }: PageProps) {
  const { lang, category } = await params;
  
  // Filter questions on the server
  const allQuestions = questionsData as unknown as SmallQuestion[];
  const initialQuestions = allQuestions.filter(q => q.category === category);

  return <DrillClient lang={lang} category={category} initialQuestions={initialQuestions} />;
}
