import type { Metadata } from 'next';
import '@fontsource-variable/inter/wght.css';
import './globals.css';
export const metadata: Metadata = {
  title: 'Command Center',
  description: 'One workspace for coursework, schedules, source records and recruiting.',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
