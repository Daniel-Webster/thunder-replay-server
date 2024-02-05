// wait for the localhost api to be ready
// this will be when it stops throwing errors on the MapInfo call

import { Hudmsg, thunderClient, Indicators, GameChat } from 'thunderscript-client';
import {
  Hudmsg as HudmsgEntity,
  Indicators as IndicatorsEntity,
  Gamechat as GameChatEntity,
  Session,
} from './entities';
import { AppDataSource } from './data-source';
import ora, { Ora } from 'ora';

export const client = thunderClient('http://localhost:9222');
/**
 * Uses the War Thunder API to scrape the session data
 * and then saves it to the database
 */
export class Poller {
  spinner: Ora;
  lastGamechat: number;
  lastEventId: number;
  lastDamage: number;
  session: Session;
  interval?: NodeJS.Timeout;
  constructor(session: Session) {
    this.spinner = ora('Polling for Game Data').start();
    this.lastGamechat = 0;
    this.lastEventId = 0;
    this.lastDamage = 0;
    this.session = session;
  }
  async poll(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.interval = setInterval(async () => {
        try {
          this.spinner.start('Polling for Game Data');
          const { done } = await this.scrape();
          if (done) {
            this.cancel();
            this.spinner.succeed('Detected end of game. Ending session.');
            resolve();
          }
        } catch (err) {
          this.spinner.fail('Error scraping War Thunder API');
          this.cancel();
          reject(err);
        }
      }, 5000);
    });
  }

  async scrape() {
    const mapInfo = await client.getMapInfo();
    if (!mapInfo.valid) {
      return {
        done: true,
      };
    }
    const hudmsg = await client.getHudmsg({ lastDmg: this.lastDamage, lastEvt: this.lastEventId });
    await this.saveHudmsg(hudmsg);
    this.updateDamageIdIfNewer(hudmsg);
    const indicators = await client.getIndicators();
    await this.saveIndicators(indicators);
    const gamechat = await client.getGameChat(this.lastGamechat);
    this.updateGamechatIdIfNewer(gamechat);
    await this.saveGamechat(gamechat);
    this.spinner.info('Scraped War Thunder API successfully. Polling again in 5 seconds.');
    return {
      done: false,
    };
  }

  async saveHudmsg(hudmsg: Hudmsg) {
    // save the hudmsg to the database
    const hudmsgEntity = new HudmsgEntity(this.session, hudmsg);
    await AppDataSource.manager.save(hudmsgEntity);
  }

  updateDamageIdIfNewer(hudmsg: Hudmsg) {
    if (hudmsg.damage?.length) {
      const lastDmg = hudmsg.damage[hudmsg.damage.length - 1]?.id;
      if (lastDmg && lastDmg > this.lastDamage) {
        this.lastDamage = lastDmg;
      }
    }
  }

  async saveIndicators(indicators: Indicators) {
    // save the hudmsg to the database
    const indicatorsEntity = new IndicatorsEntity(this.session, indicators);
    await AppDataSource.manager.save(indicatorsEntity);
  }

  async saveGamechat(gamechat: GameChat) {
    // save the hudmsg to the database
    const gamechatEntity = new GameChatEntity(this.session, gamechat);
    await AppDataSource.manager.save(gamechatEntity);
  }

  updateGamechatIdIfNewer(gamechat: GameChat) {
    if (gamechat?.length) {
      const lastGamechat = gamechat[gamechat.length - 1].id;
      if (lastGamechat && lastGamechat > this.lastGamechat) {
        this.lastGamechat = lastGamechat;
      }
    }
  }

  cancel() {
    clearInterval(this.interval);
  }
}
