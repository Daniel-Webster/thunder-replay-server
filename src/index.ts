import "reflect-metadata";

import { DataSource } from "typeorm";

const AppDataSource = new DataSource({
  type: "postgres",
  host: "10.10.0.216",
  port: 5432,
  username: "postgres",
  password: process.env.POSTGRES_PASSWORD,
  database: "war-thunder-replay-db",
  entities: ["src/entities/*.ts"],
  logging: true,
  synchronize: true,
});

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((err) => {
    console.error("Error during Data Source initialization", err);
  });
