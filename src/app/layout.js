// Root Layout

import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Traffic Problems App',
  description: 'Aplikacija za evidenciju saobraćajnih problema',
};

export default function RootLayout({ children }) {
  return (
    <html lang="sr">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}