import ora from 'ora';
import { client } from './poller';
import { WarThunderSession } from './WarThunderSession';

export async function waitForSession(): Promise<WarThunderSession> {
  return new Promise((resolve, _reject) => {
    const spinner = ora('Waiting for War Thunder').start();
    const interval = setInterval(() => {
      client
        .getMapInfo()
        .then(async (res) => {
          if (res.valid === false) {
            spinner.color = 'yellow';
            spinner.prefixText = '⚠️';
            return;
          }
          spinner.succeed('War Thunder is ready');
          clearInterval(interval);
          const thunderSession = new WarThunderSession(res);
          await thunderSession.insertNewSession();
          resolve(thunderSession);
        })
        .catch((err) => {
          spinner.color = 'red';
          spinner.prefixText = '❌';
          spinner.text = `Error: ${err.message}`;
        });
    }, 5000);
  });
}
