import { Entity } from 'typeorm';
import { Session } from './session';
import { Base } from './base';

@Entity({ name: 'indicators' })
export class Indicators extends Base {
  constructor(session_id: Session, data: any) {
    super(session_id, data);
  }
}
