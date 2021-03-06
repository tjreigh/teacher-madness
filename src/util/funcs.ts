import { Poll, Vote } from '@typings';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { serialize } from 'cookie';
import { v4 as uuidv4 } from 'uuid';
import { usePrisma } from './prisma';

class InvalidJSONError extends Error {
	constructor(args?: string) {
		super(args ?? 'Malformed JSON');
	}
}

export type NowReturn = Promise<void | VercelResponse>;
export type NowFunc = (req: VercelRequest, res: VercelResponse) => NowReturn;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PURGE';
type tryHandleOptions = { shouldAllowCors?: boolean };

/**
 * Wrapper to execute a serverless function and safely handle errors.
 * @param handle Serverless function to execute (should take a VercelRequest and VercelResponse)
 * @param method HTTP method to enforce
 * @param {Object} options Additional options
 * @param {Boolean} options.shouldAllowCors Allow Cross-Origin requests
 */
export const tryHandleFunc = (
	handle: NowFunc,
	method: HttpMethod | HttpMethod[],
	options: tryHandleOptions = { shouldAllowCors: false }
) => async (req: VercelRequest, res: VercelResponse): NowReturn => {
	if (typeof method === 'string' && req.method?.toUpperCase() !== method)
		return res.status(405).send(`Invalid HTTP method (expected ${method})`);
	else if (typeof method === 'object' && !method.includes(req.method!.toUpperCase() as HttpMethod))
		return res.status(405).send(`Invalid HTTP method (expected one of ${method.join(', ')})`);

	try {
		if (!process.env.NODE_ENV) return;
		await handle(req, res);
	} catch (err) {
		const stackOrObj = err.stack ?? err;
		if (err instanceof InvalidJSONError) return res.status(422).send(stackOrObj);
		return res.status(500).send(`Uncaught internal server error: \n${stackOrObj}`);
	}

	if (options?.shouldAllowCors) {
		res.setHeader('Access-Control-Allow-Credentials', 'true');
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', method + ',OPTIONS');
		res.setHeader(
			'Access-Control-Allow-Headers',
			'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
		);
		if (req.method === 'OPTIONS') {
			return res.status(200).end();
		}
	}
};

async function genUserId(req: VercelRequest) {
	const userId = uuidv4();

	await usePrisma(prisma =>
		prisma.user.create({ data: { id: userId, ip: getForwardedHeader(req) } })
	);
	const idCookie = serialize('user-id', userId, { httpOnly: true });

	return { userId, idCookie };
}

export async function getUserId(req: VercelRequest) {
	const cookieId = getCookie(req, 'user-id');

	console.log(`cookieId: ${cookieId}`);

	if (!cookieId) return await genUserId(req);

	const dbId = (await usePrisma(prisma => prisma.user.findUnique({ where: { id: cookieId } })))?.id;

	console.log(`dbId: ${dbId}`);

	if (cookieId !== dbId) return await genUserId(req);
	else return { userId: cookieId, idCookie: '' };
}

export function getCookie(req: VercelRequest, name: string) {
	const rawCookies = req.headers.cookie?.split('; ');
	const present = rawCookies?.find(c => c.split('=')[0] === name);
	const value = present?.split('=')[1] as string;

	return present != null ? value : null;
}

export function getForwardedHeader(req: VercelRequest) {
	// rawHeaders are stored in one array with both keys and values
	// See https://nodejs.org/api/http.html#http_class_http_incomingmessage
	const forwardedIdx = req.rawHeaders.findIndex(h => h.toLowerCase() === 'x-forwarded-for');
	return req.rawHeaders[forwardedIdx + 1];
}

/**
 * Attempt to parse the request body of a Vercel serverless function
 * @param req - Vercel serverless function request object
 * @returns Attempted parsed body (possibly an error)
 */
export function cleanBody<T>(req: VercelRequest): T {
	try {
		return JSON.parse(req.body) as T;
	} catch (err) {
		throw new InvalidJSONError('Malformed JSON');
	}
}

export const arrayHasIndex = (array: any[], index: number) =>
	Array.isArray(array) && Array.prototype.hasOwnProperty.call(array, index);

export function hasAllChallongeIds(poll: Poll): boolean {
	const objHasId = Object.prototype.hasOwnProperty.call(poll, 'challongeId');
	const entriesHaveId = poll.entries.every(e =>
		Object.prototype.hasOwnProperty.call(e, 'challongeId')
	);
	return objHasId && entriesHaveId;
}

export function isVote(vote: unknown): vote is Vote {
	const keys = ['id', 'choice'];
	return vote ? keys.every(key => Object.prototype.hasOwnProperty.call(vote, key)) : false;
}

export function isPoll(poll: unknown): poll is Poll {
	if ((poll as Poll).entries == null) return false;

	const keys = ['id', 'entries'];
	const entryKeys = ['name', 'votes'];

	const isShallowPoll = keys.every(key => Object.prototype.hasOwnProperty.call(poll, key));
	const isDeepPoll = (poll as Poll).entries.every(e =>
		entryKeys.every(key => Object.prototype.hasOwnProperty.call(e, key))
	);

	return isShallowPoll && isDeepPoll;
}
