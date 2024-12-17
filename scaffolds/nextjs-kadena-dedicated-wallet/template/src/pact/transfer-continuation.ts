import { NETWORK_ID } from "@/utils/constants";
import { ChainId, Pact } from "@kadena/client";

interface TransferContinuationTransaction {
  proof: string;
  pactId: string;
  toChainId: ChainId;
}

export const buildTransferContinuationTransaction = ({
  proof,
  pactId,
  toChainId,
}: TransferContinuationTransaction) => {
  return Pact.builder
    .continuation({
      pactId,
      proof,
      rollback: false,
      step: 1,
    })
    .setNetworkId(NETWORK_ID)
    .setMeta({
      chainId: toChainId as ChainId,
      senderAccount: "kadena-xchain-gas",
      gasLimit: 850, // maximum value
    })
    .createTransaction();
};
