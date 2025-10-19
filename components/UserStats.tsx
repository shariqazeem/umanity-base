'use client';

import { useEffect, useState } from 'react';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

interface UserStatsProps {
  address: string;
  totalDonated?: string;
  donationCount?: number;
  rank?: number;
}

export function UserStats({ 
  address, 
  totalDonated = '0.00', 
  donationCount = 0,
  rank 
}: UserStatsProps) {
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const [basename, setBasename] = useState<string | null>(null);

  useEffect(() => {
    const getBasename = async () => {
      try {
        const name = await publicClient.getEnsName({
          address: address as `0x${string}`,
        });
        if (name) {
          setBasename(name);
        }
      } catch (error) {
        console.log('No basename found');
      }
    };

    getBasename();
  }, [address]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500 mb-1">Sub Account (App Wallet)</p>
          {basename ? (
            <div>
              <p className="font-semibold text-lg text-blue-600">{basename}</p>
              <p className="font-mono text-xs text-gray-500">{shortAddress}</p>
            </div>
          ) : (
            <p className="font-mono text-sm font-medium text-gray-900">{shortAddress}</p>
          )}
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xl">👤</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center bg-blue-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-900">${totalDonated}</p>
          <p className="text-xs text-gray-600 mt-1">USDC Donated</p>
        </div>
        
        <div className="text-center bg-green-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-900">{donationCount}</p>
          <p className="text-xs text-gray-600 mt-1">Donations</p>
        </div>
        
        <div className="text-center bg-purple-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-900">
            {rank && rank > 0 ? `#${rank}` : '--'}
          </p>
          <p className="text-xs text-gray-600 mt-1">Rank</p>
        </div>
      </div>
    </div>
  );
}