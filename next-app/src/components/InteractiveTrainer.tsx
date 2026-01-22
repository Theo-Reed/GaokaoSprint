"use client";

import React, { useState, useEffect } from "react";
import { TRAINING_LEVELS, SentenceData } from "@/data/training-data";

type ToolType = "subject" | "verb" | "object" | null;

export const InteractiveTrainer = () => {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [selectedTool, setSelectedTool] = useState<ToolType>(null);
  
  // Track user progress: which indices have been correctly identified for each type
  const [foundIndices, setFoundIndices] = useState<{
    subject: number[];
    verb: number[];
    object: number[];
  }>({ subject: [], verb: [], object: [] });

  const [message, setMessage] = useState("Select a tool (S/V/O) and click the words.");
  const [feedbackColor, setFeedbackColor] = useState("text-gray-500");

  const currentSentence = TRAINING_LEVELS[currentLevelIndex];
  const words = currentSentence.text.split(" ");

  // Reset when level changes
  useEffect(() => {
    setFoundIndices({ subject: [], verb: [], object: [] });
    setMessage("New Level: Analyze the sentence structure.");
    setFeedbackColor("text-gray-500");
  }, [currentLevelIndex]);

  const handleWordClick = (index: number) => {
    if (!selectedTool) {
      setMessage("⚠️ Please select a tool first (Subject / Verb / Object)");
      setFeedbackColor("text-yellow-600");
      return;
    }

    const correctIndices = currentSentence.answerKey[selectedTool];

    // Check if valid target
    if (correctIndices.includes(index)) {
      // Correct!
      if (!foundIndices[selectedTool].includes(index)) {
        // ... (existing success logic)
        setFoundIndices(prev => ({
          ...prev,
          [selectedTool]: [...prev[selectedTool], index]
        }));
        setMessage("✅ Correct! Keep going.");
        setFeedbackColor("text-green-600");
      }
    } else {
      // 1. Check if it's a known TRAP
      if (currentSentence.traps && currentSentence.traps[index]) {
        setMessage(currentSentence.traps[index]); // Show specific trap explanation
        setFeedbackColor("text-red-600 font-bold");
      } else {
        // 2. Generic Error
        setMessage(`❌ Logic Error: This word is NOT part of the ${selectedTool.toUpperCase()}. Look for clues.`);
        setFeedbackColor("text-red-600");
      }
    }
  };

  const showAlgorithm = () => {
    // Helper to toggle algorithm visibility (could be a modal or expansion panel)
    // For demo simplicity, we just inject it into message area or add a new UI section
    alert(currentSentence.algorithm.join("\n"));
  };

  const checkCompletion = () => {
    // In a real app, logic to check if ALL parts are found would go here
    // For this demo, let's keep it simple
  };

  const isCompleted = (type: ToolType, index: number) => {
    return type && foundIndices[type].includes(index);
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
          <h3 className="text-xl font-bold tracking-tight">Syntax Logic Trainer</h3>
          <p className="text-slate-400 text-sm">Level {currentLevelIndex + 1} / {TRAINING_LEVELS.length} • Difficulty: {currentSentence.difficulty}</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => alert(`LOGIC ALGORITHM:\n\n${currentSentence.algorithm.join('\n')}`)}
                className="px-3 py-1 bg-yellow-600 rounded hover:bg-yellow-500 text-xs font-bold text-white mr-2"
            >
                💡 Logic Hint
            </button>
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

      {/* Toolbox */}
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-center gap-4">
        <ToolButton 
          label="Subject (S)" 
          color="red" 
          active={selectedTool === 'subject'} 
          onClick={() => setSelectedTool('subject')} 
        />
        <ToolButton 
          label="Verb (V)" 
          color="yellow" 
          active={selectedTool === 'verb'} 
          onClick={() => setSelectedTool('verb')} 
        />
        <ToolButton 
          label="Object (O)" 
          color="blue" 
          active={selectedTool === 'object'} 
          onClick={() => setSelectedTool('object')} 
        />
      </div>

      {/* Main Game Area */}
      <div className="p-10 min-h-[200px] flex items-center justify-center flex-col">
        <div className="flex flex-wrap gap-3 text-2xl leading-relaxed justify-center select-none">
          {words.map((word, index) => {
            let style = "border-b-4 border-transparent hover:bg-gray-100 cursor-pointer transition-all px-1 rounded";
            
            // Apply styling if found
            if (foundIndices.subject.includes(index)) style = "border-b-4 border-red-500 bg-red-50 text-red-900";
            if (foundIndices.verb.includes(index))    style = "border-b-4 border-yellow-500 bg-yellow-50 text-yellow-900 font-bold transform scale-105 shadow-sm";
            if (foundIndices.object.includes(index))  style = "border-b-4 border-blue-500 bg-blue-50 text-blue-900";

            return (
              <span 
                key={index} 
                className={style}
                onClick={() => handleWordClick(index)}
              >
                {word}
              </span>
            );
          })}
        </div>
        
        <div className={`mt-12 text-center font-medium opacity-90 transition-colors ${feedbackColor}`}>
          {message}
        </div>
      </div>

      {/* Theoretical Footer */}
      <div className="bg-gray-50 p-4 text-xs text-center text-gray-400 border-t border-gray-100">
        Based on <strong>Deliberate Practice Theory</strong>: Active Retrieval + Immediate Feedback
      </div>
    </div>
  );
};

const ToolButton = ({ label, color, active, onClick }: { label: string, color: string, active: boolean, onClick: () => void }) => {
  const baseClass = "px-6 py-2 rounded-full font-bold transition-all shadow-sm border-2";
  const activeClass = active 
    ? `bg-${color}-100 border-${color}-500 text-${color}-700 scale-105 shadow-md` 
    : `bg-white border-gray-200 text-gray-500 hover:border-${color}-300 hover:text-${color}-500`;

  // Tailwind dynamic classes restriction workaround (usually better to use static classes map)
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
