import { Entity } from 'typeorm';
import { Session } from './session';
import { Base } from './base';

@Entity({ name: 'gamechat' })
export class Gamechat extends Base {
  constructor(session_id: Session, data: any) {
    super(session_id, data);
  }
}
