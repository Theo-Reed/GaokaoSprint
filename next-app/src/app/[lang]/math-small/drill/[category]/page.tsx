
import React from 'react';
import DrillClient from './DrillClient';

interface PageProps {
  params: Promise<{
    lang: string;
    category: string;
  }>;
}

const CATEGORY_NAMES: Record<string, string> = {
  'logic': '集合与逻辑',
  'complex': '复数专题',
  'function': '函数专题',
  'derivative': '导数专题',
  'trigo_func': '三角函数',
  'trigo_sol': '解三角形',
  'sequence': '数列专题',
  'vector': '向量专题',
  'inequality': '不等式专题',
  'line_circle': '直线与圆',
  'conic': '圆锥曲线',
  'solid_geometry': '立体几何',
  'probability': '概率统计',
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

export default async function MathSmallDrillPage({ params }: PageProps) {
  const { lang, category } = await params;
  
  return <DrillClient lang={lang} category={category} />;
}
