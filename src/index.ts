import { AppDataSource, initializeAppDataSource as setupAppDataSource } from './data-source';
import { waitForSession } from './war-thunder/waitForSession';
import { Command } from 'commander';

export type RecordOptions = {
  sessionName?: string;
  port?: number;
  postgresHost: string;
  postgresPort: number;
  postgresUsername: string;
  postgresPassword: string;
  pollRate: number;
};
export async function record(options: RecordOptions) {
  await AppDataSource.initialize();
  await waitForAndRecordSessions(options);
}

async function waitForAndRecordSessions(options: RecordOptions): Promise<void> {
  return waitForSession(options).then(async (session) => {
    await session.record();
    return waitForAndRecordSessions(options);
  });
}

const program = new Command();
program
  .name('wtrs')
  .version('1.0.0')
  .description(
    'War Thunder Replay Server: A CLI tool for recording and replaying War Thunder sessions',
  );

// Command to replay a session
program
  .command('replay')
  .description('Replay a session by launching a local rest server.')
  .option('-i, --sessionId <sessionId>', 'Session ID to replay')
  .option('-n, --sessionName <sessionName>', 'Session name to replay')
  .option('-p, --port <number>', 'port number', '8112')
  .action((options) => {
    if (options.sessionId) {
      console.log(`Replaying session with ID: ${options.sessionId}`);
    } else if (options.sessionName) {
      console.log(`Replaying session with name: ${options.sessionName}`);
    } else {
      console.log('Please provide either a session ID or session name');
    }
  });

// Command to record a session
program
  .command('record')
  .description(
    'Record War Thunder gameplay sessions. Each session will be recorded automatically and saved to the database. The Id and Name of the session will be displayed in the console.',
  )
  .option('-n, --sessionName [sessionName]', 'Session name (optional)', 'Untitled')
  .option(
    '-p, --port <number>',
    'War Thunder localhost server port number (usually 8111 or 9222) (optional)',
    '8111',
  )
  .option('--pollRate <number>', 'Poll rate in milliseconds (defaults to: 5000)', '5000')
  .option('--postgresPort <number>', 'Postgres port (defaults to: 5432)', '5432')
  .option('--postgresUsername <string>', 'Postgres username (defaults to postgres)', 'postgres')
  .requiredOption('--postgresHost <string>', 'Postgres host')
  .requiredOption('--postgresPassword <string>', 'Postgres password')
  .action(async (options: RecordOptions) => {
    setupAppDataSource(options);
    if (options.sessionName) {
      console.log(`Recording session with name: ${options.sessionName}`);
      await record(options);
    } else {
      console.log('Recording session');
      await record(options);
    }
  });

program.parse(process.argv);
