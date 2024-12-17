import { NETWORK_ID } from "@/utils/constants";
import { ChainId, Pact, ISigner, literal, readKeyset } from "@kadena/client";
import { IPactDecimal } from "@kadena/types";

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

export const buildTransferCrosschainTransaction = ({
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
        scheme: "WebAuthn",
      }
    : senderPubKey;

  const guard = isSpireKeyAccount ? literal(`(keyset-ref-guard "${to.substring(2)}")`) : readKeyset("receiverKeyset");

  return Pact.builder
    .execution(
      (Pact.modules as any).coin.defpact["transfer-crosschain"](
        from,
        to,
        guard,
        toChainId,
        amount
      )
    )
    .addSigner(signer, (signFor: any) => [
      signFor("coin.GAS"),
      signFor("coin.TRANSFER_XCHAIN", from, to, amount, toChainId),
    ])
    .addKeyset("receiverKeyset", "keys-all", receiverPubKey)
    .setMeta({ chainId: fromChainId, senderAccount: from })
    .setNetworkId(NETWORK_ID)
    .createTransaction();
};
