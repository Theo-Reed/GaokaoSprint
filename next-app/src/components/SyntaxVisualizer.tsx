"use client";

import React, { useState } from 'react';

type ComponentType = 'subject' | 'verb' | 'object' | 'clause';

interface WordProps {
  text: string;
  type?: ComponentType;
  clauseType?: string; // e.g., "Attributive Clause"
}

const Word: React.FC<WordProps> = ({ text, type, clauseType }) => {
  const [isHovered, setIsHovered] = useState(false);

  let className = "inline-block px-1 mx-0.5 rounded transition-all cursor-pointer ";
  
  if (type === 'subject') className += "border-b-4 border-red-500 ";
  if (type === 'verb') className += "border-b-4 border-yellow-500 ";
  if (type === 'object') className += "border-b-4 border-indigo-500 ";
  
  if (type === 'clause') {
    className += "border border-dashed border-gray-400 rounded-md relative hover:bg-indigo-100 hover:border-indigo-500 ";
  }

  return (
    <span 
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={clauseType} // Simple tooltip fallback
    >
      {type === 'clause' && isHovered && (
        <span className="absolute -top-6 left-0 text-xs text-green-600 font-bold bg-white px-1 shadow-sm rounded whitespace-nowrap z-10">
          {clauseType}
        </span>
      )}
      {text}
    </span>
  );
};

export const SyntaxVisualizer = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto font-sans leading-loose text-lg bg-white shadow-lg rounded-xl mt-10">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">English Syntax Visualizer (Demo)</h2>
      <p className="text-gray-500 mb-8 text-sm">
        Hover over the dashed boxes to see clause types. Note the <span className="text-red-500 font-bold">Subject</span>, <span className="text-yellow-500 font-bold">Verb</span>, and <span className="text-indigo-500 font-bold">Object</span> colors.
      </p>

      <div className="bg-gray-50 p-6 rounded-lg leading-[3rem]">
        {/* Sentence: The student who studies hard will pass the exam which is difficult. */}
        
        <Word text="The student" type="subject" />
        
        {/* Attributive Clause 1 */}
        <span className="inline-block mx-1">
            <Word text="who" type="clause" clauseType="Attributive Clause (modifies student)" />
            <Word text=" studies" type="verb" /> 
            <Word text=" hard" />
        </span>
        
        <Word text="will pass" type="verb" />
        
        <Word text="the exam" type="object" />

        {/* Attributive Clause 2 - Fixing the structure to match the nesting visual */}
        <span className="border border-dashed border-gray-400 rounded mx-1 hover:bg-green-50 hover:border-green-500 relative group transition-colors cursor-help">
             <span className="absolute -top-5 left-2 text-xs text-green-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                Attributive Clause (modifies exam)
             </span>
             <span className="px-1">which</span>
             <span className="border-b-4 border-yellow-500 px-1">is</span>
             <span className="px-1">difficult</span>
        </span>
        .
      </div>

      <div className="mt-8 p-4 bg-indigo-50 border-l-4 border-indigo-500 text-indigo-700 text-sm">
        <strong>Study Strategy:</strong> This visualization simplifies the "chunking" process. Every time you see a long sentence, try to visualize these boxes and lines in your mind.
      </div>
    </div>
  );
};
