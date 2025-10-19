'use client';

import { useState } from 'react';
import { getSDK } from '@/lib/base-sdk';

interface WalletConnectProps {
  onConnect: (address: string) => void;
}

export function WalletConnect({ onConnect }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const sdk = getSDK();
      const provider = sdk.getProvider();

      console.log('Connecting to Base Account...');

      const accounts = await provider.request({
        method: 'eth_requestAccounts',
        params: [],
      }) as string[];

      if (accounts.length > 0) {
        console.log('Connected:', accounts[0]);
        onConnect(accounts[0]);
      }
    } catch (err: any) {
      console.error('Connection failed:', err);
      setError('Failed to connect. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
      >
        {isConnecting ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Connecting...</span>
          </div>
        ) : (
          'Connect Base Account'
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600 text-center">{error}</p>
        </div>
      )}
    </div>
  );
}