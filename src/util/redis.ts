import { Tedis } from 'tedis';
import { DBInitError } from './funcs';

const raw = process.env.REDIS_URL?.split('@') as string[];
const host = raw[1].split(':')[0];
const port = parseInt(raw[1].split(':')[1]);
const password = raw[0].split(':')[2];

export const redisClient = new Tedis({
	host,
	port,
	password,
});

redisClient.on('timeout', () => {
	throw new DBInitError(`Redis client connection timed out`);
});

redisClient.on('error', err => {
	throw new DBInitError(`Redis client connection encountered error \n${err}`);
});
