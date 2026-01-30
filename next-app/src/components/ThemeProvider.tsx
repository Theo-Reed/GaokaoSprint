"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const [mounted, setMounted] = React.useState(false);
  const [config, setConfig] = React.useState({ key: 'theme', def: 'dark' });

  React.useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const key = isMobile ? 'gaokao-theme-mobile' : 'gaokao-theme-desktop';
    const def = isMobile ? 'light' : 'dark';
    setConfig({ key, def });
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <NextThemesProvider 
      {...props} 
      storageKey={config.key}
      defaultTheme={config.def}
      enableSystem={false}
    >
      {children}
    </NextThemesProvider>
  )
}
