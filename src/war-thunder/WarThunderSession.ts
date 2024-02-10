import { MapInfo, ThunderClient } from 'thunderscript-client';
import { Session } from '../entities';
import { AppDataSource } from '../data-source';
import ora, { Ora } from 'ora';
import { Poller } from './poller';

export interface WarThunderSessionOptions {
  mapInfo: MapInfo;
  client: ThunderClient;
  pollRate: number;
}

export class WarThunderSession {
  spinner: Ora;
  mapInfo: MapInfo;
  session?: Session;
  client: ThunderClient;
  pollRate: number;
  constructor({ mapInfo, client, pollRate }: WarThunderSessionOptions) {
    this.spinner = ora('Initializing Sesson').start();
    this.mapInfo = mapInfo;
    this.client = client;
    this.pollRate = pollRate;
  }
  async insertNewSession(sessionNamePrefix?: string) {
    const mission = await this.client.getMission();
    const sesh = new Session(
      `${sessionNamePrefix || 'Untitled'} - ${new Date(Date.now()).toISOString()}`,
    );
    sesh.mission_status = mission.status;
    sesh.start_date = new Date(Date.now());
    this.session = await AppDataSource.manager.save(sesh);
    this.spinner.info(
      `Created new session: ${this.session.session_name} with id: ${this.session.id}`,
    );
    return this.session;
  }

  async record() {
    this.session = await this.insertNewSession();
    if (!this.session) {
      throw new Error('Session failed to initialize');
    }
    const poller = new Poller({
      pollRate: this.pollRate,
      session: this.session,
      client: this.client,
      mapInfo: this.mapInfo,
    });
    this.spinner.succeed('Session Initialized, starting poller.');
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
    this.spinner.succeed(
      `Session Saved: ${this.session?.session_name} - ${this.session?.id} - ${mission.status}`,
    );
  }
}
