import { Entity } from 'typeorm';
import { Session } from './session';
import { Base } from './base';

@Entity({ name: 'state' })
export class State extends Base {
  constructor(session_id: Session, data: any) {
    super(session_id, data);
  }
}
