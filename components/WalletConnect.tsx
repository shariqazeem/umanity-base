'use client';

import { useState } from 'react';
import { SignInWithBaseButton } from '@base-org/account-ui/react';
import { getSDK } from '@/lib/base-sdk';

interface WalletConnectProps {
  onConnect?: (address: string, subAccountAddress?: string) => void;
}

export function WalletConnect({ onConnect }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const sdk = getSDK();
      const provider = sdk.getProvider();

      const accounts = (await provider.request({
        method: 'eth_requestAccounts',
      })) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const universalAddress = accounts[0];
      const subAccountAddress = accounts[1];

      console.log('✅ Connected to Base:', {
        universalAddress,
        subAccountAddress,
      });

      onConnect?.(universalAddress, subAccountAddress);
    } catch (err: any) {
      console.error('❌ Connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* ✅ Fixed: Removed unsupported props */}
      <SignInWithBaseButton onClick={handleSignIn} disabled={isConnecting} />

      {isConnecting && (
        <p className="text-sm text-gray-600">Connecting to Base Account...</p>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
