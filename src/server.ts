import restify from 'restify';
import { AppDataSource } from './data-source';
import {
  State,
  Mission,
  Base,
  MapObjects,
  MapInfo,
  Indicators,
  Hudmsg,
  Gamechat,
} from './entities';
import { EntityTarget, Equal, MoreThan } from 'typeorm';
import ora from 'ora';

export interface ReplayServerOptions {
  /**
   * The port that the server will listen on
   * @default 8111
   * @example 3000
   */
  port?: number;
  /**
   * The session ID to replay
   */
  session_id: string;
}

async function respondWithLastEntity<T extends EntityTarget<Base>>(
  entityClass: T,
  res: restify.Response,
  session_id: string,
  lastId?: number,
) {
  const currentState = await AppDataSource.manager.findOneBy(entityClass, {
    session_id: Equal(session_id),
    id: MoreThan(lastId || -1),
  });
  if (!currentState) {
    res.json(200, {
      valid: false,
    });
  } else {
    res.json(200, currentState.data);
  }
  return currentState?.id;
}

export function startReplayServer(options: ReplayServerOptions) {
  const spinner = ora(`Replay server Starting...`).start();

  const server = restify.createServer({
    name: 'War Thunder Localhost API Replay',
    version: '1.0.0',
  });

  server.use(restify.plugins.queryParser());
  // Routes
  let lastStateId: number | undefined;
  server.get('/state', async (_req, res) => {
    lastStateId = await respondWithLastEntity(State, res, options.session_id, lastStateId);
  });

  let lastMissionId: number | undefined;
  server.get('/mission.json', async (_req, res) => {
    lastMissionId = await respondWithLastEntity(Mission, res, options.session_id, lastMissionId);
  });

  let lastMapObjectsId: number | undefined;
  server.get('/map_obj.json', async (_req, res) => {
    lastMapObjectsId = await respondWithLastEntity(
      MapObjects,
      res,
      options.session_id,
      lastMapObjectsId,
    );
  });

  let lastMapInfoId: number | undefined;
  server.get('/map_info.json', async (_req, res) => {
    lastMapInfoId = await respondWithLastEntity(MapInfo, res, options.session_id, lastMapInfoId);
  });

  let lastIndicatorsId: number | undefined;
  server.get('/indicators', async (_req, res) => {
    lastIndicatorsId = await respondWithLastEntity(
      Indicators,
      res,
      options.session_id,
      lastIndicatorsId,
    );
  });

  let lastHudmsgId: number | undefined;
  server.get('/hudmsg', async (_req, res) => {
    lastHudmsgId = await respondWithLastEntity(Hudmsg, res, options.session_id, lastHudmsgId);
  });

  let lastGamechatId: number | undefined;
  server.get('/gamechat', async (_req, res) => {
    lastGamechatId = await respondWithLastEntity(Gamechat, res, options.session_id, lastGamechatId);
  });

  // server.get('/map.img', (req, res) => {
  //   // Custom logic to get the current map image
  //   const mapGeneration = parseInt(req.query.gen as string) || 0;
  //   // Fetch image based on mapGeneration
  //   const imagePath = `path_to_map_images/map_${mapGeneration}.jpg`;
  //   res.contentType = 'image/jpeg';
  //   res.sendFile(imagePath);
  // });

  // Start server
  server.listen(options.port, () => {
    spinner.text = `Replay server listening at http://localhost:${options.port}`;
    spinner.color = 'green';
    spinner.prefixText = '🚀';
  });
}
