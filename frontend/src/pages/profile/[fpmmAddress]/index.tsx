import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { TOKEN_CONTRACT } from "../../../contracts";
import { Abi } from "viem";
import fpmmAbi from "../../../contracts/fpmm/fpmmAbi.json";
import { handleCheckCanResolve } from "../../../hooks/useCheckCanResolve";
import { handleReport } from "../../../hooks/UseReport";
import Marquee from "react-fast-marquee";
import TransactionProgress from "../../../components/TransactionProgress";
import { useGetTokenContract } from "../../../hooks/contracts/useGetTokenContract";

interface Event {
  id: number;
  fpmm_title: string;
  fpmm_address: string;
  deployer: string;
  created_at: string;
  questionId: string;
}

const Index = () => {
  const router = useRouter();
  const { fpmmAddress } = router.query;

  const [eventData, setEventData] = useState<Event | null>(null);
  const [funding, setFunding] = useState<string>("");
  const [canResolve, setCanResolve] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState<boolean>(false);
  const { address, chainId } = useAccount(); // Add this to check if user is the deployer
  
  const { address: tokenContractAddress } = useGetTokenContract(
    Number(chainId)
  );

  const {
    data: hashApprove,
    isPending: isPendingApprove,
    writeContract: writeContractApprove,
  } = useWriteContract();
  const { isLoading: isConfirmingApprove, isSuccess: isConfirmedApproved } =
    useWaitForTransactionReceipt({
      hash: hashApprove,
    });
  function handleApprove() {
    setIsProgressOpen(true); // Add this line to open the modal
    // Convert input amount to 18 decimal places
    const amount = BigInt(parseFloat(funding) * 10 ** 18);
    console.log(eventData);
    writeContractApprove({
      address: tokenContractAddress,
      abi: TOKEN_CONTRACT.abi as Abi,
      functionName: "approve",
      args: [eventData?.fpmm_address, amount],
    });
  }

  const {
    data: hash,
    isPending: isPending,
    writeContract: writeContract,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });
  function handleFunding() {
    // Convert input amount to 18 decimal places
    const amount = BigInt(parseFloat(funding) * 10 ** 18);
    writeContract({
      address: eventData?.fpmm_address as `0x${string}`,
      abi: fpmmAbi as Abi,
      functionName: "addFunding",
      args: [amount, [1, 1]],
    });
  }

  async function fetchEventData() {
    if (!fpmmAddress) return;

    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("fpmm_address", fpmmAddress)
        .single();

      if (error) throw error;
      if (data) setEventData(data);
    } catch (error) {
      console.error("Error fetching event:", error);
    }
  }

  async function checkCanResolve() {
    if (!eventData || !fpmmAddress) return;

    try {
      const canResolveStatus = await handleCheckCanResolve(
        eventData.fpmm_address,
        eventData.deployer,
        eventData.questionId as string,
        2
      );
      setCanResolve(canResolveStatus);
      console.log("Can resolve:", canResolveStatus);
    } catch (error) {
      console.error("Error checking resolution status:", error);
      setCanResolve(false);
    }
  }

  const handleResolveEvent = async (resultIndex: number) => {
    if (!eventData || !canResolve) return;

    try {
      setIsResolving(true);
      await handleReport(
        eventData.fpmm_address,
        eventData.questionId as string,
        resultIndex
      );

      // Update the database
      const { error } = await supabase
        .from("events")
        .update({
          resolved: true,
          resolution: resultIndex === 1 ? "Yes" : "No",
        })
        .eq("fpmm_address", fpmmAddress);

      if (error) throw error;

      // Refetch event data
      await fetchEventData();
    } catch (error) {
      console.error("Error resolving event:", error);
    } finally {
      setIsResolving(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [fpmmAddress]);

  useEffect(() => {
    if (eventData) {
      checkCanResolve();
    }
  }, [eventData]);

  

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 ">

{eventData && (
 <div className="min-h-screen">
  <div className="max-w-4xl mx-auto">
    {/* Title Section */}
    <h1
      className="text-5xl sm:text-6xl lg:text-8xl font-extrabold text-center mb-10 animate-bounce
                 [text-shadow:_4px_4px_0_lime,_8px_8px_0_green] text-white press-start-2p-regular"
    >
      EVENTS
    </h1>

            {/* Card Section */}
            <div>
              {/* Event Information */}
              <div className="space-y-4 mb-8">
                <Marquee className="bg-black/30 p-4 rounded-full">
                  <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-lime-300">
                    🚀 Title: {eventData?.fpmm_title || "Loading..."} 🌙
                  </div>
                </Marquee>

                <Marquee direction="right">
                  <div className="text-lg sm:text-2xl font-bold text-lime-300">
                    ⏰ Created:{" "}
                    {eventData?.created_at
                      ? new Date(eventData.created_at).toLocaleDateString()
                      : "Loading..."}{" "}
                    (STILL EARLY!!!)
                  </div>
                </Marquee>
              </div>

              {/* Funding Section */}
              <div
                className="bg-green-800/50 p-6 rounded-3xl border-4 border-dashed border-lime-400  
                    space-y-6"
              >
                <h2
                  className="text-2xl md:text-4xl  font-extrabold text-center text-lime-300 
                     animate-pulse press-start-2p-regular "
                >
                  💸 Add Funding 💸
                </h2>

                <div className="space-y-4">
                  <input
                    type="number"
                    value={funding}
                    onChange={(e) => setFunding(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-black/30 text-lg sm:text-xl p-4 sm:p-6 rounded-xl text-center 
                        border-4 border-lime-400 text-lime-300 placeholder-lime-600"
                  />

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* <button
              onClick={handleApprove}
              className="flex-1 p-4 text-lg sm:text-xl font-bold bg-blue-500 rounded-xl 
                         border-4 border-blue-300 hover:animate-spin"
            >
              {isPendingApprove ? "LOADING..." : "APPROVE 🚀"}
            </button> */}

            <button
              onClick={handleApprove}
              className="flex-1 p-4 text-lg sm:text-xl font-bold bg-yellow-400 rounded-xl 
                         border-4 border-yellow-300"
            >
              {isPending ? "PROCESSING..." : "SEND IT 🌙"}
            </button>
          </div>
        </div>
      </div>

              {/* Resolution Section */}
              <div className="bg-green-800/50 p-6 rounded-3xl border-4 border-dashed border-lime-400 mt-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4">
                  <h2 className="text-lg sm:text-xl font-semibold  press-start-2p-regular text-lime-400">
                    Resolve Event
                  </h2>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        canResolve
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {canResolve ? "Ready to Resolve" : "Not Ready"}
                    </span>
                    {!canResolve && (
                      <button
                        onClick={checkCanResolve}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Check Again
                      </button>
                    )}
                  </div>
                </div>

                {address === eventData?.deployer ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => handleResolveEvent(1)}
                        disabled={!canResolve || isResolving}
                        className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white 
                           rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Resolve as YES
                      </button>
                      <button
                        onClick={() => handleResolveEvent(0)}
                        disabled={!canResolve || isResolving}
                        className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white 
                           rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Resolve as NO
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600 text-center">
                      Only the event creator can resolve this event.
                    </p>
                  </div>
                )}
              </div>
            </div>

    {/* Bottom Ticker */}
    <Marquee className="mt-8 text-lg sm:text-2xl lg:text-4xl text-green-300">
      🚀 PUMP IT! 💎 HODL! 🌙 WEN MOON! 🦍 WAGMI! 💪
    </Marquee>
  </div>
</div>

)}
<TransactionProgress 
      isOpen={isProgressOpen}
      onClose={() => setIsProgressOpen(false)}
      amount={funding}
      isPendingApprove={isPendingApprove}
      isConfirmingApprove={isConfirmingApprove}
      isConfirmedApproved={isConfirmedApproved}
      isPendingFunding={isPending}
      isConfirmingFunding={isConfirming}
      isConfirmedFunding={isConfirmed}
      onApprove={handleApprove}
      onFunding={handleFunding}
    />
 

 </div>
  );
};

export default Index;
