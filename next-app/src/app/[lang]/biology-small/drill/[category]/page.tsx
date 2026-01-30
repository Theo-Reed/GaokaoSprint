
import React from 'react';
import DrillClient from './DrillClient';
import biologyQuestions from '@/data/biology/small_questions.json';

interface PageProps {
  params: Promise<{
    lang: string;
    category: string;
  }>;
}

const CATEGORY_NAMES: Record<string, string> = {
  'molecular_basis': '元素、化合物与无机物',
  'cell_structure': '细胞器与生物膜系统',
  'transport': '物质跨膜运输',
  'enzymes_atp': '酶与 ATP 的机制',
  'photo_resp': '光合与呼吸',
  'cell_lifecycle': '细胞生命历程',
  'genetics_laws': '孟德尔遗传定律',
  'meiosis': '减数分裂与受精',
  'molecular_genetics': '分子遗传机制',
  'variation_evolution': '变异、育种与进化',
  'internal_environment': '内环境稳态',
  'nervous_system': '神经调节',
  'hormonal_reg': '激素/体液调节',
  'immune_system': '免疫调节',
  'plant_hormones': '植物激素调节',
  'ecology_system': '生态系统及其稳态',
  'bio_engineering': '基因与细胞工程',
  'fermentation': '发酵工程与微生物',
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
  
  // Filter questions on the server side to reduce bundle size
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categoryQuestions = (biologyQuestions as any[] || []).filter((q: any) => q.category === category);

  return <DrillClient lang={lang} category={category} initialQuestions={categoryQuestions} />;
}
