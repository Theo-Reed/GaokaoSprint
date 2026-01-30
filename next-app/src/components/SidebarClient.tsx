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

  // Floating button state
  const [pos, setPos] = useState({ x: -1, y: 120 }); // -1 means right-aligned initially, y=120 to avoid top safe area
  const [isDragging, setIsDragging] = useState(false);
  const [isLongPressed, setIsLongPressed] = useState(false);
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);

  // menuSide controls which side the sidebar pops out from
  const [menuSide, setMenuSide] = useState<'left' | 'right'>('left');
  
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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.innerWidth >= 768) return; // Only mobile
    const touch = e.touches[0];
    
    longPressTimer.current = setTimeout(() => {
      setIsLongPressed(true);
      if (window.navigator.vibrate) window.navigator.vibrate(50); // Haptic feedback if available
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // If we've started the long press timer but moved significantly, cancel it
    // But since we want to allow small movements to not cancel long press, 
    // we only care about if we are already in long press mode.
    
    if (!isLongPressed) {
      // If we move too early, it's probably a scroll, so cancel long press
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      return;
    }

    // CRITICAL: Prevent system menus/selection during drag
    if (e.cancelable) e.preventDefault();
    setIsDragging(true);
    const touch = e.touches[0];
    setPos({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (isLongPressed) {
      // Snap logic
      const screenWidth = window.innerWidth;
      const isLeft = pos.x < screenWidth / 2;
      setPos(prev => ({ 
        x: isLeft ? 16 : screenWidth - 16, 
        y: prev.y 
      }));
      
      // Update menu side ONLY after drag ends to prevent flickering
      setMenuSide(isLeft ? 'right' : 'left');
      
      // Reset modes
      setTimeout(() => {
        setIsLongPressed(false);
        setIsDragging(false);
      }, 50);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.body.classList.add('select-none');
    } else {
      document.body.classList.remove('select-none');
    }
  }, [isDragging]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
          setUserEmail(session.user.email);
      }
    });
  }, []);

  return (
    <>
      {/* Mobile Menu Button - Draggable with snap */}
      <button 
        onClick={() => {
          if (!isDragging) setIsOpen(!isOpen);
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed',
          top: `${pos.y - 20}px`,
          left: pos.x === -1 ? 'auto' : `${pos.x - 20}px`,
          right: pos.x === -1 ? '16px' : 'auto',
          touchAction: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none'
        }}
        className={`z-[70] p-2 rounded-md bg-white dark:bg-slate-900 shadow-md md:hidden text-gray-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-shadow ${isLongPressed ? 'scale-110 shadow-lg ring-2 ring-violet-500' : ''}`}
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
          className="fixed inset-0 bg-black/50 z-[55] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 h-screen w-64 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800
        transform transition-transform duration-300 ease-in-out z-[60]
        ${menuSide === 'left' ? 'left-0 border-r' : 'right-0 border-l'}
        ${isOpen ? 'translate-x-0 opacity-100 visible pointer-events-auto' : (menuSide === 'left' ? '-translate-x-full' : 'translate-x-full') + ' opacity-0 invisible pointer-events-none md:opacity-100 md:visible md:pointer-events-auto'}
        md:left-0 md:right-auto md:border-r md:translate-x-0 md:block
        overflow-y-auto no-scrollbar
      `}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
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
            <div className="mb-6 p-3 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden select-none touch-none">
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
                        className="block px-3 py-2 text-sm text-slate-600 dark:text-slate-400 rounded-xl hover:bg-white dark:hover:bg-slate-900 hover:text-violet-600 dark:hover:text-violet-400 hover:shadow-sm active:scale-95 active:bg-violet-50 dark:active:bg-slate-800 transition-all duration-200"
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
