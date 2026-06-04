import type { Metadata } from 'next';
import { Inter, Orbitron } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '600', '800', '900'],
  variable: '--font-orbitron',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Redis vs PostgreSQL Sales Benchmark Arena',
  description: 'A premium visual performance benchmark demonstrating the power of Redis caching vs PostgreSQL raw aggregation queries on 500,000 sales records.',
  keywords: ['Redis', 'PostgreSQL', 'Cache', 'Benchmark', 'Next.js', 'NestJS', 'Performance', 'Dashboard'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable}`}>
      <body>{children}</body>
    </html>
  );
}
