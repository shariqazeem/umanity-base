'use client';

import { useState, useEffect } from 'react';
import { getSDK } from '@/lib/base-sdk';
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDC_ADDRESS, ERC20_ABI, PoolType } from '@/lib/contract';
import { encodeFunctionData, createPublicClient, http, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';

const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
});

interface Pool {
    name: string;
    total: string;
    available: string;
    icon: string;
    description: string;
    type: PoolType;
}

interface PoolsSectionProps {
    userAddress: string;
    onDonationSuccess?: () => void;
}

export function PoolsSection({ userAddress, onDonationSuccess }: PoolsSectionProps) {
    const [pools, setPools] = useState<Pool[]>([]);
    const [loading, setLoading] = useState(true);
    const [donatingTo, setDonatingTo] = useState<PoolType | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [usdcBalance, setUsdcBalance] = useState<string>('0');

    useEffect(() => {
        const fetchPools = async () => {
            if (!CONTRACT_ADDRESS) return;

            try {
                setLoading(true);

                // Fetch pools data
                const poolsData = await publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: CONTRACT_ABI,
                    functionName: 'getAllPools',
                }) as [string[], bigint[], bigint[]];

                const [names, totals, available] = poolsData;

                const poolsArray: Pool[] = [
                    {
                        name: names[0],
                        total: formatUnits(totals[0], 6),
                        available: formatUnits(available[0], 6),
                        icon: '📚',
                        description: 'Support education for underprivileged children',
                        type: PoolType.EDUCATION,
                    },
                    {
                        name: names[1],
                        total: formatUnits(totals[1], 6),
                        available: formatUnits(available[1], 6),
                        icon: '🏥',
                        description: 'Help cover medical expenses for those in need',
                        type: PoolType.HEALTHCARE,
                    },
                    {
                        name: names[2],
                        total: formatUnits(totals[2], 6),
                        available: formatUnits(available[2], 6),
                        icon: '🆘',
                        description: 'Provide immediate relief in crisis situations',
                        type: PoolType.EMERGENCY,
                    },
                ];

                setPools(poolsArray);

                // Fetch user balance
                if (userAddress) {
                    const balance = await publicClient.readContract({
                        address: USDC_ADDRESS,
                        abi: ERC20_ABI,
                        functionName: 'balanceOf',
                        args: [userAddress as `0x${string}`],
                    }) as bigint;
                    setUsdcBalance(formatUnits(balance, 6));
                }
            } catch (error) {
                console.error('Error fetching pools:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPools();
    }, [userAddress]);

    const handleDonateToPool = async (poolType: PoolType) => {
        if (!CONTRACT_ADDRESS || !userAddress) {
            setError('Please connect your wallet first.');
            return;
        }

        const balanceNum = parseFloat(usdcBalance);
        if (balanceNum < 1) {
            setError('You need at least 1 USDC to donate.');
            return;
        }

        setDonatingTo(poolType);
        setError(null);
        setTxHash(null);

        try {
            const sdk = getSDK();
            const provider = sdk.getProvider();
            const amount = 1_000_000n; // 1 USDC

            console.log('=== Donating to Pool ===');
            console.log('Pool:', poolType);
            console.log('Amount: 1 USDC');

            const approveData = encodeFunctionData({
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [CONTRACT_ADDRESS, amount],
            });

            const donateData = encodeFunctionData({
                abi: CONTRACT_ABI,
                functionName: 'donateToPool',
                args: [poolType, amount],
            });

            const result = await provider.request({
                method: 'wallet_sendCalls',
                params: [{
                    version: '2.0.0',
                    chainId: `0x${baseSepolia.id.toString(16)}`,
                    from: userAddress,
                    calls: [
                        { to: USDC_ADDRESS, data: approveData, value: '0x0' },
                        { to: CONTRACT_ADDRESS, data: donateData, value: '0x0' },
                    ],
                }],
            }) as string;

            const transactionId = typeof result === 'string' ? result : result?.id || 'unknown';
            console.log('✅ Pool donation success:', transactionId);
            setTxHash(transactionId);

            setTimeout(async () => {
                // Refresh data
                const balance = await publicClient.readContract({
                    address: USDC_ADDRESS,
                    abi: ERC20_ABI,
                    functionName: 'balanceOf',
                    args: [userAddress as `0x${string}`],
                }) as bigint;
                setUsdcBalance(formatUnits(balance, 6));

                // Refresh pools
                const poolsData = await publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: CONTRACT_ABI,
                    functionName: 'getAllPools',
                }) as [string[], bigint[], bigint[]];

                const [names, totals, available] = poolsData;
                const poolsArray: Pool[] = [
                    {
                        name: names[0],
                        total: formatUnits(totals[0], 6),
                        available: formatUnits(available[0], 6),
                        icon: '📚',
                        description: 'Support education for underprivileged children',
                        type: PoolType.EDUCATION,
                    },
                    {
                        name: names[1],
                        total: formatUnits(totals[1], 6),
                        available: formatUnits(available[1], 6),
                        icon: '🏥',
                        description: 'Help cover medical expenses for those in need',
                        type: PoolType.HEALTHCARE,
                    },
                    {
                        name: names[2],
                        total: formatUnits(totals[2], 6),
                        available: formatUnits(available[2], 6),
                        icon: '🆘',
                        description: 'Provide immediate relief in crisis situations',
                        type: PoolType.EMERGENCY,
                    },
                ];
                setPools(poolsArray);

                onDonationSuccess?.();
            }, 5000);

        } catch (err: any) {
            console.error('❌ Pool donation error:', err);
            setError(err.message?.includes('rejected') ? 'Transaction rejected' : 'Donation failed. Please try again.');
        } finally {
            setDonatingTo(null);
        }
    };

    if (txHash) {
        return (
            <div className="text-center space-y-8 py-12">
                <div className="relative">
                    <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-4xl font-bold text-gray-900">Thank You! 🎉</h2>
                    <p className="text-xl text-gray-600">
                        Your <span className="font-bold text-blue-600">$1 USDC</span> donation was added to the pool
                    </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 max-w-md mx-auto">
                    <p className="text-xs text-gray-500">Transaction</p>
                    <p className="font-mono text-xs break-all text-gray-700 mt-2">{txHash}</p>
                    <a
                        href={`https://sepolia.basescan.org/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-xs underline mt-2 inline-block"
                    >
                        View on BaseScan
                    </a>
                </div>

                <button
                    onClick={() => setTxHash(null)}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700"
                >
                    Back to Pools
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-gray-900">Support Our Pools</h1>
                <p className="text-xl text-gray-600">
                    Donate to specific causes and help make a targeted impact
                </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 max-w-md mx-auto text-center">
                <p className="text-xs text-gray-500">Your Balance</p>
                <p className="text-2xl font-bold text-blue-600">${parseFloat(usdcBalance).toFixed(2)} USDC</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {pools.map((pool) => (
                    <div
                        key={pool.type}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6 space-y-4"
                    >
                        <div className="text-center">
                            <div className="text-6xl mb-4">{pool.icon}</div>
                            <h3 className="text-xl font-bold text-gray-900">{pool.name}</h3>
                            <p className="text-sm text-gray-600 mt-2">{pool.description}</p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Total Donated:</span>
                                <span className="font-bold text-gray-900">${parseFloat(pool.total).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Available:</span>
                                <span className="font-bold text-green-600">${parseFloat(pool.available).toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => handleDonateToPool(pool.type)}
                            disabled={donatingTo === pool.type || parseFloat(usdcBalance) < 1}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {donatingTo === pool.type ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Donating...</span>
                                </div>
                            ) : (
                                'Donate $1 USDC'
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}
        </div>
    );
}