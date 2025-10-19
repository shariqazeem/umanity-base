// app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-6xl font-bold text-gray-900 leading-tight">
            Give with One Tap.<br />
            <span className="text-blue-600">Help Someone Now.</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The first one-tap donation app on Base.<br />
            Transparent. Verifiable. Emotional.
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/app"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
            >
              Open App &rarr;
            </Link>
            <Link
              href="/apply"
              className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-gray-400 transition"
            >
              Apply as Recipient
            </Link>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="text-4xl font-bold text-blue-600">$0</div>
            <div className="text-gray-600 mt-2">Total Donated</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="text-4xl font-bold text-green-600">0</div>
            <div className="text-gray-600 mt-2">Recipients Helped</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="text-4xl font-bold text-purple-600">0</div>
            <div className="text-gray-600 mt-2">Total Donations</div>
          </div>
        </div>
      </section>

      {/* Built on Base */}
      <section className="text-center py-16">
        <div className="inline-flex items-center gap-2 text-gray-500">
          <span className="text-sm">Built on</span>
          <span className="text-lg font-bold">Base ⚡</span>
        </div>
      </section>
    </main>
  );
}