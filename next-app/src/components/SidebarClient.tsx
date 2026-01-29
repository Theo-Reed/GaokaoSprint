"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface NavItem {
  title: string;
  href: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarClientProps {
  lang: string;
  nav: NavSection[];
}

export default function SidebarClient({ lang, nav }: SidebarClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
          setUserEmail(session.user.email);
      }
    });
  }, []);

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 p-2 rounded-md bg-white dark:bg-slate-900 shadow-md md:hidden text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        )}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 h-screen w-64 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800
        transform transition-transform duration-300 ease-in-out z-40
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:block
        overflow-y-auto no-scrollbar
      `}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4.5">
            <Link href={`/${lang}`} onClick={() => setIsOpen(false)}>
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                高考 <span className="text-indigo-500">Gaokao</span>
              </h1>
            </Link>
            <ThemeToggle />
          </div>
          
          <div className="flex gap-3 text-xs mb-4.5">
            <Link href="/cn" className={`px-4 py-2 rounded-full font-bold transition-all ${lang === 'cn' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-50' : 'text-slate-500 hover:bg-slate-200'}`}>
              中文
            </Link>
            <Link href="/en" className={`px-4 py-2 rounded-full font-bold transition-all ${lang === 'en' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-50' : 'text-slate-500 hover:bg-slate-200'}`}>
              English
            </Link>
          </div>

          {userEmail && (
            <div className="mb-6 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate" title={userEmail}>{userEmail}</p>
            </div>
          )}

          <nav className="space-y-6">
            {nav.map((section) => (
              <div key={section.title} className="space-y-2">
                <button 
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
                >
                  <span>{section.title}</span>
                  <span className={`transform transition-transform duration-200 ${collapsedSections[section.title] ? '-rotate-90' : 'rotate-0'}`}>
                    <ChevronDown size={16} className="opacity-70 group-hover:opacity-100" />
                  </span>
                </button>
                
                <ul className={`space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${collapsedSections[section.title] ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="block px-3 py-2 text-sm text-slate-600 dark:text-slate-400 rounded-xl hover:bg-white dark:hover:bg-slate-900 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm transition-all duration-200"
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
