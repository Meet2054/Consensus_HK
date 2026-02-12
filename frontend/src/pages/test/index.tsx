import React, { useState, useEffect } from "react";
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import FpmmABI from "../../contracts/fpmm/fpmmAbi.json";

const MarketDataDisplay = () => {
  const marketAddress = "0xd9251350D7fD00D57BF78B6C38B260Ec099370f8";
  const [prices, setPrices] = useState({
    yesPrice: 0,
    noPrice: 0,
    sharePrice: 0,
  });
  const [loading, setLoading] = useState(true);

  const { data: poolBalances } = useReadContract({
    address: marketAddress,
    abi: FpmmABI,
    functionName: "getPoolBalances",
  }) as { data: bigint[] | undefined };

  const { data: sharePrice } = useReadContract({
    address: marketAddress,
    abi: FpmmABI,
    functionName: "getSharePrice",
  });

  const calculateProbability = (balance: any, totalBalance: any) => {
    if (totalBalance === 0) return 0;
    return ((balance / totalBalance) * 100).toFixed(2);
  };

  const formatSharePrice = (price: any) => {
    return Number().toFixed(4);
  };

  useEffect(() => {
    if (poolBalances && sharePrice) {
      try {
        setLoading(true);

        // Convert to numbers for calculation
        const yesBalance = Number(formatUnits(poolBalances[0], 18));
        const noBalance = Number(formatUnits(poolBalances[1], 18));
        const totalBalance = yesBalance + noBalance;

        // Calculate probabilities
        const yesProbability = calculateProbability(yesBalance, totalBalance);
        const noProbability = calculateProbability(noBalance, totalBalance);

        setPrices({
          yesPrice: Number(yesProbability),
          noPrice: Number(noProbability),
          sharePrice: Number(sharePrice),
        });
      } catch (error) {
        console.error("Error processing market data:", error);
      } finally {
        setLoading(false);
      }
    }
  }, [poolBalances, sharePrice]);

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">
          Market Probabilities
        </h2>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center p-4">Loading...</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l2 2 4-4" />
                </svg>
                <span className="font-medium">Yes</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-700">
                  {prices.yesPrice}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-red-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
                <span className="font-medium">No</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-red-700">
                  {prices.noPrice}%
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Share Price:</span>
                <span className="font-medium">
                  {formatSharePrice(prices.sharePrice)} tokens
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketDataDisplay;
