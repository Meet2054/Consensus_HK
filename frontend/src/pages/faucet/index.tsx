import React from "react";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { TOKEN_CONTRACT } from "../../contracts";
import { Abi } from "viem";
import useToken from "../../hooks/useToken";
import { useGetTokenContract } from "../../hooks/contracts/useGetTokenContract";

const index = () => {
  const { address,chainId } = useAccount();
  const { data: hash, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });
  const {address: tokenAddress}=useGetTokenContract(Number(chainId))

  function handleMint() {
    writeContract({
      address: tokenAddress,
      abi: TOKEN_CONTRACT.abi as Abi,
      functionName: "mint",
      args: [address, 1000000000000000000000],
    });
  }

  return (
    <div>
      <button onClick={handleMint} className=" bg-zinc-50">
        {isPending ? "Confirming..." : "mint"}
      </button>
      {isConfirming && <div>Waiting for confirmation...</div>}
      {isConfirmed && <div>Transaction confirmed.</div>}
    </div>
  );
};

export default index;
