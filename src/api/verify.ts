import { VercelRequest, VercelResponse } from '@vercel/node';
import { serialize } from 'cookie';
import { addHours } from 'date-fns';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { GRecaptchaResult } from '../types';
import { cleanBody, getCookie, getUserId, NowReturn, redisClient, tryHandleFunc } from '../util';

const handle = async (req: VercelRequest, res: VercelResponse): NowReturn => {
	const { userId, idCookie } = await getUserId(req);

	const verifiedCookie = getCookie(req, 'captcha-verified');

	if (verifiedCookie != null) {
		const dbVerified = await redisClient.hget('verified', userId);
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

	if (!result.success || result.score < 0.5) return res.status(403).send('reCAPTCHA failed');
	if (result['error-codes']?.length && result['error-codes'].length > 0) {
		const errors: string[] = [];

		for (const err in result['error-codes']) {
			errors.push(err);
		}

		return res.status(400).send(errors.join(', '));
	}

	const token = uuidv4();
	await redisClient.hset('verified', userId, token);

	const expires = addHours(new Date(Date.now()), 2);
	const cookie = serialize('captcha-verified', token, { expires, httpOnly: true });
	res.setHeader('Set-Cookie', [cookie, idCookie]);

	return res.status(200).send('reCAPTCHA passed');
};

export default tryHandleFunc(handle, 'POST');
