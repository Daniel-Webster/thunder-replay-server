// wait for the localhost api to be ready
// this will be when it stops throwing errors on the MapInfo call

import { MapInfo, Hudmsg, thunderClient, Indicators, GameChat } from 'thunderscript-client';
import {
  Hudmsg as HudmsgEntity,
  Indicators as IndicatorsEntity,
  Gamechat as GameChatEntity,
  Session,
} from './entities';
import { AppDataSource } from './data-source';
import ora, { Ora } from 'ora';

const client = thunderClient();
const maxRetries = 50;
export async function waitForSession(): Promise<WarThunderSession> {
  return new Promise((resolve, reject) => {
    // use ora to start a spinner
    // and then stop it once the map info call is successful
    const spinner = ora('Waiting for War Thunder').start();
    let count = 0;

    const interval = setInterval(() => {
      client
        .getMapInfo()
        .then(async (res) => {
          if (res.valid === false) {
            spinner.color = 'yellow';
            spinner.prefixText = '⚠️';
            return;
          }
          spinner.succeed('War Thunder is ready');
          clearInterval(interval);
          const thunderSession = new WarThunderSession(res);
          await thunderSession.insertNewSession();
          resolve(thunderSession);
        })
        .catch((err) => {
          if (count >= maxRetries) {
            spinner.fail('War Thunder is not ready passed max retries');
            clearInterval(interval);
            reject(err);
          }
          count++;
        });
    }, 5000);
  });
}

class WarThunderSession {
  spinner: Ora;
  mapInfo: MapInfo;
  session?: Session;
  constructor(mapInfo: MapInfo) {
    this.spinner = ora('Initializing Sesson').start();
    this.mapInfo = mapInfo;
  }
  async insertNewSession() {
    const mission = await client.getMission();
    const sesh = new Session(
      process.argv[2] || `Test Session Name - ${new Date(Date.now()).toISOString()}`,
    );
    sesh.mission_status = mission.status;
    sesh.start_date = new Date(Date.now());
    this.spinner.info(`Inserting new session: ${sesh.session_name}`);
    this.session = await AppDataSource.manager.save(sesh);
  }

  async record() {
    if (!this.session) {
      throw new Error('Session failed to initialize');
    }
    const poller = new Poller(this.session);
    this.spinner.succeed('Session Initialized');
    await poller.poll();
    await this.end();
  }
  async end() {
    const mission = await client.getMission();
    this.spinner.start('Ending Session');
    AppDataSource.manager.update(Session, this.session?.id, {
      end_date: new Date(Date.now()),
      mission_status: mission.status,
    });
    AppDataSource.manager
      .count(HudmsgEntity, { where: { session_id: this.session } })
      .then((count) => {
        this.spinner.info(`Session ended with ${count} hudmsgs`);
      });
    this.spinner.succeed('Session Ended');
  }
}

/**
 * Uses the War Thunder API to scrape the session data
 * and then saves it to the database
 */
class Poller {
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
