"use client";

import React, { useState, useEffect } from "react";
import { ANALYSIS_LEVELS } from "../data/training-data";

type ToolType = "subject" | "verb" | "object" | null;

export const SentenceAnalyzer = ({ lang = 'en' }: { lang?: string }) => {
  const isCn = lang === 'cn';
  
  const text = {
    title: isCn ? '结构透视' : 'Syntax Analysis',
    prev: isCn ? '上一句' : 'Prev',
    next: isCn ? '下一句' : 'Next',
    level: isCn ? '难度' : 'Level',
    selectTool: isCn ? '请先选择一个工具 (主语/谓语/宾语)' : 'Please select a tool first (Subject / Verb / Object)',
    initialMsg: isCn ? '第一步：分析句子主干结构' : 'Step 1: Analyze the sentence structure.',
    correct: isCn ? '✅ 正确！继续寻找。' : '✅ Correct! Keep going.',
    errorPrefix: isCn ? '❌ 逻辑错误：' : '❌ Logic Error:',
    errorSuffix: isCn ? '不是该成分。' : 'is NOT part of this component.',
    viewLogic: isCn ? '💡 查看分析逻辑' : '💡 View Logic Algorithm',
    tools: {
      s: isCn ? '主语 (S)' : 'Subject',
      v: isCn ? '谓语 (V)' : 'Verb',
      o: isCn ? '宾语 (O)' : 'Object'
    }
  };

  const [currentAnalyzeIndex, setCurrentAnalyzeIndex] = useState(0);
  const [selectedTool, setSelectedTool] = useState<ToolType>(null);
  const [foundIndices, setFoundIndices] = useState<{
    subject: number[];
    verb: number[];
    object: number[];
  }>({ subject: [], verb: [], object: [] });
  const [analyzeMessage, setAnalyzeMessage] = useState(text.initialMsg);
  const [analyzeFeedbackColor, setAnalyzeFeedbackColor] = useState("text-gray-500");

  const currentSentence = ANALYSIS_LEVELS[currentAnalyzeIndex];
  const analyzeWords = currentSentence.text.split(" ");

  // Reset Analyze level state
  useEffect(() => {
    setFoundIndices({ subject: [], verb: [], object: [] });
    setAnalyzeMessage(text.initialMsg);
    setAnalyzeFeedbackColor("text-gray-500");
    setSelectedTool(null);
  }, [currentAnalyzeIndex, lang]); 

  const handleWordClick = (index: number) => {
    if (!selectedTool) {
      setAnalyzeMessage("⚠️ " + text.selectTool);
      setAnalyzeFeedbackColor("text-yellow-600");
      return;
    }

    const correctIndices = currentSentence.answerKey[selectedTool];

    if (correctIndices.includes(index)) {
      if (!foundIndices[selectedTool].includes(index)) {
        setFoundIndices(prev => ({
          ...prev,
          [selectedTool]: [...prev[selectedTool], index]
        }));
        setAnalyzeMessage(text.correct);
        setAnalyzeFeedbackColor("text-green-600");
      }
    } else {
      if (currentSentence.traps && currentSentence.traps[index]) {
        setAnalyzeMessage(currentSentence.traps[index]); 
        setAnalyzeFeedbackColor("text-red-600 font-bold");
      } else {
        setAnalyzeMessage(`${text.errorPrefix} ${text.errorSuffix}`);
        setAnalyzeFeedbackColor("text-red-600");
      }
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-slate-100 flex flex-col h-full">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span>🧬</span> {text.title}
          </h3>
          <p className="text-blue-100 text-xs mt-1">
            {text.level} {currentAnalyzeIndex + 1} / {ANALYSIS_LEVELS.length} • {currentSentence.difficulty}
          </p>
        </div>
        <div className="flex gap-2">
           <button 
                onClick={() => setCurrentAnalyzeIndex(Math.max(0, currentAnalyzeIndex - 1))}
                className="p-2 bg-blue-700 rounded hover:bg-blue-500 text-xs disabled:opacity-50"
                disabled={currentAnalyzeIndex === 0}
            >
                {text.prev}
            </button>
            <button 
                onClick={() => setCurrentAnalyzeIndex(Math.min(ANALYSIS_LEVELS.length - 1, currentAnalyzeIndex + 1))}
                className="p-2 bg-white text-blue-700 rounded hover:bg-blue-50 text-xs font-bold disabled:opacity-50"
                disabled={currentAnalyzeIndex === ANALYSIS_LEVELS.length - 1}
            >
                {text.next}
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 flex-1 flex flex-col items-center">
        {/* Tool Selector */}
        <div className="mb-6 flex gap-2 justify-center w-full">
          <ToolButton label={text.tools.s} color="red" active={selectedTool === 'subject'} onClick={() => setSelectedTool('subject')} />
          <ToolButton label={text.tools.v} color="yellow" active={selectedTool === 'verb'} onClick={() => setSelectedTool('verb')} />
          <ToolButton label={text.tools.o} color="blue" active={selectedTool === 'object'} onClick={() => setSelectedTool('object')} />
        </div>

        {/* Sentence Display */}
        <div className="flex flex-wrap gap-2 text-xl leading-relaxed justify-center select-none mb-6">
          {analyzeWords.map((word, index) => {
            let style = "border-b-4 border-transparent hover:bg-slate-50 cursor-pointer transition-all px-1 rounded";
            if (foundIndices.subject.includes(index)) style = "border-b-4 border-red-500 bg-red-50 text-red-900";
            if (foundIndices.verb.includes(index))    style = "border-b-4 border-yellow-500 bg-yellow-50 text-yellow-900 font-bold transform scale-105 shadow-sm";
            if (foundIndices.object.includes(index))  style = "border-b-4 border-blue-500 bg-blue-50 text-blue-900";

            return (
              <span key={index} className={style} onClick={() => handleWordClick(index)}>{word}</span>
            );
          })}
        </div>

        {/* Feedback Area */}
        <div className={`text-center text-sm font-medium min-h-[40px] flex items-center justify-center rounded-lg bg-slate-50 w-full p-2 mb-4 ${analyzeFeedbackColor}`}>
          {analyzeMessage}
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100 w-full flex justify-center">
            <button 
              onClick={() => alert(`LOGIC ALGORITHM:\n\n${currentSentence.algorithm.join('\n')}`)}
              className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded hover:bg-amber-100 border border-amber-200 transition-colors"
          >
              {text.viewLogic}
          </button>
        </div>
      </div>
    </div>
  );
};

const ToolButton = ({ label, color, active, onClick }: { label: string, color: string, active: boolean, onClick: () => void }) => {
  const colorMap: Record<string, string> = {
    red:    active ? "bg-red-500 text-white border-red-600 shadow-md transform scale-105" : "bg-white text-red-600 border-red-200 hover:bg-red-50",
    yellow: active ? "bg-amber-400 text-amber-900 border-amber-600 shadow-md transform scale-105" : "bg-white text-amber-600 border-amber-200 hover:bg-amber-50",
    blue:   active ? "bg-blue-500 text-white border-blue-600 shadow-md transform scale-105" : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50",
  };

  return (
    <button 
      className={`px-3 py-1.5 rounded-md font-bold text-sm transition-all border ${colorMap[color] || ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};
