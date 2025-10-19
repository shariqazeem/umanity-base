'use client';

import { useState, useEffect } from 'react';
import { getSDK } from '@/lib/base-sdk';
import { CONTRACT_ADDRESS, CONTRACT_ABI, USDC_ADDRESS, ERC20_ABI } from '@/lib/contract';
import { encodeFunctionData, createPublicClient, http, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

interface OneTapButtonProps {
  userAddress: string;
  onDonationSuccess?: () => void;
}

export function OneTapButton({ userAddress, onDonationSuccess }: OneTapButtonProps) {
  const [isDonating, setIsDonating] = useState(false);
  const [bundleId, setBundleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string>('0');
  const [checkingBalance, setCheckingBalance] = useState(true);

  useEffect(() => {
    const checkBalance = async () => {
      if (!userAddress) return;
      
      try {
        setCheckingBalance(true);
        const balance = await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [userAddress as `0x${string}`],
        }) as bigint;

        setUsdcBalance(formatUnits(balance, 6));
        console.log('USDC Balance:', formatUnits(balance, 6));
      } catch (error) {
        console.error('Error checking balance:', error);
      } finally {
        setCheckingBalance(false);
      }
    };

    checkBalance();
  }, [userAddress]);

  const handleDonate = async () => {
    if (!CONTRACT_ADDRESS || !userAddress) {
      setError('Please connect your wallet first.');
      return;
    }

    const balanceNum = parseFloat(usdcBalance);
    if (balanceNum < 1) {
      setError('You need at least 1 USDC to donate.');
      return;
    }

    setIsDonating(true);
    setError(null);
    setBundleId(null);

    try {
      const sdk = getSDK();
      const provider = sdk.getProvider();
      const amount = 1_000_000n; // 1 USDC

      console.log('=== Starting Donation ===');
      console.log('From:', userAddress);
      console.log('Amount: 1 USDC');

      const approveData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, amount],
      });

      const donateData = encodeFunctionData({
        abi: CONTRACT_ABI,
        functionName: 'donateRandom',
        args: [amount],
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
      }) as any;

      // wallet_sendCalls returns a bundle ID, not a tx hash
      const callsId = typeof result === 'string' ? result : result?.id;
      
      console.log('✅ Success! Bundle ID:', callsId);
      setBundleId(callsId);
      
      setTimeout(async () => {
        try {
          const newBalance = await publicClient.readContract({
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [userAddress as `0x${string}`],
          }) as bigint;
          setUsdcBalance(formatUnits(newBalance, 6));
          onDonationSuccess?.();
        } catch (e) {
          console.error('Error refreshing balance:', e);
        }
      }, 5000);

    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message?.includes('rejected') ? 'Transaction rejected' : 'Donation failed. Please try again.');
    } finally {
      setIsDonating(false);
    }
  };

  if (bundleId) {
    return (
      <div className="text-center space-y-8">
        <div className="relative">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-bounce-slow">
            <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="absolute inset-0 w-32 h-32 mx-auto bg-green-400 rounded-full animate-ping opacity-20" />
        </div>

        <div className="space-y-4">
          <h2 className="text-4xl font-bold text-gray-900 animate-fade-in">
            You&apos;re Amazing! 🎉
          </h2>
          <p className="text-xl text-gray-600">
            Your donation of <span className="font-bold text-blue-600">$1 USDC</span> just helped someone in need
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-center gap-2 text-green-600">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">Transaction Confirmed</span>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <span className="text-2xl">💙</span>
              <span>100% of your donation went directly to help someone</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              <span>Recorded on Base blockchain - fully transparent</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span>Gas fees handled automatically</span>
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <p className="text-xs text-gray-500 font-medium">Bundle ID</p>
          <p className="font-mono text-xs break-all text-gray-700">{bundleId}</p>
          <p className="text-xs text-gray-500 mt-2">
            This is a batch transaction ID. The individual transactions are being processed on Base.
          </p>
        </div>

        <button
          onClick={() => setBundleId(null)}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
        >
          Make Another Donation 💝
        </button>
      </div>
    );
  }

  return (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Make Someone&apos;s Day</h1>
        <p className="text-xl text-gray-600">
          One tap sends <span className="font-bold text-blue-600">$1 USDC</span> to a verified person in need
        </p>
      </div>

      <div className="bg-blue-50 rounded-xl p-4 max-w-md mx-auto">
        <p className="text-xs text-gray-500">Your Balance</p>
        {checkingBalance ? (
          <p className="text-sm text-gray-400">Checking...</p>
        ) : (
          <p className="text-2xl font-bold text-blue-600">${parseFloat(usdcBalance).toFixed(2)} USDC</p>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-left max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div className="text-2xl">✨</div>
          <div className="flex-1 space-y-2">
            <p className="font-semibold text-blue-900">How It Works</p>
            <ul className="text-blue-700 text-xs space-y-1">
              <li>• Click the button to donate $1 USDC</li>
              <li>• A random verified recipient is selected</li>
              <li>• 100% of your donation goes directly to them</li>
              <li>• All transactions recorded on Base blockchain</li>
            </ul>
          </div>
        </div>
      </div>

      <button
        onClick={handleDonate}
        disabled={isDonating || checkingBalance || parseFloat(usdcBalance) < 1}
        className="group relative w-64 h-64 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 
                   text-white text-2xl font-bold shadow-2xl hover:shadow-3xl
                   transform hover:scale-105 active:scale-95
                   transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                   disabled:transform-none mx-auto flex items-center justify-center"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <span className="relative z-10 flex flex-col items-center">
          {isDonating ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-lg">Sending...</span>
            </div>
          ) : checkingBalance ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-lg">Loading...</span>
            </div>
          ) : (
            <>
              <div className="text-5xl mb-2">💝</div>
              <div>Give $1 Now</div>
            </>
          )}
        </span>
      </button>

      {parseFloat(usdcBalance) < 1 && !checkingBalance && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto space-y-3">
          <p className="text-sm text-yellow-800 font-semibold">
            You need at least 1 USDC to donate
          </p>
          <a
            href="https://faucet.circle.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-blue-600 hover:text-blue-700 text-xs underline"
          >
            Get testnet USDC from Circle Faucet →
          </a>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="text-sm text-gray-500">
        Powered by Base Account ⚡
      </div>
    </div>
  );
}