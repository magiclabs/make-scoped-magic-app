import { ChainId, Pact } from '@kadena/client';
import { getNetworkId } from '@/utils/network';
interface KeysetRefGuardTransaction {
  chainId: ChainId;
  keysetRefGuardName: string;
}
export const buildKeysetRefGuardTransaction = ({ chainId, keysetRefGuardName }: KeysetRefGuardTransaction) => {
  return Pact.builder
    .execution(`(keyset-ref-guard "${keysetRefGuardName}")`)
    .setMeta({ chainId })
    .setNetworkId(getNetworkId())
    .createTransaction();
};
