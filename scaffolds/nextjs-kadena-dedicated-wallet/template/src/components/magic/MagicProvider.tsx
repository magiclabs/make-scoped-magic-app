import { getNetworkUrl } from '@/utils/network';
import { OAuthExtension } from '@magic-ext/oauth';
import { Magic as MagicBase } from 'magic-sdk';
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { KadenaExtension } from '@magic-ext/kadena';
import { ChainId } from '@kadena/types';
import { DEFAULT_CHAIN_ID, NETWORK_ID } from '@/utils/constants';
import { KadenaUserMetadata } from '@magic-ext/kadena/dist/types/types';

export type Magic = MagicBase<OAuthExtension[] & KadenaExtension[]>;

type MagicContextType = {
  magic: Magic | null;
  chainId: ChainId;
  userInfo: KadenaUserMetadata | undefined;
  setChainId: (chainId: ChainId) => void;
  setUserInfo: (userInfo: KadenaUserMetadata | undefined) => void;
};

const MagicContext = createContext<MagicContextType>({
  magic: null,
  chainId: DEFAULT_CHAIN_ID,
  userInfo: undefined,
  setChainId: () => {},
  setUserInfo: () => {},
});

export const useMagic = () => useContext(MagicContext);

const MagicProvider = ({ children }: { children: ReactNode }) => {
  const [magic, setMagic] = useState<Magic | null>(null);
  const [chainId, setChainId] = useState<ChainId>(DEFAULT_CHAIN_ID);
  const [userInfo, setUserInfo] = useState<KadenaUserMetadata | undefined>();

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
      chainId,
      userInfo,
      setChainId,
      setUserInfo,
    };
  }, [magic, chainId, userInfo]);

  return <MagicContext.Provider value={value}>{children}</MagicContext.Provider>;
};

export default MagicProvider;
