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
import { ChainId } from '@kadena/types';

const UserInfo = ({ setToken }: LoginProps) => {
  const { magic, chainId, setChainId } = useMagic();

  const [balance, setBalance] = useState<String | Number>('...');
  const [copied, setCopied] = useState('Copy');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [userInfo, setUserInfo] = useState<KadenaUserMetadata | undefined>();
  const [accountName, setAccountName] = useState('');

  const getUserInfo = () => {
    return magic?.kadena.getUserInfo();
  };

  useEffect(() => {
    const checkLoginAndGetBalance = async () => {
      const isLoggedIn = await getUserInfo();
      if (isLoggedIn) {
        try {
          const kadenaUserInfo = await magic?.kadena.getUserInfo();
          if (kadenaUserInfo) {
            localStorage.setItem('user', kadenaUserInfo?.accountName);
            setUserInfo(kadenaUserInfo);
            setAccountName(kadenaUserInfo.accountName);
            getBalance(kadenaUserInfo.accountName, chainId).then(setBalance);
          }
        } catch (e) {
          console.log('error in fetching address: ' + e);
        }
      }
    };
    setTimeout(() => checkLoginAndGetBalance(), 5000);
  }, []);

  const refresh = useCallback(async () => {
    if (!userInfo) return;
    setIsRefreshing(true);
    getBalance(userInfo.accountName, chainId).then(setBalance);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  }, [getBalance, userInfo, chainId]);

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

  const handleChainIdChange = (newChainId: ChainId) => {
    setChainId(newChainId);
    refresh();
  };

  const ChainIdSelector = () => {
    return (
      <div className="flex-row justify-between">
        <p className="card-label">Select ChainId: </p>
        <select className="code" value={chainId} onChange={(e) => handleChainIdChange(e.target.value as ChainId)}>
          {Array.from({ length: 20 }, (_, i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader id="Wallet">Wallet</CardHeader>
      <CardLabel leftHeader="Status" rightAction={<div onClick={disconnect}>Disconnect</div>} isDisconnect />
      <div className="flex-row">
        <div className="green-dot" />
        <div className="connected">Connected to {getNetworkName()}</div>
      </div>
      <Divider />
      <CardLabel leftHeader="Account" rightAction={!accountName ? <Spinner /> : <div onClick={copy}>{copied}</div>} />
      <div className="code">{accountName?.length == 0 ? 'Fetching account...' : accountName}</div>
      <Divider />
      <ChainIdSelector />
      <Divider />
      <CardLabel
        leftHeader="Balance"
        rightAction={
          isRefreshing ? (
            <div className="loading-container">
              <Spinner />
            </div>
          ) : (
            <div onClick={refresh}>Refresh</div>
          )
        }
      />
      <div className="code">{`${balance} KDA`}</div>
    </Card>
  );
};

export default UserInfo;
