'use client';

import { AlienProvider } from '@alien-id/miniapps-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AlienProvider autoReady={true}>
        {children}
      </AlienProvider>
    </QueryClientProvider>
  );
}
