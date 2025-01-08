import React, { useState } from 'react';
import WalletMethods from './cards/WalletMethodsCard';
import SendTransaction from './cards/SendTransactionCard';
import Spacer from '@/components/ui/Spacer';
import { LoginProps } from '@/utils/types';
import UserInfo from './cards/UserInfoCard';
import DevLinks from './DevLinks';
import Header from './Header';
import SendCrosschainTransaction from './cards/SendCrosschainTransactionCard';

export default function Dashboard({ token, setToken }: LoginProps) {
  const [balance, setBalance] = useState<string | number>('...');

  return (
    <div className="home-page">
      <Header />
      <div className="cards-container">
        <UserInfo balance={balance} setBalance={setBalance} setToken={setToken} />
        <Spacer size={10} />
        <SendTransaction setBalance={setBalance} />
        <Spacer size={10} />
        <SendCrosschainTransaction setBalance={setBalance} />
        <Spacer size={10} />
        <WalletMethods token={token} setToken={setToken} />
        <Spacer size={15} />
      </div>
      <DevLinks primary />
    </div>
  );
}
