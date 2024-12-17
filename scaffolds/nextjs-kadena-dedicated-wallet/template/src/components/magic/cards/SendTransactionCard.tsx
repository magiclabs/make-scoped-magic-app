import React, { useCallback, useEffect, useState } from 'react';
import Divider from '@/components/ui/Divider';
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
import { KadenaUserMetadata } from '@magic-ext/kadena/dist/types/types';
import { buildTransferCreateTransaction } from '@/pact/transfer-create';
import { buildTransferTransaction } from '@/pact/transfer';
import { PactNumber } from '@kadena/pactjs';
import { accountToPublicKey } from '@/utils/account-to-public-key';
import { getKadenaClient } from '@/utils/client';

const SendTransaction = () => {
  const { magic } = useMagic();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [toAddressError, setToAddressError] = useState(false);
  const [amountError, setAmountError] = useState(false);
  const [hash, setHash] = useState('');
  const [transactionLoading, setTransactionLoadingLoading] = useState(false);
  const publicAddress = localStorage.getItem('user');

    // User
    const [email, setEmail] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userInfo, setUserInfo] = useState<KadenaUserMetadata | undefined>();
    const [balance, setBalance] = useState(0);
  
    // Same Chain Transaction
    const [toAccount, setToAccount] = useState("");
    const [sendAmount, setSendAmount] = useState("");
    const [disabled, setDisabled] = useState(!toAddress || !sendAmount);
  
    // Cross Chain Transaction
    const [xDisabled, setXDisabled] = useState(false);
    const [toXAccount, setXToAccount] = useState("");
    const [xSendAmount, setXSendAmount] = useState("");
    const [xChainId, setXChainId] = useState<ChainId | string>("");

  useEffect(() => {
    setDisabled(!toAddress || !amount);
    setAmountError(false);
    setToAddressError(false);
  }, [amount, toAddress]);

  const handleBuildTransaction = async () => {
    const accountExists = await checkAccountExists(toAccount, selectedChainId);

    const to = toAccount;
    const from = userInfo?.accountName as string;
    const amount = new PactNumber(sendAmount).toPactDecimal();
    const chainId = selectedChainId;
    const senderPubKey = userInfo?.publicKey as string;
    const receiverPubKey = accountToPublicKey(to);
    const isSpireKeyAccount = Boolean(userInfo?.loginType === "spirekey");

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
    const isSpireKeyLogin = Boolean(userInfo?.loginType === "spirekey");

    if (isSpireKeyLogin) {
      const { transactions } = await magic?.kadena.signTransactionWithSpireKey(transaction);
      return transactions[0];
    } else {
      const signature = await magic?.kadena.signTransaction(transaction.hash);
      return addSignatures(transaction, signature);
    }
  };

  const sendTransaction = useCallback(async () => {
    if (!userInfo?.accountName) return;

    setDisabled(true);

    try {
      // TODO: Add chainId?
      const kadenaClient = getKadenaClient();

      const transaction = await handleBuildTransaction();

      const signedTx = await signTransaction(transaction);
      console.log("signed transaction", signedTx);

      // See if transaction will succeed locally before broadcasting
      const localRes = await kadenaClient.local(signedTx as ICommand);
      if (localRes.result.status === "failure") {
        throw new Error((localRes.result.error as { message: string }).message);
      }

      const transactionDescriptor = await kadenaClient.submit(signedTx as ICommand);
      console.log("broadcasting transaction...", transactionDescriptor);

      const response = await kadenaClient.listen(transactionDescriptor);
      setDisabled(false);

      if (response.result.status === "failure") {
        console.error(response.result.error);
      } else {
        showToast({
          message: `Transaction successful sig: ${signature}`,
          type: 'success',
        });
        setTransactionLoadingLoading(false);
        setDisabled(false);
        setToAddress('');
        setSendAmount('');
        getBalance(userInfo.accountName, selectedChainId).then(setBalance);
      }
    } catch (error) {
      setTransactionLoadingLoading(false);
      setDisabled(false);
      setToAddress('');
      setSendAmount('');
      showToast({ message: 'Transaction failed', type: 'error' });
      console.log(error);
    }
  },[]);

  return (
    <Card>
      <CardHeader id="send-transaction">Send Transaction</CardHeader>
      <FormInput
        value={toAddress}
        onChange={(e: any) => setToAddress(e.target.value)}
        placeholder="Receiving Address"
      />
      {toAddressError ? <ErrorText>Invalid address</ErrorText> : null}
      <FormInput value={sendAmount} onChange={(e: any) => setSendAmount(e.target.value)} placeholder={`Amount (SOL)`} />
      {amountError ? <ErrorText className="error">Invalid amount</ErrorText> : null}
      <FormButton onClick={sendTransaction} disabled={!toAddress || !amount || disabled}>
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
          <TransactionHistory />
        </>
      ) : null}
    </Card>
  );
};

export default SendTransaction;
