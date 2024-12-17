import { createClient } from "@kadena/client";
import { getNetworkUrl } from "./network";

export const getKadenaClient = () => {
  const rpcUrl = getNetworkUrl();
  return createClient(rpcUrl);
}
