import { getNetworkUrl } from '@/utils/network';
import { OAuthExtension } from '@magic-ext/oauth';
import { Magic as MagicBase } from 'magic-sdk';
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { KadenaExtension } from "@magic-ext/kadena";
import { ChainId } from '@kadena/types';
import { DEFAULT_CHAIN_ID, NETWORK_ID } from '@/utils/constants';

export type Magic = MagicBase<OAuthExtension[] & KadenaExtension[]>;

type MagicContextType = {
  magic: Magic | null;
  setChainId: (chainId: ChainId) => void;
};

const MagicContext = createContext<MagicContextType>({
  magic: null,
  setChainId: () => {},
});

export const useMagic = () => useContext(MagicContext);

const MagicProvider = ({ children }: { children: ReactNode }) => {
  const [magic, setMagic] = useState<Magic | null>(null);
  const [chainId, setChainId] = useState<ChainId>('0');

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MAGIC_API_KEY) {
      const magic = new MagicBase(process.env.NEXT_PUBLIC_MAGIC_API_KEY as string, {
        extensions: [
          new OAuthExtension(),
          new KadenaExtension({
            rpcUrl: getNetworkUrl(chainId),
            chainId: chainId || DEFAULT_CHAIN_ID,
            networkId: NETWORK_ID,
            createAccountsOnChain: true,
          }),
        ],
      });
      setMagic(magic);

    }
  }, [chainId]);

  const value = useMemo(() => {
    return {
      magic,
      setChainId
    };
  }, [magic]);

  return <MagicContext.Provider value={value}>{children}</MagicContext.Provider>;
};

export default MagicProvider;
