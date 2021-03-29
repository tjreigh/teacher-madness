import { VercelRequest, VercelResponse } from '@vercel/node';
import { Poll } from '../types';
import { db, DBInitError, isPoll, NowReturn, tryHandleFunc } from '../util';

const handle = async (req: VercelRequest, res: VercelResponse): NowReturn => {
	if (!db) throw new DBInitError();

	const polls: Poll[] | undefined = (await (await db.fetch())[Symbol.asyncIterator]().next()).value;

	const sorted = polls
		?.flat()
		.filter(it => isPoll(it))
		.sort((a, b) => a.id - b.id);

	return res.json(sorted);
};

export default tryHandleFunc(handle, 'GET');
