import AppShell from '@/client/core/AppShell';
import SessionProvider from '@/client/core/SessionProvider';

export default function SolicitacoesLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
