import { AppDataSource } from './data-source';
import { detectSession } from './session-detect';

async function recordSessions(): Promise<void> {
  return detectSession().then(async (session) => {
    await session.record();
    return recordSessions();
  });
}

AppDataSource.initialize().then(recordSessions);
