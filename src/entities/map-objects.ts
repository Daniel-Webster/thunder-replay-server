import { Entity } from 'typeorm';
import { Session } from './session';
import { Base } from './base';

@Entity({ name: 'map_objects' })
export class MapObjects extends Base {
  constructor(session_id: Session, data: any) {
    super(session_id, data);
  }
}
