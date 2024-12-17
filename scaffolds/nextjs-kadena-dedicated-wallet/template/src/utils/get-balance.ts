import { ChainId } from "@kadena/types";
import { buildGetBalanceTransaction } from "../pact/get-balance";
import { getKadenaClient } from "./client";

export const getBalance = async (accountName: string, chainId: ChainId) => {
  const kadenaClient = getKadenaClient(chainId);
  try {
    const transaction = buildGetBalanceTransaction({ chainId, accountName });
    const response = await kadenaClient.dirtyRead(transaction);
    if (response.result.status === "failure") {
      console.error('Failed to get balance:', response.result.error);
      return 0;
    }
    return (response.result as any).data as number;
  } catch (error) {
    console.error("Failed to get balance:", error);
    return 0;
  }
};
