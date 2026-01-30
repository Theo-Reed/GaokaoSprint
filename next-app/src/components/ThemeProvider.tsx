"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const [mounted, setMounted] = React.useState(false);
  const [config, setConfig] = React.useState<{key: string; def: string} | null>(null);

  React.useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const key = isMobile ? 'gaokao-theme-mobile' : 'gaokao-theme-desktop';
    const def = 'system';
    
    // 如果之前有老版本的默认值（如 'light' 或 'dark'），
    // 且用户从未手动切换过，我们可以考虑清除它来让 system 生效。
    // 但为了不破坏用户现有选择，我们只设置 defaultTheme。
    
    setConfig({ key, def });
    setMounted(true);
  }, []);

  if (!mounted || !config) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <NextThemesProvider 
      {...props} 
      storageKey={config.key}
      defaultTheme={config.def}
      enableSystem={true}
      attribute="class"
    >
      {children}
    </NextThemesProvider>
  )
}
