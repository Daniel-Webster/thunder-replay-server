import { AppDataSource } from './data-source';
import { waitForSession } from './waitForSession';

async function waitForAndRecordSessions(): Promise<void> {
  return waitForSession().then(async (session) => {
    await session.record();
    return waitForAndRecordSessions();
  });
}

AppDataSource.initialize().then(waitForAndRecordSessions);
