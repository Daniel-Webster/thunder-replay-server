// src/entities/Session.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Indicators } from './indicators';
import { Hudmsg } from './hudmsg';
import { Gamechat } from './gamechat';

@Entity({ name: 'session' })
export class Session {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'text', nullable: true })
  session_name: string;

  @Column({ type: 'timestamp', nullable: true })
  end_date?: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  start_date?: Date;

  @Column({ type: 'text', nullable: true })
  mission_status?: string;

  @OneToMany(() => Indicators, (indicators) => indicators.session_id)
  indicators?: Indicators[];

  @OneToMany(() => Hudmsg, (hudmsgs) => hudmsgs.session_id)
  hudmsgs?: Hudmsg[];

  @OneToMany(() => Gamechat, (gamechats) => gamechats.session_id)
  gamechats?: Gamechat[];

  constructor(session_name: string) {
    this.session_name = session_name;
  }
}
