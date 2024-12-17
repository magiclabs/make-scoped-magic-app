import { ChainId, IPactDecimal } from "@kadena/types";
import { Pact, ISigner, literal, readKeyset } from "@kadena/client";
import { NETWORK_ID } from "@/utils/constants";

interface TransferCreateTransaction {
  to: string;
  from: string;
  amount: IPactDecimal;
  chainId: ChainId;
  senderPubKey: string;
  receiverPubKey: string;
  isSpireKeyAccount: boolean;
}

export const buildTransferCreateTransaction = ({
  to,
  from,
  amount,
  chainId,
  senderPubKey,
  receiverPubKey,
  isSpireKeyAccount,
}: TransferCreateTransaction) => {

  const signer: ISigner = isSpireKeyAccount
    ? {
        pubKey: senderPubKey,
        scheme: "WebAuthn",
      }
    : senderPubKey;

  const guard = isSpireKeyAccount ? literal(`(keyset-ref-guard "${to.substring(2)}")`) : readKeyset("receiverKeyset");

  return Pact.builder
    .execution(
      (Pact.modules as any).coin["transfer-create"](
        from,
        to,
        guard,
        amount
      )
    )
    .addKeyset("receiverKeyset", "keys-all", receiverPubKey)
    .addSigner(signer, (withCapability: any) => [
      withCapability("coin.GAS"),
      withCapability("coin.TRANSFER", from, to, amount),
    ])
    .setMeta({ chainId, senderAccount: from })
    .setNetworkId(NETWORK_ID)
    .createTransaction();
};
