'use client';

import { useState, useEffect } from 'react';
import { getSDK } from '@/lib/base-sdk';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import { encodeFunctionData } from 'viem';
import { baseSepolia } from 'viem/chains';
import Link from 'next/link';

export default function ApplyPage() {
    const [userAddress, setUserAddress] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        story: '',
        proofUrl: '',
    });

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

    const handleConnect = async () => {
        try {
            const sdk = getSDK();
            const provider = sdk.getProvider();
            const accounts = await provider.request({
                method: 'eth_requestAccounts',
                params: [],
            }) as string[];

            if (accounts.length > 0) {
                setUserAddress(accounts[0]);
            }
        } catch (error) {
            console.error('Connection failed:', error);
            setError('Failed to connect wallet');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userAddress || !CONTRACT_ADDRESS) {
            setError('Please connect your wallet first');
            return;
        }

        if (!formData.name || !formData.story) {
            setError('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setTxHash(null);

        try {
            const sdk = getSDK();
            const provider = sdk.getProvider();

            console.log('=== Submitting Application ===');
            console.log('Name:', formData.name);
            console.log('Story length:', formData.story.length);

            const applyData = encodeFunctionData({
                abi: CONTRACT_ABI,
                functionName: 'applyAsRecipient',
                args: [formData.name, formData.story, formData.proofUrl || ''],
            });

            const result = await provider.request({
                method: 'wallet_sendCalls',
                params: [{
                    version: '2.0',
                    chainId: `0x${baseSepolia.id.toString(16)}`,
                    from: userAddress,
                    calls: [{
                        to: CONTRACT_ADDRESS,
                        data: applyData,
                        value: '0x0',
                    }],
                }],
            }) as string;

            const transactionId = typeof result === 'string' ? result : result?.id || 'unknown';
            console.log('✅ Application submitted:', transactionId);
            setTxHash(transactionId);

            // Reset form
            setFormData({ name: '', story: '', proofUrl: '' });

        } catch (err: any) {
            console.error('❌ Application error:', err);

            if (err.message?.includes('Already applied')) {
                setError('You have already submitted an application.');
            } else if (err.message?.includes('Already verified')) {
                setError('You are already a verified recipient.');
            } else if (err.message?.includes('rejected')) {
                setError('Transaction was rejected.');
            } else {
                setError('Failed to submit application. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
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

                        <nav className="flex items-center space-x-6">
                            <Link href="/app" className="text-gray-600 hover:text-gray-900 font-medium">
                                Donate
                            </Link>
                            <Link href="/leaderboard" className="text-gray-600 hover:text-gray-900 font-medium">
                                Leaderboard
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-12">
                {txHash ? (
                    <div className="text-center space-y-8">
                        <div className="relative">
                            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                                <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-4xl font-bold text-gray-900">Application Submitted! 🎉</h2>
                            <p className="text-xl text-gray-600">
                                Your application has been submitted for review. We&apos;ll review it as soon as possible.
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-left">
                            <h3 className="font-bold text-blue-900 mb-3">What happens next?</h3>
                            <ul className="text-blue-700 text-sm space-y-2">
                                <li>• Our team will review your application</li>
                                <li>• We may contact you for additional information</li>
                                <li>• You&apos;ll be notified once your application is approved</li>
                                <li>• Once approved, you&apos;ll start receiving random donations</li>
                            </ul>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4">
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

                        <Link
                            href="/app"
                            className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700"
                        >
                            Back to Home
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="text-center space-y-4">
                            <h1 className="text-4xl font-bold text-gray-900">Apply as Recipient</h1>
                            <p className="text-xl text-gray-600">
                                Tell us your story and join our community of verified recipients
                            </p>
                        </div>

                        {!userAddress ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                                <div className="space-y-6">
                                    <div className="text-6xl">🔐</div>
                                    <h2 className="text-2xl font-bold text-gray-900">Connect Your Wallet</h2>
                                    <p className="text-gray-600">
                                        You need to connect your Base Account to submit an application
                                    </p>
                                    <button
                                        onClick={handleConnect}
                                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700"
                                    >
                                        Connect Wallet
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="story" className="block text-sm font-semibold text-gray-900 mb-2">
                                        Your Story <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="story"
                                        value={formData.story}
                                        onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                                        rows={6}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Tell us about your situation and why you need help..."
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Please be honest and detailed. This helps us verify your application.
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="proofUrl" className="block text-sm font-semibold text-gray-900 mb-2">
                                        Supporting Documents (Optional)
                                    </label>
                                    <input
                                        type="url"
                                        id="proofUrl"
                                        value={formData.proofUrl}
                                        onChange={(e) => setFormData({ ...formData, proofUrl: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="https://... (Google Drive, Dropbox, etc.)"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Link to documents that support your application (medical bills, school documents, etc.)
                                    </p>
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <p className="text-sm text-yellow-800">
                                        <strong>Note:</strong> Your application will be reviewed by our team.
                                        We verify all recipients to ensure donations go to people who truly need help.
                                    </p>
                                </div>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-sm text-red-600">{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Submitting...</span>
                                        </div>
                                    ) : (
                                        'Submit Application'
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}