import { ChainId, Pact, ISigner } from '@kadena/client';
import { NETWORK_ID } from '../utils/constants';
import { IPactDecimal } from '@kadena/types';
import { accountGuard } from '../utils/account-guard';
import { accountProtocol } from '../utils/account-protocol';
import { checkKeysetRefExists } from '../utils/check-keyset-ref-exists';

interface TransferCrosschainTransaction {
  to: string;
  from: string;
  amount: IPactDecimal;
  toChainId: ChainId;
  fromChainId: ChainId;
  senderPubKey: string;
  receiverPubKey: string;
  isSpireKeyAccount: boolean;
}

export const buildTransferCrosschainTransaction = async ({
  to,
  from,
  amount,
  toChainId,
  fromChainId,
  senderPubKey,
  receiverPubKey,
  isSpireKeyAccount,
}: TransferCrosschainTransaction) => {
  const signer: ISigner = isSpireKeyAccount
    ? {
        pubKey: senderPubKey,
        scheme: 'WebAuthn',
      }
    : senderPubKey;

  const pactBuilder = Pact.builder
    .execution((Pact.modules as any).coin.defpact['transfer-crosschain'](from, to, accountGuard(to), toChainId, amount))
    .addSigner(signer, (signFor: any) => [
      signFor('coin.GAS'),
      signFor('coin.TRANSFER_XCHAIN', from, to, amount, toChainId),
    ])
    .setMeta({ chainId: fromChainId, senderAccount: from })
    .setNetworkId(NETWORK_ID);

  if (accountProtocol(to) === 'r:') {
    const keysetRefExists = await checkKeysetRefExists(to.substring(2), toChainId);
    if (!keysetRefExists) {
      console.error(`Keyset reference guard "${to.substring(2)}" does not exist on chain ${toChainId}`);
      throw new Error(`Keyset reference guard "${to.substring(2)}" does not exist on chain ${toChainId}`);
    }
    return pactBuilder.createTransaction();
  }
  return pactBuilder.addKeyset('receiverKeyset', 'keys-all', receiverPubKey).createTransaction();
};
