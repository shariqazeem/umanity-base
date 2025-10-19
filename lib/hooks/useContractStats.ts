'use client';

import { useState, useEffect } from 'react';
import { createPublicClient, http, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export function useContractStats(userAddress?: string, refreshKey?: number) {
  const [stats, setStats] = useState({
    totalDonated: '0.0000',
    donationCount: 0,
    rank: 0,
    platformTotal: '0.0000',
    recipientCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!CONTRACT_ADDRESS) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Get platform stats
        const platformStats = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'getPlatformStats',
        }) as [bigint, bigint, bigint];

        let userStats = [BigInt(0), BigInt(0), BigInt(0)] as [bigint, bigint, bigint];
        
        // Get user stats if address provided
        if (userAddress) {
          userStats = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: 'getDonorStats',
            args: [userAddress as `0x${string}`],
          }) as [bigint, bigint, bigint];
        }

        setStats({
          totalDonated: parseFloat(formatEther(userStats[0])).toFixed(4),
          donationCount: Number(userStats[1]),
          rank: Number(userStats[2]),
          platformTotal: parseFloat(formatEther(platformStats[0])).toFixed(4),
          recipientCount: Number(platformStats[2]),
        });
      } catch (error) {
        console.error('Error fetching contract stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userAddress, refreshKey]);

  return { stats, loading };
}