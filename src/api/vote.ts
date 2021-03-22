import { Poll, Vote } from '../types';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { cleanBody, db, DBInitError, limit, NowReturn, tryHandleFunc } from '../util';

const handle = async (req: VercelRequest, res: VercelResponse): NowReturn => {
	if (!db) throw new DBInitError();

	const { id, choice } = cleanBody<Vote>(req);

	const poll: Poll | undefined = (
		await (await db.fetch({ id }, 1, 1))[Symbol.asyncIterator]().next()
	).value[0];

	if (!poll) return res.status(404).send(`Could not find poll with id ${id}`);

	console.log(poll);
	if (choice === 0) {
		poll.firstChoice.votes++;
	} else if (choice === 1) {
		poll.secondChoice.votes++;
	} else {
		res.status(422).send('Invalid poll choice');
	}

	await db.update(
		{ firstChoice: poll.firstChoice, secondChoice: poll.secondChoice },
		id.toString()
	);
	return res.json(poll);
};

export default tryHandleFunc(handle, 'POST');
