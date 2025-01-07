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
import { addSignatures } from '@kadena/client';
import { checkAccountExists } from '@/utils/check-account-exists';
import { SignatureWithPublicKey } from '@magic-ext/kadena/dist/types/types';
import { buildTransferCreateTransaction } from '@/pact/transfer-create';
import { buildTransferTransaction } from '@/pact/transfer';
import { PactNumber } from '@kadena/pactjs';
import { accountToPublicKey } from '@/utils/account-to-public-key';
import { getKadenaClient } from '@/utils/client';
import { getBalance } from '@/utils/get-balance';
import { SendTransactionProps } from '@/utils/types';

const SendTransaction = ({ setBalance }: SendTransactionProps) => {
  const { magic, chainId, userInfo } = useMagic();
  const [toAccountError, setToAccountError] = useState(false);
  const [amountError, setAmountError] = useState(false);
  const [hash, setHash] = useState('');
  const [transactionLoading, setTransactionLoadingLoading] = useState(false);

  // Same Chain Transaction
  const [toAccount, setToAccount] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [disabled, setDisabled] = useState(!toAccount || !sendAmount);

  // Cross Chain Transaction
  const [xDisabled, setXDisabled] = useState(false);
  const [toXAccount, setXToAccount] = useState('');
  const [xSendAmount, setXSendAmount] = useState('');
  const [xChainId, setXChainId] = useState<ChainId | string>('');

  useEffect(() => {
    setDisabled(!toAccount || !sendAmount);
    setAmountError(false);
    setToAccountError(false);
  }, [sendAmount, toAccount]);

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

  const sendTransaction = useCallback(async () => {
    if (!userInfo?.accountName) return;
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
        showToast({
          message: `Transaction successful request key: ${response.reqKey}`,
          type: 'success',
        });
        setHash(response.reqKey);
        setTransactionLoadingLoading(false);
        setDisabled(false);
        setToAccount('');
        setSendAmount('');
        getBalance(userInfo.accountName, chainId).then(setBalance);
      }
    } catch (error) {
      setTransactionLoadingLoading(false);
      setDisabled(false);
      setToAccount('');
      setSendAmount('');
      showToast({ message: 'Transaction failed', type: 'error' });
      console.log(error);
    }
  }, [toAccount, sendAmount, userInfo, chainId]);

  return (
    <Card>
      <CardHeader id="send-transaction">Send Transaction</CardHeader>
      <FormInput
        value={toAccount}
        onChange={(e: any) => setToAccount(e.target.value)}
        placeholder="Receiving Account"
      />
      {toAccountError ? <ErrorText>Invalid account</ErrorText> : null}
      <FormInput value={sendAmount} onChange={(e: any) => setSendAmount(e.target.value)} placeholder={`Amount (KDA)`} />
      {amountError ? <ErrorText className="error">Invalid amount</ErrorText> : null}
      <FormButton onClick={sendTransaction} disabled={!toAccount || !sendAmount || disabled}>
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
  );
};

export default SendTransaction;
