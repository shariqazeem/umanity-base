'use client';

import { useState, useEffect, useCallback } from 'react';
import { WalletConnect } from '@/components/WalletConnect';
import { OneTapButton } from '@/components/OneTapButton';
import { PoolsSection } from '@/components/PoolsSection';
import { UserStats } from '@/components/UserStats';
import { useContractStats } from '@/lib/hooks/useContractStats';
import Link from 'next/link';
import { getSDK } from '@/lib/base-sdk';

type Tab = 'donate' | 'pools';

export default function AppDashboard() {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('donate');

  const { stats, loading: statsLoading } = useContractStats(userAddress || undefined, refreshKey);

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
        }
      } catch (error) {
        console.error('Failed to check connection:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, []);

  const handleConnect = (address: string) => {
    setUserAddress(address);
  };

  const handleDisconnect = () => {
    setUserAddress(null);
  };

  const handleDonationSuccess = useCallback(() => {
    console.log('Donation success - refreshing stats...');
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
              <Link href="/apply" className="text-gray-600 hover:text-gray-900 font-medium">
                Apply as Recipient
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
            <UserStats
              address={userAddress}
              totalDonated={stats.totalDonated}
              donationCount={stats.donationCount}
              rank={stats.rank}
            />
            {/* Tab Navigation */}
        <div className="flex justify-center">
          <div className="inline-flex bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setActiveTab('donate')}
              className={`px-6 py-2 rounded-md font-semibold transition-all ${
                activeTab === 'donate'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              One-Tap Donate
            </button>
            <button
              onClick={() => setActiveTab('pools')}
              className={`px-6 py-2 rounded-md font-semibold transition-all ${
                activeTab === 'pools'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Support Pools
            </button>
          </div>
        </div>

        {/* Content Based on Active Tab */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-12">
          {activeTab === 'donate' ? (
            <OneTapButton
              userAddress={userAddress}
              onDonationSuccess={handleDonationSuccess}
            />
          ) : (
            <PoolsSection
              userAddress={userAddress}
              onDonationSuccess={handleDonationSuccess}
            />
          )}
        </div>

        {/* Platform Stats */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Platform Impact</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">${stats.platformTotal}</p>
              <p className="text-xs text-gray-600">Total USDC Donated</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.recipientCount}</p>
              <p className="text-xs text-gray-600">Verified Recipients</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">100%</p>
              <p className="text-xs text-gray-600">Goes to Recipients</p>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-bold text-gray-900 mb-2">Random Selection</h3>
            <p className="text-sm text-gray-600">
              Our system randomly selects verified recipients ensuring fair distribution.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="text-3xl mb-3">🏦</div>
            <h3 className="font-bold text-gray-900 mb-2">Support Pools</h3>
            <p className="text-sm text-gray-600">
              Donate to specific causes like education, healthcare, or emergency relief.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="text-3xl mb-3">✅</div>
            <h3 className="font-bold text-gray-900 mb-2">Verified Recipients</h3>
            <p className="text-sm text-gray-600">
              All recipients are manually verified to ensure your donations help those in real need.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-3">Need Help?</h3>
          <p className="text-blue-100 mb-6">
            If you or someone you know needs assistance, apply to become a verified recipient
          </p>
          <Link
            href="/apply"
            className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-all"
          >
            Apply as Recipient
          </Link>
        </div>
      </div>
    )}
  </main>
</div>
);
}