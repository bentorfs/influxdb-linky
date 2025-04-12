import { InfluxDBClient } from './influxdb.js';
import { LinkyClient } from './linky.js';
import { getUserConfig, MeterConfig } from './config.js';
import { debug, error, info, warn } from './log.js';
import cron from 'node-cron';
import dayjs from 'dayjs';

async function main() {
  debug('InfluxDB Linky is starting');

  const userConfig = getUserConfig();

  // Stop if configuration is empty
  if (userConfig.meters.length === 0) {
    warn('Add-on is not configured properly');
    debug('InfluxDB Linky stopped');
    return;
  }

  const influxDBClient = new InfluxDBClient();
  influxDBClient.connect();

  async function sync(config: MeterConfig) {
    info(
      `[${dayjs().format('DD/MM HH:mm')}] Synchronization started for ${
        config.production ? 'production' : 'consumption'
      } data`,
    );

    const influxDBMeasurement = config.production ? 'linky_production' : 'linky_consumption';

    const result = await influxDBClient.getLastPointSent(config.prm, influxDBMeasurement);
    const isSyncingNeeded = !result || (dayjs(result).isBefore(dayjs().subtract(2, 'days')) && dayjs().hour() >= 6);
    if (!isSyncingNeeded) {
      info('Everything is up-to-date, nothing to synchronize');
      return;
    }

    const client = new LinkyClient(config.token, config.prm, config.production);
    const dayToPull = dayjs().subtract(1, 'day');
    const energyData = await client.getEnergyData(dayToPull);

    await influxDBClient.writePoints(config.prm, energyData, influxDBMeasurement);
  }

  // Initialize or sync data
  for (const config of userConfig.meters) {
    await sync(config);
  }
  await influxDBClient.disconnect();
  // Setup cron job
  const randomMinute = Math.floor(Math.random() * 59);
  const randomSecond = Math.floor(Math.random() * 59);

  info(
    `Data synchronization planned every day at ` +
      `06:${randomMinute.toString().padStart(2, '0')}:${randomSecond.toString().padStart(2, '0')} and ` +
      `09:${randomMinute.toString().padStart(2, '0')}:${randomSecond.toString().padStart(2, '0')}`,
  );

  cron.schedule(`${randomSecond} ${randomMinute} 7,10 * * *`, async () => {
    await influxDBClient.connect();
    for (const config of userConfig.meters) {
      await sync(config);
    }

    influxDBClient.disconnect();
  });
}

try {
  await main();
} catch (e) {
  error(e.toString());
  process.exit(1);
}
