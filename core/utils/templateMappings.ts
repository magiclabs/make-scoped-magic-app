import { Ora } from 'ora';
import {
  AuthTypePrompt,
  BlockchainNetworkPrompt,
  ConfigurationPrompt,
  ProjectNamePrompt,
  PublishableApiKeyPrompt,
} from 'scaffolds/prompts';
import { CreateMagicAppConfig, pauseTimerAndSpinner } from 'core/create-app';
import { makeInputsLowercase } from 'core/flags';
import BaseScaffold from '../types/BaseScaffold';
import DedicatedScaffold, { flags as dedicatedFlags } from '../../scaffolds/nextjs-dedicated-wallet/scaffold';
import FlowDedicatedScaffold, {
  flags as flowDedicatedFlags,
} from '../../scaffolds/nextjs-flow-dedicated-wallet/scaffold';
import SolanaDedicatedScaffold, {
  flags as solanaDedicatedFlags,
} from '../../scaffolds/nextjs-solana-dedicated-wallet/scaffold';
import { Timer } from './timer';
import KadenaDedicatedScaffold, {
  flags as kadenaDedicatedFlags,
} from '../../scaffolds/nextjs-kadena-dedicated-wallet/scaffold';

export type Chain = 'evm' | 'solana' | 'flow' | 'kadena';
export type Template =
  | 'nextjs-dedicated-wallet'
  | 'nextjs-solana-dedicated-wallet'
  | 'nextjs-flow-dedicated-wallet'
  | 'nextjs-kadena-dedicated-wallet';

type ConfigType = CreateMagicAppConfig & {
  chain: Chain | undefined;
  configuration: string | undefined;
  isChosenTemplateValid: boolean;
  isQuickstart: boolean;
};

function mapTemplateToChain(template: string): Chain | undefined {
  switch (template) {
    case 'nextjs-dedicated-wallet':
      return 'evm';
    case 'nextjs-solana-dedicated-wallet':
      return 'solana';
    case 'nextjs-flow-dedicated-wallet':
      return 'flow';
    case 'nextjs-kadena-dedicated-wallet':
      return 'kadena';
    default:
      return undefined;
  }
}

export async function mapTemplateToScaffold(
  template: string,
  appData: any,
  spinner: Ora,
  timer: Timer,
): Promise<BaseScaffold> {
  const data = appData;
  data.network = makeInputsLowercase(data.network);
  pauseTimerAndSpinner(timer, spinner);
  if (!data.publishableApiKey) {
    data.publishableApiKey = await PublishableApiKeyPrompt.publishableApiKeyPrompt();
  }
  switch (template) {
    case 'nextjs-dedicated-wallet':
      if (!data.network) {
        data.network = await BlockchainNetworkPrompt.evmNetworkPrompt();
      }

      if (data.isQuickstart) {
        data.loginMethods = ['Email OTP'];
      } else if (!data.loginMethods || data.loginMethods.length === 0) {
        data.loginMethods = await AuthTypePrompt.loginMethodsPrompt();
      }
      return new DedicatedScaffold(data);
    case 'nextjs-solana-dedicated-wallet':
      if (!data.network) {
        data.network = await BlockchainNetworkPrompt.solanaNetworkPrompt();
      }
      if (!data.loginMethods || data.loginMethods.length === 0) {
        data.loginMethods = await AuthTypePrompt.loginMethodsPrompt();
      }
      return new SolanaDedicatedScaffold(data);
    case 'nextjs-flow-dedicated-wallet':
      if (!data.network) {
        data.network = await BlockchainNetworkPrompt.flowNetworkPrompt();
      }
      if (!data.loginMethods || data.loginMethods.length === 0) {
        data.loginMethods = await AuthTypePrompt.loginMethodsPrompt();
      }
      return new FlowDedicatedScaffold(data);
    case 'nextjs-kadena-dedicated-wallet':
      if (!data.network) {
        data.network = await BlockchainNetworkPrompt.kadenaNetworkPrompt();
      }
      if (!data.loginMethods || data.loginMethods.length === 0) {
        data.loginMethods = await AuthTypePrompt.loginMethodsPrompt('kadena');
      }
      return new KadenaDedicatedScaffold(data);
    default:
      throw new Error(`Invalid template: ${template}`);
  }
}

