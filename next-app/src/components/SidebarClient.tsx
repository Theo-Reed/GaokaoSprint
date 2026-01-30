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
  
  // Set default collapsed state for sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    // Collect section titles from nav
    const initialState: Record<string, boolean> = {};
    if (nav) {
      nav.forEach(section => {
        // Sections that should be collapsed by default
        const toCollapse = ['生活与健康', '学科策略', 'Life & Health', 'Strategies'];
        if (toCollapse.includes(section.title)) {
          initialState[section.title] = true;
        }
      });
    }
    return initialState;
  });

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
        className="fixed top-4 right-4 z-50 p-2 rounded-md bg-white dark:bg-slate-900 shadow-md md:hidden text-gray-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white"
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
        fixed top-0 left-0 h-screen w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
        transform transition-transform duration-300 ease-in-out z-40
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:block
        overflow-y-auto no-scrollbar
      `}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 text-[13px] font-black tracking-widest uppercase">
              <Link href="/cn" className={`transition-colors ${lang === 'cn' ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-slate-600 hover:text-violet-600 dark:hover:text-violet-400'}`}>
                中文
              </Link>
              <span className="text-slate-200 dark:text-slate-800">/</span>
              <Link href="/en" className={`transition-colors ${lang === 'en' ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-slate-600 hover:text-violet-600 dark:hover:text-violet-400'}`}>
                EN
              </Link>
            </div>
            <ThemeToggle />
          </div>

          {userEmail && (
            <div className="mb-6 p-3 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <p className="text-sm font-bold text-slate-700 dark:text-white truncate" title={userEmail}>{userEmail}</p>
            </div>
          )}

          <nav className="space-y-6">
            {nav.map((section) => (
              <div key={section.title} className="space-y-2">
                <button 
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-violet-600 dark:hover:text-violet-400 transition-colors group"
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
                        className="block px-3 py-2 text-sm text-slate-600 dark:text-slate-400 rounded-xl hover:bg-white dark:hover:bg-slate-900 hover:text-violet-600 dark:hover:text-violet-400 hover:shadow-sm transition-all duration-200"
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
