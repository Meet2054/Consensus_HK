import { Button } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useGetEvent } from "../../hooks/useGetEvent";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import FpmmABI from "../../contracts/fpmm/fpmmAbi.json";
import { handleBuy } from "../../hooks/useBuy";
import { Abi, formatUnits, parseUnits } from "viem";
import { TOKEN_CONTRACT } from "../../contracts";
import { conditionalTokensABI } from "../../contracts/Ctf/ConditionalTokensABI";
import { ethers } from "ethers";
import MarketDataDisplay from "../../components/Chart";
import TransactionProgressBuy from "../../components/TransactionProgress/TransactionProgressBuy";
import { useGetTokenContract } from "../../hooks/contracts/useGetTokenContract";

interface MarketState {
  title: string;
  deployer: string;
  questionId: string;
  fpmmAddress: string;
}

const event = () => {
  const { address, chainId } = useAccount();
  const router = useRouter();
  useEffect(() => {
    if (router.isReady && router.query.id) {
      setFpmmId(router.query.id as string);
      console.log("Setting fpmmId:", router.query.id);
    }
  }, [router.isReady, router.query.id]);

  const [marketState, setMarketState] = useState<MarketState>({
    title: "Prediction Market",
    deployer: "",
    questionId: "",
    fpmmAddress: "",
  });

  const id = router.query.id as string;
  const [fpmmId, setFpmmId] = useState<string>(id);
  const { event } = useGetEvent(id as string);

  const [position, setPosition] = useState(1);
  const [amount, setAmount] = useState<string>("0");
  const [canRedeem, setCanRedeem] = useState(false);
  const [showRedeemSection, setShowRedeemSection] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [isConfirmingApprove, setIsConfirmingApprove] = useState(false);
  const [isConfirmedApproved, setIsConfirmedApproved] = useState(false);
  const [choice, setChoice] = useState(""); //
  const [isBuy, setIsBuy] = useState(true); //buy or sell
  const [debugInfo, setDebugInfo] = useState({
    condition: { isReported: false, endTime: 0 },
  });
  const [deployer, setDeployer] = useState("");
  const [questionId, setQuestionId] = useState("");
  const [fpmmAddress, setFpmmAddress] = useState("");
  // Add this state to track if redemption is available

  const [title, setTitle] = useState("");

  const { data: hash, isPending, writeContract } = useWriteContract();

  const { address: tokenAdress } = useGetTokenContract(Number(chainId));

  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const {
    data: hashApprove,
    isPending: isPendingApprove,
    writeContract: writeContractApprove,
  } = useWriteContract();

  // Calculate buy amount based on current input
  const { data: calculatedBuyAmount, isError } = useReadContract({
    address: id as `0x${string}`,
    abi: FpmmABI,
    functionName: "calcBuyAmount",
    args:
      amount && amount !== "0"
        ? [parseUnits(amount, 18), BigInt(position)]
        : undefined,
  });

  const {
    data: redeemHash,
    isPending: isRedeemPending,
    writeContract: writeRedeemContract,
  } = useWriteContract();

  useEffect(() => {
    event.choices.length > 1 && setChoice(event.choices[0]);
  }, []);
  // Check redeem status (database removed)
  const checkRedeemStatus = async () => {
    // Use the fpmmId directly since we don't have database
    setFpmmAddress(fpmmId);
    setDeployer(address || "");
    setQuestionId("");

    try {
      console.log("Reach here");
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const fpmm = new ethers.Contract(
        fpmmId || fpmmAddress,
        FpmmABI,
        provider
      );

      const conditionalToken = await fpmm.conditionalTokens();
      console.log("Conditional token:", conditionalToken);

      const conditionalTokens = new ethers.Contract(
        conditionalToken,
        conditionalTokensABI,
        provider
      );

      const conditionId = await conditionalTokens.getConditionId(
        deployer,
        questionId,
        2
      );

      console.log("Condition ID:", conditionId);

      const condition = await conditionalTokens.conditionInfo(conditionId);
      const currentTime = Math.floor(Date.now() / 1000);

      console.log(condition);

      const canRedeemNow = condition[2] && Number(condition[1]) < currentTime;
      setCanRedeem(canRedeemNow);

      setDebugInfo({
        condition: {
          isReported: condition[2],
          endTime: condition[1],
        },
      });
    } catch (error) {
      console.error("Error checking redeem status:", error);
    }
  };

  // Modify the checkRedeemStatus useEffect to depend on fpmmId
  useEffect(() => {
    async function checkRedeemStatusPeriodically() {
      if (!fpmmId) {
        console.log("No fpmmId available yet");
        return;
      }
      console.log("Checking redeem status for:", fpmmId);
      await checkRedeemStatus();
    }

    if (fpmmId) {
      checkRedeemStatusPeriodically();
      const interval = setInterval(checkRedeemStatusPeriodically, 10000);
      return () => clearInterval(interval);
    }
  }, [fpmmId]); // Only depend on fpmmId

  useEffect(() => {
    // Set basic market state (database removed)
    if (router.query.id) {
      setMarketState({
        title: "Prediction Market",
        deployer: address || "",
        questionId: "",
        fpmmAddress: router.query.id as string,
      });
    }
  }, [router.query.id, address]);

  // Add this effect to track approve transaction status
  useEffect(() => {
    const checkApproveStatus = async () => {
      if (hashApprove) {
        setIsConfirmingApprove(true);
        try {
          const receipt = await window.ethereum.request({
            method: "eth_getTransactionReceipt",
            params: [hashApprove],
          });

          if (receipt) {
            setIsConfirmingApprove(false);
            if (receipt.status === "0x1") {
              setIsConfirmedApproved(true);
            }
          }
        } catch (error) {
          console.error("Error checking approve status:", error);
          setIsConfirmingApprove(false);
        }
      }
    };

    checkApproveStatus();
  }, [hashApprove]);

  // Also add receipt watch for approve transaction
  const {
    isLoading: isConfirmingApproveReceipt,
    isSuccess: isConfirmedApproveReceipt,
  } = useWaitForTransactionReceipt({
    hash: hashApprove,
  });

  if (!router.isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If router is ready but no ID, show error
  if (!router.query.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Error</h1>
          <p className="mt-2">No market ID found</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!isNaN(Number(value)) && value !== "") {
      setAmount(value);
    } else {
      setAmount("0");
    }
  };

  function handleApprove() {
    // Convert input amount to 18 decimal places
    const amounts = BigInt(parseFloat(amount) * 10 ** 18);
    writeContractApprove({
      address: tokenAdress,
      abi: TOKEN_CONTRACT.abi as Abi,
      functionName: "approve",
      args: [fpmmId as `0x${string}`, amounts],
    });
  }

  const formatTokenAmount = (amount: unknown) => {
    if (!amount) return "0";
    try {
      return formatUnits(BigInt(amount.toString()), 18);
    } catch {
      return "0";
    }
  };

  const handleRedeem = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const fpmm = new ethers.Contract(fpmmAddress, FpmmABI, provider);

      const conditionalToken = await fpmm.conditionalTokens();
      const indexSets = [BigInt(1), BigInt(2)];

      const conditionalTokens = new ethers.Contract(
        conditionalToken,
        conditionalTokensABI,
        provider
      );

      const conditionalId = await conditionalTokens.getConditionId(
        deployer,
        questionId,
        2
      );

      await writeRedeemContract({
        address: conditionalToken as `0x${string}`,
        abi: conditionalTokensABI,
        functionName: "redeemPositions",
        args: [
          tokenAdress,
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          conditionalId,
          indexSets,
        ],
      });
    } catch (error) {
      console.error("Error redeeming positions:", error);
    }
  };

  // Chat functionality removed (Push Protocol removed)

  const handleBuyTransaction = async () => {
    try {
      if (!address) {
        console.log("Please connect your wallet");
        return;
      }

      if (!fpmmId || !amount || amount === "0") {
        console.log("Invalid transaction parameters");
        return;
      }

      // Execute the contract transaction (database removed)
      await handleBuy(writeContract, fpmmId as `0x${string}`, position, amount);

      console.log("Buy transaction:", {
        user_address: address,
        fpmm_address: fpmmId,
        position: position,
        amount: amount,
      });
    } catch (error) {
      console.error("Transaction error:", error);
      throw error;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mt-10 w-full min-h-screen px-4 sm:px-6">
      {/* Main Container */}
      <div className="w-full max-w-[1200px] flex flex-col justify-between gap-5">
        {/* Title and Chart Section */}
        <div className="flex justify-center items-center flex-wrap bg-green-800/50 p-4 sm:p-6 rounded-3xl border-4 border-dashed border-lime-400 text-white text-xl my-4 sm:my-8 w-full">
          <h1 className="text-3xl sm:text-5xl lg:text-8xl font-extrabold text-center mb-6 sm:mb-10 animate-bounce [text-shadow:_4px_4px_0_lime,_8px_8px_0_green] text-white w-full">
            {marketState.title}
          </h1>
          <div className="w-full overflow-x-auto">
            <MarketDataDisplay marketAddress={fpmmId as `0x${string}`} />
          </div>
        </div>

        {/* Trading Section */}
        <div className="w-full flex-col flex justify-center items-center bg-green-800/50 p-4 sm:p-6 rounded-3xl border-4 border-dashed border-lime-400 text-white text-xl my-4 sm:my-8">
          {/* Position Selection */}
          <h1 className="text-lg sm:text-xl mt-4 press-start-2p-regular">
            Outcome:{" "}
          </h1>
          <div className="w-full max-w-[600px] justify-center items-center flex gap-2 sm:gap-4 my-2 sm:my-4">
            <button
              onClick={() => setPosition(1)}
              className="text-black px-4 sm:px-8 py-2 sm:py-3 rounded bg-teal-300 hover:bg-teal-700 hover:text-white w-1/2 text-base sm:text-xl"
            >
              Yes
            </button>
            <button
              onClick={() => setPosition(0)}
              className="bg-teal-300 hover:bg-teal-700 hover:text-white text-black px-4 sm:px-8 py-2 sm:py-3 rounded w-1/2 text-base sm:text-xl"
            >
              No
            </button>
          </div>

          {/* Amount Input */}
          <h1 className="text-lg sm:text-xl mt-4 press-start-2p-regular">
            Amount:{" "}
          </h1>
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            placeholder="Enter amount"
            className="w-full max-w-[600px] p-2 sm:p-3 rounded mb-4 text-black text-base sm:text-xl"
          />

          {/* Transaction Preview */}
          <div className="w-full max-w-[600px] flex flex-col items-center">
            {amount && amount !== "0" && (
              <div className="w-full bg-green-800/50 p-4 sm:p-6 rounded-3xl border-4 border-dashed border-lime-400 text-white text-base sm:text-xl mb-4">
                <h3 className="font-semibold mb-2">Transaction Preview</h3>
                {isError ? (
                  <p className="text-sm text-red-500">
                    Error calculating amount. Please try again.
                  </p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm sm:text-base">
                      Tokens to receive:{" "}
                      {calculatedBuyAmount
                        ? formatTokenAmount(calculatedBuyAmount)
                        : "Calculating..."}
                    </p>
                    <p className="text-xs sm:text-sm text-white">
                      Price per token:{" "}
                      {calculatedBuyAmount && amount
                        ? `${(
                            Number(amount) /
                            Number(formatTokenAmount(calculatedBuyAmount))
                          ).toFixed(4)} USDC`
                        : "Calculating..."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Trade Button */}
            <button
              className={`w-full max-w-[600px] p-3 sm:p-4 rounded text-base sm:text-xl ${
                isBuy
                  ? "bg-teal-300 hover:bg-teal-600 text-black"
                  : "bg-red-500 hover:bg-red-600"
              }`}
              disabled={!amount || amount === "0" || isPending || isConfirming}
              onClick={() => setIsProgressOpen(true)}
            >
              {isPending || isConfirming
                ? "Confirming..."
                : `Confirm ${isBuy ? "Buy" : "Sell"} ${
                    position === 1 ? "Yes" : "No"
                  }`}
            </button>
          </div>
        </div>

        {/* Chat Section - Removed (Push Protocol dependency removed) */}

        {canRedeem && (
          <div className="w-full mt-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Redeem Positions</h2>
                <button
                  onClick={() => setShowRedeemSection(!showRedeemSection)}
                  className="text-blue-500 hover:text-blue-600"
                >
                  {showRedeemSection ? "Hide" : "Show"} Redeem Section
                </button>
              </div>

              {showRedeemSection && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                    <p>Status: Market Resolved</p>
                    <p>
                      Is Reported:{" "}
                      {debugInfo.condition.isReported ? "Yes" : "No"}
                    </p>
                    <p>
                      End Time:{" "}
                      {new Date(
                        Number(debugInfo.condition.endTime) * 1000
                      ).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={handleRedeem}
                    disabled={isRedeemPending}
                    className={`w-full py-2 px-4 rounded-lg font-medium ${
                      isRedeemPending
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    {isRedeemPending
                      ? "Processing Redemption..."
                      : "Redeem Positions"}
                  </button>

                  {redeemHash && (
                    <div className="bg-green-100 text-green-700 p-4 rounded-lg mt-4">
                      <p className="text-sm">
                        Redemption successful! Transaction hash:{" "}
                        {redeemHash.slice(0, 10)}...
                        <a
                          href={`https://etherscan.io/tx/${redeemHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline ml-2"
                        >
                          View on Etherscan
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Show message if redemption is not available */}
        {!canRedeem && debugInfo.condition && (
          <div className=" w-full  mt-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center text-gray-600">
                <h2 className="text-xl font-semibold mb-2">
                  Redemption Not Available Yet
                </h2>
                <p>
                  {!debugInfo.condition.isReported
                    ? "Market has not been reported yet."
                    : "Market end time has not been reached."}
                </p>
                <p className="text-sm mt-2">
                  End Time:{" "}
                  {new Date(
                    Number(debugInfo.condition.endTime) * 1000
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Progress Modal */}
        <TransactionProgressBuy
          isOpen={isProgressOpen}
          onClose={() => setIsProgressOpen(false)}
          amount={amount}
          position={position}
          setPosition={setPosition}
          isPendingApprove={isPendingApprove}
          isConfirmingApprove={isConfirmingApproveReceipt}
          isConfirmedApproved={isConfirmedApproveReceipt}
          isPendingBuy={isPending}
          isConfirmingBuy={isConfirming}
          isConfirmedBuy={isConfirmed}
          onApprove={handleApprove}
          onBuy={handleBuyTransaction}
        />
      </div>
    </div>
  );
};

export default event;
