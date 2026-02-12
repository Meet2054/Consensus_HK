import React, { useState } from 'react';
import { useMarket } from '../hooks/useMarket';
import MarketCard from './MarketCard';
import CreateMarketModal from './CreateMarketModal';

interface MarketsListProps {
  userAddress?: string;
}

export default function MarketsList({ userAddress }: MarketsListProps) {
  const { markets } = useMarket();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prediction Markets</h1>
          <p className="text-gray-600 mt-2">
            Bet on ERC20 token bonding curve thresholds
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold shadow-sm"
        >
          + Create Market
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({markets.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'active'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'resolved'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Resolved
        </button>
      </div>

      {/* Markets Grid */}
      {filteredMarkets.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No markets found
          </h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all'
              ? 'Create the first prediction market'
              : `No ${filter} markets available`}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Create Market
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMarkets.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
            />
          ))}
        </div>
      )}

      {/* Create Market Modal */}
      <CreateMarketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(marketId) => {
          console.log('Market created:', marketId);
        }}
      />
    </div>
  );
}
