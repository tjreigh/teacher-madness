import { VercelRequest, VercelResponse } from '@vercel/node';
import { NowReturn, tryHandleFunc, usePrisma } from '../util';

const handle = async (req: VercelRequest, res: VercelResponse): NowReturn => {
	const polls = await usePrisma(prisma =>
		prisma.poll.findMany({
			where: { active: true },
			include: { entries: true },
			orderBy: { id: 'asc' },
		})
	);

	return res.json(polls);
};

export default tryHandleFunc(handle, 'GET');
