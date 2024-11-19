import os from 'os';
import { HtEvents } from '@ht-sdks/events-sdk-js-node';
import { loadConfig } from './config';
import { addShutdownTask } from './utils/shutdown';

export interface Analytics {
  logEvent(event: string, data: any): void;
  identifyUser(userId: string): void;
  prepareForShutdown(): Promise<void>;
}

export class HightouchAnalytics implements Analytics {
  private htevents: HtEvents;

  constructor() {
    this.htevents = new HtEvents({
      writeKey: 'beb757ad12ccfdaa3d8a1ada480ead6719b7d9033a747bc55b66cc4c18d18347',
      host: 'https://us-east-1.hightouch-events.com',
    });
    addShutdownTask(async (reason) => {
      this.logEvent('cli-tool-shutdown', reason);
      await this.prepareForShutdown();
    });
  }

  logEvent(event: string, data: any): void {
    const config = loadConfig();
    if (config?.shouldTrackUsageData ?? false) {
      this.htevents.track({ anonymousId: config?.id ?? '', event, properties: data });
    }
  }

  identifyUser(userId: string) {
    const config = loadConfig();
    if (config?.shouldTrackUsageData ?? false) {
      this.htevents.identify({ userId, traits: { os: os.platform } });
    }
  }

  async prepareForShutdown(): Promise<void> {
    await this.htevents.closeAndFlush();
  }
}

export const SharedAnalytics = new HightouchAnalytics();
