import { VercelRequest, VercelResponse } from '@vercel/node';
import { oneLineTrim } from 'common-tags';
import { serialize } from 'cookie';
import { addSeconds } from 'date-fns';
import fetch from 'node-fetch';
import { Poll, Vote } from '../types';
import {
	arrayHasIndex,
	cleanBody,
	getCookie,
	getUserId,
	hasAllChallongeIds,
	NowReturn,
	tryHandleFunc,
	usePrisma,
} from '../util';

const handle = async (req: VercelRequest, res: VercelResponse): NowReturn => {
	const { id: pollId, choice } = cleanBody<Vote>(req);

	const { userId, idCookie } = await getUserId(req);
	const { isCookieLimited, isDbLimited } = await getRateLimit(req, pollId, userId);
	if (isCookieLimited || isDbLimited) return res.status(429).send('Ratelimited');

	const verifiedCookie = getCookie(req, 'captcha-verified') ?? '';
	const dbVerified = (
		await usePrisma(prisma => prisma.user.findUnique({ where: { verified: verifiedCookie } }))
	)?.verified;
	if (verifiedCookie !== dbVerified) return res.status(403).send('Captcha token not recognized');

	const poll = await usePrisma(prisma =>
		prisma.poll.findUnique({ where: { id: pollId }, include: { entries: true } })
	);

	if (!poll) return res.status(404).send(`Could not find poll with id ${pollId}`);

	if (!arrayHasIndex(poll.entries, choice)) return res.status(422).send('Invalid poll choice');

	poll.entries[choice].votes++;

	if (hasAllChallongeIds(poll)) {
		await challongeUpdate(poll);
	}

	await usePrisma(async prisma => {
		const entry = poll.entries[choice];
		await prisma.poll.update({
			where: { id: pollId },
			data: {
				//entries: { set: poll.entries },
				entries: {
					update: {
						where: { id_pollId: { id: entry.id, pollId } },
						data: { votes: entry.votes },
					},
				},
			},
		});

		await prisma.ratelimit.upsert({
			where: { pollId_userId: { pollId, userId } },
			create: { time: new Date(Date.now()), pollId, userId },
			update: { time: new Date(Date.now()) },
		});
	});

	const expires = addSeconds(new Date(Date.now()), 30);
	const cookie = serialize(`vote-limit-${pollId}`, 'true', { expires, httpOnly: true });
	console.log(cookie);
	res.setHeader('Set-Cookie', [cookie, idCookie]);

	return res.json(poll);
};

async function getRateLimit(req: VercelRequest, pollId: number, userId: string) {
	const rawCookies = req.headers.cookie?.split('; ');
	console.log('rawCookies', rawCookies);

	// Check if cookie with poll id is present
	const limitedCookie = rawCookies?.find(c => {
		const split = c.split('=');
		if (split[0] === `vote-limit-${pollId}`) return split;
		return undefined;
	});
	const isCookieLimited = limitedCookie != null; // Value doesn't matter, only definition

	const limited = await usePrisma(prisma =>
		prisma.ratelimit.findUnique({ where: { pollId_userId: { pollId, userId } } })
	);

	console.log(limited);

	// Limit if stored date is less than 30 seconds from now
	const isDbLimited =
		limited && Math.round((Date.now() - Number(limited.time)) / 1000) < 30 ? true : false;

	console.log(`isCookieLimited: ${isCookieLimited} | isDbLimited: ${isDbLimited}`);

	return { isCookieLimited, isDbLimited };
}

async function challongeUpdate(poll: Poll) {
	const params = {
		'match[player1_votes]': poll.entries[0].votes.toString(),
		'match[player2_votes]': poll.entries[1].votes.toString(),
		'match[scores_csv]': `${poll.entries[0].votes}-${poll.entries[1].votes}`,
	};

	const url = new URL(oneLineTrim`https://${process.env.CHALLONGE_USER}:${process.env.CHALLONGE_KEY}
		@api.challonge.com/v1/tournaments/
		${process.env.CHALLONGE_TOURNAMENT}/matches/${poll.challongeId}.json`);

	url.search = new URLSearchParams(params).toString();

	const res = await fetch(url, {
		method: 'put',
	});

	if (!res.ok) return console.error(`Error attempting to update challonge: \n${await res.text()}`);
}

export default tryHandleFunc(handle, 'POST');
