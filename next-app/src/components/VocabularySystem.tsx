"use client";

import React, { useState, useMemo } from 'react';

// Type Definitions matching our JSON structure
type ExampleSentence = {
  sentence: string;
  year: string | number;
  paper: string;
};

type VocabEntry = {
  word: string;
  meanings: string[];
  pos: string;
  tags: string[];
  source: string;
  is_polysemy: boolean;
  frequency: number;
  last_seen_year: number;
  years_count: number;
  example_sentences: ExampleSentence[];
  tier: number;
};

interface VocabularySystemProps {
  data: VocabEntry[];
}

const TierBadge = ({ tier }: { tier: number }) => {
  if (tier === 1) return <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100">Tier 1: Core</span>;
  if (tier === 2) return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-100">Tier 2: Polysemy</span>;
  if (tier === 3) return <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-100">Tier 3: Defense</span>;
  return null;
};

const FrequencyGraph = ({ freq, years }: { freq: number; years: number }) => {
    // Simple visual indicator of frequency
    const maxFreq = 200; // Cap for visual bar
    const widthPercentage = Math.min((freq / maxFreq) * 100, 100);
    
    return (
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-400 mt-1">
            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-slate-500 dark:bg-indigo-400 rounded-full" style={{ width: `${widthPercentage}%` }}></div>
            </div>
            <span>{freq} hits / {years} yrs</span>
        </div>
    );
};

const WordCard = ({ entry }: { entry: VocabEntry }) => {
    const [expanded, setExpanded] = useState(false);

    // Filter out super long sentences to keep card tidy? Or just truncate.
    const displayExamples = entry.example_sentences.slice(0, 3);
    
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white font-serif tracking-wide">{entry.word}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-mono text-slate-500 dark:text-slate-400 italic">{entry.pos}</span>
                        <TierBadge tier={entry.tier} />
                        {entry.is_polysemy && (
                            <span className="text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-800">⚠ Trap Word</span>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-400 block">LAST SEEN</span>
                    <span className="text-lg font-bold text-indigo-600 dark:text-slate-300">{entry.last_seen_year || 'N/A'}</span>
                </div>
            </div>

            <FrequencyGraph freq={entry.frequency} years={entry.years_count} />

            <div className="mt-4 prose prose-sm dark:prose-invert">
                {entry.meanings.length > 0 ? (
                    <ul className="list-disc list-inside text-slate-700 dark:text-slate-200">
                        {entry.meanings.map((m, i) => (
                            <li key={i}>{m}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-400 dark:text-slate-400 italic text-sm">No definition (Real Exam Word)</p>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => setExpanded(!expanded)}
                  className="w-full text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-between"
                >
                    <span>{expanded ? 'Hide Analysis' : `Show Exam Context (${entry.example_sentences.length})`}</span>
                    <span>{expanded ? '▲' : '▼'}</span>
                </button>
                
                {expanded && (
                    <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        {displayExamples.length > 0 ? (
                            displayExamples.map((ex, idx) => (
                                <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-sm border border-slate-100 dark:border-slate-700">
                                    <p className="text-slate-700 dark:text-slate-300 mb-1">"{ex.sentence}"</p>
                                    <div className="flex justify-between text-xs text-slate-400 dark:text-slate-400 mt-2">
                                        <span>{ex.paper}</span>
                                        <span>{ex.year}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-slate-400 dark:text-slate-400">No examples captured in database.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export const VocabularySystem = ({ data }: VocabularySystemProps) => {
    const [activeTier, setActiveTier] = useState<number>(1);
    const [search, setSearch] = useState("");
    const [visibleCount, setVisibleCount] = useState(20);

    // Derived Data
    const tierCounts = useMemo(() => {
        return {
            1: data.filter(d => d.tier === 1).length,
            2: data.filter(d => d.tier === 2).length,
            3: data.filter(d => d.tier === 3).length,
        };
    }, [data]);

    const filteredData = useMemo(() => {
        return data.filter(item => {
            const matchesTier = item.tier === activeTier;
            const matchesSearch = search 
                ? item.word.toLowerCase().includes(search.toLowerCase()) 
                : true;
            return matchesTier && matchesSearch;
        });
    }, [data, activeTier, search]);

    // Reset pagination on filter change
    React.useEffect(() => {
        setVisibleCount(20);
    }, [activeTier, search]);

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 20);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Gaokao Vocabulary Engine</h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Master the {data.length.toLocaleString()} words found in 18 years of real exams.
                </p>
            </header>

            {/* Controls Area */}
            <div className="sticky top-4 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
                
                {/* Search */}
                <div className="mb-4">
                    <input 
                        type="text"
                        placeholder="Search for a word..."
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Tiers Tabs */}
                <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((tier) => (
                        <button
                            key={tier}
                            onClick={() => setActiveTier(tier)}
                            className={`
                                flex flex-col items-center justify-center py-3 rounded-xl transition-all border-2
                                ${activeTier === tier 
                                    ? tier === 1 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-100' 
                                    : tier === 2 ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-100'
                                    : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-100'
                                    : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }
                            `}
                        >
                            <span className="text-sm font-bold uppercase tracking-wider">
                                {tier === 1 ? 'Core Syllabus' : tier === 2 ? 'Polysemy / Trap' : 'Defense Zone'}
                            </span>
                            <span className="text-xs opacity-70 font-mono mt-1">
                                {tierCounts[tier as keyof typeof tierCounts]} words
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredData.slice(0, visibleCount).map((entry) => (
                    <WordCard key={entry.word} entry={entry} />
                ))}
            </div>

            {/* Load More / Status */}
            <div className="mt-12 text-center">
                {filteredData.length > visibleCount ? (
                    <button 
                        onClick={handleLoadMore}
                        className="px-8 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-semibold rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
                    >
                        Load More Words ({filteredData.length - visibleCount} remaining)
                    </button>
                ) : (
                    <p className="text-slate-400 dark:text-slate-600 italic">End of list.</p>
                )}
            </div>
        </div>
    );
};
