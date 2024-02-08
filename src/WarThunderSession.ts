import { MapInfo, ThunderClient } from 'thunderscript-client';
import { Hudmsg as HudmsgEntity, Session } from './entities';
import { AppDataSource } from './data-source';
import ora, { Ora } from 'ora';
import { Poller } from './poller';
export class WarThunderSession {
  spinner: Ora;
  mapInfo: MapInfo;
  session?: Session;
  client: ThunderClient;
  constructor(mapInfo: MapInfo, client: ThunderClient) {
    this.spinner = ora('Initializing Sesson').start();
    this.mapInfo = mapInfo;
    this.client = client;
  }
  async insertNewSession(sessionNamePrefix?: string) {
    const mission = await this.client.getMission();
    const sesh = new Session(
      `${sessionNamePrefix || 'Test Session Name'} - ${new Date(Date.now()).toISOString()}`,
    );
    sesh.mission_status = mission.status;
    sesh.start_date = new Date(Date.now());
    this.session = await AppDataSource.manager.save(sesh);
    this.spinner.info(
      `Created new session: ${this.session.session_name} with id: ${this.session.id}`,
    );
  }

  async record() {
    if (!this.session) {
      throw new Error('Session failed to initialize');
    }
    const poller = new Poller(this.session, this.mapInfo, this.client);
    this.spinner.succeed('Session Initialized');
    await poller.poll();
    await this.end();
  }
  async end() {
    const mission = await this.client.getMission();
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
