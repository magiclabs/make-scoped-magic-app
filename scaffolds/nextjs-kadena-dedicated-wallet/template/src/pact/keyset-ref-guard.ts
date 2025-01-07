import { ChainId, Pact } from '@kadena/client';
import { NETWORK_ID } from '../utils/constants';
interface KeysetRefGuardTransaction {
  chainId: ChainId;
  keysetRefGuardName: string;
}
export const buildKeysetRefGuardTransaction = ({ chainId, keysetRefGuardName }: KeysetRefGuardTransaction) => {
  return Pact.builder
    .execution(`(keyset-ref-guard "${keysetRefGuardName}")`)
    .setMeta({ chainId })
    .setNetworkId(NETWORK_ID)
    .createTransaction();
};
