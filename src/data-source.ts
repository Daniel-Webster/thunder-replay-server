import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Gamechat, Hudmsg, Indicators, Session } from './entities';
import { Migration1707019132222 } from './migration/1707019132222-migration';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: '10.10.0.216',
  port: 5432,
  username: 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  database: 'war-thunder-replay-db',
  entities: [Session, Indicators, Hudmsg, Gamechat],
  migrations: [Migration1707019132222],
  //logging: true,
  synchronize: true,
});
