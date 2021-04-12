import { VercelRequest, VercelResponse } from '@vercel/node';
import { Poll } from '../types';
import { cleanBody, NowReturn, tryHandleFunc, usePrisma } from '../util';

const handle = async (req: VercelRequest, res: VercelResponse): NowReturn => {
	const { polls } = cleanBody<{ polls: Array<Partial<Poll>> }>(req);
	const finalPolls: Poll[] = [];
	let nextId =
		(await usePrisma(prisma => prisma.poll.findFirst({ where: {}, orderBy: { id: 'desc' } })))
			?.id || 0;
	console.log(nextId);

	for (const poll of polls) {
		if (!poll.entries?.every(e => e != null))
			return res.status(422).send('Request body missing choice');

		const obj = {
			id: poll.id ?? (nextId === 0 ? 0 : nextId + 1),
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

	await usePrisma(async prisma => {
		const existingEntries = await prisma.pollEntry.findMany({
			where: {
				OR: [
					{
						AND: [
							{ pollId: { in: finalPolls.map(({ id }) => id) } },
							{ name: { in: finalPolls.map(p => p.entries.map(e => e.name)).flat() } },
						],
					},
					{ challongeId: { in: finalPolls.map(p => p.entries.map(e => e.challongeId)).flat() } },
				],
			},
		});
		console.log(existingEntries);

		await Promise.all(
			finalPolls.map(({ id, challongeId, entries }) =>
				prisma.poll.upsert({
					where: { id_challongeId: { id, challongeId } },
					create: {
						challongeId,
						active: true,
						entries: {
							connectOrCreate: [
								{
									where: { id: existingEntries.find(e => (e.pollId = id))?.id ?? -1 },
									create: entries[0],
								},
								{
									where: { id: existingEntries.find(e => (e.pollId = id))?.id ?? -1 },
									create: entries[1],
								},
							],
							// createMany: { data: entries },
							// 	connectOrCreate: {
							// 		where: { id: entries[0].id },
							// 		create: entries[0],
							// 	},
						},
					},
					update: { active: true },
				})
			)
		);

		const newEntries = finalPolls
			.map(({ entries }) => entries.filter(e => !existingEntries.includes(e)))
			.flat();

		await Promise.all(newEntries.map(data => prisma.pollEntry.create({ data })));

		await prisma.poll.updateMany({
			where: { id: { not: { in: finalPolls.map(p => p.id) } } },
			data: { active: false },
		});
	});

	res.status(201).json(finalPolls);
};

export default tryHandleFunc(handle, 'PUT');
