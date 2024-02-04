import { AppDataSource } from './data-source';
import { detectSession } from './session-detect';

AppDataSource.initialize()
  .then(async () => {
    // console.log("Loading sessions from the database...");
    // const sessions = await AppDataSource.manager.find(Session);
    // console.log("Loaded sessions: ", sessions);

    console.log('Here you can setup and run express / fastify / any other framework.');
    await detectSession();
  })
  .catch((error) => console.log(error));
