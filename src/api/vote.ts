import { VercelRequest, VercelResponse } from '@vercel/node';
import { oneLineTrim } from 'common-tags';
import { serialize } from 'cookie';
import { addSeconds } from 'date-fns';
import fetch from 'node-fetch';
import { Poll, Vote } from '../types';
import {
	arrayHasIndex,
	cleanBody,
	db,
	DBInitError,
	getForwardedHeader,
	hasAllChallongeIds,
	limit,
	NowReturn,
	tryHandleFunc,
} from '../util';

const handle = async (req: VercelRequest, res: VercelResponse): NowReturn => {
	if (!db || !limit) throw new DBInitError(); // This enables safe non-null assertions

	const { id, choice } = cleanBody<Vote>(req);

	const { isCookieLimited, isDbLimited, forwarded } = await getRateLimit(req, id);
	if (isCookieLimited || isDbLimited) return res.status(429).send('Ratelimited');

	// `fetch` returns `AsyncIterable` so `Symbol.asyncIterator` must be explicitly called
	const poll: Poll | undefined = (
		await (await db.fetch({ id }, 1, 1))[Symbol.asyncIterator]().next()
	).value[0];

	if (!poll) return res.status(404).send(`Could not find poll with id ${id}`);

	if (!arrayHasIndex(poll.entries, choice)) return res.status(422).send('Invalid poll choice');

	poll.entries[choice].votes++;

	await db.update({ entries: poll.entries }, id.toString());

	if (hasAllChallongeIds(poll)) {
		await challongeUpdate(poll);
	}

	await limit.update({ polls: { [id]: Date.now() } }, forwarded);

	const expires = addSeconds(new Date(Date.now()), 30);
	const cookie = serialize(`vote-limit-${id}`, 'true', { expires, httpOnly: true });
	console.log(cookie);
	res.setHeader('Set-Cookie', [cookie]);

	return res.json(poll);
};

async function getRateLimit(req: VercelRequest, id: number) {
	const rawCookies = req.headers.cookie?.split('; ');
	console.log('rawCookies', rawCookies);

	// Check if cookie with poll id is present
	const limitedCookie = rawCookies?.find(c => {
		const split = c.split('=');
		if (split[0] === `vote-limit-${id}`) return split;
		return undefined;
	});
	const isCookieLimited = limitedCookie != null; // Value doesn't matter, only definition

	const forwarded = getForwardedHeader(req);

	// Non-null assertion is safe becuase of check at beginning of `handle`
	const dbLimit = (await limit!.get(forwarded)) as { polls: Record<number, number> };
	console.log(dbLimit.polls[id]);

	// Limit if stored date is less than 30 seconds from now
	const isDbLimited = Math.round((Date.now() - dbLimit.polls[id]) / 1000) < 30 ? true : false;

	console.log(`isCookieLimited: ${isCookieLimited} | isDbLimited: ${isDbLimited}`);

	return { isCookieLimited, isDbLimited, forwarded };
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
