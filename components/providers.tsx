'use client';

import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  // We're using Base Account SDK directly, not OnchainKit's wallet features
  return <>{children}</>;
}