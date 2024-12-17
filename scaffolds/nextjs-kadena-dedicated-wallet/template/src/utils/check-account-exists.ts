import { ChainId } from "@kadena/types";
import { getKadenaClient } from "./client";
import { buildAccountDetailsTransaction } from "@/pact/account-details";

export  const checkAccountExists = async (accountName: string, chainId: ChainId) => {
  const kadenaClient = getKadenaClient(chainId);
  try {
    const transaction = buildAccountDetailsTransaction({ chainId, accountName });
    const response = await kadenaClient.dirtyRead(transaction);
    if (response.result.status === "failure") {
      console.error((response.result.error as any).message);
      return false;
    } else {
      console.log(response.result.data);
      return true;
    }
  } catch (error) {
    console.error(`Failed to get balance for ${accountName} on chain ${chainId}`);
    console.error(error);
    return false;
  }
};
