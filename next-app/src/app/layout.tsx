import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import 'katex/dist/katex.min.css';
import { ThemeProvider } from "@/components/ThemeProvider";

/*
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
*/

export const metadata: Metadata = {
  title: "AI高考训练",
  description: "全真模拟高考写作与语法环境，配备多模型 AI 联合测评。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1c1c1e" media="(prefers-color-scheme: dark)" />
        <script src="https://unpkg.com/vconsole@latest/dist/vconsole.min.js"></script>
        <script
          dangerouslySetInnerHTML={{
             __html: `
               if (location.search.indexOf('debug=1') > -1) {
                 window.vConsole = new window.VConsole();
               }
               window.onerror = function(msg, url, line, col, error) {
                 var div = document.getElementById('mobile-debug-console');
                 if (!div) {
                   div = document.createElement('div');
                   div.id = 'mobile-debug-console';
                   div.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:50vh;overflow:auto;background:rgba(180,0,0,0.95);color:white;z-index:999999;padding:12px;font-family:monospace;font-size:12px;pointer-events:none;';
                   document.documentElement.appendChild(div);
                 }
                 div.innerHTML += '<div style="margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.3);padding-bottom:4px;"><strong>[Error]</strong> ' + msg + '<br/><span style="opacity:0.8">' + (url||'').split('/').pop() + ':' + line + '</span></div>';
               };
               window.onunhandledrejection = function(e) {
                 var div = document.getElementById('mobile-debug-console');
                  if (!div) {
                   div = document.createElement('div');
                   div.id = 'mobile-debug-console';
                   div.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:50vh;overflow:auto;background:rgba(180,0,0,0.95);color:white;z-index:999999;padding:12px;font-family:monospace;font-size:12px;pointer-events:none;';
                   document.documentElement.appendChild(div);
                 }
                 div.innerHTML += '<div style="margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.3);padding-bottom:4px;"><strong>[Promise]</strong> ' + (e.reason ? e.reason.toString() : 'Unknown Rejection') + '</div>';
               };
             `
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var isMobile = window.innerWidth < 768;
                  var key = isMobile ? 'gaokao-theme-mobile' : 'gaokao-theme-desktop';
                  
                  function applyTheme() {
                    var isDark;
                    if (isMobile) {
                      // 手机端完全跟随系统
                      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    } else {
                      // 电脑端记录用户习惯
                      var theme = localStorage.getItem(key);
                      if (!theme || theme === 'system') {
                        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                      } else {
                        isDark = theme === 'dark';
                      }
                    }
                    document.documentElement.classList.toggle('dark', isDark);
                  }

                  applyTheme();

                  // 实时监听系统主题切换
                  var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                  if (mediaQuery.addEventListener) {
                    mediaQuery.addEventListener('change', function() {
                      if (isMobile) {
                        applyTheme();
                      } else {
                        var currentTheme = localStorage.getItem(key);
                        if (!currentTheme || currentTheme === 'system') {
                          applyTheme();
                        }
                      }
                    });
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
