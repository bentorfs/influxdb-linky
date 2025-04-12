import { InfluxDB, Point, QueryApi, WriteApi } from '@influxdata/influxdb-client';
import dayjs from 'dayjs';
import { StatisticDataPoint } from './format.js';

const INFLUXDB_URL = process.env.INFLUXDB_URL || 'http://localhost:8086';
const INFLUXDB_TOKEN = process.env.INFLUXDB_TOKEN;
const INFLUXDB_ORG = process.env.INFLUXDB_ORG;
const INFLUXDB_BUCKET = process.env.INFLUXDB_BUCKET;

export class InfluxDBClient {
  private writeApi: WriteApi;
  private queryApi: QueryApi;

  public connect() {
    const influxDB = new InfluxDB({ url: INFLUXDB_URL, token: INFLUXDB_TOKEN });
    this.writeApi = influxDB.getWriteApi(INFLUXDB_ORG, INFLUXDB_BUCKET);
    this.queryApi = influxDB.getQueryApi(INFLUXDB_ORG);
  }

  public async disconnect() {
    return this.writeApi.close().then(() => {
      console.log('Connection with InfluxDB closed');
    });
  }

  public async writePoints(prm: string, stats: StatisticDataPoint[], measurement: string) {
    stats.forEach((stat) => {
      const ts = dayjs(stat.start, 'YYYY-MM-DD HH:mm:ss');
      const point = new Point(measurement).tag('prm', prm).floatField('value', stat.state).timestamp(ts.toDate());
      this.writeApi.writePoint(point);
    });
    return this.writeApi.flush();
  }

  public async getLastPointSent(prm: string, measurement: string) {
    const fluxQuery = `
      from(bucket: "${INFLUXDB_BUCKET}")
        |> range(start: -30d)
        |> filter(fn: (r) => r["_measurement"] == "${measurement}")
        |> filter(fn: (r) => r["prm"] == "${prm}")
        |> sort(columns:["_time"], desc: true)
        |> limit(n:1)
    `;

    const result = await this.queryApi.collectRows(fluxQuery);
    if (result.length == 0) {
      return null;
    } else {
      return result[0]['_time'];
    }
  }
}
