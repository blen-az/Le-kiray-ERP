import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth';

export const metadata: Metadata = {
  title: 'Le’Kiray Contractor ERP',
  description: 'Multi-tenant contractor management ERP for construction sites, heavy machinery, fuel, and inventory in Ethiopia.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className="min-h-full flex flex-col font-sans antialiased text-slate-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
