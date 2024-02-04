import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Session } from "./session";

@Entity()
export class Indicators {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne(() => Session, (session) => session.indicators)
  session_id: Session;

  @Column({ type: "jsonb", nullable: false })
  data: any;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  timestamp?: Date;

  constructor(session_id: Session, data: any) {
    this.session_id = session_id;
    this.data = data;
  }
}
