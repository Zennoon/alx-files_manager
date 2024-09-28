import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient().on('error', (err) => {
      console.log(err);
    });
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    const get = promisify(this.client.get).bind(this.client);
    const val = await get(key);
    return val;
  }

  async set(key, value, duration) {
    const setex = promisify(this.client.setex).bind(this.client);
    await setex(key, duration, value);
  }

  async del(key) {
    const del = promisify(this.client.del).bind(this.client);
    await del(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
