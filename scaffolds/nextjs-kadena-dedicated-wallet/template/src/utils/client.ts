import { createClient } from "@kadena/client";
import { ChainId } from "@kadena/types";
import { DEFAULT_CHAIN_ID } from "./constants";
import { getNetworkUrl } from "./network";

export const getKadenaClient = (chainId?: ChainId) => {
  const rpcUrl = getNetworkUrl(chainId || DEFAULT_CHAIN_ID);
  return createClient(rpcUrl);
}
