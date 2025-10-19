'use client';

import { useState } from 'react';
import { getSDK } from '@/lib/base-sdk';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import { encodeFunctionData } from 'viem';

interface OneTapButtonProps {
  userAddress: string;
  subAccountAddress?: string;
  onDonationSuccess?: () => void;
}

export function OneTapButton({ userAddress, subAccountAddress, onDonationSuccess }: OneTapButtonProps) {
  const [isDonating, setIsDonating] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<string | null>(null);

  const handleDonate = async () => {
    if (!CONTRACT_ADDRESS) {
      setError('Contract not deployed yet');
      return;
    }

    setIsDonating(true);
    setError(null);
    setTxHash(null);
    setRecipient(null);

    try {
      const sdk = getSDK();
      const provider = sdk.getProvider();

      // Encode the function call
      const data = encodeFunctionData({
        abi: CONTRACT_ABI,
        functionName: 'donateRandom',
      });

      const donation = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: subAccountAddress || userAddress,
          to: CONTRACT_ADDRESS,
          value: '0x38D7EA4C68000', // 0.001 ETH
          data,
        }],
      }) as string;

      console.log('Donation successful!', donation);
      setTxHash(donation);
      
      // Wait for transaction confirmation and get recipient
      setTimeout(async () => {
        try {
          const receipt = await provider.request({
            method: 'eth_getTransactionReceipt',
            params: [donation],
          }) as any;
          
          if (receipt && receipt.logs && receipt.logs.length > 0) {
            // Parse the DonationMade event to get recipient
            const log = receipt.logs[0];
            if (log.topics && log.topics.length > 2) {
              const recipientAddress = '0x' + log.topics[2].slice(26);
              setRecipient(recipientAddress);
            }
          }
        } catch (e) {
          console.error('Error getting recipient:', e);
        }
        
        onDonationSuccess?.();
      }, 3000);

    } catch (err: any) {
      console.error('Donation error:', err);
      setError(err.message || 'Donation failed');
    } finally {
      setIsDonating(false);
    }
  };

  if (txHash) {
    return (
      <div className="text-center space-y-8">
        {/* Success Animation */}
        <div className="relative">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-bounce-slow">
            <svg
              className="w-16 h-16 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="absolute inset-0 w-32 h-32 mx-auto bg-green-400 rounded-full animate-ping opacity-20" />
        </div>

        {/* Main Message */}
        <div className="space-y-4">
          <h2 className="text-4xl font-bold text-gray-900 animate-fade-in">
            You&apos;re Amazing! 🎉
          </h2>
          <p className="text-xl text-gray-600">
            Your donation of <span className="font-bold text-blue-600">$1</span> just helped someone in need
          </p>
        </div>

        {/* Impact Message */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-center gap-2 text-green-600">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">Transaction Confirmed</span>
          </div>
          
          {recipient && (
            <p className="text-sm text-gray-600">
              Sent to: <span className="font-mono text-xs">{recipient.slice(0, 6)}...{recipient.slice(-4)}</span>
            </p>
          )}

          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <span className="text-2xl">💙</span>
              <span>100% of your donation went directly to help someone</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              <span>Verified on Base blockchain - fully transparent</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span>Zero fees - every cent counts</span>
            </p>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <p className="text-xs text-gray-500 font-medium">Transaction Hash</p>
          <p className="font-mono text-xs break-all text-gray-700">{txHash}</p>
          
          <a
            href={`https://sepolia.basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            <span>View on BaseScan</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-4">
          <button
            onClick={() => setTxHash(null)}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold 
                     hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
          >
            Make Another Donation 💝
          </button>
        </div>

        {/* Share Section */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">Share your impact</p>
          <div className="flex gap-3 justify-center">
            <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
              <span className="text-xl">🐦</span>
            </button>
            <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
              <span className="text-xl">📱</span>
            </button>
            <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
              <span className="text-xl">📧</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Make Someone&apos;s Day</h1>
        <p className="text-xl text-gray-600">
          One tap sends <span className="font-bold text-blue-600">$1</span> to a verified person in need
        </p>
      </div>

      <button
        onClick={handleDonate}
        disabled={isDonating}
        className="group relative w-64 h-64 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 
                   text-white text-2xl font-bold shadow-2xl hover:shadow-3xl
                   transform hover:scale-105 active:scale-95
                   transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                   disabled:transform-none mx-auto"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <span className="relative z-10">
          {isDonating ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-lg">Sending...</span>
            </div>
          ) : (
            <>
              <div className="text-5xl mb-2">💝</div>
              <div>Give $1 Now</div>
            </>
          )}
        </span>
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="text-sm text-gray-500">
        Powered by Base ⚡
      </div>
    </div>
  );
}