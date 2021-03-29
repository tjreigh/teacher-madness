import { VercelRequest, VercelResponse } from '@vercel/node';
import { serialize } from 'cookie';
import { addHours } from 'date-fns';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import {
	cleanBody,
	DBInitError,
	getForwardedHeader,
	NowReturn,
	tryHandleFunc,
	verified,
} from '../util';

interface GRecaptchaResult {
	success: boolean;
	score: number;
	action: string;
	challenge_ts: Date;
	hostname: string;
	'error-codes'?: GRecaptchaError[];
}

enum GRecaptchaError {
	'missing-input-secret' = 'The secret parameter is missing',
	'invalid-input-secret' = 'The secret parameter is invalid or malformed',
	'missing-input-response' = 'The response parameter is missing',
	'invalid-input-response' = 'The response parameter is invalid or malformed',
	'bad-request' = 'The request is invalid or malformed',
	'timeout-or-duplicate' = 'The response is no longer valid: either is too old or has been used previously',
}

const handle = async (req: VercelRequest, res: VercelResponse): NowReturn => {
	if (!verified) throw new DBInitError();

	const rawCookies = req.headers.cookie?.split('; ');
	const verifiedCookie = rawCookies
		?.find(c => {
			const split = c.split('=');
			if (split[0] === 'captcha-verified') return split;
			return undefined;
		})
		?.split('=')[1];

	if (verifiedCookie != null) {
		const dbVerified = ((await verified.get(getForwardedHeader(req))) as { value: string }).value;
		console.log(dbVerified, verifiedCookie);
		if (dbVerified && verifiedCookie === dbVerified)
			return res.status(200).send('Already verified');
	}

	const { response } = cleanBody<{ response: string }>(req);

	const params = {
		secret: process.env.GRECAPTCHA_SECRET!,
		response,
	};

	const url = new URL('https://www.google.com/recaptcha/api/siteverify');

	url.search = new URLSearchParams(params).toString();

	const verifyRes = await fetch(url, {
		method: 'POST',
	});

	const result: GRecaptchaResult = await verifyRes.json();

	console.log(result);

	if (!result.success) return res.status(403).send('reCAPTCHA failed');
	if (result['error-codes']?.length && result['error-codes'].length > 0) {
		const errors: string[] = [];

		for (const err in result['error-codes']) {
			errors.push(err);
		}

		return res.status(400).send(errors.join(', '));
	}

	const token = uuidv4();
	await verified.put(token, getForwardedHeader(req));

	const expires = addHours(new Date(Date.now()), 2);
	const cookie = serialize('captcha-verified', token, { expires, httpOnly: true });
	res.setHeader('Set-Cookie', [cookie]);

	return res.status(200).send('reCAPTCHA passed');
};

export default tryHandleFunc(handle, 'POST');
