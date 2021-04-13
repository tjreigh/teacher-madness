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

	const sorted = polls.map(p => {
		return {
			...p,
			entries: p.entries.sort((a, b) => a.id - b.id),
		};
	});

	return res.json(sorted);
};

export default tryHandleFunc(handle, 'GET');
