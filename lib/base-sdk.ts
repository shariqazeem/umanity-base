'use client';

import { createBaseAccountSDK } from '@base-org/account';
import { baseSepolia } from 'viem/chains';

let sdkInstance: ReturnType<typeof createBaseAccountSDK> | null = null;

export const getSDK = () => {
  if (typeof window === 'undefined') {
    throw new Error('SDK can only be initialized in the browser');
  }

  if (!sdkInstance) {
    sdkInstance = createBaseAccountSDK({
      appName: process.env.NEXT_PUBLIC_APP_NAME || 'Umanity',
      appLogoUrl: process.env.NEXT_PUBLIC_APP_LOGO_URL || 'https://umanity.xyz/logo.png',
      appChainIds: [baseSepolia.id],
      // No sub accounts - use universal account directly
    });
  }

  return sdkInstance;
};

export const getProvider = () => getSDK().getProvider();