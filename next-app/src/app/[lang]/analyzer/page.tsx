import React from 'react';
import { TextReader } from '@/components/TextReader';

export async function generateStaticParams() {
  return [{ lang: 'cn' }, { lang: 'en' }];
}

export default function AnalyzerPage() {
  const sampleText = `
    In the modern world, time is a precious resource. 
    Many people book their schedules weeks in advance to ensure they have a place for everything. 
    However, looking back on the data, scientific research suggests that this approach might lead to increased stress.
    
    The university administration decided to place greater emphasis on mental health.
    Students often face difficult questions about their future.
    Results show that those who travel frequently have broader horizons.
    
    It is clear that human experience is shaped by how we spend our time.
    We must question the value of constant productivity.
  `;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-slate-800 px-4">Vocabulary Analyzer (Beta)</h1>
      <div className="h-[600px]">
        <TextReader 
            content={sampleText} 
            title="Sample Reading Analysis"
        />
      </div>
    </div>
  );
}
