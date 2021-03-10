import { NowRequest, NowResponse } from '@vercel/node';

class InvalidJSONError extends Error {
	constructor(args?: string) {
		super(args ?? 'Malformed JSON');
	}
}

export type NowReturn = Promise<void | NowResponse>;
export type NowFunc = (req: NowRequest, res: NowResponse) => NowReturn;

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
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PURGE',
	options: tryHandleOptions = { shouldAllowCors: false }
) => async (req: NowRequest, res: NowResponse): NowReturn => {
	if (req.method?.toUpperCase() !== method) {
		return res.status(405).send(`Invalid HTTP method (expected ${method})`);
	}

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

/**
 * Attempt to parse the request body of a Vercel serverless function
 * @param req - Vercel serverless function request object
 * @returns Attempted parsed body (possibly an error)
 */
export function cleanBody<T>(req: NowRequest): T {
	try {
		return JSON.parse(req.body) as T;
	} catch (err) {
		throw new InvalidJSONError('Malformed JSON');
	}
}
