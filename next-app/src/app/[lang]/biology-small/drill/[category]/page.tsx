
import React from 'react';
import DrillClient from './DrillClient';

interface PageProps {
  params: Promise<{
    lang: string;
    category: string;
  }>;
}

const CATEGORY_NAMES: Record<string, string> = {
  'cell': '细胞与代谢',
  'genetics': '遗传与变异',
  'regulation': '稳态与环境',
  'ecology': '生态系统',
  'experiment': '实验专题',
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

export default async function BiologySmallDrillPage({ params }: PageProps) {
  const { lang, category } = await params;
  
  return <DrillClient lang={lang} category={category} />;
}
