import { getNavigation } from '@/lib/markdown';
import SidebarClient from './SidebarClient';

export default function Sidebar({ lang }: { lang: string }) {
  const nav = getNavigation(lang);

  return <SidebarClient lang={lang} nav={nav} />;
}
