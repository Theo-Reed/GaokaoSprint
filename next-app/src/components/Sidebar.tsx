import Link from 'next/link';
import { getNavigation } from '@/lib/markdown';

export default function Sidebar({ lang }: { lang: string }) {
  const nav = getNavigation(lang);

  return (
    <div className="w-64 h-screen bg-gray-50 border-r border-gray-200 flex-shrink-0 overflow-y-auto fixed left-0 top-0 hidden md:block">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
          Gaokao Cockpit
        </h1>
        <div className="flex gap-2 text-sm mb-6">
          <Link href="/cn" className={`px-2 py-1 rounded ${lang === 'cn' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}>
            中文
          </Link>
          <Link href="/en" className={`px-2 py-1 rounded ${lang === 'en' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}>
            English
          </Link>
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
  );
}
