import { Poll } from '../types';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { cleanBody, db, DBInitError, incNextId, NowReturn, tryHandleFunc } from '../util';

const handle = async (req: VercelRequest, res: VercelResponse): NowReturn => {
	if (!db) throw new DBInitError();

	const { polls } = cleanBody<{ polls: Poll[] }>(req);
	let nextId = await incNextId(0);

	for (const poll of polls) {
		const obj: Poll = {
			id: poll.id ?? nextId,
			firstChoice: poll.firstChoice,
			secondChoice: poll.secondChoice,
		};

		nextId++;

		for (const [key, value] of Object.entries(obj)) {
			if (value == null) {
				return res.status(422).send(`Request body is missing property "${key}"`);
			}
		}
	}

	await Promise.all(polls.map(poll => db?.put(poll, poll.id.toString())));
	return res.status(201).json(polls);
};

export default tryHandleFunc(handle, 'PUT');
