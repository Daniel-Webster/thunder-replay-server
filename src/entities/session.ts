// src/entities/Session.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Indicators } from "./indicators";

@Entity()
export class Session {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: "text", nullable: true })
  session_name: string;

  @Column({ type: "timestamp", nullable: true })
  end_date?: number;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  start_date?: Date;

  @OneToMany(() => Indicators, (indicators) => indicators.session_id)
  indicators?: Indicators[];

  constructor(session_name: string) {
    this.session_name = session_name;
  }
}
