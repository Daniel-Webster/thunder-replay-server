// src/entities/Session.ts

import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Session {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  length?: number;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  date?: Date;
}
