import { useState, useCallback, useEffect } from 'react';
import { Market, MarketStatus, TokenInfo } from '../types/market';
import { AlchemyBaseClient } from '../lib/AlchemyBaseClient';

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '';

export function useMarket() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alchemyClient] = useState(() => new AlchemyBaseClient(ALCHEMY_API_KEY));

  // Load markets from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('prediction-markets');
    if (stored) {
      try {
        setMarkets(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored markets:', e);
      }
    }
  }, []);

  // Save markets to localStorage whenever they change
  useEffect(() => {
    if (markets.length > 0) {
      localStorage.setItem('prediction-markets', JSON.stringify(markets));
    }
  }, [markets]);

  // Validate and fetch token info
  const fetchTokenInfo = useCallback(
    async (tokenAddress: string): Promise<TokenInfo> => {
      setLoading(true);
      setError(null);

      try {
        // Validate address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
          throw new Error('Invalid Ethereum address format');
        }

        // Check if it's a contract
        const isContract = await alchemyClient.isContract(tokenAddress);
        if (!isContract) {
          throw new Error('Address is not a contract');
        }

        // Fetch token metadata
        const metadata = await alchemyClient.getTokenMetadata(tokenAddress);

        // Fetch total supply
        const totalSupply = await alchemyClient.getTotalSupply(tokenAddress);

        // Fetch contract creator
        let creator = 'Unknown';
        try {
          const creatorInfo = await alchemyClient.getContractCreator(tokenAddress);
          creator = creatorInfo.creator;
        } catch (e) {
          console.warn('Could not fetch creator:', e);
        }

        const tokenInfo: TokenInfo = {
          address: tokenAddress,
          name: metadata.name,
          symbol: metadata.symbol,
          decimals: metadata.decimals,
          creator,
          totalSupply,
        };

        setLoading(false);
        return tokenInfo;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch token info';
        setError(message);
        setLoading(false);
        throw new Error(message);
      }
    },
    [alchemyClient]
  );

  // Check if bonding curve threshold is reached
  const checkBondingCurveReached = useCallback(
    async (tokenAddress: string, threshold: number): Promise<boolean> => {
      try {
        const totalSupply = await alchemyClient.getTotalSupply(tokenAddress);
        const totalSupplyNum = Number(totalSupply);
        return totalSupplyNum >= threshold;
      } catch (err) {
        console.error('Error checking bonding curve:', err);
        return false;
      }
    },
    [alchemyClient]
  );

  // Create a new market
  const createMarket = useCallback(
    async (
      tokenAddress: string,
      question: string,
      threshold: number,
      deadline: number
    ): Promise<Market> => {
      setLoading(true);
      setError(null);

      try {
        // Validate deadline
        if (deadline <= Date.now()) {
          throw new Error('Deadline must be in the future');
        }

        // Fetch token info
        const tokenInfo = await fetchTokenInfo(tokenAddress);

        // Validate threshold
        const currentSupply = Number(tokenInfo.totalSupply);
        if (threshold <= currentSupply) {
          throw new Error('Threshold must be higher than current total supply');
        }

        // Create market
        const market: Market = {
          id: `${tokenAddress}-${Date.now()}`,
          question,
          tokenAddress,
          tokenName: tokenInfo.name,
          tokenSymbol: tokenInfo.symbol,
          tokenDecimals: tokenInfo.decimals,
          contractCreator: tokenInfo.creator,
          totalSupply: tokenInfo.totalSupply,
          threshold,
          deadline,
          yesPool: 0,
          noPool: 0,
          bets: [],
          resolved: false,
          reached: false,
          createdAt: Date.now(),
        };

        setMarkets((prev) => [...prev, market]);
        setLoading(false);

        return market;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create market';
        setError(message);
        setLoading(false);
        throw new Error(message);
      }
    },
    [fetchTokenInfo]
  );

  // Resolve a market
  const resolveMarket = useCallback(
    async (marketId: string): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const market = markets.find((m) => m.id === marketId);
        if (!market) {
          throw new Error('Market not found');
        }

        if (market.resolved) {
          throw new Error('Market already resolved');
        }

        const now = Date.now();
        if (now < market.deadline) {
          throw new Error('Market deadline has not passed yet');
        }

        // Check if threshold was reached
        const reached = await checkBondingCurveReached(
          market.tokenAddress,
          market.threshold
        );

        setMarkets((prev) =>
          prev.map((m) =>
            m.id === marketId
              ? { ...m, resolved: true, reached, resolvedAt: now }
              : m
          )
        );

        setLoading(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to resolve market';
        setError(message);
        setLoading(false);
        throw new Error(message);
      }
    },
    [markets, checkBondingCurveReached]
  );

  // Get market status
  const getMarketStatus = useCallback((market: Market): MarketStatus => {
    const now = Date.now();

    if (market.resolved) {
      return market.reached ? MarketStatus.REACHED : MarketStatus.FAILED;
    }

    if (now >= market.deadline) {
      return MarketStatus.EXPIRED;
    }

    return MarketStatus.PENDING;
  }, []);

  // Update market total supply
  const updateMarketSupply = useCallback(
    async (marketId: string): Promise<void> => {
      const market = markets.find((m) => m.id === marketId);
      if (!market) return;

      try {
        const totalSupply = await alchemyClient.getTotalSupply(market.tokenAddress);

        setMarkets((prev) =>
          prev.map((m) =>
            m.id === marketId ? { ...m, totalSupply } : m
          )
        );
      } catch (err) {
        console.error('Failed to update supply:', err);
      }
    },
    [markets, alchemyClient]
  );

  return {
    markets,
    loading,
    error,
    fetchTokenInfo,
    createMarket,
    resolveMarket,
    getMarketStatus,
    checkBondingCurveReached,
    updateMarketSupply,
  };
}
