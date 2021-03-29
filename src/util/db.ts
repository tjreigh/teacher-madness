import { Deta, DetaBase, DetaInstance } from 'deta';

const key = process.env?.DETA_KEY;
let deta: DetaInstance;
let db: DetaBase | null = null;
let users: DetaBase | null = null;
let limit: DetaBase | null = null;
let verified: DetaBase | null = null;

try {
	deta = Deta(key!);
	db = deta.Base('votes');
	users = deta.Base('users');
	limit = deta.Base('ratelimit');
	verified = deta.Base('verified');
} catch (e) {
	console.warn(`Failed to register Deta instance: ${e}`);
}

export { db, users, limit, verified };
