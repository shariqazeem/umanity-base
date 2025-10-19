'use client';

import { useState, useEffect, useCallback } from 'react';
import { WalletConnect } from '@/components/WalletConnect';
import { OneTapButton } from '@/components/OneTapButton';
import { UserStats } from '@/components/UserStats';
import { useContractStats } from '@/lib/hooks/useContractStats';
import Link from 'next/link';
import { getSDK } from '@/lib/base-sdk';

export default function AppDashboard() {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [subAccountAddress, setSubAccountAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Use sub account for stats if available, otherwise universal
  const addressForStats = subAccountAddress || userAddress;

  // Fetch stats from contract
  const { stats, loading: statsLoading } = useContractStats(addressForStats || undefined, refreshKey);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const sdk = getSDK();
        const provider = sdk.getProvider();
        const accounts = await provider.request({
          method: 'eth_accounts',
          params: [],
        }) as string[];

        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
          if (accounts[1]) {
            setSubAccountAddress(accounts[1]);
            console.log('Universal Account:', accounts[0]);
            console.log('Sub Account:', accounts[1]);
          }
        }
      } catch (error) {
        console.error('Failed to check connection:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, []);

  const handleConnect = (address: string, subAccount?: string) => {
    setUserAddress(address);
    if (subAccount) {
      setSubAccountAddress(subAccount);
      console.log('Connected - Universal:', address);
      console.log('Connected - Sub Account:', subAccount);
    }
  };

  const handleDisconnect = () => {
    setUserAddress(null);
    setSubAccountAddress(null);
  };

  const handleDonationSuccess = useCallback(() => {
    console.log('Donation success - refreshing stats...');
    // Force refresh stats after a delay for blockchain confirmation
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 5000);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              Umanity
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/leaderboard" className="text-gray-600 hover:text-gray-900 font-medium">
                Leaderboard
              </Link>
              <Link href="/recipients" className="text-gray-600 hover:text-gray-900 font-medium">
                Recipients
              </Link>
              <Link href="/apply" className="text-gray-600 hover:text-gray-900 font-medium">
                Apply
              </Link>
            </nav>

            {userAddress && (
              <button
                onClick={handleDisconnect}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {!userAddress ? (
          <div className="max-w-lg mx-auto text-center space-y-8 py-20">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-gray-900">
                Connect Your
                <br />
                <span className="text-blue-600">Base Account</span>
              </h1>
              <p className="text-xl text-gray-600">
                Start making one-tap donations to help people in need
              </p>
            </div>

            <WalletConnect onConnect={handleConnect} />

            <div className="pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">
                New to Base?
              </p>

              <a
                href="https://keys.coinbase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm underline"
              >
                Create a Base Account
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Show which account is being used */}
            {subAccountAddress && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="text-blue-800">
                  <span className="font-semibold">Using Sub Account:</span> {subAccountAddress.slice(0, 6)}...{subAccountAddress.slice(-4)}
                </p>
                <p className="text-blue-600 text-xs mt-1">
                  Donations and stats tracked for this address
                </p>
              </div>
            )}

            <UserStats
              address={addressForStats || userAddress}
              totalDonated={stats.totalDonated}
              donationCount={stats.donationCount}
              rank={stats.rank}
            />

            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-12">
              <OneTapButton
                userAddress={userAddress}
                subAccountAddress={subAccountAddress || undefined}
                onDonationSuccess={handleDonationSuccess}
              />
            </div>

            {/* Platform Stats */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Platform Impact</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.platformTotal}</p>
                  <p className="text-xs text-gray-600">Total ETH Donated</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.recipientCount}</p>
                  <p className="text-xs text-gray-600">Recipients</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">100%</p>
                  <p className="text-xs text-gray-600">Goes to Recipients</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="font-bold text-gray-900 mb-2">One Tap</h3>
                <p className="text-sm text-gray-600">
                  No need to choose who to help. Our system randomly selects a verified recipient.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="text-3xl mb-3">🔒</div>
                <h3 className="font-bold text-gray-900 mb-2">Transparent</h3>
                <p className="text-sm text-gray-600">
                  Every donation is recorded on Base blockchain. Fully verifiable.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="text-3xl mb-3">💙</div>
                <h3 className="font-bold text-gray-900 mb-2">Direct Impact</h3>
                <p className="text-sm text-gray-600">
                  100 percent of your donation goes directly to someone who needs help.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}