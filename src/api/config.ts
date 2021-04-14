import { VercelRequest, VercelResponse } from '@vercel/node';
import { cleanBody, NowReturn, tryHandleFunc, usePrisma } from '../util';

type Payload = { gameId?: string; endTime?: string };

const handle = async (req: VercelRequest, res: VercelResponse): NowReturn => {
	if (req.method?.toString() === 'GET') {
		const config = await usePrisma(prisma => prisma.config.findFirst({ where: { id: 0 } }));

		if (typeof config == null) return res.status(500).send('No config found');
		return res.status(200).json(config);
	} else if (req.method?.toString() === 'POST') {
		const config = cleanBody<Payload>(req);

		const data = config.endTime ? { ...config, endTime: new Date(config.endTime) } : config;

		const dbRes = await usePrisma(prisma => prisma.config.update({ where: { id: 0 }, data })).catch(
			err => {
				throw new Error(err);
			}
		);

		return res.status(200).send(dbRes);
	}
};

export default tryHandleFunc(handle, ['GET', 'POST']);
