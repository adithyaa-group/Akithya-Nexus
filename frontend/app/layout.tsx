import type { Metadata } from 'next';
import { Orbitron, Rajdhani, Share_Tech_Mono } from 'next/font/google';
import './globals.css';

const display = Orbitron({ subsets: ['latin'], variable: '--font-display', weight: ['500', '700'] });
const body = Rajdhani({ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600'] });
const mono = Share_Tech_Mono({ subsets: ['latin'], variable: '--font-mono', weight: '400' });

export const metadata: Metadata = {
  title: 'N.E.X.U.S. · Akithya Group — Central Intelligence Division',
  description: 'National Executive eXchange & Unified Intelligence System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
