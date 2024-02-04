import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1707019132222 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.createDatabase("war-thunder-replay-db", true);
    queryRunner.commitTransaction();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.dropDatabase("war-thunder-replay-db");
    queryRunner.commitTransaction();
  }
}
