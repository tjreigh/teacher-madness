import { Greeter } from '@typings';
import { NowRequest, NowResponse } from '@vercel/node';
import { cleanBody, NowReturn, tryHandleFunc } from '../util';

// Real implementations should acutally be async and remove this
// eslint-disable-next-line require-await
const handle = async (req: NowRequest, res: NowResponse): NowReturn => {
	const { message, name } = cleanBody<Greeter>(req.body);

	return res.send(`${message}, ${name}!`);
};

export default tryHandleFunc(handle, 'GET', { shouldAllowCors: true });
