import type { Metadata, Viewport } from 'next';
import { ToastProvider } from '@/components/ui';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
import './globals.css';

export const metadata: Metadata = {
  title: 'FORDAYS パートナー手帳',
  applicationName: 'FORDAYS パートナー手帳',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: { capable: true, title: 'パートナー手帳', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f7323f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" data-mode="member">
      <head>
        {/* 文字サイズ設定を描画前に反映 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=localStorage.getItem('fd-font-scale');var m={normal:18,large:20,xlarge:22};if(m[s])document.documentElement.style.fontSize=m[s]+'px'}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ToastProvider>
          {children}
          <PwaInstallPrompt />
        </ToastProvider>
      </body>
    </html>
  );
}
