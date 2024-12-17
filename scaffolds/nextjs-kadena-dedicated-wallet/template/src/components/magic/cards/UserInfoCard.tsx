import { useCallback, useEffect, useState } from 'react';
import Divider from '@/components/ui/Divider';
import { LoginProps } from '@/utils/types';
import { logout } from '@/utils/common';
import { useMagic } from '../MagicProvider';
import Card from '@/components/ui/Card';
import CardHeader from '@/components/ui/CardHeader';
import CardLabel from '@/components/ui/CardLabel';
import Spinner from '@/components/ui/Spinner';
import { getNetworkName } from '@/utils/network';
import { getBalance } from '@/utils/get-balance';
import { KadenaUserMetadata } from '@magic-ext/kadena/dist/types/types';

const UserInfo = ({ token, setToken }: LoginProps) => {
  const { magic, chainId } = useMagic();

  const [balance, setBalance] = useState<String | Number>('...');
  const [copied, setCopied] = useState('Copy');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [userInfo, setUserInfo] = useState<KadenaUserMetadata | undefined>();
  const [accountName, setAccountName] = useState(localStorage.getItem('user'));

  const getUserInfo = () => {
    return magic?.kadena.getUserInfo();
  };

  useEffect(() => {
    const checkLoginAndGetBalance = async () => {
      const isLoggedIn = await getUserInfo();
      if (isLoggedIn) {
        try {
          const userInfo = await magic?.kadena.getUserInfo();
          if (userInfo) {
            localStorage.setItem('user', userInfo?.accountName);
            setAccountName(userInfo?.accountName);
            getBalance(userInfo.accountName, chainId).then(setBalance);
          }
        } catch (e) {
          console.log('error in fetching address: ' + e);
        }
      }
    };
    setTimeout(() => checkLoginAndGetBalance(), 5000);
  }, []);

  // const refresh = useCallback(async () => {
  //   setIsRefreshing(true);
  //   await getBalance();
  //   setTimeout(() => {
  //     setIsRefreshing(false);
  //   }, 500);
  // }, [getBalance]);

  // useEffect(() => {
  //   if (accountName) {
  //     refresh();
  //   }
  // }, [accountName, refresh]);

  // useEffect(() => {
  //   setBalance('...');
  // }, [magic, chainId]);

  const disconnect = useCallback(async () => {
    if (magic) {
      await logout(setToken, magic);
    }
  }, [magic, setToken]);

  const copy = useCallback(() => {
    if (accountName && copied === 'Copy') {
      setCopied('Copied!');
      navigator.clipboard.writeText(accountName);
      setTimeout(() => {
        setCopied('Copy');
      }, 1000);
    }
  }, [copied, accountName]);

  return (
    <Card>
      <CardHeader id="Wallet">Wallet</CardHeader>
      <CardLabel leftHeader="Status" rightAction={<div onClick={disconnect}>Disconnect</div>} isDisconnect />
      <div className="flex-row">
        <div className="green-dot" />
        <div className="connected">Connected to {getNetworkName()}</div>
      </div>
      <Divider />
      <CardLabel leftHeader="Address" rightAction={!accountName ? <Spinner /> : <div onClick={copy}>{copied}</div>} />
      <div className="code">{accountName?.length == 0 ? 'Fetching address..' : accountName}</div>
      <Divider />
      <CardLabel
        leftHeader="Balance"
        rightAction={
          isRefreshing ? (
            <div className="loading-container">
              <Spinner />
            </div>
          ) : (
            <div               onClick={() =>
              getBalance(
                (userInfo as KadenaUserMetadata).accountName,
                chainId
              ).then(setBalance)
            }>Refresh</div>
          )
        }
      />
      <div className="code">{`${balance} KDA`}</div>
    </Card>
  );
};

export default UserInfo;
