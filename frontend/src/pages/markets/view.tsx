import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import MarketCard from '../../components/MarketCard';
import { Market } from '../../types/market';
import Link from 'next/link';

export default function ViewMarkets() {
  const { address } = useAccount();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  const loadMarkets = () => {
    const stored = localStorage.getItem('prediction-markets');
    if (stored) {
      try {
        setMarkets(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored markets:', e);
      }
    }
  };

  useEffect(() => {
    loadMarkets();
  }, []);

  const filteredMarkets = markets.filter((market) => {
    const now = Date.now();

    switch (filter) {
      case 'active':
        return !market.resolved && now < market.deadline;
      case 'resolved':
        return market.resolved;
      default:
        return true;
    }
  });

  return (
    <div className="flex flex-col items-center min-h-screen py-8">
      {/* Header */}
      <div className="press-start-2p-regular text-xl md:text-4xl items-center justify-center font-extrabold text-center mb-10 animate-bounce [text-shadow:_4px_4px_0_lime,_8px_8px_0_green] text-white">
        View Prediction Markets
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-lime-400 text-black'
              : 'bg-green-800/50 border-2 border-lime-400 text-white hover:bg-green-700'
          }`}
        >
          All ({markets.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            filter === 'active'
              ? 'bg-lime-400 text-black'
              : 'bg-green-800/50 border-2 border-lime-400 text-white hover:bg-green-700'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            filter === 'resolved'
              ? 'bg-lime-400 text-black'
              : 'bg-green-800/50 border-2 border-lime-400 text-white hover:bg-green-700'
          }`}
        >
          Resolved
        </button>
      </div>

      {/* Markets Grid */}
      {filteredMarkets.length === 0 ? (
        <div className="bg-green-800/50 p-8 rounded-3xl border-4 border-dashed border-lime-400 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No markets found
          </h3>
          <p className="text-teal-300 mb-6">
            {filter === 'all'
              ? 'Create the first prediction market'
              : `No ${filter} markets available`}
          </p>
          {filter === 'all' && (
            <Link href="/markets">
              <button className="bg-green-800/50 rounded-3xl border-4 border-dashed border-lime-400 text-white text-xl hover:bg-teal-700 hover:text-white px-6 py-3">
                Create Market
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl px-4">
          {filteredMarkets.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              onUpdate={loadMarkets}
            />
          ))}
        </div>
      )}
    </div>
  );
}
