import ora from 'ora';
import { WarThunderSession } from './WarThunderSession';
import { RecordOptions } from '.';
import { ThunderClient, thunderClient } from 'thunderscript-client';
let client: ThunderClient;
export async function waitForSession(options: RecordOptions): Promise<WarThunderSession> {
  client = thunderClient(`http://localhost:${options.port}`);
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
          const thunderSession = new WarThunderSession(res, client);
          await thunderSession.insertNewSession(options.sessionName);
          resolve(thunderSession);
        })
        .catch((err) => {
          spinner.color = 'red';
          spinner.prefixText = '❌';
          spinner.text = `Waiting for War Thunder: ${err.message}`;
        });
    }, 5000);
  });
}
