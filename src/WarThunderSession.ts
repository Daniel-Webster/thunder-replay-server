import { MapInfo } from 'thunderscript-client';
import { Hudmsg as HudmsgEntity, Session } from './entities';
import { AppDataSource } from './data-source';
import ora, { Ora } from 'ora';
import { client, Poller } from './poller';

export class WarThunderSession {
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
