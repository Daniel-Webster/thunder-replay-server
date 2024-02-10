import { AppDataSource } from './data-source';
import {
  Hudmsg,
  Indicators,
  GameChat,
  MapObjects,
  MapInfo,
  Mission,
  State,
} from 'thunderscript-client';
import {
  Hudmsg as HudmsgEntity,
  Indicators as IndicatorsEntity,
  Gamechat as GameChatEntity,
  MapObjects as MapObjectsEntity,
  MapInfo as MapInfoEntity,
  State as StateEntity,
  Mission as MissionEntity,
  Session,
} from './entities';

export class WarThunderDao {
  async saveMapObjects(session: Session, mapObjects: MapObjects) {
    const mapObjectsEntity = new MapObjectsEntity(session, mapObjects);
    await AppDataSource.manager.save(mapObjectsEntity);
  }

  async saveIndicators(session: Session, indicators: Indicators) {
    const indicatorsEntity = new IndicatorsEntity(session, indicators);
    await AppDataSource.manager.save(indicatorsEntity);
  }

  async saveGamechat(session: Session, gamechat: GameChat) {
    if (!gamechat?.length) return;
    const gamechatEntity = new GameChatEntity(session, gamechat);
    await AppDataSource.manager.save(gamechatEntity);
  }

  async saveMapInfo(session: Session, mapInfo: MapInfo) {
    const mapInfoEntity = new MapInfoEntity(session, mapInfo);
    await AppDataSource.manager.save(mapInfoEntity);
  }

  async saveHudmsg(session: Session, hudmsg: Hudmsg) {
    // save the hudmsg to the database
    if (!hudmsg.damage && !hudmsg.events) return;
    const hudmsgEntity = new HudmsgEntity(session, hudmsg);
    await AppDataSource.manager.save(hudmsgEntity);
  }

  async saveState(session: Session, state: State) {
    // save the state to the database
    const stateEntity = new StateEntity(session, state);
    await AppDataSource.manager.save(stateEntity);
  }

  async saveMission(session: Session, mission: Mission) {
    // save the mission to the database
    const missionEntity = new MissionEntity(session, mission);
    await AppDataSource.manager.save(missionEntity);
  }
}
