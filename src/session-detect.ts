// wait for the localhost api to be ready
// this will be when it stops throwing errors on the MapInfo call

import { MapInfo, Hudmsg, thunderClient, Indicators } from 'thunderscript-client';
import { Hudmsg as HudmsgEntity, Indicators as IndicatorsEntity, Session } from './entities';
import { AppDataSource } from './data-source';
import ora, { Ora } from 'ora';

async function insertNewSession() {
  console.log('Inserting a new session into the database...');
  const sesh = new Session(process.argv[2] || `Test Session Name - ${Date.now().toLocaleString()}`);
  await AppDataSource.manager.save(sesh);
  console.log('Saved a new session with id: ' + sesh.id);
  return sesh;
}

const client = thunderClient();
const maxRetries = 50;
export async function detectSession(): Promise<WarThunderSession> {
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
          const newSession = await insertNewSession();
          resolve(new WarThunderSession(newSession, res));
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
  session: Session;
  constructor(session: Session, mapInfo: MapInfo) {
    this.spinner = ora('Initializing Sesson').start();
    this.mapInfo = mapInfo;
    this.session = session;
  }

  async record() {
    const poller = new Poller(this.session);
    this.spinner.succeed('Session Initialized');
    return await poller.poll().catch(() => {
      this.spinner.start('Ending Session');
      AppDataSource.manager.update(Session, this.session.id, { end_date: new Date(Date.now()) });
      this.spinner.succeed('Session Ended');
    });
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
  async poll() {
    return new Promise((_resolve, reject) => {
      this.interval = setInterval(async () => {
        try {
          await this.scrape();
          this.spinner.info('Scraped War Thunder API successfully. Polling again in 5 seconds.');
          this.spinner.start('Polling for Game Data');
        } catch (err) {
          this.spinner.fail('Error scraping War Thunder API');
          clearInterval(this.interval);
          reject(err);
        }
      }, 5000);
    });
  }

  async scrape() {
    const mapInfo = await client.getMapInfo();
    if (!mapInfo.valid) {
      throw new Error('MapInfo is no longer valid! Ending Session.');
    }
    const hudmsg = await client.getHudmsg({ lastDmg: this.lastDamage, lastEvt: this.lastEventId });
    this.saveHudmsg(hudmsg);
    const indicators = await client.getIndicators();
    this.saveIndicators(indicators);
  }

  async saveHudmsg(hudmsg: Hudmsg) {
    // save the hudmsg to the database
    const hudmsgEntity = new HudmsgEntity(this.session, hudmsg);
    await AppDataSource.manager.save(hudmsgEntity);
  }

  async saveIndicators(indicators: Indicators) {
    // save the hudmsg to the database
    const indicatorsEntity = new IndicatorsEntity(this.session, indicators);
    await AppDataSource.manager.save(indicatorsEntity);
  }

  async cancel() {
    clearInterval(this.interval);
  }
}
