import { Poll } from '../types';
import { NowRequest, NowResponse } from '@vercel/node';
import { db, DBInitError, isPoll, NowReturn, tryHandleFunc } from '../util';

// Real implementations should acutally be async and remove this
// eslint-disable-next-line require-await
const handle = async (req: NowRequest, res: NowResponse): NowReturn => {
	if (!db) throw new DBInitError();

	const polls: Poll[] | undefined = (await (await db.fetch())[Symbol.asyncIterator]().next()).value;

	return res.json(polls?.flat().filter(poll => isPoll(poll)));
};

export default tryHandleFunc(handle, 'GET');
