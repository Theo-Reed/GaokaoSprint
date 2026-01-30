
import React from 'react';
import DrillClient, { SmallQuestion } from './DrillClient';
import questionsData from '@/data/physics/small_questions.json';

interface PageProps {
  params: Promise<{
    lang: string;
    category: string;
  }>;
}

const CATEGORY_NAMES: Record<string, string> = {
  'mechanics': '力学专题',
  'electromagnetism': '电磁学',
  'thermodynamics': '热学与光',
  'atomic': '原子物理',
  'experiment': '物理实验',
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

export default async function PhysicsSmallDrillPage({ params }: PageProps) {
  const { lang, category } = await params;
  
  // Filter questions on the server
  const allQuestions = questionsData as unknown as SmallQuestion[];
  const initialQuestions = allQuestions.filter(q => q.category === category);
  
  return <DrillClient lang={lang} category={category} initialQuestions={initialQuestions} />;
}
