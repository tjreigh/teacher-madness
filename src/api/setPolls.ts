import { Poll } from '../types';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { cleanBody, db, DBInitError, incNextId, NowReturn, tryHandleFunc } from '../util';

const handle = async (req: VercelRequest, res: VercelResponse): NowReturn => {
	if (!db) throw new DBInitError();

	const { polls } = cleanBody<{ polls: Array<Partial<Poll>> }>(req);
	const finalPolls: Poll[] = [];
	let nextId = await incNextId(0);

	for (const poll of polls) {
		if (!poll.entries?.every(e => e != null))
			return res.status(422).send('Request body missing choice');

		const obj = {
			id: poll.id ?? nextId,
			entries: [
				{
					name: poll.entries[0].name,
					votes: poll.entries[0].votes ?? 0,
					challongeId: poll.entries[0].challongeId,
				},
				{
					name: poll.entries[1].name,
					votes: poll.entries[1].votes ?? 0,
					challongeId: poll.entries[1].challongeId,
				},
			],
			challongeId: poll.challongeId,
		};

		nextId++;

		for (const [key, value] of Object.entries(obj)) {
			if (value == null) {
				return res.status(422).send(`Request body is missing property "${key}"`);
			}
		}

		finalPolls.push(obj as Poll);
	}

	await Promise.all(finalPolls.map(poll => db?.put(poll, poll.id.toString())));
	await incNextId(nextId);
	return res.status(201).json(finalPolls);
};

export default tryHandleFunc(handle, 'PUT');
