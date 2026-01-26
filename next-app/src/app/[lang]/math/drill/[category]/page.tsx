
import React from 'react';
import DrillClient from './DrillClient';

interface PageProps {
  params: Promise<{
    lang: string;
    category: string;
  }>;
}

const CATEGORY_NAMES = {
  'conic': '圆锥曲线',
  'derivative': '导数',
  'solid_geometry': '立体几何',
  'trigonometry': '三角函数',
  'sequence': '数列',
  'probability': '概率统计'
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

export default async function MathDrillPage({ params }: PageProps) {
  const { lang, category } = await params;
  
  return <DrillClient lang={lang} category={category} />;
}

