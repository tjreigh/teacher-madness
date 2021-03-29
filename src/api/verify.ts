import { VercelRequest, VercelResponse } from '@vercel/node';
import { cleanBody, NowReturn, tryHandleFunc } from '../util';
import fetch from 'node-fetch';

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
	return res.status(200).send('reCAPTCHA passed');
};

export default tryHandleFunc(handle, 'POST');
