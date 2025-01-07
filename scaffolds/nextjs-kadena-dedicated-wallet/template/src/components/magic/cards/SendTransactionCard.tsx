import React, { useCallback, useEffect, useState } from 'react';
import { useMagic } from '../MagicProvider';
import FormButton from '@/components/ui/FormButton';
import FormInput from '@/components/ui/FormInput';
import ErrorText from '@/components/ui/ErrorText';
import Card from '@/components/ui/Card';
import CardHeader from '@/components/ui/CardHeader';
import showToast from '@/utils/showToast';
import Spinner from '@/components/ui/Spinner';
import Spacer from '@/components/ui/Spacer';
import TransactionHistory from '@/components/ui/TransactionHistory';
import { ChainId, ICommand, IUnsignedCommand } from '@kadena/types';
import { addSignatures, ITransactionDescriptor } from '@kadena/client';
import { checkAccountExists } from '@/utils/check-account-exists';
import { SignatureWithPublicKey } from '@magic-ext/kadena/dist/types/types';
import { buildTransferCreateTransaction } from '@/pact/transfer-create';
import { buildTransferTransaction } from '@/pact/transfer';
import { PactNumber } from '@kadena/pactjs';
import { accountToPublicKey } from '@/utils/account-to-public-key';
import { getKadenaClient } from '@/utils/client';
import { getBalance } from '@/utils/get-balance';
import { SendTransactionProps } from '@/utils/types';
import { buildTransferContinuationTransaction } from '@/pact/transfer-continuation';
import { buildTransferCrosschainTransaction } from '@/pact/transfer-crosschain';

