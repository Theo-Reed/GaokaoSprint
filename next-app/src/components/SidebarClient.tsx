"use client";

import React, { useState } from 'react';
import Link from 'next/link';

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

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 p-2 rounded-md bg-white shadow-md md:hidden text-gray-600 hover:text-blue-600"
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
        fixed top-0 left-0 h-screen w-64 bg-gray-50 border-r border-gray-200 
        transform transition-transform duration-300 ease-in-out z-40
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:block
        overflow-y-auto
      `}>
        <div className="p-6">
          <Link href={`/${lang}`} onClick={() => setIsOpen(false)}>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
              Gaokao Cockpit
            </h1>
          </Link>
          
          <div className="flex gap-2 text-sm mb-6">
            <Link href="/cn" className={`px-2 py-1 rounded ${lang === 'cn' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}>
              中文
            </Link>
            <Link href="/en" className={`px-2 py-1 rounded ${lang === 'en' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}>
              English
            </Link>
          </div>

          <div className="mb-6 flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              S
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Student User</p>
              <p className="text-xs text-slate-400">Level 3 • 450 words</p>
            </div>
          </div>

          <nav className="space-y-6">
            {nav.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="block px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-white hover:shadow-sm transition-all duration-200"
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
