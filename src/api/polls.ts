import { Poll } from '../types';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { db, DBInitError, isPoll, NowReturn, tryHandleFunc } from '../util';

const handle = async (req: VercelRequest, res: VercelResponse): NowReturn => {
	if (!db) throw new DBInitError();

	const polls: Poll[] | undefined = (await (await db.fetch())[Symbol.asyncIterator]().next()).value;

	return res.json(polls?.flat().filter(poll => isPoll(poll)));
};

export default tryHandleFunc(handle, 'GET');