const SendTransaction = ({ setBalance }: SendTransactionProps) => {
  const { magic, chainId, userInfo } = useMagic();

  // Same Chain Transaction
  const [toAccount, setToAccount] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [hash, setHash] = useState('');

  // Cross Chain Transaction
  const [xToAccount, setXToAccount] = useState('');
  const [xSendAmount, setXSendAmount] = useState('');
  const [xChainId, setXChainId] = useState<ChainId | string>('');
  const [xDisabled, setXDisabled] = useState(false);
  const [xTransactionLoading, setXTransactionLoading] = useState(false);
  const [xHash, setXHash] = useState('');

  const handleBuildTransaction = async () => {
    const accountExists = await checkAccountExists(toAccount, chainId);

    const to = toAccount;
    const from = userInfo?.accountName as string;
    const amount = new PactNumber(sendAmount).toPactDecimal();
    const senderPubKey = userInfo?.publicKey as string;
    const receiverPubKey = accountToPublicKey(to);
    const isSpireKeyAccount = Boolean(userInfo?.loginType === 'spirekey');

    if (accountExists) {
      return buildTransferTransaction({
        to,
        from,
        amount,
        chainId,
        senderPubKey,
        receiverPubKey,
        isSpireKeyAccount,
      });
    }

    return buildTransferCreateTransaction({
      to,
      from,
      amount,
      chainId,
      senderPubKey,
      receiverPubKey,
      isSpireKeyAccount,
    });
  };

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

  // Same Chain Transaction
  const handleSendTransaction = useCallback(async () => {
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
      setDisabled(false);

      if (response.result.status === 'failure') {
        console.error(response.result.error);
      } else {
        console.log('transaction success! response:', response);
        showToast({
          message: `Transaction successful request key: ${response.reqKey}`,
          type: 'success',
        });
        setHash(response.reqKey);
        setTransactionLoading(false);
        setDisabled(false);
        setToAccount('');
        setSendAmount('');
        getBalance(userInfo.accountName, chainId).then(setBalance);
      }
    } catch (error) {
      setTransactionLoading(false);
      setDisabled(false);
      showToast({ message: 'Transaction failed', type: 'error' });
      console.log(error);
    }
  }, [toAccount, sendAmount, userInfo, chainId]);

  const handleBuildXTransaction = async () => {
    const to = xToAccount;
    const from = userInfo?.accountName as string;
    const amount = new PactNumber(xSendAmount).toPactDecimal();
    const toChainId = xChainId as ChainId;
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
  const handleSendXTransactionStart = useCallback(async () => {
    if (!userInfo?.accountName) return;
    setXTransactionLoading(true);
    setXDisabled(true);

    try {
      const kadenaClient = getKadenaClient(chainId);

      const transaction = await handleBuildXTransaction();

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
        await handleSendXTransactionFinish(transactionDescriptor);
      }
    } catch (error) {
      console.error('Failed to send transaction', error);
      setXTransactionLoading(false);
      setXDisabled(false);
      showToast({ message: 'Transaction failed', type: 'error' });
    }
  }, [xToAccount, xSendAmount, xChainId, userInfo, chainId]);

  const handleSendXTransactionFinish = useCallback(
    async (transactionDescriptor: ITransactionDescriptor) => {
      if (!userInfo?.accountName) return;

      try {
        const kadenaClientOriginChain = getKadenaClient(chainId);
        const kadenaClientTargetChain = getKadenaClient(xChainId as ChainId);

        console.log('fetching proof for cross-chain transaction...');
        const proof = await kadenaClientOriginChain.pollCreateSpv(transactionDescriptor, xChainId as ChainId);

        const status = await kadenaClientOriginChain.listen(transactionDescriptor);
        console.log('status', status);

        const continuationTransaction = buildTransferContinuationTransaction({
          proof,
          pactId: status.continuation?.pactId ?? '',
          toChainId: xChainId as ChainId,
        });

        const continuationTxDescriptor = await kadenaClientTargetChain.submit(continuationTransaction as ICommand);
        console.log('broadcasting continuation transaction...', continuationTxDescriptor);

        const response = await kadenaClientTargetChain.listen(continuationTxDescriptor);
        setXDisabled(false);

        if (response.result.status === 'failure') {
          console.error(response.result.error);
        } else {
          console.log('transaction continuation success! response:', response);
          showToast({
            message: `Transaction successful request key: ${response.reqKey}`,
            type: 'success',
          });
          setXHash(response.reqKey);
          setXTransactionLoading(false);
          setXDisabled(false);
          setXToAccount('');
          setXSendAmount('');
        }
      } catch (error) {
        console.error('Failed to complete cross-chain transaction', error);
        setXTransactionLoading(false);
        setXDisabled(false);
        showToast({ message: 'Transaction failed', type: 'error' });
      }
    },
    [userInfo, chainId, xChainId],
  );

  return (
    <>
      <Card>
        <CardHeader id="send-transaction">Send Transaction (same chain)</CardHeader>
        <FormInput
          value={toAccount}
          onChange={(e: any) => setToAccount(e.target.value)}
          placeholder="Receiving Account"
        />
        <FormInput
          value={sendAmount}
          onChange={(e: any) => setSendAmount(e.target.value)}
          placeholder={`Amount (KDA)`}
        />
        <FormButton onClick={handleSendTransaction} disabled={!toAccount || !sendAmount || disabled}>
          {transactionLoading ? (
            <div className="w-full loading-container">
              <Spinner />
            </div>
          ) : (
            'Send Transaction'
          )}
        </FormButton>
        {hash ? (
          <>
            <Spacer size={20} />
            <TransactionHistory reqKey={hash} />
          </>
        ) : null}
      </Card>

      <Spacer size={10} />

      <Card>
        <CardHeader id="send-transaction">Send Transaction (cross chain)</CardHeader>
        <FormInput
          value={xToAccount}
          onChange={(e: any) => setXToAccount(e.target.value)}
          placeholder="Receiving Account"
        />
        <FormInput
          value={xSendAmount}
          onChange={(e: any) => setXSendAmount(e.target.value)}
          placeholder="Amount (KDA)"
        />
        <FormInput
          value={xChainId}
          onChange={(e: any) => setXChainId(e.target.value)}
          placeholder="Destination Chain"
        />
        <FormButton
          onClick={handleSendXTransactionStart}
          disabled={!xToAccount || !xSendAmount || !xChainId || xDisabled}
        >
          {xTransactionLoading ? (
            <div className="w-full loading-container">
              <Spinner />
            </div>
          ) : (
            'Send Cross Chain Transaction'
          )}
        </FormButton>
        {xHash ? (
          <>
            <Spacer size={20} />
            <TransactionHistory reqKey={xHash} />
          </>
        ) : null}
      </Card>
    </>
  );
};

export default SendTransaction;