export function mapTemplateToFlags(template: string): any {
  switch (template) {
    case 'nextjs-dedicated-wallet':
      return dedicatedFlags;
    case 'nextjs-solana-dedicated-wallet':
      return solanaDedicatedFlags;
    case 'nextjs-flow-dedicated-wallet':
      return flowDedicatedFlags;
    case 'nextjs-kadena-dedicated-wallet':
      return kadenaDedicatedFlags;
    default:
      throw new Error(`Invalid template: ${template}`);
  }
}

const quickstartConfig = (config: ConfigType): ConfigType => ({
  ...config,
  template: 'nextjs-dedicated-wallet',
  network: 'polygon-amoy',
  chain: 'evm',
  isChosenTemplateValid: true,
  isQuickstart: true,
});

const evmConfig = async (config: ConfigType): Promise<ConfigType> => ({
  ...config,
  template: 'nextjs-dedicated-wallet',
  network: await BlockchainNetworkPrompt.evmNetworkPrompt(),
  chain: 'evm',
  isChosenTemplateValid: true,
  isQuickstart: false,
});

const solanaConfig = async (config: ConfigType): Promise<ConfigType> => ({
  ...config,
  template: 'nextjs-solana-dedicated-wallet',
  network: await BlockchainNetworkPrompt.solanaNetworkPrompt(),
  chain: 'solana',
  isChosenTemplateValid: true,
  isQuickstart: false,
});

const flowConfig = async (config: ConfigType): Promise<ConfigType> => ({
  ...config,
  template: 'nextjs-flow-dedicated-wallet',
  network: await BlockchainNetworkPrompt.flowNetworkPrompt(),
  chain: 'flow',
  isChosenTemplateValid: true,
  isQuickstart: false,
});

const kadenaConfig = async (config: ConfigType): Promise<ConfigType> => ({
  ...config,
  template: 'nextjs-kadena-dedicated-wallet',
  network: await BlockchainNetworkPrompt.kadenaNetworkPrompt(),
  chain: 'kadena',
  isChosenTemplateValid: true,
  isQuickstart: false,
});

export const buildTemplate = async (appConfig: ConfigType): Promise<ConfigType> => {
  let config = { ...appConfig };

  if (!config.projectName) {
    config.projectName = await ProjectNamePrompt.askProjectName();
  }

  if (!config.template) {
    config.configuration = await ConfigurationPrompt.askConfiguration();

    if (config.configuration === 'quickstart') {
      return quickstartConfig(config);
    }
  } else {
    config.chain = mapTemplateToChain(config.template);
  }

  if (!config.chain) {
    config.chain = await BlockchainNetworkPrompt.chainPrompt();
  }

  if (!config.network) {
    switch (config.chain) {
      case 'solana':
        config = await solanaConfig(config);
        break;
      case 'flow':
        config = await flowConfig(config);
        break;
      case 'kadena':
        config = await kadenaConfig(config);
        break;
      case 'evm':
        config = await evmConfig(config);
        break;
      default:
        config = await evmConfig(config);
        break;
    }
  } else {
    const evmNetworks = [
      'ethereum',
      'ethereum-sepolia',
      'polygon',
      'polygon-amoy',
      'etherlink',
      'etherlink-testnet',
      'zksync',
      'zksync-sepolia',
    ];
    const solanaNetworks = ['solana-devnet', 'solana-mainnet'];
    const kadenaNetworks = ['kadena-testnet', 'kadena-mainnet'];

    if (evmNetworks.includes(config.network)) {
      config.chain = 'evm';
    } else if (solanaNetworks.includes(config.network)) {
      config.chain = 'solana';
    } else if (kadenaNetworks.includes(config.network)) {
      config.chain = 'kadena';
    } else {
      config.chain = 'flow';
    }
  }

  config.isChosenTemplateValid = true;

  return config;
};
