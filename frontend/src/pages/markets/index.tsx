"use client";
import TextField from "@mui/material/TextField";
import React, { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useReadContract } from "wagmi";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import confetti from "canvas-confetti";
import { AlchemyBaseClient } from "../../lib/AlchemyBaseClient";
import { Market, TokenInfo } from "../../types/market";
import { FACTORY_ADDRESS, MARKET_FACTORY_ABI } from "../../constants/contracts";
import { decodeEventLog } from "viem";

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '';

export default function MarketsCreate() {
  const [isMounted, setIsMounted] = useState(false);
  const { address } = useAccount();
  const publicClient = usePublicClient();

  // Step state
  const [step, setStep] = useState<'input' | 'configure' | 'deploying' | 'success'>('input');

  // Form data
  const [tokenAddress, setTokenAddress] = useState("");
  const [question, setQuestion] = useState("");
  const [threshold, setThreshold] = useState("");
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs().add(7, 'day'));

  // Token info
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Created market
  const [createdMarket, setCreatedMarket] = useState<Market | null>(null);
  const [newMarketAddress, setNewMarketAddress] = useState<string>("");

  const [alchemyClient] = useState(() => new AlchemyBaseClient(ALCHEMY_API_KEY));

  // Contract interaction
  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract();
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle contract deployment success
  useEffect(() => {
    async function handleDeployment() {
      if (isConfirmed && hash && publicClient && tokenInfo) {
        console.log('Transaction confirmed! Hash:', hash);
        console.log('Fetching receipt...');

        try {
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          console.log('Receipt received:', receipt);
          console.log('Number of logs:', receipt.logs.length);

          // Parse logs to get new market address
          let marketFound = false;
          for (const log of receipt.logs) {
            try {
              console.log('Attempting to decode log:', log);
              const decoded = decodeEventLog({
                abi: MARKET_FACTORY_ABI,
                data: log.data,
                topics: log.topics,
              });

              console.log('Decoded event:', decoded.eventName, decoded.args);

              if (decoded.eventName === "MarketCreated") {
                marketFound = true;
                const marketAddress = decoded.args.market as string;
                console.log('Market created at address:', marketAddress);
                setNewMarketAddress(marketAddress);

                // Recalculate threshold in base units for storage
                const thresholdInBaseUnits = BigInt(threshold) * (10n ** BigInt(tokenInfo.decimals));

                // Create market object with contract address
                const market: Market = {
                  id: marketAddress,
                  question: question.trim(),
                  tokenAddress,
                  tokenName: tokenInfo?.name || "",
                  tokenSymbol: tokenInfo?.symbol || "",
                  tokenDecimals: tokenInfo?.decimals || 18,
                  contractCreator: tokenInfo?.creator || "",
                  totalSupply: tokenInfo?.totalSupply || "0",
                  threshold: Number(thresholdInBaseUnits),
                  deadline: selectedDate?.valueOf() || Date.now(),
                  yesPool: 0,
                  noPool: 0,
                  bets: [],
                  resolved: false,
                  reached: false,
                  createdAt: Date.now(),
                  marketContract: marketAddress,
                };

                console.log('Saving market to localStorage:', market);

                // Save to localStorage
                const existingMarkets = localStorage.getItem('prediction-markets');
                const markets = existingMarkets ? JSON.parse(existingMarkets) : [];
                markets.push(market);
                localStorage.setItem('prediction-markets', JSON.stringify(markets));

                setCreatedMarket(market);
                setStep('success');

                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 },
                });

                break; // Exit loop once market is found
              }
            } catch (e) {
              console.log('Failed to decode log (might not be our event):', e);
            }
          }

          if (!marketFound) {
            console.error('MarketCreated event not found in transaction logs!');
            setValidationError('Transaction succeeded but could not find market address. Check console.');
            setStep('configure');
          }
        } catch (error) {
          console.error('Error parsing deployment:', error);
          setValidationError('Failed to get market address from transaction');
          setStep('configure');
        }
      }
    }

    handleDeployment();
  }, [isConfirmed, hash, publicClient, question, tokenAddress, tokenInfo, threshold, selectedDate]);

  if (!isMounted) {
    return null;
  }

  const handleValidateToken = async () => {
    setValidationError(null);
    setIsValidating(true);

    try {
      if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
        throw new Error('Invalid Ethereum address format');
      }

      const isContract = await alchemyClient.isContract(tokenAddress);
      if (!isContract) {
        throw new Error('Address is not a contract');
      }

      // Try to get metadata, but use defaults if it fails (for pump.fun tokens)
      let name = 'Unknown Token';
      let symbol = 'TOKEN';
      let decimals = 18;
      let totalSupply = '0';

      try {
        const metadata = await alchemyClient.getTokenMetadata(tokenAddress);
        name = metadata.name || name;
        symbol = metadata.symbol || symbol;
        decimals = metadata.decimals || decimals;
      } catch (e) {
        console.warn('Could not fetch token metadata (using defaults):', e);
      }

      try {
        totalSupply = await alchemyClient.getTotalSupply(tokenAddress);
      } catch (e) {
        console.warn('Could not fetch total supply:', e);
      }

      let creator = 'Unknown';
      try {
        const creatorInfo = await alchemyClient.getContractCreator(tokenAddress);
        creator = creatorInfo.creator;
      } catch (e) {
        console.warn('Could not fetch creator:', e);
      }

      const info: TokenInfo = {
        address: tokenAddress,
        name,
        symbol,
        decimals,
        creator,
        totalSupply,
      };

      setTokenInfo(info);
      setStep('configure');

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Validation failed';
      setValidationError(message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleCreateMarket = async () => {
    if (!tokenInfo || !selectedDate || !question) return;

    try {
      const thresholdInTokens = threshold;
      const deadlineSeconds = BigInt(Math.floor(selectedDate.valueOf() / 1000)); // Convert to seconds

      if (!question.trim()) {
        setValidationError('Please enter a prediction question');
        return;
      }

      // Fetch REAL on-chain supply AND decimals using Alchemy API
      console.log('Fetching real on-chain data from Alchemy API...');
      let realSupply: bigint;
      let realDecimals: number;

      try {
        // Use Alchemy's enhanced API to get token metadata
        const alchemyClient = new AlchemyBaseClient(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '');

        // Get metadata using Alchemy API (works for non-standard tokens)
        const metadata = await alchemyClient.getTokenMetadataEnhanced(tokenAddress) as {
          decimals: number;
          name: string;
          symbol: string;
        };
        realDecimals = metadata.decimals ?? 18;
        console.log('Real decimals from Alchemy API:', realDecimals);
        console.log('Token metadata:', metadata);

        // Get total supply using Alchemy API
        const supplyString = await alchemyClient.getTotalSupply(tokenAddress);
        realSupply = BigInt(supplyString);
        console.log('Real on-chain supply:', realSupply.toString());
      } catch (e) {
        console.warn('Could not fetch on-chain data from Alchemy, using cached values');
        console.error(e);
        realDecimals = tokenInfo.decimals;
        realSupply = BigInt(tokenInfo.totalSupply || 0);
      }

      // ALWAYS calculate threshold using real decimals
      const thresholdInBaseUnits = BigInt(thresholdInTokens) * (10n ** BigInt(realDecimals));
      console.log('Threshold calculation:');
      console.log('  Input tokens:', thresholdInTokens);
      console.log('  Decimals:', realDecimals);
      console.log('  Base units:', thresholdInBaseUnits.toString());

      // Since we're on TESTNET creating markets for MAINNET tokens,
      // we use Alchemy API data (already fetched as realSupply)
      // The contract will store this value instead of calling the token
      const currentSupplyForContract = realSupply;
      console.log('Using mainnet supply from Alchemy API:', currentSupplyForContract.toString());
      console.log('Supply (tokens):', Number(currentSupplyForContract) / Math.pow(10, realDecimals));

      // Validate threshold > supply
      if (thresholdInBaseUnits <= currentSupplyForContract) {
        const currentSupplyTokens = Number(currentSupplyForContract) / Math.pow(10, realDecimals);
        const thresholdTokens = Number(thresholdInBaseUnits) / Math.pow(10, realDecimals);
        setValidationError(
          `Threshold must be GREATER than current on-chain supply!\n\n` +
          `Current supply: ${currentSupplyTokens.toLocaleString()} ${tokenInfo.symbol}\n` +
          `Your threshold: ${thresholdTokens.toLocaleString()} ${tokenInfo.symbol}\n\n` +
          `Enter a number HIGHER than ${Math.ceil(currentSupplyTokens)}`
        );
        return;
      }

      if (selectedDate.valueOf() <= Date.now()) {
        setValidationError('Deadline must be in the future');
        return;
      }

      setStep('deploying');

      // Debug: Log values being sent
      console.log('Creating market with:');
      console.log('Token:', tokenAddress);
      console.log('Threshold (base units):', thresholdInBaseUnits.toString());
      console.log('Deadline (seconds):', deadlineSeconds.toString());
      console.log('Current supply (base units):', currentSupplyForContract.toString());
      console.log('Threshold > Supply?', thresholdInBaseUnits > currentSupplyForContract);
      console.log('Threshold (tokens):', Number(thresholdInBaseUnits) / Math.pow(10, realDecimals));
      console.log('Supply (tokens):', Number(currentSupplyForContract) / Math.pow(10, realDecimals));

      // Call factory contract to create market with current supply parameter
      writeContract({
        address: FACTORY_ADDRESS,
        abi: MARKET_FACTORY_ABI,
        functionName: 'createMarket',
        args: [
          tokenAddress as `0x${string}`,
          thresholdInBaseUnits,
          deadlineSeconds,
          currentSupplyForContract  // Pass current supply from mainnet
        ],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create market';
      setValidationError(message);
      setStep('configure');
    }
  };

  const handleReset = () => {
    setStep('input');
    setTokenAddress('');
    setQuestion('');
    setThreshold('');
    setSelectedDate(dayjs().add(7, 'day'));
    setTokenInfo(null);
    setValidationError(null);
    setCreatedMarket(null);
    setNewMarketAddress('');
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-[50vh]">
      <div className="press-start-2p-regular text-xl md:text-4xl items-center justify-center font-extrabold text-center mb-10 animate-bounce [text-shadow:_4px_4px_0_lime,_8px_8px_0_green] text-white">
        Create Prediction Market
      </div>

      <div className="flex flex-col justify-center items-center bg-green-800/50 p-6 rounded-3xl border-4 border-dashed border-lime-400 text-white text-xl w-full max-w-2xl">
        <div className="press-start-2p-regular text-xl mb-4">
          Deploy on-chain markets, bet ETH, win big!
        </div>

        {/* Step 1: Token Address Input */}
        {step === 'input' && (
          <div className="w-full space-y-4">
            <div className="text-teal-300 bg-slate-50 w-full">
              <TextField
                focused
                variant="filled"
                label="ERC20 Token Contract Address"
                value={tokenAddress}
                color="success"
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="0x..."
                fullWidth
                helperText="Enter the contract address of a pump.fun token on Base"
              />
            </div>

            {validationError && (
              <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-3 text-red-200 text-sm">
                {validationError}
              </div>
            )}

            <button
              className="bg-green-800/50 rounded-3xl border-4 border-dashed border-lime-400 text-white text-xl hover:bg-teal-700 hover:text-white p-2 w-full"
              onClick={handleValidateToken}
              disabled={!tokenAddress || isValidating}
            >
              {isValidating ? 'Validating...' : 'Validate Token'}
            </button>
          </div>
        )}

        {/* Step 2: Configure Market */}
        {step === 'configure' && tokenInfo && (
          <div className="w-full space-y-4">
            <div className="bg-green-900/50 rounded-2xl border-2 border-lime-400 p-4 space-y-3">
              <h3 className="text-lime-300 font-bold text-lg">Token Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-teal-300">Token Name:</p>
                  <p className="text-white font-semibold">{tokenInfo.name}</p>
                </div>
                <div>
                  <p className="text-teal-300">Symbol:</p>
                  <p className="text-white font-semibold">{tokenInfo.symbol}</p>
                </div>
                <div>
                  <p className="text-teal-300">Decimals:</p>
                  <p className="text-white font-semibold">{tokenInfo.decimals}</p>
                </div>
                <div>
                  <p className="text-teal-300">Total Supply:</p>
                  <p className="text-white font-semibold">
                    {(Number(tokenInfo.totalSupply) / Math.pow(10, tokenInfo.decimals)).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-teal-300 bg-slate-50 w-full">
              <TextField
                focused
                variant="filled"
                label="Prediction Question"
                value={question}
                color="success"
                onChange={(e) => setQuestion(e.target.value)}
                fullWidth
                placeholder={`Will ${tokenInfo.symbol} reach the threshold before deadline?`}
                helperText="What are users betting on?"
              />
            </div>

            <div className="text-teal-300 bg-slate-50 w-full">
              <TextField
                focused
                variant="filled"
                label={`Threshold (in ${tokenInfo.symbol} tokens)`}
                type="number"
                value={threshold}
                color="success"
                onChange={(e) => setThreshold(e.target.value)}
                fullWidth
                placeholder={`e.g., ${Math.ceil((Number(tokenInfo.totalSupply) / Math.pow(10, tokenInfo.decimals)) * 1.5)}`}
                helperText={`Current supply: ${(Number(tokenInfo.totalSupply) / Math.pow(10, tokenInfo.decimals)).toLocaleString()} ${tokenInfo.symbol}. Enter a HIGHER number (e.g., ${Math.ceil((Number(tokenInfo.totalSupply) / Math.pow(10, tokenInfo.decimals)) * 2).toLocaleString()} for 2x)`}
              />
            </div>

            <div className="flex flex-col items-center space-y-4">
              <label className="text-lime-300 font-medium">Select Deadline:</label>
              <DateTimePicker
                label="End Date"
                value={selectedDate}
                onChange={(value) => setSelectedDate(value)}
                className="border-white"
              />
            </div>

            {validationError && (
              <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-3 text-red-200 text-sm">
                {validationError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                className="flex-1 bg-gray-600/50 rounded-2xl border-2 border-gray-400 text-white text-lg hover:bg-gray-700 p-2"
                onClick={handleReset}
              >
                Back
              </button>
              <button
                className="flex-1 bg-green-800/50 rounded-3xl border-4 border-dashed border-lime-400 text-white text-xl hover:bg-teal-700 p-2"
                onClick={handleCreateMarket}
                disabled={!threshold || !selectedDate || !question}
              >
                Deploy Market
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Deploying */}
        {step === 'deploying' && (
          <div className="w-full text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-lime-400 mx-auto"></div>
            <p className="text-lime-300 text-lg">Deploying Market Contract...</p>
            <p className="text-teal-300 text-sm">
              {isPending ? 'Waiting for confirmation...' : 'Processing transaction...'}
            </p>
            {writeError && (
              <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-3 text-red-200 text-sm mt-4">
                <p className="font-bold">Transaction Failed:</p>
                <p className="mt-2">{writeError.message}</p>
                <button
                  onClick={() => setStep('configure')}
                  className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Go Back
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && createdMarket && (
          <div className="w-full space-y-4">
            <div className="bg-green-900/50 rounded-2xl border-2 border-lime-400 p-6 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-lime-300 font-bold text-2xl mb-3">
                Market Deployed On-Chain!
              </h3>

              <div className="space-y-2 text-left">
                <p className="text-white">
                  <span className="text-teal-300">Question:</span> {createdMarket.question}
                </p>
                <p className="text-white">
                  <span className="text-teal-300">Market Contract:</span>
                  <span className="font-mono text-xs block mt-1">{newMarketAddress}</span>
                </p>
                <p className="text-white">
                  <span className="text-teal-300">Token:</span> {createdMarket.tokenName} ({createdMarket.tokenSymbol})
                </p>
                <p className="text-white">
                  <span className="text-teal-300">Threshold:</span>{' '}
                  {(createdMarket.threshold / Math.pow(10, createdMarket.tokenDecimals)).toLocaleString()} {createdMarket.tokenSymbol}
                </p>
                <p className="text-white">
                  <span className="text-teal-300">Deadline:</span>{' '}
                  {new Date(createdMarket.deadline).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 bg-green-800/50 rounded-3xl border-4 border-dashed border-lime-400 text-white text-lg hover:bg-teal-700 p-2"
                onClick={handleReset}
              >
                Create Another
              </button>
              <button
                className="flex-1 bg-blue-600/50 rounded-3xl border-4 border-dashed border-blue-400 text-white text-lg hover:bg-blue-700 p-2"
                onClick={() => window.location.href = '/markets/view'}
              >
                View All Markets
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
