"use client";

import React, { useState, useEffect } from "react";
import { TRAINING_LEVELS, SentenceData } from "@/data/training-data";

type ToolType = "subject" | "verb" | "object" | null;
type Mode = "analyze" | "exam";

export const InteractiveTrainer = () => {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("analyze");
  
  // Analyze Mode State
  const [selectedTool, setSelectedTool] = useState<ToolType>(null);
  const [foundIndices, setFoundIndices] = useState<{
    subject: number[];
    verb: number[];
    object: number[];
  }>({ subject: [], verb: [], object: [] });

  // Exam Mode State
  const [examInput, setExamInput] = useState("");
  const [examFeedback, setExamFeedback] = useState("");
  const [isExamCorrect, setIsExamCorrect] = useState(false);

  const [message, setMessage] = useState("Select a tool (S/V/O) and click the words.");
  const [feedbackColor, setFeedbackColor] = useState("text-gray-500");

  const currentSentence = TRAINING_LEVELS[currentLevelIndex];
  const words = currentSentence.text.split(" ");

  // Reset when level changes
  useEffect(() => {
    setFoundIndices({ subject: [], verb: [], object: [] });
    setMessage("Step 1: Analyze the sentence structure.");
    setFeedbackColor("text-gray-500");
    setMode("analyze");
    setExamInput("");
    setExamFeedback("");
    setIsExamCorrect(false);
  }, [currentLevelIndex]);

  const handleWordClick = (index: number) => {
    if (mode !== "analyze") return;

    if (!selectedTool) {
      setMessage("⚠️ Please select a tool first (Subject / Verb / Object)");
      setFeedbackColor("text-yellow-600");
      return;
    }

    const correctIndices = currentSentence.answerKey[selectedTool];

    if (correctIndices.includes(index)) {
      if (!foundIndices[selectedTool].includes(index)) {
        setFoundIndices(prev => ({
          ...prev,
          [selectedTool]: [...prev[selectedTool], index]
        }));
        setMessage("✅ Correct! Keep going.");
        setFeedbackColor("text-green-600");
      }
    } else {
      if (currentSentence.traps && currentSentence.traps[index]) {
        setMessage(currentSentence.traps[index]); 
        setFeedbackColor("text-red-600 font-bold");
      } else {
        setMessage(`❌ Logic Error: This word is NOT part of the ${selectedTool.toUpperCase()}. Look for clues.`);
        setFeedbackColor("text-red-600");
      }
    }
  };

  const handleExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSentence.quiz) return;

    const userAnswer = examInput.trim();
    // Simple case-insensitive match
    if (userAnswer.toLowerCase() === currentSentence.quiz.expected.toLowerCase()) {
      setIsExamCorrect(true);
      setExamFeedback("🎉 EXACTLY! You identified the grammar Trap.");
    } else {
      setIsExamCorrect(false);
      setExamFeedback(`❌ Incorrect. Hint: ${currentSentence.quiz.explanation}`);
    }
  };

  const nextLevel = () => {
    if (currentLevelIndex < TRAINING_LEVELS.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
    } else {
      setMessage("🎉 All levels complete! Excellent syntax logic.");
      setFeedbackColor("text-purple-600 font-bold");
    }
  };

  return (
    <div className="bg-white shadow-xl rounded-2xl overflow-hidden max-w-4xl mx-auto border border-gray-100">
      {/* Header / HUD */}
      <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Gaokao Syntax Core</h3>
          <p className="text-slate-400 text-sm">Level {currentLevelIndex + 1} / {TRAINING_LEVELS.length} • Difficulty: {currentSentence.difficulty}</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="bg-slate-800 rounded px-2 py-1 text-xs text-slate-300 mr-4">
             mode: <span className={`uppercase font-bold ${mode === 'analyze' ? 'text-blue-400' : 'text-purple-400'}`}>{mode}</span>
          </div>

          <button 
              onClick={() => setCurrentLevelIndex(Math.max(0, currentLevelIndex - 1))}
              className="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600 text-xs"
          >
              Prev
          </button>
          <button 
              onClick={nextLevel}
              className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-500 text-xs font-bold"
          >
              Next Level →
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setMode("analyze")}
          className={`flex-1 py-3 font-bold text-sm transition-colors ${mode === 'analyze' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Phase 1: Syntax Analysis (Structure)
        </button>
        <button 
          onClick={() => setMode("exam")}
          className={`flex-1 py-3 font-bold text-sm transition-colors ${mode === 'exam' ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-500' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Phase 2: Exam Simulation (Gap Fill)
        </button>
      </div>

      {/* Main Content Area */}
      <div className="p-8 min-h-[400px] flex flex-col items-center">
        
        {mode === 'analyze' && (
          <>
            <div className="mb-8 flex gap-4">
              <ToolButton label="Subject (S)" color="red" active={selectedTool === 'subject'} onClick={() => setSelectedTool('subject')} />
              <ToolButton label="Verb (V)" color="yellow" active={selectedTool === 'verb'} onClick={() => setSelectedTool('verb')} />
              <ToolButton label="Object (O)" color="blue" active={selectedTool === 'object'} onClick={() => setSelectedTool('object')} />
            </div>

            <div className="flex flex-wrap gap-3 text-2xl leading-relaxed justify-center select-none mb-8 max-w-2xl">
              {words.map((word, index) => {
                let style = "border-b-4 border-transparent hover:bg-gray-100 cursor-pointer transition-all px-1 rounded";
                if (foundIndices.subject.includes(index)) style = "border-b-4 border-red-500 bg-red-50 text-red-900";
                if (foundIndices.verb.includes(index))    style = "border-b-4 border-yellow-500 bg-yellow-50 text-yellow-900 font-bold transform scale-105 shadow-sm";
                if (foundIndices.object.includes(index))  style = "border-b-4 border-blue-500 bg-blue-50 text-blue-900";

                return (
                  <span key={index} className={style} onClick={() => handleWordClick(index)}>{word}</span>
                );
              })}
            </div>

            <div className={`text-center font-medium opacity-90 transition-colors ${feedbackColor}`}>
              {message}
            </div>

            <div className="mt-8">
               <button 
                  onClick={() => alert(`LOGIC ALGORITHM:\n\n${currentSentence.algorithm.join('\n')}`)}
                  className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm font-bold hover:bg-amber-200"
              >
                  💡 View Analysis Logic
              </button>
            </div>
          </>
        )}

        {mode === 'exam' && currentSentence.quiz && (
          <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 mb-6">
                <h4 className="text-purple-900 font-bold mb-4 uppercase tracking-wider text-xs">Gaokao Simulation Question</h4>
                <p className="text-2xl font-serif text-gray-800 leading-relaxed">
                   {/* Render the question with a gap visualization if needed, or just text */}
                   {currentSentence.quiz.question}
                </p>
             </div>

             <form onSubmit={handleExamSubmit} className="flex gap-4 mb-6">
                <input 
                  type="text" 
                  value={examInput}
                  onChange={(e) => setExamInput(e.target.value)}
                  placeholder="Type the correct form..."
                  className="flex-1 p-4 border-2 border-gray-200 rounded-lg text-lg focus:border-purple-500 outline-none transition-colors"
                  disabled={isExamCorrect}
                />
                <button 
                  type="submit"
                  className={`px-8 py-3 rounded-lg font-bold text-white transition-all ${isExamCorrect ? 'bg-green-500' : 'bg-purple-600 hover:bg-purple-700'}`}
                >
                  {isExamCorrect ? 'Solved' : 'Check'}
                </button>
             </form>

             {examFeedback && (
               <div className={`p-4 rounded-lg text-center ${isExamCorrect ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-800'}`}>
                 {examFeedback}
                 {isExamCorrect && (
                   <div className="mt-2 text-sm text-green-700">
                     Explanation: {currentSentence.quiz.explanation}
                   </div>
                 )}
               </div>
             )}
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-4 text-xs text-center text-gray-400 border-t border-gray-100">
        System Status: <span className="text-green-600 font-bold">● Online</span> | Logic Matrix Loaded (v2.0)
      </div>
    </div>
  );
};

const ToolButton = ({ label, color, active, onClick }: { label: string, color: string, active: boolean, onClick: () => void }) => {
  const baseClass = "px-6 py-2 rounded-full font-bold transition-all shadow-sm border-2";
  // Tailwind dynamic classes workaround
  let specificClass = "";
  if (color === 'red') specificClass = active ? "bg-red-100 border-red-500 text-red-700" : "hover:border-red-300";
  if (color === 'yellow') specificClass = active ? "bg-yellow-100 border-yellow-500 text-yellow-700" : "hover:border-yellow-300";
  if (color === 'blue') specificClass = active ? "bg-blue-100 border-blue-500 text-blue-700" : "hover:border-blue-300";

  return (
    <button 
      className={`${baseClass} ${active ? specificClass : "bg-white border-gray-200 text-gray-500"}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};
