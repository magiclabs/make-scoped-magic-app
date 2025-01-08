import React, { useCallback, useState } from 'react';
import { useMagic } from '../MagicProvider';
import FormButton from '@/components/ui/FormButton';
import FormInput from '@/components/ui/FormInput';
import Card from '@/components/ui/Card';
import CardHeader from '@/components/ui/CardHeader';
import showToast from '@/utils/showToast';
import Spinner from '@/components/ui/Spinner';
import Spacer from '@/components/ui/Spacer';
import TransactionHistory from '@/components/ui/TransactionHistory';
import { ChainId, ICommand, IUnsignedCommand } from '@kadena/types';
import { addSignatures, ITransactionDescriptor } from '@kadena/client';
import { PactNumber } from '@kadena/pactjs';
import { accountToPublicKey } from '@/utils/account-to-public-key';
import { getKadenaClient } from '@/utils/client';
import { getBalance } from '@/utils/get-balance';
import { SendTransactionProps } from '@/utils/types';
import { buildTransferContinuationTransaction } from '@/pact/transfer-continuation';
import { buildTransferCrosschainTransaction } from '@/pact/transfer-crosschain';
import { SignatureWithPublicKey } from '@magic-ext/kadena/dist/types/types';

const SendCrosschainTransaction = ({ setBalance }: SendTransactionProps) => {
  const { magic, chainId, userInfo } = useMagic();
  const [toAccount, setToAccount] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [destinationChainId, setDestinationChainId] = useState<ChainId | string>('');
  const [disabled, setDisabled] = useState(false);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [hash, setHash] = useState('');

  const signTransaction = async (transaction: IUnsignedCommand) => {
    const isSpireKeyLogin = Boolean(userInfo?.loginType === 'spirekey');

    if (isSpireKeyLogin) {
      const { transactions } = (await magic?.kadena.signTransactionWithSpireKey(transaction)) as {
        transactions: ICommand[];
      };
      return transactions[0];
    } else {
      const signature = (await magic?.kadena.signTransaction(transaction.hash)) as SignatureWithPublicKey;
      return addSignatures(transaction, signature);
    }
  };

  const handleBuildTransaction = async () => {
    const to = toAccount;
    const from = userInfo?.accountName as string;
    const amount = new PactNumber(sendAmount).toPactDecimal();
    const toChainId = destinationChainId as ChainId;
    const fromChainId = chainId;
    const senderPubKey = userInfo?.publicKey as string;
    const receiverPubKey = accountToPublicKey(to);
    const isSpireKeyAccount = Boolean(userInfo?.loginType === 'spirekey');

    return buildTransferCrosschainTransaction({
      to,
      from,
      amount,
      toChainId,
      fromChainId,
      senderPubKey,
      receiverPubKey,
      isSpireKeyAccount,
    });
  };

  // Cross Chain Transaction
  const handleSendTransactionStart = useCallback(async () => {
    if (!userInfo?.accountName) return;
    setTransactionLoading(true);
    setDisabled(true);

    try {
      const kadenaClient = getKadenaClient(chainId);

      const transaction = await handleBuildTransaction();

      const signedTx = await signTransaction(transaction);
      console.log('signed transaction', signedTx);

      // See if transaction will succeed locally before broadcasting
      const localRes = await kadenaClient.local(signedTx as ICommand);
      if (localRes.result.status === 'failure') {
        throw new Error((localRes.result.error as { message: string }).message);
      }

      const transactionDescriptor = await kadenaClient.submit(signedTx as ICommand);
      console.log('broadcasting transaction...', transactionDescriptor);

      const response = await kadenaClient.listen(transactionDescriptor);

      if (response.result.status === 'failure') {
        console.error(response.result.error);
      } else {
        console.log('transaction start success! response:', response);
        getBalance(userInfo.accountName, chainId).then(setBalance);
        await handleSendTransactionFinish(transactionDescriptor);
      }
    } catch (error) {
      console.error('Failed to send transaction', error);
      setTransactionLoading(false);
      setDisabled(false);
      showToast({ message: 'Transaction failed', type: 'error' });
    }
  }, [toAccount, sendAmount, destinationChainId, userInfo, chainId]);

  const handleSendTransactionFinish = useCallback(
    async (transactionDescriptor: ITransactionDescriptor) => {
      if (!userInfo?.accountName) return;

      try {
        const kadenaClientOriginChain = getKadenaClient(chainId);
        const kadenaClientTargetChain = getKadenaClient(destinationChainId as ChainId);

        console.log('fetching proof for cross-chain transaction...');
        const proof = await kadenaClientOriginChain.pollCreateSpv(transactionDescriptor, destinationChainId as ChainId);

        const status = await kadenaClientOriginChain.listen(transactionDescriptor);
        console.log('status', status);

        const continuationTransaction = buildTransferContinuationTransaction({
          proof,
          pactId: status.continuation?.pactId ?? '',
          toChainId: destinationChainId as ChainId,
        });

        const continuationTxDescriptor = await kadenaClientTargetChain.submit(continuationTransaction as ICommand);
        console.log('broadcasting continuation transaction...', continuationTxDescriptor);

        const response = await kadenaClientTargetChain.listen(continuationTxDescriptor);
        setDisabled(false);

        if (response.result.status === 'failure') {
          console.error(response.result.error);
        } else {
          console.log('transaction continuation success! response:', response);
          showToast({
            message: `Transaction successful request key: ${response.reqKey}`,
            type: 'success',
          });
          setHash(response.reqKey);
          setTransactionLoading(false);
          setDisabled(false);
          setToAccount('');
          setSendAmount('');
          setDestinationChainId('');
        }
      } catch (error) {
        console.error('Failed to complete cross-chain transaction', error);
        setTransactionLoading(false);
        setDisabled(false);
        showToast({ message: 'Transaction failed', type: 'error' });
      }
    },
    [userInfo, chainId, destinationChainId],
  );

  return (
    <Card>
      <CardHeader id="send-transaction">Send Transaction (cross chain)</CardHeader>
      <FormInput
        value={toAccount}
        onChange={(e: any) => setToAccount(e.target.value)}
        placeholder="Receiving Account"
      />
      <FormInput value={sendAmount} onChange={(e: any) => setSendAmount(e.target.value)} placeholder="Amount (KDA)" />
      <FormInput
        value={destinationChainId}
        onChange={(e: any) => setDestinationChainId(e.target.value)}
        placeholder="Destination Chain"
      />
      <FormButton
        onClick={handleSendTransactionStart}
        disabled={!toAccount || !sendAmount || !destinationChainId || disabled}
      >
        {transactionLoading ? (
          <div className="w-full loading-container">
            <Spinner />
          </div>
        ) : (
          'Send Cross Chain Transaction'
        )}
      </FormButton>
      {hash ? (
        <>
          <Spacer size={20} />
          <TransactionHistory reqKey={hash} />
        </>
      ) : null}
    </Card>
  );
};

export default SendCrosschainTransaction;
