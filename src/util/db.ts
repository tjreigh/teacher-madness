import { Deta, DetaBase, DetaInstance } from 'deta';

const key = process.env?.DETA_KEY;
let deta: DetaInstance;
let db: DetaBase | null = null;
let limit: DetaBase | null = null;

try {
	deta = Deta(key!);
	db = deta.Base('votes');
	limit = deta.Base('ratelimit');
} catch (e) {
	console.warn(`Failed to register Deta instance: ${e}`);
}

export { db, limit };
