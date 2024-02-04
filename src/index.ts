import { Session, Indicators } from "./entities";
import { AppDataSource } from "./data-source";
import { thunderClient } from "thunderscript-client";

AppDataSource.initialize()
  .then(async () => {
    console.log("Inserting a new session into the database...");
    const sesh = new Session(
      process.argv[2] || `Test Session Name - ${Date.now().toLocaleString()}`
    );
    await AppDataSource.manager.save(sesh);
    console.log("Saved a new session with id: " + sesh.id);

    console.log("Loading sessions from the database...");
    const sessions = await AppDataSource.manager.find(Session);
    console.log("Loaded sessions: ", sessions);

    console.log(
      "Here you can setup and run express / fastify / any other framework."
    );
    const client = await thunderClient();

    const indicators = client.getIndicators();
    await AppDataSource.manager.save(new Indicators(sesh, indicators));
  })
  .catch((error) => console.log(error));
