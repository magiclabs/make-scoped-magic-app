import { ChainId } from '@kadena/types';
import { getKadenaClient } from './client';
import { buildKeysetRefGuardTransaction } from '@/pact/keyset-ref-guard';

export const checkKeysetRefExists = async (keysetRefGuardName: string, chainId: ChainId) => {
  const kadenaClient = getKadenaClient(chainId);
  try {
    const transaction = buildKeysetRefGuardTransaction({
      chainId,
      keysetRefGuardName,
    });
    const response = await kadenaClient.dirtyRead(transaction);
    if (response.result.status === 'failure') {
      console.error('not able to check', (response.result.error as any).message);
      return false;
    } else {
      console.log(response.result.data);
      return true;
    }
  } catch (error) {
    console.error(
      `Failed to send transaction to check the keyset defined as "${keysetRefGuardName}" on chain ${chainId}`,
    );
    console.error(error);
    return false;
  }
};
