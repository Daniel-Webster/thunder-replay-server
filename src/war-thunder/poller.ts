// wait for the localhost api to be ready
// this will be when it stops throwing errors on the MapInfo call

import { Hudmsg, GameChat, ThunderClient, MapInfo } from 'thunderscript-client';
import { Session } from '../entities';
import ora, { Ora } from 'ora';
import { WarThunderDao } from '../dao';

export interface PollerOptions {
  pollRate: number;
  session: Session;
  mapInfo: MapInfo;
  client: ThunderClient;
}

/**
 * Uses the War Thunder API to scrape the session data
 * and then saves it to the database
 */
export class Poller {
  tickRate: number;
  spinner: Ora;
  lastGamechat: number;
  lastEventId: number;
  lastDamage: number;
  session: Session;
  interval?: NodeJS.Timeout;
  client: ThunderClient;
  mapInfo: MapInfo;
  dao: WarThunderDao;
  constructor({ pollRate: tickRate, session, mapInfo, client }: PollerOptions) {
    this.spinner = ora('Polling for Game Data').start();
    this.tickRate = tickRate;
    this.mapInfo = mapInfo;
    this.lastGamechat = 0;
    this.lastEventId = 0;
    this.lastDamage = 0;
    this.session = session;
    this.client = client;
    this.dao = new WarThunderDao();
  }
  async poll(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.spinner.start('Polling for Game Data');
      this.interval = setInterval(async () => {
        try {
          const { done } = await this.scrapeAllEndpoints();
          if (done) {
            this.cancel();
            this.spinner.succeed('Detected end of game. Ending session.');
            resolve();
          }
        } catch (err) {
          this.cancel();
          this.spinner.fail('Error scraping War Thunder API');
          reject(err);
        }
      }, this.tickRate);
    });
  }

  async scrapeAllEndpoints() {
    await this.scrapeMapInfo();
    if (!this.mapInfo.valid) {
      return {
        done: true,
      };
    }
    await Promise.all([
      this.scrapeHudmsg(),
      this.scrapeIndicators(),
      this.scrapeGamechat(),
      this.scrapeMapObjects(),
      this.scrapeState(),
      this.scrapeMission(),
    ]);

    this.spinner.text = `Polling for Game Data - Last Event: ${this.lastEventId} - Last Damage: ${this.lastDamage} - Last Gamechat: ${this.lastGamechat}`;
    return {
      done: false,
    };
  }

  async scrapeMission() {
    const mission = await this.client.getMission();
    await this.dao.saveMission(this.session, mission);
  }

  async scrapeState() {
    const state = await this.client.getState();
    await this.dao.saveState(this.session, state);
  }

  async scrapeMapInfo() {
    const mapInfo = await this.client.getMapInfo();
    if (this.mapInfo !== mapInfo) {
      this.mapInfo = mapInfo;
      await this.dao.saveMapInfo(this.session, mapInfo);
    }
  }

  async scrapeHudmsg() {
    const hudmsg = await this.client.getHudmsg({
      lastDmg: this.lastDamage,
      lastEvt: this.lastEventId,
    });
    await this.dao.saveHudmsg(this.session, hudmsg);
    this.updateDamageIdIfNewer(hudmsg);
    // todo: update lastEventId
  }

  async scrapeIndicators() {
    const indicators = await this.client.getIndicators();
    await this.dao.saveIndicators(this.session, indicators);
  }

  async scrapeGamechat() {
    const gamechat = await this.client.getGameChat(this.lastGamechat);
    this.updateGamechatIdIfNewer(gamechat);
    await this.dao.saveGamechat(this.session, gamechat);
  }

  async scrapeMapObjects() {
    const mapObjects = await this.client.getMapObjects();
    await this.dao.saveMapObjects(this.session, mapObjects);
  }

  updateDamageIdIfNewer(hudmsg: Hudmsg) {
    if (hudmsg.damage?.length) {
      const lastDmg = hudmsg.damage[hudmsg.damage.length - 1]?.id;
      if (lastDmg && lastDmg > this.lastDamage) {
        this.lastDamage = lastDmg;
      }
    }
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
