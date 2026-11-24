import type { Metadata } from 'next';
import 'bootstrap/dist/css/bootstrap.min.css';
import QueryProvider from '@/client/core/QueryProvider';

export const metadata: Metadata = {
  title: 'Solicitações',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-light">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
