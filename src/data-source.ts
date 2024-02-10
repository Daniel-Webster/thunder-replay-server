import 'reflect-metadata';
import { DataSource } from 'typeorm';
import {
  Gamechat,
  Hudmsg,
  Indicators,
  MapInfo,
  MapObjects,
  Mission,
  Session,
  State,
} from './entities';
import { Migration1707019132222 } from './migration/1707019132222-migration';
import { RecordOptions } from '.';

export function initializeAppDataSource(options: RecordOptions): void {
  const { postgresHost, postgresPort, postgresUsername, postgresPassword } = options;
  AppDataSource = new DataSource({
    type: 'postgres',
    host: postgresHost,
    port: postgresPort,
    username: postgresUsername,
    password: postgresPassword,
    database: 'war-thunder-replay-db',
    migrations: [Migration1707019132222],
    entities: [Session, Indicators, Hudmsg, Gamechat, MapObjects, MapInfo, State, Mission],
    synchronize: true, // You can remove this if you want to manage migrations separately
  });
}
export let AppDataSource: DataSource;
