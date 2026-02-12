import React, { useState, useEffect } from 'react';
import { Market, MarketStatus } from '../types/market';
import { useMarket } from '../hooks/useMarket';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { MILESTONE_MARKET_ABI } from '../constants/contracts';
import { parseEther, formatEther } from 'viem';

interface MarketCardProps {
  market: Market;
  onUpdate?: () => void;
}

export default function MarketCard({ market, onUpdate }: MarketCardProps) {
  const { address } = useAccount();
  const { getMarketStatus, updateMarketSupply } = useMarket();

  const [timeRemaining, setTimeRemaining] = useState('');
  const [progress, setProgress] = useState(0);
  const [betAmount, setBetAmount] = useState('');

  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  // Log write errors
  useEffect(() => {
    if (writeError) {
      console.error('Write contract error:', writeError);
      alert(`Transaction error: ${writeError.message}`);
    }
  }, [writeError]);

  // Get ETH balance
  const { data: ethBalance } = useBalance({ address });

  // Read on-chain data if market has contract
  const { data: onChainResolved } = useReadContract({
    address: market.marketContract as `0x${string}`,
    abi: MILESTONE_MARKET_ABI,
    functionName: 'resolved',
    query: { enabled: !!market.marketContract }
  });

  const { data: onChainReached } = useReadContract({
    address: market.marketContract as `0x${string}`,
    abi: MILESTONE_MARKET_ABI,
    functionName: 'reached',
    query: { enabled: !!market.marketContract && !!onChainResolved }
  });

  const { data: totalYes } = useReadContract({
    address: market.marketContract as `0x${string}`,
    abi: MILESTONE_MARKET_ABI,
    functionName: 'totalYes',
    query: { enabled: !!market.marketContract }
  });

  const { data: totalNo } = useReadContract({
    address: market.marketContract as `0x${string}`,
    abi: MILESTONE_MARKET_ABI,
    functionName: 'totalNo',
    query: { enabled: !!market.marketContract }
  });

  const { data: userYesDeposit } = useReadContract({
    address: market.marketContract as `0x${string}`,
    abi: MILESTONE_MARKET_ABI,
    functionName: 'yesDeposits',
    args: address ? [address] : undefined,
    query: { enabled: !!market.marketContract && !!address }
  });

  const { data: userNoDeposit } = useReadContract({
    address: market.marketContract as `0x${string}`,
    abi: MILESTONE_MARKET_ABI,
    functionName: 'noDeposits',
    args: address ? [address] : undefined,
    query: { enabled: !!market.marketContract && !!address }
  });

  const { data: hasClaimed } = useReadContract({
    address: market.marketContract as `0x${string}`,
    abi: MILESTONE_MARKET_ABI,
    functionName: 'claimed',
    args: address ? [address] : undefined,
    query: { enabled: !!market.marketContract && !!address && !!onChainResolved }
  });

  const { data: onChainDeadline } = useReadContract({
    address: market.marketContract as `0x${string}`,
    abi: MILESTONE_MARKET_ABI,
    functionName: 'deadline',
    query: { enabled: !!market.marketContract }
  });

  // Debug deadline and check contract version
  useEffect(() => {
    if (onChainDeadline) {
      const deadlineMs = Number(onChainDeadline) * 1000;
      const now = Date.now();
      console.log('On-chain deadline:', new Date(deadlineMs).toLocaleString());
      console.log('Current time:', new Date(now).toLocaleString());
      console.log('Time until deadline (ms):', deadlineMs - now);
      console.log('Is expired?', now >= deadlineMs);
    }
  }, [onChainDeadline]);

  // Check which version of contract this is (old or new)
  const { data: hasOldDeposit } = useReadContract({
    address: market.marketContract as `0x${string}`,
    abi: [{
      "inputs": [],
      "name": "totalDeposited",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    }],
    functionName: 'totalDeposited',
    query: { enabled: !!market.marketContract }
  });

  useEffect(() => {
    if (market.marketContract) {
      console.log('Checking contract version...');
      console.log('Has totalDeposited (OLD contract)?', hasOldDeposit !== undefined);
      console.log('Has totalYes (NEW contract)?', totalYes !== undefined);
    }
  }, [market.marketContract, hasOldDeposit, totalYes]);

  const status = getMarketStatus(market);

  // Reload on transaction success
  useEffect(() => {
    if (isSuccess) {
      onUpdate?.();
      setBetAmount('');
    }
  }, [isSuccess, onUpdate]);

  // Update countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = market.deadline - now;

      if (remaining <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [market.deadline]);

  // Update progress
  useEffect(() => {
    const currentSupply = Number(market.totalSupply);
    const progressPercent = Math.min((currentSupply / market.threshold) * 100, 100);
    setProgress(progressPercent);
  }, [market.totalSupply, market.threshold]);

  // Auto-refresh supply
  useEffect(() => {
    if (status === MarketStatus.PENDING) {
      const interval = setInterval(() => {
        updateMarketSupply(market.id);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [market.id, status, updateMarketSupply]);

  const handleBetYes = () => {
    console.log('BET YES clicked');
    console.log('Market contract:', market.marketContract);
    console.log('Bet amount:', betAmount);
    console.log('Address:', address);
    console.log('On-chain resolved?', onChainResolved);
    console.log('On-chain deadline (seconds):', onChainDeadline);
    console.log('Current block timestamp would be around:', Math.floor(Date.now() / 1000));

    if (!market.marketContract) {
      alert('No market contract address');
      return;
    }

    if (!betAmount) {
      alert('Please enter bet amount');
      return;
    }

    if (!address) {
      alert('Please connect wallet');
      return;
    }

    if (onChainResolved) {
      alert('Market is already resolved on-chain. Cannot place bets.');
      return;
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const deadlineTimestamp = Number(onChainDeadline);
    if (currentTimestamp >= deadlineTimestamp) {
      alert(`Market deadline has passed!\nDeadline: ${new Date(deadlineTimestamp * 1000).toLocaleString()}\nCurrent: ${new Date(currentTimestamp * 1000).toLocaleString()}`);
      return;
    }

    try {
      const value = parseEther(betAmount);
      console.log('Parsed value:', value.toString());

      writeContract({
        address: market.marketContract as `0x${string}`,
        abi: MILESTONE_MARKET_ABI,
        functionName: 'depositYes',
        value,
      });
    } catch (error) {
      console.error('Error betting YES:', error);
      alert(`Failed to bet YES: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleBetNo = () => {
    console.log('BET NO clicked');
    console.log('Market contract:', market.marketContract);
    console.log('Bet amount:', betAmount);
    console.log('Address:', address);
    console.log('On-chain resolved?', onChainResolved);
    console.log('On-chain deadline (seconds):', onChainDeadline);
    console.log('Current block timestamp would be around:', Math.floor(Date.now() / 1000));

    if (!market.marketContract) {
      alert('No market contract address');
      return;
    }

    if (!betAmount) {
      alert('Please enter bet amount');
      return;
    }

    if (!address) {
      alert('Please connect wallet');
      return;
    }

    if (onChainResolved) {
      alert('Market is already resolved on-chain. Cannot place bets.');
      return;
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const deadlineTimestamp = Number(onChainDeadline);
    if (currentTimestamp >= deadlineTimestamp) {
      alert(`Market deadline has passed!\nDeadline: ${new Date(deadlineTimestamp * 1000).toLocaleString()}\nCurrent: ${new Date(currentTimestamp * 1000).toLocaleString()}`);
      return;
    }

    try {
      const value = parseEther(betAmount);
      console.log('Parsed value:', value.toString());

      writeContract({
        address: market.marketContract as `0x${string}`,
        abi: MILESTONE_MARKET_ABI,
        functionName: 'depositNo',
        value,
      });
    } catch (error) {
      console.error('Error betting NO:', error);
      alert(`Failed to bet NO: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleResolve = () => {
    if (!market.marketContract) return;

    try {
      writeContract({
        address: market.marketContract as `0x${string}`,
        abi: MILESTONE_MARKET_ABI,
        functionName: 'resolve',
      });
    } catch (error) {
      console.error('Error resolving:', error);
      alert('Failed to resolve market');
    }
  };

  const handleClaim = () => {
    if (!market.marketContract) return;

    try {
      writeContract({
        address: market.marketContract as `0x${string}`,
        abi: MILESTONE_MARKET_ABI,
        functionName: 'claim',
      });
    } catch (error) {
      console.error('Error claiming:', error);
      alert('Failed to claim winnings');
    }
  };

  const currentSupply = Number(market.totalSupply) / Math.pow(10, market.tokenDecimals);
  const thresholdDisplay = market.threshold / Math.pow(10, market.tokenDecimals);

  const isResolved = onChainResolved || market.resolved;
  const hasReached = onChainReached || market.reached;

  return (
    <div className="border-4 border-dashed border-lime-400 rounded-3xl p-6 bg-green-800/50 shadow-sm hover:shadow-md transition-shadow">
      {/* Question */}
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-lime-300 mb-2">
          {market.question}
        </h3>
        <p className="text-sm text-teal-300 font-mono">
          {market.tokenName} ({market.tokenSymbol})
        </p>
        {market.marketContract && (
          <p className="text-xs text-gray-400 font-mono mt-1">
            Contract: {market.marketContract.slice(0, 10)}...{market.marketContract.slice(-8)}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-teal-300 mb-2">
          <span>Token Supply Progress</span>
          <span>{progress.toFixed(2)}%</span>
        </div>
        <div className="w-full bg-green-900 rounded-full h-3 overflow-hidden border-2 border-lime-400">
          <div
            className={`h-full transition-all duration-500 ${
              progress >= 100 ? 'bg-lime-400' : 'bg-teal-400'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-teal-300 mt-1">
          <span>Current: {currentSupply.toLocaleString()}</span>
          <span>Target: {thresholdDisplay.toLocaleString()}</span>
        </div>
      </div>

      {/* Pool Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-green-500/20 border-2 border-green-400 rounded-lg p-3">
          <p className="text-xs text-green-300 mb-1">YES Pool</p>
          <p className="font-semibold text-white text-lg">
            {totalYes ? formatEther(totalYes as bigint) : '0'} ETH
          </p>
          {userYesDeposit && Number(userYesDeposit) > 0 && (
            <p className="text-xs text-green-200 mt-1">
              Your bet: {formatEther(userYesDeposit as bigint)} ETH
            </p>
          )}
        </div>
        <div className="bg-red-500/20 border-2 border-red-400 rounded-lg p-3">
          <p className="text-xs text-red-300 mb-1">NO Pool</p>
          <p className="font-semibold text-white text-lg">
            {totalNo ? formatEther(totalNo as bigint) : '0'} ETH
          </p>
          {userNoDeposit && Number(userNoDeposit) > 0 && (
            <p className="text-xs text-red-200 mt-1">
              Your bet: {formatEther(userNoDeposit as bigint)} ETH
            </p>
          )}
        </div>
      </div>

      {/* Betting Interface */}
      {status === MarketStatus.PENDING && address && market.marketContract && (
        <div className="mb-4 space-y-3">
          <div className="bg-blue-500/20 border-2 border-blue-400 rounded-lg p-3">
            <p className="text-blue-300 text-sm mb-2">Place your bet</p>
            <input
              type="number"
              step="0.01"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Amount in ETH"
              className="w-full px-4 py-2 rounded-lg bg-green-900/50 border-2 border-lime-400 text-white placeholder-teal-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleBetYes}
              disabled={!betAmount || isPending}
              className="bg-green-600/50 rounded-2xl border-3 border-dashed border-green-400 text-white py-3 px-4 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed font-bold"
            >
              {isPending ? 'Betting...' : `BET YES`}
            </button>

            <button
              onClick={handleBetNo}
              disabled={!betAmount || isPending}
              className="bg-red-600/50 rounded-2xl border-3 border-dashed border-red-400 text-white py-3 px-4 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed font-bold"
            >
              {isPending ? 'Betting...' : `BET NO`}
            </button>
          </div>

          {ethBalance && (
            <p className="text-xs text-teal-300 text-center">
              Balance: {Number(formatEther(ethBalance.value)).toFixed(4)} ETH
            </p>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-green-900/50 border-2 border-lime-400 rounded p-3">
          <p className="text-xs text-teal-300 mb-1">Time Left</p>
          <p className="font-semibold text-white text-sm">{timeRemaining}</p>
        </div>
        <div className="bg-green-900/50 border-2 border-lime-400 rounded p-3">
          <p className="text-xs text-teal-300 mb-1">Total Pool</p>
          <p className="font-semibold text-white text-sm">
            {totalYes && totalNo
              ? (Number(formatEther(totalYes as bigint)) + Number(formatEther(totalNo as bigint))).toFixed(4)
              : '0'
            } ETH
          </p>
        </div>
        <div className="bg-green-900/50 border-2 border-lime-400 rounded p-3">
          <p className="text-xs text-teal-300 mb-1">Created</p>
          <p className="font-semibold text-white text-sm">
            {new Date(market.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {status === MarketStatus.EXPIRED && !isResolved && market.marketContract && (
          <button
            onClick={handleResolve}
            disabled={isPending}
            className="w-full bg-yellow-600/50 rounded-3xl border-4 border-dashed border-yellow-400 text-white py-2 px-4 hover:bg-yellow-700 disabled:bg-gray-600"
          >
            {isPending ? 'Resolving...' : 'Resolve Market'}
          </button>
        )}

        {isResolved && (
          <div className={`text-center p-4 rounded-lg ${
            hasReached
              ? 'bg-green-500/20 border-2 border-green-400 text-green-300'
              : 'bg-red-500/20 border-2 border-red-400 text-red-300'
          }`}>
            <p className="font-bold text-2xl mb-2">
              {hasReached ? '✓ YES WINS!' : '✗ NO WINS!'}
            </p>
            <p className="text-sm mb-1">
              {hasReached
                ? 'Threshold reached - YES bettors win'
                : 'Threshold not reached - NO bettors win'
              }
            </p>
            <p className="text-xs opacity-80">
              Final supply: {currentSupply.toLocaleString()} / {thresholdDisplay.toLocaleString()}
            </p>
          </div>
        )}

        {isResolved && address && !hasClaimed && market.marketContract && (
          <>
            {((hasReached && userYesDeposit && Number(userYesDeposit) > 0) ||
              (!hasReached && userNoDeposit && Number(userNoDeposit) > 0)) && (
              <button
                onClick={handleClaim}
                disabled={isPending}
                className="w-full bg-lime-600/50 rounded-3xl border-4 border-dashed border-lime-400 text-white py-3 px-4 hover:bg-lime-700 disabled:bg-gray-600 font-bold text-lg"
              >
                {isPending ? 'Claiming...' : '💰 Claim Winnings'}
              </button>
            )}
          </>
        )}

        {hasClaimed && (
          <div className="bg-lime-500/20 border-2 border-lime-400 rounded-lg p-3 text-center">
            <p className="text-lime-300 font-bold">✓ Already Claimed</p>
          </div>
        )}
      </div>
    </div>
  );
}
