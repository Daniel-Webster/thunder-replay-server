import { AppDataSource } from './data-source';
import { waitForSession } from './session-detect';

async function waitForAndRecordSessions(): Promise<void> {
  return waitForSession().then(async (session) => {
    await session.record();
    return waitForAndRecordSessions();
  });
}

AppDataSource.initialize().then(waitForAndRecordSessions);
