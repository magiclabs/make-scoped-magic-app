import { Dispatch, SetStateAction } from 'react';

export type LoginProps = {
  token: string;
  setToken: Dispatch<SetStateAction<string>>;
};

export type UserInfoProps = {
  balance: string | number;
  setBalance: Dispatch<SetStateAction<string | number>>;
  setToken: Dispatch<SetStateAction<string>>;
};

export type SendTransactionProps = {
  setBalance: Dispatch<SetStateAction<string | number>>;
};

export type { Magic } from '../components/magic/MagicProvider';
