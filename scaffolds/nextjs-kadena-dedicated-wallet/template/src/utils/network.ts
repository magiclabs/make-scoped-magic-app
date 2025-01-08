import { ChainId } from '@kadena/types';
import { DEFAULT_CHAIN_ID } from './constants';

export enum NetworkName {
  KADENA_TESTNET = 'kadena-testnet',
  KADENA_MAINNET = 'kadena-mainnet',
}

export enum NetworkId {
  KADENA_TESTNET = 'testnet04',
  KADENA_MAINNET = 'mainnet01',
}

export const getNetworkUrl = (chainId?: ChainId) => {
  switch (process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK) {
    case NetworkName.KADENA_TESTNET:
      return `https://api.testnet.chainweb.com/chainweb/0.0/${NetworkId.KADENA_TESTNET}/chain/${chainId || DEFAULT_CHAIN_ID}/pact`;
    case NetworkName.KADENA_MAINNET:
      return `https://api.chainweb.com/chainweb/0.0/${NetworkId.KADENA_MAINNET}/chain/${chainId || DEFAULT_CHAIN_ID}/pact`;
    default:
      throw new Error('Network not supported');
  }
};

export const getNetworkName = () => {
  switch (process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK) {
    case NetworkName.KADENA_TESTNET:
      return 'Kadena (Testnet)';
    case NetworkName.KADENA_MAINNET:
      return 'Kadena (Mainnet)';
  }
};

export const getNetworkId = () => {
  switch (process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK) {
    case NetworkName.KADENA_TESTNET:
      return 'testnet04';
    case NetworkName.KADENA_MAINNET:
      return 'mainnet01';
    default:
      return 'testnet04';
  }
};

export const getBlockExplorer = (reqKey: string) => {
  switch (process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK) {
    case NetworkName.KADENA_TESTNET:
      return `https://explorer.chainweb.com/testnet/txdetail/${reqKey}`;
    case NetworkName.KADENA_MAINNET:
      return `https://explorer.chainweb.com/mainnet/txdetail/${reqKey}`;
  }
};
