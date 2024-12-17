import { DEFAULT_CHAIN_ID, NETWORK_ID } from "./constants";

export enum Network {
  KADENA_TESTNET = 'kadena-testnet',
  KADENA_MAINNET = 'kadena-mainnet',
}

export const getNetworkUrl = () => {
  switch (process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK) {
    case Network.KADENA_TESTNET:
      return `https://api.testnet.chainweb.com/chainweb/0.0/${NETWORK_ID}/chain/${DEFAULT_CHAIN_ID}/pact`;;
    case Network.KADENA_MAINNET:
      return `https://api.chainweb.com/chainweb/0.0/${NETWORK_ID}/chain/${DEFAULT_CHAIN_ID}/pact`;;
    default:
      throw new Error('Network not supported');
  }
};

export const getNetworkName = () => {
  switch (process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK) {
    case Network.KADENA_TESTNET:
      return 'Kadena (Testnet)';
    case Network.KADENA_MAINNET:
      return 'Kadena (Mainnet)';
  }
};

export const getBlockExplorer = (address: string) => {
  // TODO: Update block explorer URL
  switch (process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK) {
    case Network.KADENA_TESTNET:
      return `https://explorer.chainweb.com/testnet/address/${address}`;
    case Network.KADENA_MAINNET:
      return `https://explorer.chainweb.com/address/${address}`;
  }
};
